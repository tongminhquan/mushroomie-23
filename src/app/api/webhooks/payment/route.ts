import { NextResponse } from 'next/server'
import { cancelOrderAndReleaseInventory } from '@/lib/order-inventory'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payment/factory'
import { sendOrderEmail } from '@/lib/payment/email/sender'
import {
  extractOrderCodes,
  redactWebhookPayload,
  sanitizeWebhookHeaders,
} from '@/lib/payment/webhook-security'

/**
 * POST /api/webhooks/payment
 * 
 * Nhận webhook từ payment provider (Casso/SePay/VNPay)
 * Production-ready: signature verify, idempotency, DB transaction, audit log
 */
export async function POST(request: Request) {
  let webhookEvent: { id: number } | null = null

  try {
    const provider = getPaymentProvider()

    // ─── STEP 1: Clone request để đọc body nhiều lần ──────────────
    const clonedRequest = request.clone()

    // ─── STEP 2: Verify chữ ký webhook ────────────────────────────
    const verifyResult = await provider.verifyWebhookSignature(clonedRequest)

    const sanitizedHeaders = sanitizeWebhookHeaders(request.headers)
    const sanitizedPayload = redactWebhookPayload(verifyResult.rawPayload)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null

    // Lưu webhook event để audit (kể cả khi invalid)
    const savedEvent = await prisma.paymentWebhookEvent.create({
      data: {
        provider: provider.providerKey,
        event_id: verifyResult.eventId || `unverified-${Date.now()}`,
        transaction_code: verifyResult.transactionCode || null,
        amount: verifyResult.amount || null,
        currency: 'VND',
        raw_payload: sanitizedPayload as object,
        sanitized_headers: sanitizedHeaders,
        message: verifyResult.isValid ? 'Received valid webhook' : 'Invalid signature',
        ip_address: ipAddress,
        user_agent: userAgent,
        signature: verifyResult.signature ? '[REDACTED]' : null,
        status: verifyResult.isValid ? 'VERIFIED' : 'FAILED',
        error_message: verifyResult.isValid ? null : 'Signature verification failed',
      },
    }).catch(async (err) => {
      // Nếu event_id đã tồn tại (duplicate webhook), trả 200 ngay
      if (err?.code === 'P2002') {
        console.log('[WEBHOOK] Duplicate event, ignoring')
        return null
      }
      throw err
    })

    if (!savedEvent) {
      return NextResponse.json({ ok: true }) // Duplicate
    }

    webhookEvent = savedEvent

    if (!verifyResult.isValid) {
      console.warn('[WEBHOOK] Invalid signature from', provider.providerKey)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // ─── STEP 3: Idempotency — đã xử lý chưa? ────────────────────
    const alreadyProcessed = await prisma.paymentWebhookEvent.findFirst({
      where: {
        event_id: verifyResult.eventId,
        status: 'PROCESSED',
        id: { not: savedEvent.id },
      },
    })

    if (alreadyProcessed) {
      await prisma.paymentWebhookEvent.update({
        where: { id: savedEvent.id },
        data: { status: 'IGNORED', error_message: 'Duplicate event — already processed' },
      })
      return NextResponse.json({ ok: true })
    }

    // ─── STEP 4: Tìm Payment bằng transfer_content ────────────────
    const transferContent = verifyResult.transferContent.toUpperCase()
    const prefix = (process.env.PAYMENT_PREFIX || 'MUSHROOMIE').toUpperCase()

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { transfer_content: { contains: transferContent } },
          // Tìm theo order_code trong nội dung
          ...(transferContent.includes(prefix)
            ? [{
                order: {
                  order_code: {
                    in: extractOrderCodes(transferContent, prefix),
                  },
                },
              }]
            : []),
        ],
        status: 'PENDING',
      },
      include: { order: true },
    })

    if (!payment) {
      await prisma.paymentWebhookEvent.update({
        where: { id: savedEvent.id },
        data: { status: 'IGNORED', error_message: `No matching pending payment for: ${transferContent}` },
      })
      return NextResponse.json({ ok: true })
    }

    // ─── STEP 5: Kiểm tra số tiền ─────────────────────────────────
    if (verifyResult.amount < Number(payment.amount)) {
      await prisma.paymentWebhookEvent.update({
        where: { id: savedEvent.id },
        data: {
          status: 'FAILED',
          payment_id: payment.id,
          order_id: payment.order_id,
          error_message: `Amount mismatch: received ${verifyResult.amount}, expected ${payment.amount}`,
        },
      })
      console.warn(`[WEBHOOK] Amount mismatch for ${payment.order.order_code}`)
      return NextResponse.json({ ok: true })
    }

    // ─── STEP 6: Kiểm tra hết hạn ─────────────────────────────────
    if (payment.expires_at && new Date(payment.expires_at) < new Date()) {
      await prisma.$transaction(async (tx) => {
        const expired = await tx.payment.updateMany({
          where: { id: payment.id, status: 'PENDING' },
          data: { status: 'EXPIRED' },
        })
        if (expired.count === 1) {
          await cancelOrderAndReleaseInventory(tx, {
            orderId: payment.order_id,
            changedBy: 'PAYMENT_WEBHOOK',
            note: 'Payment expired; inventory released',
          })
        }
        await tx.paymentWebhookEvent.update({
          where: { id: savedEvent.id },
          data: {
            status: 'FAILED',
            payment_id: payment.id,
            order_id: payment.order_id,
            error_message: 'Payment expired',
          },
        })
      })
      return NextResponse.json({ ok: true })
    }

    // ─── STEP 7: Cập nhật trong DB Transaction ────────────────────
    const now = new Date()
    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          transaction_code: verifyResult.transactionCode,
          paid_at: now,
        },
      })

      // Update order
      await tx.order.update({
        where: { id: payment.order_id },
        data: {
          payment_status: 'PAID',
          order_status: 'PROCESSING',
          },
      })

      // UserVoucher is already marked as USED when order is created, nothing to do here

      // Log status history
      await tx.orderStatusHistory.create({
        data: {
          order_id: payment.order_id,
          old_status: payment.order.order_status,
          new_status: 'PROCESSING',
          changed_by: 'PAYMENT_WEBHOOK',
          note: `Thanh toán xác nhận | GD: ${verifyResult.transactionCode} | Provider: ${provider.providerKey}`,
        },
      })

      // Update webhook event
      await tx.paymentWebhookEvent.update({
        where: { id: savedEvent.id },
        data: {
          status: 'PROCESSED',
          processed_at: now,
          payment_id: payment.id,
          order_id: payment.order_id,
        },
      })
    })

    console.log(`[WEBHOOK] ✅ Payment PAID: ${payment.order.order_code} | ${verifyResult.transactionCode}`)

    // ─── STEP 8: Gửi email (fire & forget) ───────────────────────
    sendOrderEmail(payment.order_id, 'payment_success').catch((err) =>
      console.error('[WEBHOOK] Email error:', err)
    )

    return NextResponse.json({ ok: true }, { status: 200 })

  } catch (error) {
    console.error('[WEBHOOK ERROR]', error)

    if (webhookEvent) {
      await prisma.paymentWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'FAILED', error_message: String(error) },
      }).catch(() => {})
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

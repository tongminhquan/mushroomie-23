import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProvider } from '@/lib/payment/factory'
import { sendOrderEmail } from '@/lib/payment/email/sender'
import type { WebhookTransaction } from '@/lib/payment/types'
import {
  extractOrderCodes,
  redactWebhookPayload,
  sanitizeWebhookHeaders,
} from '@/lib/payment/webhook-security'

const RETRYABLE_EVENT_STATUSES = ['RECEIVED', 'VERIFIED', 'FAILED'] as const

class WebhookBusyError extends Error {}
class PaymentStateChangedError extends Error {}

interface AuditContext {
  providerKey: string
  rawPayload: object
  sanitizedHeaders: Record<string, string>
  ipAddress: string | null
  userAgent: string | null
  hasSignature: boolean
}

interface StoredWebhookEvent {
  id: number
  status: string
}

function paymentWebhookSuccess() {
  return NextResponse.json({ success: true, ok: true }, { status: 200 })
}

function paymentWebhookRetry(message: string) {
  return NextResponse.json(
    { success: false, error: message },
    { status: 503, headers: { 'Retry-After': '5' } },
  )
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002')
}

function normalizeBankAccount(value: string | undefined) {
  return (value || '').replace(/[\s.-]/g, '').toUpperCase()
}

function normalizeTransactionCode(value: string | null | undefined) {
  return (value || '').trim().toUpperCase()
}

function hasCoherentPaidOrder(order: { order_status: string; payment_status: string }) {
  return (
    order.payment_status === 'PAID'
    && ['PROCESSING', 'MAKING', 'PACKING', 'SHIPPING', 'COMPLETED'].includes(order.order_status)
  )
}

function toAuditPayload(value: unknown): object {
  const redacted = redactWebhookPayload(value)
  if (redacted !== null && typeof redacted === 'object') return redacted as object
  return { value: redacted ?? null }
}

function stableEventKey(providerKey: string, transaction: WebhookTransaction) {
  const transactionCode = normalizeTransactionCode(transaction.transactionCode)
  const eventId = transaction.eventId.trim()
  const sourceType = transactionCode ? 'tx' : 'event'
  const sourceId = transactionCode || eventId
  if (!sourceId) return null

  // A provider may retry one bank transaction under a different webhook event
  // id. Keying primarily by the bank transaction code prevents that one
  // transaction from being applied to two different orders concurrently.
  const directKey = `${providerKey}:${sourceType}:${sourceId}`
  if (directKey.length <= 191) return directKey

  const digest = createHash('sha256').update(`${sourceType}:${sourceId}`).digest('hex')
  return `${providerKey}:${sourceType}:sha256:${digest}`
}

function invalidEventKey(providerKey: string, rawPayload: unknown) {
  const digest = createHash('sha256')
    .update(JSON.stringify(rawPayload ?? null))
    .digest('hex')
  return `invalid:${providerKey}:${digest}`
}

async function auditInvalidWebhook(context: AuditContext, transaction: WebhookTransaction) {
  try {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: context.providerKey,
        event_id: invalidEventKey(context.providerKey, context.rawPayload),
        transaction_code: transaction.transactionCode || null,
        amount: Number.isFinite(transaction.amount) ? transaction.amount : null,
        currency: 'VND',
        raw_payload: context.rawPayload,
        sanitized_headers: context.sanitizedHeaders,
        message: 'Invalid signature',
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        signature: context.hasSignature ? '[REDACTED]' : null,
        status: 'FAILED',
        error_message: 'Signature verification failed',
      },
    })
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error
  }
}

async function getOrCreateVerifiedEvent(
  context: AuditContext,
  transaction: WebhookTransaction,
): Promise<{ event: StoredWebhookEvent; terminal: boolean }> {
  const eventKey = stableEventKey(context.providerKey, transaction)
  if (!eventKey) {
    const fallbackKey = `${context.providerKey}:missing:${createHash('sha256')
      .update(JSON.stringify(transaction))
      .digest('hex')}`
    const event = await prisma.paymentWebhookEvent.create({
      data: {
        provider: context.providerKey,
        event_id: fallbackKey,
        transaction_code: null,
        amount: Number.isFinite(transaction.amount) ? transaction.amount : null,
        currency: 'VND',
        raw_payload: context.rawPayload,
        sanitized_headers: context.sanitizedHeaders,
        message: 'Webhook transaction is missing an idempotency key',
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        signature: context.hasSignature ? '[REDACTED]' : null,
        status: 'IGNORED',
        error_message: 'Missing event id and transaction code',
      },
    }).catch(async (error) => {
      if (!isUniqueConstraintError(error)) throw error
      return prisma.paymentWebhookEvent.findUnique({ where: { event_id: fallbackKey } })
    })
    if (!event) throw new Error('Unable to audit webhook transaction without an id')
    return { event, terminal: true }
  }

  try {
    const event = await prisma.paymentWebhookEvent.create({
      data: {
        provider: context.providerKey,
        event_id: eventKey,
        transaction_code: transaction.transactionCode || null,
        amount: Number.isFinite(transaction.amount) ? transaction.amount : null,
        currency: 'VND',
        raw_payload: context.rawPayload,
        sanitized_headers: context.sanitizedHeaders,
        message: 'Received verified webhook',
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        signature: context.hasSignature ? '[REDACTED]' : null,
        status: 'VERIFIED',
        error_message: null,
      },
    })
    return { event, terminal: false }
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error

    const existingEvent = await prisma.paymentWebhookEvent.findUnique({
      where: { event_id: eventKey },
    })
    if (!existingEvent) throw error

    if (existingEvent.status === 'PROCESSED' || existingEvent.status === 'IGNORED') {
      return { event: existingEvent, terminal: true }
    }
    if (existingEvent.status === 'PROCESSING') {
      throw new WebhookBusyError('Webhook event is already processing')
    }
    if (!RETRYABLE_EVENT_STATUSES.includes(existingEvent.status as typeof RETRYABLE_EVENT_STATUSES[number])) {
      throw new WebhookBusyError(`Webhook event is in unexpected state: ${existingEvent.status}`)
    }

    return { event: existingEvent, terminal: false }
  }
}

async function markEventIgnored(
  eventId: number,
  errorMessage: string,
  payment?: { id: number; order_id: number },
) {
  await prisma.paymentWebhookEvent.update({
    where: { id: eventId },
    data: {
      status: 'IGNORED',
      error_message: errorMessage,
      ...(payment ? { payment_id: payment.id, order_id: payment.order_id } : {}),
    },
  })
}

function extractUniqueOrderCode(transferContent: string) {
  const configuredPrefix = (process.env.PAYMENT_PREFIX || 'MSH').trim().toUpperCase()
  const prefixes = [...new Set([configuredPrefix, 'MSH', 'MUSHROOMIE'])]
  const orderCodes = [...new Set(
    prefixes.flatMap((prefix) => extractOrderCodes(transferContent, prefix)),
  )]
  return orderCodes.length === 1 ? orderCodes[0] : null
}

async function processVerifiedTransaction(
  context: AuditContext,
  transaction: WebhookTransaction,
) {
  const stored = await getOrCreateVerifiedEvent(context, transaction)
  if (stored.terminal) return { didTransition: false }

  const transferContent = transaction.transferContent.trim().toUpperCase()
  if (!transferContent) {
    await markEventIgnored(stored.event.id, 'Missing transfer content')
    return { didTransition: false }
  }

  const configuredBankAccount = normalizeBankAccount(process.env.BANK_ACCOUNT_NUMBER)
  const receivingAccount = normalizeBankAccount(transaction.receivingAccount)
  if (!configuredBankAccount) {
    await prisma.paymentWebhookEvent.updateMany({
      where: { id: stored.event.id, status: { in: [...RETRYABLE_EVENT_STATUSES] } },
      data: {
        status: 'FAILED',
        processed_at: null,
        error_message: 'Receiving bank account is not configured',
      },
    })
    throw new Error('BANK_ACCOUNT_NUMBER is not configured')
  }
  if (configuredBankAccount && !receivingAccount) {
    await markEventIgnored(stored.event.id, 'Receiving account missing or mismatched')
    return { didTransition: false }
  }
  if (configuredBankAccount && receivingAccount !== configuredBankAccount) {
    await markEventIgnored(stored.event.id, 'Receiving account mismatch')
    return { didTransition: false }
  }

  const orderCode = extractUniqueOrderCode(transferContent)
  if (!orderCode) {
    await markEventIgnored(stored.event.id, 'Missing or ambiguous order code')
    return { didTransition: false }
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: context.providerKey,
      OR: [
        { transfer_content: orderCode },
        { order: { order_code: orderCode } },
      ],
    },
    include: { order: true },
  })

  if (!payment) {
    await markEventIgnored(stored.event.id, `No matching payment for order: ${orderCode}`)
    return { didTransition: false }
  }

  const transactionCode = normalizeTransactionCode(transaction.transactionCode)
  if (!transactionCode) {
    await markEventIgnored(stored.event.id, 'Missing transaction code', payment)
    return { didTransition: false }
  }

  if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) {
    await markEventIgnored(stored.event.id, 'Invalid transaction amount', payment)
    return { didTransition: false }
  }

  if (transaction.amount !== Number(payment.amount)) {
    await markEventIgnored(
      stored.event.id,
      `Amount mismatch: received ${transaction.amount}, expected ${payment.amount}`,
      payment,
    )
    return { didTransition: false }
  }

  if (payment.status === 'PAID') {
    if (
      normalizeTransactionCode(payment.transaction_code) === transactionCode
      && hasCoherentPaidOrder(payment.order)
    ) {
      await prisma.paymentWebhookEvent.update({
        where: { id: stored.event.id },
        data: {
          status: 'PROCESSED',
          processed_at: new Date(),
          payment_id: payment.id,
          order_id: payment.order_id,
          message: 'Duplicate notification for an already paid payment',
          error_message: null,
        },
      })
    } else {
      await markEventIgnored(
        stored.event.id,
        'Payment is already paid but requires manual reconciliation',
        payment,
      )
    }
    return { didTransition: false }
  }

  if (
    payment.status !== 'PENDING'
    || payment.order.order_status !== 'PENDING_PAYMENT'
    || payment.order.payment_status !== 'PENDING'
    || !payment.order.inventory_reserved_at
  ) {
    await markEventIgnored(
      stored.event.id,
      `Late payment requires manual reconciliation (payment=${payment.status}, order=${payment.order.order_status})`,
      payment,
    )
    return { didTransition: false }
  }

  const now = new Date()
  try {
    const didTransition = await prisma.$transaction(async (tx) => {
      // Every competing state-changing path takes the order row first:
      // webhook confirmation, QR creation, and reservation expiry. Keeping
      // that lock order (order -> payment) prevents an expiry/payment webhook
      // deadlock from turning a valid transfer into an expired order.
      const orderClaimed = await tx.order.updateMany({
        where: {
          id: payment.order_id,
          order_status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          inventory_reserved_at: { not: null },
        },
        data: { updated_at: now },
      })
      if (orderClaimed.count !== 1) {
        throw new PaymentStateChangedError('Order state changed before confirmation')
      }

      const claimed = await tx.paymentWebhookEvent.updateMany({
        where: { id: stored.event.id, status: { in: [...RETRYABLE_EVENT_STATUSES] } },
        data: { status: 'PROCESSING', error_message: null },
      })
      if (claimed.count !== 1) throw new WebhookBusyError('Webhook processing claim lost')

      const currentPayment = await tx.payment.findUnique({ where: { id: payment.id } })
      if (
        !currentPayment
        || currentPayment.order_id !== payment.order_id
        || currentPayment.provider !== context.providerKey
        || currentPayment.status !== 'PENDING'
        || Number(currentPayment.amount) !== transaction.amount
      ) {
        throw new PaymentStateChangedError('Payment state changed before confirmation')
      }

      const duplicateTransaction = await tx.payment.findFirst({
        where: {
          provider: context.providerKey,
          transaction_code: transactionCode,
          id: { not: payment.id },
        },
        select: { id: true },
      })
      if (duplicateTransaction) {
        await tx.paymentWebhookEvent.update({
          where: { id: stored.event.id },
          data: {
            status: 'IGNORED',
            payment_id: payment.id,
            order_id: payment.order_id,
            error_message: 'Transaction code is already linked to another payment',
          },
        })
        return false
      }

      const paid = await tx.payment.updateMany({
        where: {
          id: payment.id,
          order_id: payment.order_id,
          provider: context.providerKey,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
          transaction_code: transactionCode,
          paid_at: now,
        },
      })
      if (paid.count !== 1) throw new PaymentStateChangedError('Payment state changed before confirmation')

      const advanced = await tx.order.updateMany({
        where: {
          id: payment.order_id,
          order_status: 'PENDING_PAYMENT',
          payment_status: 'PENDING',
          inventory_reserved_at: { not: null },
        },
        data: {
          payment_status: 'PAID',
          order_status: 'PROCESSING',
        },
      })
      if (advanced.count !== 1) throw new PaymentStateChangedError('Order state changed before confirmation')

      await tx.orderStatusHistory.create({
        data: {
          order_id: payment.order_id,
          old_status: payment.order.order_status,
          new_status: 'PROCESSING',
          changed_by: 'PAYMENT_WEBHOOK',
          note: `Thanh toán xác nhận | GD: ${transactionCode} | Provider: ${context.providerKey}`,
        },
      })

      await tx.paymentWebhookEvent.update({
        where: { id: stored.event.id },
        data: {
          status: 'PROCESSED',
          processed_at: now,
          payment_id: payment.id,
          order_id: payment.order_id,
          message: 'Payment processed',
          error_message: null,
        },
      })

      return true
    })

    if (didTransition) {
      console.info(`[WEBHOOK] Payment PAID: ${payment.order.order_code} | ${transactionCode}`)
      sendOrderEmail(payment.order_id, 'payment_success').catch((error) =>
        console.error('[WEBHOOK] Email error:', error),
      )
    }
    return { didTransition }
  } catch (error) {
    if (error instanceof WebhookBusyError) {
      const currentEvent = await prisma.paymentWebhookEvent.findUnique({
        where: { event_id: stableEventKey(context.providerKey, transaction)! },
      })
      if (currentEvent?.status === 'PROCESSED' || currentEvent?.status === 'IGNORED') {
        return { didTransition: false }
      }
      throw error
    }

    if (error instanceof PaymentStateChangedError) {
      const currentPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { order: true },
      })
      if (
        currentPayment?.status === 'PAID'
        && normalizeTransactionCode(currentPayment.transaction_code) === transactionCode
        && hasCoherentPaidOrder(currentPayment.order)
      ) {
        await prisma.paymentWebhookEvent.update({
          where: { id: stored.event.id },
          data: {
            status: 'PROCESSED',
            processed_at: new Date(),
            payment_id: currentPayment.id,
            order_id: currentPayment.order_id,
            message: 'Payment was confirmed concurrently',
            error_message: null,
          },
        })
      } else {
        await markEventIgnored(
          stored.event.id,
          'Payment or order state changed; manual reconciliation required',
          payment,
        )
      }
      return { didTransition: false }
    }

    await prisma.paymentWebhookEvent.updateMany({
      where: { id: stored.event.id, status: { in: [...RETRYABLE_EVENT_STATUSES, 'PROCESSING'] } },
      data: { status: 'FAILED', processed_at: null, error_message: String(error) },
    }).catch(() => {})
    throw error
  }
}

/**
 * POST /api/webhooks/payment
 *
 * Verify the provider signature once, then process every transaction with
 * exact order matching and transaction-scoped idempotency.
 */
export async function POST(request: Request) {
  try {
    const provider = getPaymentProvider()
    const verifyResult = await provider.verifyWebhookSignature(request.clone())
    const context: AuditContext = {
      providerKey: provider.providerKey,
      rawPayload: toAuditPayload(verifyResult.rawPayload),
      sanitizedHeaders: sanitizeWebhookHeaders(request.headers),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      userAgent: request.headers.get('user-agent') || null,
      hasSignature: Boolean(verifyResult.signature),
    }

    if (!verifyResult.isValid) {
      await auditInvalidWebhook(context, verifyResult)
      console.warn('[WEBHOOK] Invalid signature from', provider.providerKey)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const transactions = verifyResult.transactions?.length
      ? verifyResult.transactions
      : [verifyResult]
    for (const transaction of transactions) {
      await processVerifiedTransaction(context, transaction)
    }

    return paymentWebhookSuccess()
  } catch (error) {
    console.error('[WEBHOOK ERROR]', error)
    if (error instanceof WebhookBusyError) {
      return paymentWebhookRetry(error.message)
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

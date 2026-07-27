import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { timingSafeStringEqual } from '@/lib/security'
import { createTransporter } from '@/lib/email'
import {
  OPT_OUT_TEMPLATE_KEY,
  REVIEW_REQUEST_BATCH_LIMIT,
  REVIEW_REQUEST_DELAY_DAYS,
  REVIEW_REQUEST_TEMPLATE_KEY,
  buildReviewRequestEmail,
  isDeliverableEmail,
  reviewRequestEmailsEnabled,
  type MxCache,
} from '@/lib/review-request'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron endpoint: gửi email xin đánh giá cho các đơn đã hoàn tất.
 *
 * - Bảo vệ bằng CRON_SECRET (Bearer), giống /api/cron/publish-scheduled-posts.
 *   Thiếu secret trong env → luôn 401.
 * - TẮT MẶC ĐỊNH. Phải set REVIEW_REQUEST_EMAILS_ENABLED=true mới thực sự gửi;
 *   khi tắt, endpoint vẫn trả về danh sách đơn đủ điều kiện để chạy thử (dry run).
 * - Idempotent: ghi EmailLog trước khi gửi, và loại mọi đơn đã có EmailLog cùng
 *   template_key — chạy lại bao nhiêu lần cũng không gửi trùng.
 * - Tôn trọng opt-out: email đã có EmailLog(OPT_OUT_TEMPLATE_KEY) bị bỏ qua.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!secret || !timingSafeStringEqual(token, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = !reviewRequestEmailsEnabled()

  try {
    const cutoff = new Date(Date.now() - REVIEW_REQUEST_DELAY_DAYS * 24 * 60 * 60 * 1000)

    const candidates = await prisma.order.findMany({
      where: {
        order_status: 'COMPLETED',
        is_reviewed: false,
        updated_at: { lte: cutoff },
        email_logs: { none: { template_key: REVIEW_REQUEST_TEMPLATE_KEY } },
      },
      select: { id: true, order_code: true, customer_name: true, customer_email: true },
      orderBy: { updated_at: 'asc' },
      take: REVIEW_REQUEST_BATCH_LIMIT,
    })

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, dryRun, sentCount: 0, skippedCount: 0, orderCodes: [] })
    }

    // Opt-out lưu theo email, không theo đơn — một khách từ chối là thôi tất cả đơn sau.
    const optedOut = new Set(
      (
        await prisma.emailLog.findMany({
          where: {
            template_key: OPT_OUT_TEMPLATE_KEY,
            recipient_email: { in: candidates.map((order) => order.customer_email) },
          },
          select: { recipient_email: true },
        })
      ).map((log) => log.recipient_email),
    )

    const notOptedOut = candidates.filter((order) => !optedOut.has(order.customer_email))

    // Loại địa chỉ không gửi được TRƯỚC khi gửi, và không ghi EmailLog cho chúng: lỗi DNS
    // tạm thời cũng bị coi là không gửi được, ghi log sẽ khoá vĩnh viễn một khách thật.
    const mxCache: MxCache = new Map()
    const deliverable: typeof notOptedOut = []
    const undeliverable: string[] = []
    for (const order of notOptedOut) {
      if (await isDeliverableEmail(order.customer_email, mxCache)) deliverable.push(order)
      else undeliverable.push(order.order_code)
    }

    if (undeliverable.length > 0) {
      console.warn(
        `[cron/review-requests] Bỏ qua ${undeliverable.length} đơn có email không gửi được:`,
        undeliverable.join(','),
      )
    }

    const eligible = deliverable

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        sentCount: 0,
        skippedCount: candidates.length - eligible.length,
        undeliverableCount: undeliverable.length,
        orderCodes: eligible.map((order) => order.order_code),
        hint: 'Đặt REVIEW_REQUEST_EMAILS_ENABLED=true để bật gửi thật.',
      })
    }

    const transporter = createTransporter()
    const from = process.env.EMAIL_FROM || 'Mushroomie <noreply@mushroomie.io.vn>'
    let sentCount = 0

    for (const order of eligible) {
      const { subject, html, text } = buildReviewRequestEmail(order)

      // Ghi log TRƯỚC khi gửi: nếu process chết giữa chừng, lần chạy sau sẽ bỏ qua đơn
      // này thay vì gửi lần hai. Gửi trùng phiền khách hơn là thiếu một email.
      const log = await prisma.emailLog.create({
        data: {
          order_id: order.id,
          recipient_email: order.customer_email,
          subject,
          template_key: REVIEW_REQUEST_TEMPLATE_KEY,
          status: 'PENDING',
        },
        select: { id: true },
      })

      try {
        await transporter.sendMail({ from, to: order.customer_email, subject, html, text })
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'SENT', sent_at: new Date() },
        })
        sentCount += 1
      } catch (error) {
        await prisma.emailLog.update({
          where: { id: log.id },
          data: {
            status: 'FAILED',
            error_message: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
          },
        })
        console.error(`[cron/review-requests] Gửi thất bại cho đơn ${order.order_code}`)
      }
    }

    console.info(`[cron/review-requests] Đã gửi ${sentCount}/${eligible.length} email xin đánh giá`)
    return NextResponse.json({
      success: true,
      dryRun: false,
      sentCount,
      skippedCount: candidates.length - eligible.length,
      undeliverableCount: undeliverable.length,
      orderCodes: eligible.map((order) => order.order_code),
    })
  } catch (error) {
    console.error('[cron/review-requests] Lỗi:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const POST = GET

import crypto from 'node:crypto'
import { getApplicationSecret, timingSafeStringEqual } from '@/lib/security'
import { BRAND, SITE_URL } from '@/lib/local-seo'

/**
 * Email xin đánh giá sau khi giao hàng.
 *
 * Lý do tồn tại: audit 2026-07-27 cho thấy hệ thống review đã build đủ (API, form, trang
 * admin) nhưng chưa có review nào, nên Product schema không gắn được `aggregateRating`
 * — mất sao vàng trên SERP. Nút thắt là không ai chủ động xin đánh giá.
 *
 * An toàn khi chạy lặp:
 *  - Mỗi đơn chỉ gửi một lần, chốt bằng EmailLog(order_id, template_key).
 *  - Khách đã opt-out được ghi bằng EmailLog(template_key = OPT_OUT_TEMPLATE_KEY).
 *  - Toàn bộ tính năng tắt mặc định; phải set REVIEW_REQUEST_EMAILS_ENABLED=true mới gửi.
 */

export const REVIEW_REQUEST_TEMPLATE_KEY = 'review_request'
export const OPT_OUT_TEMPLATE_KEY = 'review_request_optout'

/** Chờ vài ngày sau khi đơn hoàn tất để khách kịp nhận và dùng thử sản phẩm. */
export const REVIEW_REQUEST_DELAY_DAYS = 3
/** Link trong email sống 30 ngày — đủ dài để khách không bị hết hạn khi mở email muộn. */
const REVIEW_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
/** Trần số email mỗi lần cron chạy, tránh dồn một lượt lớn khi mới bật tính năng. */
export const REVIEW_REQUEST_BATCH_LIMIT = 25

export function reviewRequestEmailsEnabled(): boolean {
  return process.env.REVIEW_REQUEST_EMAILS_ENABLED === 'true'
}

// ─────────────────────────────────────────────
// Token — cùng cơ chế HMAC với order-access.ts, nhưng namespace riêng ('review') để
// token đánh giá không dùng thay được token tra cứu đơn.
// ─────────────────────────────────────────────

function sign(payload: string): string {
  return crypto.createHmac('sha256', getApplicationSecret()).update(payload).digest('base64url')
}

export function createReviewToken(orderId: number, orderCode: string, now: number = Date.now()): string {
  const encodedPayload = Buffer.from(`review:${orderId}:${orderCode}:${now + REVIEW_TOKEN_TTL_MS}`).toString('base64url')
  return `${encodedPayload}.${sign(encodedPayload)}`
}

export interface ReviewTokenPayload {
  orderId: number
  orderCode: string
}

export function verifyReviewToken(
  token: string | null | undefined,
  now: number = Date.now(),
): ReviewTokenPayload | null {
  if (!token) return null
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) return null
  if (!timingSafeStringEqual(signature, sign(encodedPayload))) return null

  try {
    const [namespace, orderIdText, orderCode, expiresAtText] = Buffer.from(encodedPayload, 'base64url')
      .toString('utf8')
      .split(':')

    if (namespace !== 'review') return null
    const expiresAt = Number(expiresAtText)
    if (!Number.isFinite(expiresAt) || expiresAt < now) return null

    const orderId = Number(orderIdText)
    if (!Number.isInteger(orderId) || orderId <= 0 || !orderCode) return null

    return { orderId, orderCode }
  } catch {
    return null
  }
}

export function reviewRequestUrl(orderId: number, orderCode: string): string {
  return `${SITE_URL}/danh-gia?token=${encodeURIComponent(createReviewToken(orderId, orderCode))}`
}

export function optOutUrl(orderId: number, orderCode: string): string {
  return `${SITE_URL}/api/reviews/opt-out?token=${encodeURIComponent(createReviewToken(orderId, orderCode))}`
}

// ─────────────────────────────────────────────
// Nội dung email
// ─────────────────────────────────────────────

export interface ReviewRequestOrder {
  id: number
  order_code: string
  customer_name: string
  customer_email: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildReviewRequestEmail(order: ReviewRequestOrder) {
  const name = order.customer_name.trim() || 'bạn'
  const reviewLink = reviewRequestUrl(order.id, order.order_code)
  const unsubscribeLink = optOutUrl(order.id, order.order_code)
  const subject = `${name} thấy đơn ${order.order_code} thế nào? 🍄`

  const text = [
    `Chào ${name},`,
    '',
    `Đơn hàng ${order.order_code} của bạn đã hoàn tất. Mushroomie làm thủ công từng món nên rất muốn biết cảm nhận thật của bạn — vừa tay chưa, màu có đúng như mong đợi không.`,
    '',
    `Để lại đánh giá tại đây: ${reviewLink}`,
    '',
    'Chỉ mất khoảng một phút, và đánh giá của bạn giúp các bạn khác chọn được món hợp hơn.',
    '',
    `Nếu không muốn nhận email dạng này nữa: ${unsubscribeLink}`,
    '',
    `${BRAND.name} — ${BRAND.slogan}`,
    BRAND.formattedAddress,
  ].join('\n')

  const html = `<!doctype html>
<html lang="vi"><body style="margin:0;padding:24px;background:#fff7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#2b2b2b;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px;">
    <p style="margin:0 0 16px;font-size:16px;">Chào ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Đơn hàng <strong>${escapeHtml(order.order_code)}</strong> của bạn đã hoàn tất. Mushroomie làm thủ công từng món
      nên rất muốn biết cảm nhận thật của bạn — vừa tay chưa, màu có đúng như mong đợi không.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${reviewLink}" style="display:inline-block;background:#e41d1d;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px;font-size:15px;">
        Viết đánh giá
      </a>
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b6b6b;">
      Chỉ mất khoảng một phút, và đánh giá của bạn giúp các bạn khác chọn được món hợp hơn.
    </p>
    <hr style="border:none;border-top:1px solid #f0e0d6;margin:24px 0;">
    <p style="margin:0;font-size:12px;line-height:1.6;color:#9a9a9a;">
      ${escapeHtml(BRAND.name)} — ${escapeHtml(BRAND.slogan)}<br>
      ${escapeHtml(BRAND.formattedAddress)}<br>
      <a href="${unsubscribeLink}" style="color:#9a9a9a;">Không nhận email đánh giá nữa</a>
    </p>
  </div>
</body></html>`

  return { subject, text, html }
}

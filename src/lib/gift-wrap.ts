import { z } from 'zod'

/**
 * Dịch vụ gói quà — tính phí MỘT LẦN cho cả đơn hàng (không nhân theo số sản phẩm),
 * đã bao gồm viết thư tay miễn phí.
 *
 * Giá do admin đặt trong bảng `settings` và server luôn là nguồn chân lý:
 * client chỉ gửi mức phí nó đang hiển thị (`expected_gift_wrap_fee`), nếu lệch với
 * giá hiện tại thì đơn bị từ chối kèm mã xung đột để client tải lại — cùng cơ chế
 * đang dùng cho phí vận chuyển (xem `shipping-fee.ts`).
 */

export const DEFAULT_GIFT_WRAP_FEE = 15_000
export const MAX_GIFT_WRAP_FEE = 1_000_000
export const DEFAULT_GIFT_WRAP_UPDATED_AT = '1970-01-01T00:00:00.000Z'

/** Thư tay chép bằng tay nên giới hạn độ dài cho vừa tấm thiệp. */
export const MAX_GIFT_MESSAGE_LENGTH = 500

export const giftWrapFeeValueSchema = z.number().int().min(0).max(MAX_GIFT_WRAP_FEE)

export const giftMessageSchema = z.string().trim().max(MAX_GIFT_MESSAGE_LENGTH)

export interface GiftWrapSnapshot {
  /** false = shop tạm ngừng nhận gói quà (hết hộp, quá tải đơn...) */
  enabled: boolean
  fee: number
  updatedAt: string
}

export interface GiftWrapConflict {
  code: 'GIFT_WRAP_FEE_CHANGED'
  giftWrapFee: number
  message: string
}

export interface GiftWrapUnavailable {
  code: 'GIFT_WRAP_UNAVAILABLE'
  message: string
}

export function normalizeGiftWrapFee(value: unknown): number {
  const normalizedValue = typeof value === 'string'
    ? (/^\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN)
    : value

  const parsed = giftWrapFeeValueSchema.safeParse(normalizedValue)
  return parsed.success ? parsed.data : DEFAULT_GIFT_WRAP_FEE
}

export function normalizeGiftWrapEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().toLowerCase() !== 'false'
  // Mặc định bật để shop không phải cấu hình gì thêm sau khi cài đặt tính năng.
  return true
}

/** Chuẩn hoá nội dung thư tay: cắt khoảng trắng thừa, rỗng thì coi như không có thư. */
export function normalizeGiftMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, MAX_GIFT_MESSAGE_LENGTH)
}

/**
 * Phí thực thu: chỉ tính khi khách chọn gói quà VÀ dịch vụ đang mở.
 * Trả 0 trong mọi trường hợp còn lại để tổng tiền không bao giờ cộng nhầm.
 */
export function resolveGiftWrapFee(
  requested: boolean | undefined,
  snapshot: Pick<GiftWrapSnapshot, 'enabled' | 'fee'>,
): number {
  if (!requested || !snapshot.enabled) return 0
  return snapshot.fee
}

export function createGiftWrapUnavailable(
  requested: boolean | undefined,
  snapshot: Pick<GiftWrapSnapshot, 'enabled'>,
): GiftWrapUnavailable | null {
  if (!requested || snapshot.enabled) return null

  return {
    code: 'GIFT_WRAP_UNAVAILABLE',
    message: 'Dịch vụ gói quà tạm ngừng nhận thêm đơn. Vui lòng bỏ chọn gói quà để tiếp tục đặt hàng.',
  }
}

/**
 * So mức phí client đang hiển thị với giá hiện tại. Chỉ kiểm khi khách thực sự
 * chọn gói quà — không chọn thì giá đổi cũng không ảnh hưởng tổng tiền.
 */
export function createGiftWrapFeeConflict(
  requested: boolean | undefined,
  expectedFee: number | null | undefined,
  currentFee: number,
): GiftWrapConflict | null {
  if (!requested) return null
  if (expectedFee === currentFee) return null

  return {
    code: 'GIFT_WRAP_FEE_CHANGED',
    giftWrapFee: currentFee,
    message: expectedFee == null
      ? 'Phí gói quà đã được cập nhật. Vui lòng tải lại trang để kiểm tra tổng tiền.'
      : 'Phí gói quà vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.',
  }
}

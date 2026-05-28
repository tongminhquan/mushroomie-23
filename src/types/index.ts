export type Role = 'user' | 'admin'

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PROCESSING'
  | 'MAKING'
  | 'PACKING'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

export type WebhookEventStatus = 'RECEIVED' | 'VERIFIED' | 'PROCESSED' | 'FAILED' | 'IGNORED'

export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type ContactStatus = 'unread' | 'read' | 'replied'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  MAKING: 'Đang làm sản phẩm',
  PACKING: 'Đóng gói',
  SHIPPING: 'Đang giao hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  EXPIRED: 'Hết hạn thanh toán',
  CANCELLED: 'Đã hủy',
}

export const EMAIL_TEMPLATE_KEYS = [
  'payment_success',
  'order_processing',
  'order_making',
  'order_packing',
  'order_shipping',
  'order_completed',
  'order_cancelled',
] as const

export type EmailTemplateKey = typeof EMAIL_TEMPLATE_KEYS[number]

export const EMAIL_SUBJECTS: Record<EmailTemplateKey, string> = {
  payment_success: '✅ Mushroomie xác nhận thanh toán đơn hàng của bạn',
  order_processing: '🎉 Đơn hàng đang được xử lý',
  order_making: '🧵 Mushroomie đang làm sản phẩm handmade cho bạn',
  order_packing: '📦 Sản phẩm đang được đóng gói',
  order_shipping: '🚚 Đơn hàng đang trên đường đến tay bạn',
  order_completed: '🍄 Cảm ơn bạn! Đơn hàng đã hoàn tất',
  order_cancelled: '❌ Thông báo: Đơn hàng đã bị hủy',
}

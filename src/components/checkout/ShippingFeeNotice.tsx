'use client'

import { Truck, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { ShippingFeeUpdateNotice } from '@/lib/shipping-fee'

interface ShippingFeeNoticeProps {
  notice: ShippingFeeUpdateNotice | null
  onDismiss: () => void
}

export default function ShippingFeeNotice({
  notice,
  onDismiss,
}: ShippingFeeNoticeProps) {
  if (!notice) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg border border-primary/25 bg-theme-subtle p-3 text-sm text-theme-secondary"
    >
      <span
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-theme-elevated text-primary"
        aria-hidden="true"
      >
        <Truck size={17} />
      </span>
      <p className="min-w-0 flex-1 leading-6">
        Phí vận chuyển vừa được cập nhật từ{' '}
        <strong>{formatPrice(notice.previousFee)}</strong> thành{' '}
        <strong>{formatPrice(notice.currentFee)}</strong>. Tổng đơn hàng đã được tính lại.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-theme-muted transition-colors hover:bg-theme-elevated hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Đóng thông báo phí vận chuyển"
      >
        <X size={18} />
      </button>
    </div>
  )
}

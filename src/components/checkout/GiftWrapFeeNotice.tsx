'use client'

import { Gift, X } from 'lucide-react'
import type { GiftWrapUpdateNotice } from '@/hooks/useGiftWrap'
import { formatPrice } from '@/lib/utils'

interface GiftWrapFeeNoticeProps {
  notice: GiftWrapUpdateNotice | null
  onDismiss: () => void
}

export default function GiftWrapFeeNotice({
  notice,
  onDismiss,
}: GiftWrapFeeNoticeProps) {
  if (!notice) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg border border-[#f2c5b9] bg-[#fff7f2] p-3 text-sm text-neutral-700"
    >
      <span
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-primary"
        aria-hidden="true"
      >
        <Gift size={17} />
      </span>
      <p className="min-w-0 flex-1 leading-6">
        Phí gói quà vừa được cập nhật từ{' '}
        <strong>{formatPrice(notice.previousFee)}</strong> thành{' '}
        <strong>{formatPrice(notice.currentFee)}</strong>. Tổng dự kiến đã được tính lại.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Đóng thông báo phí gói quà"
      >
        <X size={18} />
      </button>
    </div>
  )
}

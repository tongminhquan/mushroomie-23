'use client'

import { Gift, PenLine } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useGiftWrap } from '@/hooks/useGiftWrap'
import { formatPrice } from '@/lib/utils'
import { MAX_GIFT_MESSAGE_LENGTH } from '@/lib/gift-wrap'

interface Props {
  /** true = hiện ô viết thư tay (dùng ở trang thanh toán). */
  showMessageField?: boolean
  className?: string
}

/**
 * Tuỳ chọn gói quà dùng chung cho trang chi tiết sản phẩm và trang thanh toán.
 * Phí tính một lần cho cả đơn hàng; thư tay miễn phí.
 */
export default function GiftWrapOption({ showMessageField = false, className = '' }: Props) {
  const giftWrap = useCartStore((state) => state.giftWrap)
  const giftMessage = useCartStore((state) => state.giftMessage)
  const setGiftWrap = useCartStore((state) => state.setGiftWrap)
  const setGiftMessage = useCartStore((state) => state.setGiftMessage)
  const { enabled, fee, isReady } = useGiftWrap()

  // Shop tắt dịch vụ thì ẩn hẳn, đồng thời gỡ lựa chọn cũ để tổng tiền không lệch.
  if (isReady && !enabled) {
    if (giftWrap) setGiftWrap(false)
    return null
  }

  const feeLabel = !isReady ? '...' : fee === 0 ? 'Miễn phí' : `+${formatPrice(fee)}`

  return (
    <div className={`rounded-[18px] border-[1.5px] border-warm-border bg-white p-4 ${className}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={giftWrap}
          onChange={(event) => setGiftWrap(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[#c91414]"
          aria-describedby="gift-wrap-desc"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <Gift size={18} className="text-primary" aria-hidden />
            <span className="font-bold text-neutral-900">Gói quà tặng</span>
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-extrabold text-primary">
              {feeLabel}
            </span>
          </span>
          <span id="gift-wrap-desc" className="mt-1.5 block text-sm leading-6 text-neutral-600">
            Hộp quà handmade kèm nơ, <strong className="font-semibold text-accent-kraft">tặng kèm thư viết tay miễn phí</strong>.
            Phí tính một lần cho cả đơn hàng, dù bạn mua bao nhiêu món.
          </span>
        </span>
      </label>

      {giftWrap && showMessageField && (
        <div className="mt-4 border-t border-warm-border pt-4">
          <label htmlFor="gift-message" className="mb-1.5 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <PenLine size={16} className="text-primary" aria-hidden />
            Lời nhắn thư tay <span className="font-normal text-neutral-500">(không bắt buộc)</span>
          </label>
          <textarea
            id="gift-message"
            value={giftMessage}
            onChange={(event) => setGiftMessage(event.target.value.slice(0, MAX_GIFT_MESSAGE_LENGTH))}
            rows={4}
            maxLength={MAX_GIFT_MESSAGE_LENGTH}
            placeholder="Mushroomie sẽ chép tay lời nhắn này lên thiệp gửi kèm quà..."
            className="w-full rounded-xl border-[1.5px] border-warm-border px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-1.5 text-right text-xs text-neutral-500">
            {giftMessage.length}/{MAX_GIFT_MESSAGE_LENGTH} ký tự
          </p>
        </div>
      )}

      {giftWrap && !showMessageField && (
        <p className="mt-3 border-t border-warm-border pt-3 text-sm text-neutral-600">
          ✍️ Bạn sẽ nhập lời nhắn thư tay ở bước thanh toán.
        </p>
      )}
    </div>
  )
}

'use client'

import { useEffect, useId } from 'react'
import { Gift, PenLine } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useGiftWrap } from '@/hooks/useGiftWrap'
import { formatPrice } from '@/lib/utils'
import { MAX_GIFT_MESSAGE_LENGTH } from '@/lib/gift-wrap'

interface Props {
  /** true = hiện ô viết thư tay (dùng ở trang thanh toán). */
  showMessageField?: boolean
  /** Bỏ khung ngoài khi component nằm trong một panel/cart đã có sẵn. */
  embedded?: boolean
  /** Rút gọn nội dung cho cart drawer hẹp. */
  compact?: boolean
  poll?: boolean
  className?: string
}

interface GiftWrapOptionContentProps extends Omit<Props, 'poll'> {
  enabled: boolean
  fee: number
  isReady: boolean
}

/**
 * Tuỳ chọn gói quà dùng chung cho các bề mặt mua hàng.
 * Phí tính một lần cho cả đơn hàng; thư tay miễn phí.
 */
export default function GiftWrapOption({ poll, ...props }: Props) {
  const { enabled, fee, isReady } = useGiftWrap({
    poll: poll ?? props.showMessageField ?? false,
  })

  return (
    <GiftWrapOptionContent
      {...props}
      enabled={enabled}
      fee={fee}
      isReady={isReady}
    />
  )
}

export function GiftWrapOptionContent({
  showMessageField = false,
  embedded = false,
  compact = false,
  className = '',
  enabled,
  fee,
  isReady,
}: GiftWrapOptionContentProps) {
  const giftWrap = useCartStore((state) => state.giftWrap)
  const giftMessage = useCartStore((state) => state.giftMessage)
  const setGiftWrap = useCartStore((state) => state.setGiftWrap)
  const setGiftMessage = useCartStore((state) => state.setGiftMessage)
  const reactId = useId()
  const descriptionId = `${reactId}-gift-wrap-desc`
  const messageId = `${reactId}-gift-message`

  // Shop tắt dịch vụ giữa chừng: gỡ lựa chọn cũ để tổng tiền không lệch.
  useEffect(() => {
    if (isReady && !enabled && giftWrap) setGiftWrap(false)
  }, [isReady, enabled, giftWrap, setGiftWrap])

  if (isReady && !enabled) return null

  const feeLabel = !isReady ? '...' : fee === 0 ? 'Miễn phí' : `+${formatPrice(fee)}`
  const surfaceClass = embedded
    ? ''
    : 'rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-4'

  return (
    <div className={`${surfaceClass} ${className}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={giftWrap}
          onChange={(event) => setGiftWrap(event.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[#c91414]"
          aria-describedby={descriptionId}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <Gift size={18} className="text-primary" aria-hidden />
            <span className="font-bold text-theme-primary">Gói quà tặng</span>
            <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-extrabold text-primary">
              {feeLabel}
            </span>
          </span>
          <span id={descriptionId} className="mt-1.5 block text-sm leading-6 text-theme-secondary">
            Hộp quà handmade kèm nơ, <strong className="font-semibold text-accent-kraft">tặng kèm thư viết tay miễn phí</strong>.
            {!compact && ' Phí tính một lần cho cả đơn hàng, dù bạn mua bao nhiêu món.'}
          </span>
        </span>
      </label>

      {giftWrap && showMessageField && (
        <div className="mt-4 border-t border-theme-border pt-4">
          <label htmlFor={messageId} className="mb-1.5 flex items-center gap-2 text-sm font-bold text-theme-primary">
            <PenLine size={16} className="text-primary" aria-hidden />
            Lời nhắn thư tay <span className="font-normal text-theme-muted">(không bắt buộc)</span>
          </label>
          <textarea
            id={messageId}
            value={giftMessage}
            onChange={(event) => setGiftMessage(event.target.value.slice(0, MAX_GIFT_MESSAGE_LENGTH))}
            rows={4}
            maxLength={MAX_GIFT_MESSAGE_LENGTH}
            placeholder="Mushroomie sẽ chép tay lời nhắn này lên thiệp gửi kèm quà..."
            className="theme-transition w-full rounded-xl border-[1.5px] border-theme-border bg-theme-input px-4 py-3 text-sm leading-6 text-theme-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-1.5 text-right text-xs text-theme-muted">
            {giftMessage.length}/{MAX_GIFT_MESSAGE_LENGTH} ký tự
          </p>
        </div>
      )}

      {giftWrap && !showMessageField && (
        <p className="mt-3 border-t border-theme-border pt-3 text-sm text-theme-secondary">
          ✍️ Bạn sẽ nhập lời nhắn thư tay ở bước thanh toán.
        </p>
      )}
    </div>
  )
}

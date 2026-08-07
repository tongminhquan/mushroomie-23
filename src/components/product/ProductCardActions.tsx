'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/store/cart'
import { useVoucherStore } from '@/store/voucher'
import { formatPrice } from '@/lib/utils'
import { trackAnalyticsEvent } from '@/lib/analytics'

interface WalletVoucher {
  status: string
  voucher: {
    discountType: string
    discountValue: number | string
    maxDiscount?: number | string | null
    minOrderValue?: number | string | null
  }
}

interface ProductCardActionsProps {
  productId: number
  productName: string
  categoryName?: string
  displayPrice: number
  imageUrl: string
  isOutOfStock: boolean
  children: ReactNode
}

export default function ProductCardActions({
  productId,
  productName,
  categoryName,
  displayPrice,
  imageUrl,
  isOutOfStock,
  children,
}: ProductCardActionsProps) {
  const { addItem, openCart } = useCartStore()
  const { data: session } = useSession()
  const { vouchers, fetchVouchers } = useVoucherStore()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (session?.user) void fetchVouchers()
  }, [fetchVouchers, session])

  let bestDiscount = 0
  let bestVoucher: WalletVoucher['voucher'] | null = null

  if (session?.user) {
    const available = (vouchers as WalletVoucher[]).filter(
      (voucher) => voucher.status === 'AVAILABLE',
    )

    for (const userVoucher of available) {
      const voucher = userVoucher.voucher
      if (voucher.minOrderValue && displayPrice < Number(voucher.minOrderValue)) continue

      let discount = 0
      if (voucher.discountType === 'PERCENT') {
        discount = (displayPrice * Number(voucher.discountValue)) / 100
        if (voucher.maxDiscount && discount > Number(voucher.maxDiscount)) {
          discount = Number(voucher.maxDiscount)
        }
      } else {
        discount = Number(voucher.discountValue)
      }

      if (discount > bestDiscount) {
        bestDiscount = discount
        bestVoucher = voucher
      }
    }
  }

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (isOutOfStock) return

    addItem({
      productId,
      name: productName,
      price: displayPrice,
      image: imageUrl,
      quantity: 1,
    })
    trackAnalyticsEvent('add_to_cart', {
      currency: 'VND',
      value: displayPrice,
      items: [{
        item_id: String(productId),
        item_name: productName,
        item_category: categoryName,
        price: displayPrice,
        quantity: 1,
      }],
    })

    setAdded(true)
    window.setTimeout(() => {
      setAdded(false)
      openCart()
    }, 600)
  }

  return (
    <>
      {bestVoucher && bestDiscount > 0 && (
        <div className="mb-1 text-[11px] font-bold text-theme-accent">
          <span className="rounded bg-primary/10 px-1.5 py-0.5">
            Rẻ hơn với voucher giảm{' '}
            {bestVoucher.discountType === 'PERCENT'
              ? `${Number(bestVoucher.discountValue)}%`
              : formatPrice(bestDiscount)}
          </span>
        </div>
      )}
      {children}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={`mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-3 text-xs font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:translate-y-px ${
          added
            ? 'bg-yellow text-brand-ink'
            : isOutOfStock
              ? 'cursor-not-allowed bg-theme-subtle text-theme-muted'
              : 'bg-primary text-white hover:bg-primary-dark'
        }`}
        aria-label={added ? 'Đã thêm' : isOutOfStock ? 'Hết hàng' : 'Chọn mua'}
        type="button"
      >
        {added ? (
          <>
            <Check size={16} /> Đã thêm
          </>
        ) : (
          <>
            <ShoppingBag size={16} /> Chọn mua
          </>
        )}
      </button>
    </>
  )
}

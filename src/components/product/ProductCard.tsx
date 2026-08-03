'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Eye, ShoppingBag } from 'lucide-react'
import SafeImage from '@/components/ui/SafeImage'
import { useCartStore } from '@/store/cart'
import { useVoucherStore } from '@/store/voucher'
import { useSession } from 'next-auth/react'
import { formatPrice, getPublicImageUrl } from '@/lib/utils'
import { trackAnalyticsEvent } from '@/lib/analytics'
import { resolveDisplayPrice } from '@/lib/product-price'

interface ProductCardProps {
  product: {
    id: number
    name: string
    slug: string
    price: number
    sale_price?: number | null
    featured_image?: string | null
    is_customizable?: boolean
    is_featured?: boolean
    stock?: number
    category?: { name: string; slug: string } | null
    images?: { image_url: string }[]
  }
}

interface WalletVoucher {
  status: string
  voucher: {
    discountType: string
    discountValue: number | string
    maxDiscount?: number | string | null
    minOrderValue?: number | string | null
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore()
  const { data: session } = useSession()
  const { vouchers, fetchVouchers } = useVoucherStore()
  const [added, setAdded] = useState(false)

  const imageUrl = getPublicImageUrl(product.featured_image || product.images?.[0]?.image_url, 'product')
  const isOutOfStock = product.stock !== undefined && product.stock <= 0
  const { price: displayPrice, originalPrice, isOnSale: hasSale } = resolveDisplayPrice(
    product.price,
    product.sale_price,
  )

  useEffect(() => {
    if (session?.user) {
      fetchVouchers()
    }
  }, [fetchVouchers, session])

  let bestDiscount = 0
  let bestVoucher: WalletVoucher['voucher'] | null = null

  if (session?.user) {
    const available = (vouchers as WalletVoucher[]).filter((voucher) => voucher.status === 'AVAILABLE')

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

  const handleAddToCart = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (isOutOfStock) return

    addItem({
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: imageUrl,
      quantity: 1,
    })
    trackAnalyticsEvent('add_to_cart', {
      currency: 'VND',
      value: displayPrice,
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category?.name,
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

  const handleSelectItem = () => {
    trackAnalyticsEvent('select_item', {
      item_list_name: product.category?.name || 'Tất cả sản phẩm',
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category?.name,
        price: displayPrice,
      }],
    })
  }

  // m-card: nâng thẻ + phóng ảnh bằng transform (chạy trên compositor).
  // m-glow: đổ bóng bằng opacity của lớp ::before thay vì animate box-shadow —
  // box-shadow buộc trình duyệt repaint mỗi khung hình và gây giật trên mobile.
  return (
    <article className="theme-transition m-card m-glow group relative flex h-full flex-col overflow-hidden rounded-[24px] border-[1.5px] border-theme-border bg-theme-card hover:border-pink">
      <Link href={`/san-pham/${product.slug}`} prefetch={false} onClick={handleSelectItem} className="m-card-media relative block aspect-[3/4] w-full shrink-0 overflow-hidden bg-theme-subtle">
        <SafeImage
          src={imageUrl}
          alt={product.name}
          imageKind="product"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-theme-elevated/95 px-3.5 py-1.5 text-xs font-extrabold text-theme-primary shadow-card backdrop-blur-sm">
            <Eye aria-hidden="true" size={14} />
            Xem nhanh
          </span>
        </div>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_customizable && (
            <span className="inline-flex min-h-7 items-center rounded-lg bg-yellow px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-brand-ink">
              Cá nhân hóa
            </span>
          )}
          {!product.is_customizable && !isOutOfStock && (
            <span className="inline-flex min-h-7 items-center rounded-lg bg-pink px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-brand-ink">
              Handmade
            </span>
          )}
          {hasSale && (
            <span className="inline-flex min-h-7 items-center rounded-lg bg-primary px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-white">
              -{Math.round((1 - displayPrice / product.price) * 100)}%
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex min-h-7 items-center rounded-lg border border-theme-border bg-theme-elevated px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-theme-primary">
              Hết hàng
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category && (
          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-theme-kraft">
            {product.category.name}
          </p>
        )}
        <Link href={`/san-pham/${product.slug}`} prefetch={false} onClick={handleSelectItem} className="mb-3 block flex-1">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-theme-primary transition-colors group-hover:text-theme-accent sm:text-[15px]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex flex-col gap-1">
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
          <div className="flex flex-wrap items-baseline gap-2 tabular-nums">
            <strong className="text-xl text-theme-accent">{formatPrice(displayPrice)}</strong>
            {originalPrice && originalPrice > displayPrice && (
              <span className="text-xs text-theme-muted line-through">{formatPrice(originalPrice)}</span>
            )}
          </div>
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
        </div>
      </div>
    </article>
  )
}

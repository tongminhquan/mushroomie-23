'use client'
import Link from 'next/link'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { getPublicImageUrl, formatPrice } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useVoucherStore } from '@/store/voucher'
import BrandBadge from '@/components/ui/BrandBadge'
import PriceText from '@/components/ui/PriceText'
import SafeImage from '@/components/ui/SafeImage'

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

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore()
  const [added, setAdded] = useState(false)
  const imageUrl = getPublicImageUrl(product.featured_image || product.images?.[0]?.image_url, 'product')
  const isOutOfStock = product.stock !== undefined && product.stock <= 0
  const hasSale = product.sale_price && product.sale_price < product.price
  const displayPrice = hasSale ? product.sale_price! : product.price

  const { data: session } = useSession()
  const { vouchers, fetchVouchers } = useVoucherStore()

  useEffect(() => {
    if (session?.user) {
      fetchVouchers()
    }
  }, [session, fetchVouchers])

  let bestDiscount = 0
  let bestVoucher = null

  if (session?.user) {
    const available = vouchers.filter(v => v.status === 'AVAILABLE')
    for (const uv of available) {
      const v = uv.voucher
      if (v.minOrderValue && displayPrice < Number(v.minOrderValue)) continue
      
      let discount = 0
      if (v.discountType === 'PERCENT') {
        discount = (displayPrice * Number(v.discountValue)) / 100
        if (v.maxDiscount && discount > Number(v.maxDiscount)) discount = Number(v.maxDiscount)
      } else {
        discount = Number(v.discountValue)
      }

      if (discount > bestDiscount) {
        bestDiscount = discount
        bestVoucher = v
      }
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem({
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: imageUrl,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      openCart()
    }, 600)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border-[1.5px] border-[#f0e0d6] bg-white transition duration-200 hover:-translate-y-1.5 hover:border-pink hover:shadow-hover">
      <Link href={`/san-pham/${product.slug}`} className="relative block aspect-[3/4] w-full shrink-0 overflow-hidden bg-secondary">
        <SafeImage
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.035]"
        />
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_customizable && (
            <BrandBadge tone="yellow">Cá nhân hóa</BrandBadge>
          )}
          {!product.is_customizable && !isOutOfStock && (
            <BrandBadge tone="pink">Handmade</BrandBadge>
          )}
          {hasSale && (
            <BrandBadge tone="red">-{Math.round((1 - product.sale_price! / product.price) * 100)}%</BrandBadge>
          )}
          {isOutOfStock && (
            <BrandBadge tone="neutral">Hết hàng</BrandBadge>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category && (
          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-kraft">{product.category.name}</p>
        )}
        <Link href={`/san-pham/${product.slug}`} className="block mb-3 flex-1">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-text transition-colors group-hover:text-primary sm:text-[15px]">{product.name}</h3>
        </Link>
        <div className="flex flex-col gap-1 mt-auto">
          {bestVoucher && bestDiscount > 0 && (
            <div className="text-[11px] font-bold text-primary mb-1">
              <span className="bg-primary/10 px-1.5 py-0.5 rounded">Rẻ hơn với voucher giảm {bestVoucher.discountType === 'PERCENT' ? `${Number(bestVoucher.discountValue)}%` : formatPrice(bestDiscount)}</span>
            </div>
          )}
          <PriceText price={displayPrice} originalPrice={hasSale ? product.price : null} />
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition duration-200 active:translate-y-px ${
              added ? 'bg-yellow text-text' : isOutOfStock ? 'cursor-not-allowed bg-neutral-200 text-neutral-500' : 'bg-primary text-white hover:bg-primary-dark'
            }`}
            aria-label={added ? 'Đã thêm' : isOutOfStock ? 'Hết hàng' : 'Chọn mua'}
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

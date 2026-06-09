'use client'
import Link from 'next/link'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { getPublicImageUrl } from '@/lib/utils'
import { useState } from 'react'
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-neutral-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-pink hover:shadow-hover">
      <Link href={`/san-pham/${product.slug}`} className="relative block aspect-square w-full shrink-0 overflow-hidden bg-secondary">
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
          <PriceText price={displayPrice} originalPrice={hasSale ? product.price : null} />
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition duration-200 active:translate-y-px ${
              added ? 'bg-yellow text-text' : isOutOfStock ? 'cursor-not-allowed bg-neutral-200 text-neutral-500' : 'bg-text text-white hover:bg-primary'
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

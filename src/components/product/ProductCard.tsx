'use client'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice, getPublicImageUrl } from '@/lib/utils'
import { useState } from 'react'

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
    <div className="group bg-white rounded-[24px] border border-neutral-100 hover:border-accent-peach overflow-hidden hover:shadow-hover hover:-translate-y-1 transition-all duration-300 relative flex flex-col h-full">
      <Link href={`/san-pham/${product.slug}`} className="block relative aspect-[3/4] w-full bg-secondary overflow-hidden shrink-0">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_customizable && (
            <span className="bg-accent-mint text-neutral-900 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">✨ Cá nhân hóa</span>
          )}
          {!product.is_customizable && !isOutOfStock && (
            <span className="bg-accent-peach text-neutral-700 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">🧵 Handmade</span>
          )}
          {hasSale && (
            <span className="bg-accent-orange text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">-{Math.round((1 - product.sale_price! / product.price) * 100)}%</span>
          )}
          {isOutOfStock && (
            <span className="bg-neutral-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">Hết hàng</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {product.category && (
          <p className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">{product.category.name}</p>
        )}
        <Link href={`/san-pham/${product.slug}`} className="block mb-3 flex-1">
          <h3 className="font-heading font-bold text-sm sm:text-base text-neutral-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{product.name}</h3>
        </Link>
        <div className="flex flex-col gap-1 mt-auto">
          <div className="flex items-end gap-2 flex-wrap mb-1">
            <span className="font-bold text-lg sm:text-xl text-primary">{formatPrice(displayPrice)}</span>
            {hasSale && (
              <span className="text-xs text-neutral-400 line-through mb-1">{formatPrice(product.price)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full mt-2 py-2.5 sm:py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 ${
              added ? 'bg-accent-mint text-neutral-900 shadow-md' : isOutOfStock ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md hover:-translate-y-0.5'
            }`}
            aria-label="Thêm vào giỏ"
          >
            {added ? (
              <>
                <Check size={18} /> ĐÃ THÊM
              </>
            ) : (
              <>
                <ShoppingBag size={18} /> CHỌN MUA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

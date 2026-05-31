'use client'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
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
  const imageUrl = product.featured_image || product.images?.[0]?.image_url || `https://picsum.photos/seed/${product.id}/400/400`
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
    <div className="group bg-white rounded-lg border border-neutral-200 overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300 relative flex flex-col h-full">
      <Link href={`/san-pham/${product.slug}`} className="block relative h-56 sm:h-64 bg-neutral-50 overflow-hidden shrink-0">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized={true}
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {product.is_customizable && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Cá nhân hóa</span>
          )}
          {hasSale && (
            <span className="bg-[#FFB347] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">-{Math.round((1 - product.sale_price! / product.price) * 100)}%</span>
          )}
          {isOutOfStock && (
            <span className="bg-neutral-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Hết hàng</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {product.category && (
          <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{product.category.name}</p>
        )}
        <Link href={`/san-pham/${product.slug}`} className="block mb-2 flex-1">
          <h3 className="font-bold text-sm sm:text-base text-neutral-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{product.name}</h3>
        </Link>
        <div className="flex flex-col gap-1 mt-auto">
          <div className="flex items-end gap-2 flex-wrap">
            <span className="font-bold text-lg sm:text-xl text-primary">{formatPrice(displayPrice)}</span>
            {hasSale && (
              <span className="text-xs text-neutral-400 line-through mb-1">{formatPrice(product.price)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full mt-3 py-2 sm:py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              added ? 'bg-green-500 text-white' : isOutOfStock ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark'
            }`}
            aria-label="Thêm vào giỏ"
          >
            {added ? (
              <>
                <Check size={16} /> ĐÃ THÊM
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> CHỌN MUA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

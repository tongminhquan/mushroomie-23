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
    <Link href={`/san-pham/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(64,64,64,0.12)] hover:shadow-[0_8px_30px_rgba(228,29,29,0.18)] transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-56 sm:h-64 bg-neutral-50 overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {product.is_customizable && (
              <span className="gradient-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">Cá nhân hóa</span>
            )}
            {hasSale && (
              <span className="bg-yellow-400 text-neutral-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">-{Math.round((1 - product.sale_price! / product.price) * 100)}%</span>
            )}
            {isOutOfStock && (
              <span className="bg-neutral-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Hết hàng</span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <span className="bg-white/90 backdrop-blur-sm text-neutral-700 text-[10px] font-semibold px-2 py-1 rounded-full shadow">🧶 Handmade</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category && (
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{product.category.name}</p>
          )}
          <h3 className="font-bold text-sm text-neutral-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg gradient-text">{formatPrice(displayPrice)}</span>
              {hasSale && (
                <span className="text-xs text-neutral-400 line-through">{formatPrice(product.price)}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                added ? 'bg-green-500 scale-110' : isOutOfStock ? 'bg-neutral-200 cursor-not-allowed' : 'gradient-primary hover:scale-110 hover:shadow-lg'
              }`}
              aria-label="Thêm vào giỏ"
            >
              {added ? <Check size={16} className="text-white" /> : <ShoppingBag size={14} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

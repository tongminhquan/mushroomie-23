'use client'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Heart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { useState } from 'react'

interface ProductCardProps {
  product: {
    id: number
    name: string
    slug: string
    price: number | string
    sale_price?: number | string | null
    featured_image?: string | null
    is_customizable: boolean
    stock: number
    images?: Array<{ image_url: string }>
    category?: { name: string } | null
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore()
  const [addedToCart, setAddedToCart] = useState(false)

  const imageUrl = product.featured_image || product.images?.[0]?.image_url || 'https://picsum.photos/seed/' + product.id + '/400/400'
  const price = Number(product.price)
  const salePrice = product.sale_price ? Number(product.sale_price) : null
  const displayPrice = salePrice || price
  const isOnSale = !!salePrice && salePrice < price
  const isOutOfStock = product.stock <= 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isOutOfStock) return
    addItem({ productId: product.id, name: product.name, price: displayPrice, image: imageUrl, quantity: 1 })
    setAddedToCart(true)
    setTimeout(() => { setAddedToCart(false); openCart() }, 300)
  }

  return (
    <Link href={`/san-pham/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
        <div className="relative overflow-hidden h-64 bg-neutral-50">
          <Image src={imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_customizable && <Badge variant="custom">Ca nhan hoa</Badge>}
            {isOnSale && <Badge variant="sale">Sale</Badge>}
            {isOutOfStock && <Badge variant="status">Het hang</Badge>}
          </div>
          <div className="absolute top-3 right-3"><Badge variant="handmade">🧶 Handmade</Badge></div>
        </div>
        <div className="p-4">
          {product.category && <p className="text-xs text-neutral-500 mb-1">{product.category.name}</p>}
          <h3 className="font-semibold text-neutral-900 text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary text-base">{formatPrice(displayPrice)}</span>
              {isOnSale && <span className="text-xs text-neutral-400 line-through">{formatPrice(price)}</span>}
            </div>
            <button onClick={handleAddToCart} disabled={isOutOfStock}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                addedToCart ? 'bg-green-500 scale-110' : isOutOfStock ? 'bg-neutral-200 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark hover:scale-110'
              }`} aria-label="Them vao gio hang">
              <ShoppingBag size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

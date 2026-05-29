'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import Button from '@/components/ui/Button'
import { ShoppingBag, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProductOption {
  id: number
  option_name: string
  option_type: string
  option_values: string
}

interface Props {
  product: {
    id: number
    name: string
    price: number
    sale_price?: number | null
    featured_image?: string | null
    is_customizable: boolean
    stock: number
    options: ProductOption[]
  }
}

export default function AddToCartButton({ product }: Props) {
  const { addItem, openCart } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [customNote, setCustomNote] = useState('')
  const [added, setAdded] = useState(false)

  const displayPrice = Number(product.sale_price || product.price)
  const imageUrl = product.featured_image || `https://picsum.photos/seed/${product.id}/400`
  const isOutOfStock = product.stock <= 0

  const router = useRouter()

  const handleAddToCart = () => {
    if (isOutOfStock) return
    addItem({
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: imageUrl,
      quantity,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
      customNote: customNote || undefined,
    })
    setAdded(true)
    setTimeout(() => { setAdded(false); openCart() }, 1000)
  }

  const handleBuyNow = () => {
    if (isOutOfStock) return
    addItem({
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: imageUrl,
      quantity,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
      customNote: customNote || undefined,
    })
    router.push('/thanh-toan')
  }

  return (
    <div className="space-y-4">
      {/* Product options */}
      {product.options.map((option) => {
        let values: string[] = []
        try { values = JSON.parse(option.option_values) } catch {}
        return (
          <div key={option.id}>
            <label className="block font-semibold text-sm text-neutral-700 mb-2">{option.option_name}</label>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => (
                <button key={val}
                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.option_name]: val }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                    selectedOptions[option.option_name] === val
                      ? 'border-primary bg-primary text-white'
                      : 'border-neutral-200 hover:border-primary hover:text-primary'
                  }`}>
                  {val}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {/* Custom note */}
      {product.is_customizable && (
        <div>
          <label className="block font-semibold text-sm text-neutral-700 mb-2">Ghi chú cá nhân (tùy chọn)</label>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Ví dụ: Tên viết trên sản phẩm, màu yêu thích, phong cách..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-neutral-200 rounded-2xl text-sm focus:outline-none focus:border-primary resize-none transition-colors"
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block font-semibold text-sm text-neutral-700 mb-2">Số lượng</label>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-bold hover:bg-neutral-200 transition-colors">−</button>
          <span className="w-10 text-center font-bold text-lg">{quantity}</span>
          <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-bold hover:bg-neutral-200 transition-colors">+</button>
          <span className="text-sm text-neutral-500">Còn {product.stock} sản phẩm</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock || added}
          size="lg"
          className="w-full"
          variant={added ? 'secondary' : 'primary'}
        >
          {added ? (
            <><CheckCircle size={18} className="shrink-0" />Đã thêm vào giỏ</>
          ) : isOutOfStock ? 'Hết hàng' : (
            <><ShoppingBag size={18} className="shrink-0" />Thêm vào giỏ hàng</>
          )}
        </Button>
        {!isOutOfStock && (
          <Button onClick={handleBuyNow} variant="outline" size="lg" className="w-full">Mua ngay</Button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CheckCircle, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useCartStore } from '@/store/cart'
import { getPublicImageUrl } from '@/lib/utils'

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
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [customNote, setCustomNote] = useState('')
  const [added, setAdded] = useState(false)

  const displayPrice = Number(product.sale_price || product.price)
  const imageUrl = getPublicImageUrl(product.featured_image, 'product')
  const isOutOfStock = product.stock <= 0

  const addCurrentSelectionToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: displayPrice,
      image: imageUrl,
      quantity,
      selectedOptions: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined,
      customNote: customNote.trim() || undefined,
    })
  }

  const handleAddToCart = () => {
    if (isOutOfStock) return

    addCurrentSelectionToCart()
    setAdded(true)

    window.setTimeout(() => {
      setAdded(false)
      openCart()
    }, 1000)
  }

  const handleBuyNow = () => {
    if (isOutOfStock) return

    addCurrentSelectionToCart()
    router.push('/thanh-toan')
  }

  return (
    <div className="space-y-5">
      {product.options.map((option) => {
        let values: string[] = []
        try {
          values = JSON.parse(option.option_values)
        } catch {
          values = []
        }

        if (values.length === 0) return null

        return (
          <div key={option.id}>
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              {option.option_name}
            </label>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setSelectedOptions((prev) => ({ ...prev, [option.option_name]: value }))
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    selectedOptions[option.option_name] === value
                      ? 'border-primary bg-primary text-white'
                      : 'border-warm-border bg-white text-neutral-700 hover:border-primary hover:text-primary'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {product.is_customizable && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-neutral-700">
            Ghi chú cá nhân
          </label>
          <textarea
            value={customNote}
            onChange={(event) => setCustomNote(event.target.value)}
            placeholder="Ví dụ: tên muốn in, màu yêu thích hoặc lời nhắn riêng."
            rows={3}
            className="w-full resize-none rounded-[20px] border border-warm-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-700">Số lượng</label>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-warm-border bg-white px-2 py-2">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-warm-border bg-secondary transition hover:border-primary hover:text-primary"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-lg font-bold text-neutral-900">{quantity}</span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-warm-border bg-secondary transition hover:border-primary hover:text-primary"
            >
              <Plus size={16} />
            </button>
          </div>

          <span className={product.stock > 0 && product.stock <= 5 ? 'text-sm font-semibold text-primary' : 'text-sm text-neutral-500'}>
            {isOutOfStock
              ? 'Tạm hết hàng'
              : product.stock <= 5
                ? `Chỉ còn ${product.stock} sản phẩm`
                : `Còn ${product.stock} sản phẩm`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock || added}
          size="lg"
          className="w-full"
          variant={added ? 'secondary' : 'primary'}
        >
          {added ? (
            <>
              <CheckCircle size={18} className="shrink-0" />
              Đã thêm vào giỏ
            </>
          ) : isOutOfStock ? (
            'Hết hàng'
          ) : (
            <>
              <ShoppingBag size={18} className="shrink-0" />
              Thêm vào giỏ hàng
            </>
          )}
        </Button>

        {!isOutOfStock && (
          <Button onClick={handleBuyNow} variant="outline" size="lg" className="w-full">
            Mua ngay
          </Button>
        )}
      </div>
    </div>
  )
}

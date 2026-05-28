'use client'
import { useCartStore } from '@/store/cart'
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice } = useCartStore()

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            <h2 className="font-heading font-bold text-lg">Giỏ hàng ({items.length})</h2>
          </div>
          <button onClick={closeCart} className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🛒</div>
              <p className="font-heading font-bold text-neutral-700 mb-2">Giỏ hàng trống!</p>
              <p className="text-neutral-500 text-sm mb-6">Hãy thêm sản phẩm để bắt đầu nhé</p>
              <Button onClick={closeCart} variant="secondary" size="sm">Tiếp tục mua sắm</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-neutral-50 rounded-2xl">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 mb-1">{item.name}</h3>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-neutral-500 mb-1">
                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </p>
                    )}
                    <p className="font-bold text-primary text-sm">{formatPrice(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center hover:bg-neutral-300 transition-colors">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="ml-auto p-1 rounded-full hover:bg-red-50 hover:text-primary transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Tạm tính</span>
              <span className="font-bold text-lg text-neutral-900">{formatPrice(getTotalPrice())}</span>
            </div>
            <Link href="/thanh-toan" onClick={closeCart}>
              <Button className="w-full" size="lg">Tiến hành thanh toán</Button>
            </Link>
            <button onClick={closeCart} className="w-full text-primary font-semibold text-sm hover:underline">
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, PackageCheck, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatPrice, getPublicImageUrl } from '@/lib/utils'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore()

  return (
    <div className="min-h-screen bg-secondary py-8 md:py-12">
      <div className="brand-container max-w-5xl">
        <p className="brand-kicker mb-3">Gio hang</p>
        <h1 className="mb-7 font-heading text-3xl text-text md:text-4xl">Giỏ hàng</h1>

        {items.length === 0 ? (
          <section className="rounded-[18px] border border-neutral-200 bg-white p-8 text-center shadow-card">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-pink text-primary">
              <ShoppingBag size={28} />
            </div>
            <h2 className="mb-2 font-heading text-2xl text-text">Giỏ hàng đang trống</h2>
            <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-neutral-500">
              Chọn một món phụ kiện hợp gu rồi quay lại đây để hoàn tất đơn hàng.
            </p>
            <Link href="/san-pham">
              <Button>Khám phá sản phẩm</Button>
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="flex gap-4 rounded-[18px] border border-neutral-200 bg-white p-4 shadow-card">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <Image
                      src={getPublicImageUrl(item.image)}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-sm font-bold text-neutral-900 md:text-base">{item.name}</h2>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {Object.entries(item.selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </p>
                    )}
                    {item.customNote && <p className="mt-1 text-xs text-neutral-500">Ghi chú: {item.customNote}</p>}
                    <p className="mt-2 text-sm font-extrabold text-primary">{formatPrice(item.price)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-100 hover:bg-neutral-200"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-100 hover:bg-neutral-200"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Xóa sản phẩm"
                        onClick={() => removeItem(item.id)}
                        className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-neutral-500 hover:bg-red-50 hover:text-primary"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-[18px] border border-neutral-200 bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <PackageCheck size={20} className="text-primary" />
                <h2 className="font-heading text-xl text-text">Tóm tắt đơn hàng</h2>
              </div>
              <div className="space-y-3 border-t border-neutral-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Số sản phẩm</span>
                  <span className="font-bold">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Tạm tính</span>
                  <span className="font-bold text-primary">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
              <Link href="/thanh-toan" className="mt-5 block">
                <Button className="w-full" size="lg">Tiến hành thanh toán</Button>
              </Link>
              <Link href="/san-pham" className="mt-3 block text-center text-sm font-bold text-primary hover:underline">
                Tiếp tục mua sắm
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

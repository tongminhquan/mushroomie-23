'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, PackageCheck, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatPrice, getPublicImageUrl } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import ShippingFeeNotice from '@/components/checkout/ShippingFeeNotice'
import { useShippingFee } from '@/hooks/useShippingFee'
import { GiftWrapOptionContent } from '@/components/product/GiftWrapOption'
import GiftWrapFeeNotice from '@/components/checkout/GiftWrapFeeNotice'
import { useGiftWrap } from '@/hooks/useGiftWrap'

export default function CartPage() {
  const { items, giftWrap, removeItem, updateQuantity, getTotalPrice } = useCartStore()
  const {
    shippingFee,
    notice: shippingFeeNotice,
    dismissNotice: dismissShippingFeeNotice,
  } = useShippingFee()
  const {
    enabled: giftWrapEnabled,
    fee: giftWrapUnitFee,
    isReady: isGiftWrapReady,
    notice: giftWrapNotice,
    dismissNotice: dismissGiftWrapNotice,
  } = useGiftWrap()
  const subtotal = getTotalPrice()
  const giftWrapFee = giftWrap && giftWrapEnabled ? giftWrapUnitFee : 0
  const estimatedTotal = subtotal + shippingFee + giftWrapFee

  return (
    <div className="theme-transition min-h-screen bg-theme-page py-8 text-theme-primary md:py-12">
      <div className="brand-container max-w-5xl">
        <CheckoutStepper currentStep={1} />
        <h1 className="mb-2 font-heading text-3xl text-text md:text-4xl sr-only">Giỏ hàng</h1>

        {items.length === 0 ? (
          <section
            className="rounded-[22px] border-[1.5px] border-theme-border bg-theme-card p-8 text-center shadow-card"
          >
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl text-primary" style={{ background: '#ffd6d6' }}>
              <ShoppingBag size={28} />
            </div>
            <h2 className="mb-2 font-heading text-2xl text-text">Giỏ hàng đang trống</h2>
            <p className="mx-auto mb-6 max-w-md text-sm leading-6 text-theme-muted">
              Chọn một món phụ kiện hợp gu rồi quay lại đây để hoàn tất đơn hàng.
            </p>
            <Link href="/san-pham">
              <Button>Khám phá sản phẩm</Button>
            </Link>
          </section>
        ) : (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section
              className="min-w-0 rounded-[22px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card md:p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl text-base" style={{ background: '#ffece6' }} aria-hidden>
                  🛒
                </span>
                <h2 className="font-heading text-xl text-text">
                  Giỏ hàng ({items.reduce((sum, item) => sum + item.quantity, 0)} món)
                </h2>
              </div>
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-4 rounded-[16px] border-[1.5px] border-theme-border bg-theme-elevated p-4"
                  >
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-theme-subtle">
                      <Image
                        src={getPublicImageUrl(item.image)}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-bold text-theme-primary md:text-base">{item.name}</h3>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(item.selectedOptions).map(([key, value]) => (
                            <span
                              key={key}
                              className="rounded-full border border-theme-border bg-theme-subtle px-2.5 py-0.5 text-[11px] font-semibold text-accent-kraft"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.customNote && <p className="mt-2 text-xs text-theme-muted">Ghi chú: {item.customNote}</p>}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="inline-flex items-center overflow-hidden rounded-full border-[1.5px] border-theme-border">
                          <button
                            type="button"
                            aria-label="Giảm số lượng"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="grid h-9 w-9 place-items-center font-bold text-primary hover:bg-theme-subtle"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Tăng số lượng"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="grid h-9 w-9 place-items-center bg-theme-subtle font-bold text-primary hover:bg-theme-elevated"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="ml-auto font-heading text-base text-primary">{formatPrice(item.price * item.quantity)}</span>
                        <button
                          type="button"
                          aria-label="Xóa sản phẩm"
                          onClick={() => removeItem(item.id)}
                          className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 hover:bg-red-50 hover:text-primary"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-dashed border-theme-border pt-5">
                <GiftWrapOptionContent
                  embedded
                  enabled={giftWrapEnabled}
                  fee={giftWrapUnitFee}
                  isReady={isGiftWrapReady}
                />
              </div>
            </section>

            <aside
              className="min-w-0 h-fit rounded-[22px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card"
            >
              <div className="mb-4 flex items-center gap-2">
                <PackageCheck size={20} className="text-primary" />
                <h2 className="font-heading text-xl text-text">Tóm tắt đơn hàng</h2>
              </div>
              {shippingFeeNotice && (
                <div className="mb-4">
                  <ShippingFeeNotice
                    notice={shippingFeeNotice}
                    onDismiss={dismissShippingFeeNotice}
                  />
                </div>
              )}
              {giftWrapNotice && (
                <div className="mb-4">
                  <GiftWrapFeeNotice
                    notice={giftWrapNotice}
                    onDismiss={dismissGiftWrapNotice}
                  />
                </div>
              )}
              <div className="space-y-3 border-t border-dashed border-theme-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-theme-muted">Số sản phẩm</span>
                  <span className="font-bold">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-muted">Tạm tính</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-theme-muted">Phí vận chuyển dự kiến</span>
                  <span className="font-semibold">{formatPrice(shippingFee)}</span>
                </div>
                {giftWrap && giftWrapEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-muted">Gói quà &amp; thư tay</span>
                    <span className="font-semibold">{formatPrice(giftWrapFee)}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-dashed border-theme-border pt-3 text-sm">
                  <span className="font-bold text-text">Tổng dự kiến</span>
                  <span className="font-heading text-2xl text-primary">{formatPrice(estimatedTotal)}</span>
                </div>
              </div>
              <Link href="/thanh-toan" className="mt-5 block">
                <Button className="w-full" size="lg">Tiến hành thanh toán</Button>
              </Link>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-theme-muted" aria-hidden>
                <span>🔒</span>Thanh toán an toàn &amp; bảo mật
              </div>
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

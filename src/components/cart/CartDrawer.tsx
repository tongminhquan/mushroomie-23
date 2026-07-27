'use client'
import { useCartStore } from '@/store/cart'
import { X, ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice, getPublicImageUrl } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { GiftWrapOptionContent } from '@/components/product/GiftWrapOption'
import { useGiftWrap } from '@/hooks/useGiftWrap'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'

export default function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen)
  // Panel phải ở lại DOM hết hiệu ứng đóng — `if (!isOpen) return null` gỡ ngay lập
  // tức nên trước đây giỏ hàng bật/tắt cụt lủn, không có gì để animate.
  const { mounted, state } = useDrawerTransition(isOpen)

  if (!mounted) return null

  return <CartDrawerContent drawerState={state} />
}

function CartDrawerContent({ drawerState }: { drawerState: 'entering' | 'open' | 'exiting' }) {
  const { items, giftWrap, closeCart, removeItem, updateQuantity, getTotalPrice } = useCartStore()
  const {
    enabled: giftWrapEnabled,
    fee: giftWrapUnitFee,
    isReady: isGiftWrapReady,
  } = useGiftWrap()
  const giftWrapFee = giftWrap && giftWrapEnabled ? giftWrapUnitFee : 0
  const estimatedTotal = getTotalPrice() + giftWrapFee

  return (
    <>
      <div
        data-drawer-state={drawerState}
        className="m-backdrop fixed inset-0 z-[100] bg-text/45 backdrop-blur-[2px]"
        onClick={closeCart}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng"
        data-drawer-state={drawerState}
        className="m-drawer m-drawer-right fixed right-0 top-0 z-[110] flex h-full w-full max-w-md flex-col bg-secondary shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            <h2 className="font-heading font-bold text-lg">Giỏ hàng ({items.length})</h2>
          </div>
          <button onClick={closeCart} aria-label="Đóng giỏ hàng" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-neutral-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-pink text-primary"><ShoppingBag size={28} /></div>
              <p className="mb-2 font-heading text-xl text-text">Giỏ hàng đang trống</p>
              <p className="mb-6 max-w-xs text-sm leading-6 text-neutral-500">Chọn một món nhỏ hợp gu rồi quay lại đây nhé.</p>
              <Link href="/san-pham" onClick={closeCart}><Button size="sm">Khám phá sản phẩm</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-[18px] border border-neutral-200 bg-white p-3 shadow-card">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <Image src={getPublicImageUrl(item.image)} alt={item.name} fill sizes="80px" className="object-contain p-1" />
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
                      <button aria-label="Giảm số lượng" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 hover:bg-neutral-200">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button aria-label="Tăng số lượng" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-lg bg-neutral-100 hover:bg-neutral-200">
                        <Plus size={12} />
                      </button>
                      <button aria-label="Xóa sản phẩm" onClick={() => removeItem(item.id)} className="ml-auto grid h-7 w-7 place-items-center rounded-lg hover:bg-red-50 hover:text-primary">
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
          <div className="space-y-3 border-t border-neutral-200 bg-white p-5">
            <GiftWrapOptionContent
              embedded
              compact
              enabled={giftWrapEnabled}
              fee={giftWrapUnitFee}
              isReady={isGiftWrapReady}
            />
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Tạm tính</span>
              <span className="font-bold text-lg text-neutral-900">{formatPrice(getTotalPrice())}</span>
            </div>
            {giftWrap && giftWrapEnabled && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Gói quà &amp; thư tay</span>
                <span className="font-semibold text-neutral-900">{formatPrice(giftWrapFee)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-3">
              <span className="font-bold text-neutral-900">Tổng trước vận chuyển</span>
              <span className="font-heading text-xl text-primary">{formatPrice(estimatedTotal)}</span>
            </div>
            <Link href="/thanh-toan" onClick={closeCart}>
              <Button className="w-full" size="lg">Tiến hành thanh toán</Button>
            </Link>
            <button onClick={closeCart} className="w-full text-primary font-semibold text-sm hover:underline">
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

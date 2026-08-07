'use client'
import { useState, useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cart'
import { useSession } from 'next-auth/react'
import { formatPrice, getPublicImageUrl } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Landmark, PackageCheck, ShieldCheck } from 'lucide-react'
import FormInput from '@/components/ui/FormInput'
import Textarea from '@/components/ui/Textarea'
import CheckoutStepper from '@/components/checkout/CheckoutStepper'
import ShippingFeeNotice from '@/components/checkout/ShippingFeeNotice'
import { trackAnalyticsEvent, trackAnalyticsEventOnce } from '@/lib/analytics'
import { createOrderCreatedAnalyticsEvent } from '@/lib/checkout-analytics'
import { useShippingFee } from '@/hooks/useShippingFee'
import { useGiftWrap } from '@/hooks/useGiftWrap'
import { GiftWrapOptionContent } from '@/components/product/GiftWrapOption'
import GiftWrapFeeNotice from '@/components/checkout/GiftWrapFeeNotice'
import { resolveGiftWrapFee } from '@/lib/gift-wrap'

interface CheckoutUser {
  name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface AvailableVoucher {
  id: string
  code: string
  title?: string
  discountType: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING'
  discountValue: number
  discountAmount: number
  source: string
  sourceGame?: string | null
  minOrderValue?: number | null
  expiresAt?: string | null
}

function formatVoucherDiscountLabel(voucher: AvailableVoucher) {
  if (voucher.discountType === 'PERCENT') return `Giảm ${voucher.discountValue}%`
  if (voucher.discountType === 'FIXED') return `Giảm ${formatPrice(voucher.discountValue)}`
  return 'Miễn phí vận chuyển'
}

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const giftWrap = useCartStore((state) => state.giftWrap)
  const giftMessage = useCartStore((state) => state.giftMessage)
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cod'>('bank_transfer')
  const [availableVouchers, setAvailableVouchers] = useState<AvailableVoucher[]>([])
  const [selectedVoucher, setSelectedVoucher] = useState<AvailableVoucher | null>(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherDismissed, setVoucherDismissed] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualMessage, setManualMessage] = useState({ text: '', type: '' })
  const beginCheckoutTracked = useRef(false)
  const {
    shippingFee,
    updatedAt: shippingFeeUpdatedAt,
    isReady: shippingFeeReady,
    notice: shippingFeeNotice,
    dismissNotice: dismissShippingFeeNotice,
    acceptServerFee,
  } = useShippingFee()
  const {
    enabled: giftWrapEnabled,
    fee: giftWrapUnitFee,
    isReady: giftWrapReady,
    notice: giftWrapNotice,
    dismissNotice: dismissGiftWrapNotice,
    acceptServerFee: acceptServerGiftWrapFee,
  } = useGiftWrap()

  const user = session?.user as CheckoutUser | undefined
  const [form, setForm] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    shipping_address: user?.address || '',
    note: '',
  })

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => {
      setForm((previous) => ({
        ...previous,
        customer_name: previous.customer_name || user.name || '',
        customer_email: previous.customer_email || user.email || '',
        customer_phone: previous.customer_phone || user.phone || '',
        shipping_address: previous.shipping_address || user.address || '',
      }))
    })
  }, [user])

  const subtotal = getTotalPrice()
  const voucherDiscount = selectedVoucher ? Math.min(subtotal, selectedVoucher.discountAmount) : 0
  const shippingDiscount = selectedVoucher?.discountType === 'FREE_SHIPPING'
    ? shippingFee
    : 0
  const itemDiscount = selectedVoucher?.discountType === 'FREE_SHIPPING' ? 0 : voucherDiscount
  // Phí gói quà tính một lần cho cả đơn và không bị voucher giảm (khớp server).
  const giftWrapFee = resolveGiftWrapFee(giftWrap, { enabled: giftWrapEnabled, fee: giftWrapUnitFee })
  const total = Math.max(0, subtotal - itemDiscount)
    + Math.max(0, shippingFee - shippingDiscount)
    + giftWrapFee

  useEffect(() => {
    if (beginCheckoutTracked.current || items.length === 0 || subtotal <= 0) return
    beginCheckoutTracked.current = true
    trackAnalyticsEvent('begin_checkout', {
      currency: 'VND',
      value: subtotal,
      items: items.map((item) => ({
        item_id: String(item.productId),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  }, [items, subtotal])

  useEffect(() => {
    setVoucherDismissed(window.sessionStorage.getItem('mushroomie_checkout_voucher_dismissed') === '1')
  }, [])

  useEffect(() => {
    if (!session?.user || subtotal <= 0) {
      setAvailableVouchers([])
      setSelectedVoucher(null)
      return
    }

    const controller = new AbortController()
    const loadVouchers = async () => {
      setVoucherLoading(true)
      try {
        const response = await fetch(`/api/vouchers/my-available?subtotal=${subtotal}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        const data = await response.json()
        const voucherItems: AvailableVoucher[] = Array.isArray(data.items) ? data.items : []
        setAvailableVouchers(voucherItems)
        setSelectedVoucher((current) => {
          if (current) {
            return voucherItems.find((voucher) => voucher.id === current.id) ?? null
          }
          return !voucherDismissed && data.best ? data.best : null
        })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') console.error(error)
      } finally {
        if (!controller.signal.aborted) setVoucherLoading(false)
      }
    }

    void loadVouchers()
    return () => controller.abort()
  }, [session?.user, subtotal, shippingFeeUpdatedAt, voucherDismissed])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleApplyManualCode = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!manualCode.trim() || subtotal <= 0) return
    setManualLoading(true)
    setManualMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: manualCode.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Lỗi nhận mã')
      
      setManualMessage({ text: 'Nhận mã thành công!', type: 'success' })
      setManualCode('')
      
      const response = await fetch(`/api/vouchers/my-available?subtotal=${subtotal}`)
      if (response.ok) {
        const newData = await response.json()
        setAvailableVouchers(newData.items ?? [])
        if (newData.best) {
          setSelectedVoucher(newData.best)
          setVoucherDismissed(false)
          window.sessionStorage.removeItem('mushroomie_checkout_voucher_dismissed')
        }
      }
    } catch (err) {
      setManualMessage({
        text: err instanceof Error ? err.message : 'Không thể nhận mã',
        type: 'error',
      })
    } finally {
      setManualLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setIsLoading(true)
    setError('')

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expected_shipping_fee: shippingFee,
          gift_wrap: giftWrap,
          gift_message: giftWrap ? giftMessage : undefined,
          expected_gift_wrap_fee: giftWrapUnitFee,
          payment_method: paymentMethod,
          user_voucher_id: selectedVoucher?.id ?? null,
          items: items.map((item) => ({
            product_id: item.productId,
            product_name: item.name,
            quantity: item.quantity,
            price_snapshot: item.price,
            selected_options: item.selectedOptions,
            custom_note: item.customNote,
          })),
        }),
      })

      const orderData = await orderRes.json().catch(() => null)
      if (
        orderRes.status === 409 &&
        orderData?.code === 'SHIPPING_FEE_CHANGED' &&
        typeof orderData.shippingFee === 'number'
      ) {
        acceptServerFee(orderData.shippingFee)
        setError(orderData.message || 'Phí vận chuyển vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.')
        return
      }
      if (
        orderRes.status === 409 &&
        orderData?.code === 'GIFT_WRAP_FEE_CHANGED' &&
        typeof orderData.giftWrapFee === 'number'
      ) {
        acceptServerGiftWrapFee(orderData.giftWrapFee)
        setError(orderData.message || 'Phí gói quà vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.')
        return
      }
      if (orderRes.status === 409 && orderData?.code === 'GIFT_WRAP_UNAVAILABLE') {
        setError(orderData.message || 'Dịch vụ gói quà tạm ngừng. Vui lòng bỏ chọn gói quà để tiếp tục.')
        return
      }
      if (!orderRes.ok) {
        throw new Error(typeof orderData?.error === 'string' ? orderData.error : 'Tạo đơn hàng thất bại')
      }
      const { orderId, orderCode, accessToken } = orderData

      const orderCreatedEvent = createOrderCreatedAnalyticsEvent({
        orderCode,
        value: total,
        paymentMethod,
        items: items.map((item) => ({
          item_id: String(item.productId),
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      })
      if (orderCreatedEvent) {
        trackAnalyticsEventOnce(
          orderCreatedEvent.key,
          orderCreatedEvent.event,
          orderCreatedEvent.params,
        )
      }

      if (paymentMethod === 'bank_transfer') {
        const payRes = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, accessToken }),
        })
        if (!payRes.ok) throw new Error('Tạo thanh toán thất bại')
      }

      clearCart()
      router.push(`/thanh-toan/xac-nhan?orderCode=${encodeURIComponent(orderCode)}&accessToken=${encodeURIComponent(accessToken)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="theme-transition flex min-h-[60vh] items-center justify-center bg-theme-page px-4 text-theme-primary">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-pink text-primary"><PackageCheck size={28} /></div>
          <h1 className="font-heading text-2xl font-bold mb-2">Giỏ hàng trống</h1>
          <p className="mb-6 text-theme-muted">Hãy thêm sản phẩm trước khi thanh toán nhé!</p>
          <Link href="/san-pham"><Button>Quay lại mua sắm</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-transition min-h-screen bg-theme-page py-6 text-theme-primary md:py-10">
      <div className="brand-container max-w-6xl">
        <CheckoutStepper currentStep={2} />
        <h1 className="sr-only">Thanh toán</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Customer info */}
            <div className="space-y-4 lg:col-span-3">
              <section className="rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card md:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-light text-primary"><PackageCheck size={20} /></div>
                  <div><h2 className="font-heading text-xl text-theme-primary">Thông tin giao hàng</h2><p className="text-xs text-theme-muted">Điền thông tin người nhận chính xác</p></div>
                </div>
                <div className="space-y-4">
                  <FormInput label="Họ tên *" name="customer_name" value={form.customer_name} onChange={handleChange} required autoComplete="name" placeholder="Nguyễn Văn A" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormInput label="Email *" name="customer_email" type="email" value={form.customer_email} onChange={handleChange} required autoComplete="email" placeholder="email@example.com" />
                    <FormInput label="Số điện thoại *" name="customer_phone" type="tel" value={form.customer_phone} onChange={handleChange} required autoComplete="tel" inputMode="tel" placeholder="0912345678" />
                  </div>
                  <Textarea label="Địa chỉ giao hàng *" name="shipping_address" value={form.shipping_address} onChange={handleChange} required rows={2} autoComplete="street-address" placeholder="Số nhà, đường, phường, quận, tỉnh/thành phố" />
                  <Textarea label="Ghi chú (tùy chọn)" name="note" value={form.note} onChange={handleChange} rows={2} placeholder="Ghi chú thêm cho đơn hàng..." />
                </div>
              </section>

              {/* Gift wrap + handwritten letter */}
              <section className="rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card md:p-7">
                <h2 className="mb-4 font-heading text-xl text-text">Gói quà &amp; thư tay</h2>
                {giftWrapNotice && (
                  <div className="mb-4">
                    <GiftWrapFeeNotice
                      notice={giftWrapNotice}
                      onDismiss={dismissGiftWrapNotice}
                    />
                  </div>
                )}
                <GiftWrapOptionContent
                  showMessageField
                  embedded
                  enabled={giftWrapEnabled}
                  fee={giftWrapUnitFee}
                  isReady={giftWrapReady}
                />
              </section>

              {/* Payment method */}
              <section className="rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card md:p-7">
                <h2 className="mb-4 font-heading text-xl text-text">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {/* Bank Transfer */}
                  <button type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
                      paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/10 ring-2 ring-primary/10' : 'border-theme-border bg-theme-elevated hover:border-primary'
                    }`}
                  >
                    <Landmark size={23} className="shrink-0 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-theme-primary">Chuyển khoản ngân hàng (QR Code)</div>
                      <div className="text-xs text-theme-muted">Tự động xác nhận sau khi chuyển khoản</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'bank_transfer' ? 'border-primary' : 'border-theme-border-strong'
                    }`}>
                      {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                  
                  {/* COD */}
                  <button type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
                      paymentMethod === 'cod' ? 'border-primary bg-primary/10 ring-2 ring-primary/10' : 'border-theme-border bg-theme-elevated hover:border-primary'
                    }`}
                  >
                    <PackageCheck size={23} className="shrink-0 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-theme-primary">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-xs text-theme-muted">Thanh toán bằng tiền mặt cho shipper</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-primary' : 'border-theme-border-strong'
                    }`}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                </div>
              </section>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-5 rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card md:p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Đơn hàng ({items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)</h2>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-theme-subtle">
                        <Image src={getPublicImageUrl(item.image)} alt={item.name} fill sizes="56px" className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                        <p className="text-xs text-theme-muted">x{item.quantity}</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {shippingFeeNotice && (
                  <div className="mb-4">
                    <ShippingFeeNotice
                      notice={shippingFeeNotice}
                      onDismiss={dismissShippingFeeNotice}
                    />
                  </div>
                )}
                <div className="space-y-2 border-t border-theme-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-muted">Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-theme-muted">Phí vận chuyển</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  {giftWrap && giftWrapReady && giftWrapEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-theme-muted">Gói quà {giftMessage.trim() ? '+ thư tay' : ''}</span>
                      <span>{giftWrapFee === 0 ? 'Miễn phí' : formatPrice(giftWrapFee)}</span>
                    </div>
                  )}
                  {session?.user && (
                    <div className="rounded-xl border border-primary/15 bg-primary-light/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-primary">Voucher</span>
                        {voucherLoading && <span className="text-xs text-theme-muted">Đang tải...</span>}
                      </div>

                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Nhập mã voucher..."
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                          className="flex-1 rounded-lg border border-theme-border bg-theme-input px-3 py-1.5 font-mono text-sm text-theme-primary outline-none focus:border-primary uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyManualCode}
                          disabled={manualLoading || !manualCode}
                          className="rounded-lg bg-primary px-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
                        >
                          {manualLoading ? '...' : 'Nhận'}
                        </button>
                      </div>
                      {manualMessage.text && (
                        <div className={`mb-3 text-xs font-semibold ${manualMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                          {manualMessage.text}
                        </div>
                      )}

                      {availableVouchers.length > 0 ? (
                        <div className="space-y-2">
                          <select
                            value={selectedVoucher?.id ?? ''}
                            onChange={(event) => {
                              if (!event.target.value) {
                                setSelectedVoucher(null)
                                setVoucherDismissed(true)
                                window.sessionStorage.setItem('mushroomie_checkout_voucher_dismissed', '1')
                                return
                              }
                              const next = availableVouchers.find((voucher) => voucher.id === event.target.value) ?? null
                              setSelectedVoucher(next)
                              setVoucherDismissed(false)
                              window.sessionStorage.removeItem('mushroomie_checkout_voucher_dismissed')
                            }}
                            className="w-full rounded-lg border border-theme-border bg-theme-input px-3 py-2 text-sm font-semibold text-theme-primary outline-none focus:border-primary"
                          >
                            <option value="">Không áp dụng voucher</option>
                            {availableVouchers.map((voucher) => (
                              <option key={voucher.id} value={voucher.id}>
                                {voucher.code} - {formatVoucherDiscountLabel(voucher)}
                              </option>
                            ))}
                          </select>
                          {selectedVoucher && (
                            <div className="rounded-lg border border-primary/15 bg-theme-elevated p-3 text-xs">
                              <div className="flex justify-between gap-2">
                                <span className="font-mono font-bold text-primary">{selectedVoucher.code}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVoucher(null)
                                    setVoucherDismissed(true)
                                    window.sessionStorage.setItem('mushroomie_checkout_voucher_dismissed', '1')
                                  }}
                                  className="font-bold text-theme-muted hover:text-primary"
                                >
                                  Bỏ áp dụng
                                </button>
                              </div>
                              <div className="mt-1 text-theme-muted">
                                {formatVoucherDiscountLabel(selectedVoucher)}{selectedVoucher.expiresAt ? `, hạn ${new Date(selectedVoucher.expiresAt).toLocaleDateString('vi-VN')}` : ''}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-theme-muted">
                          {voucherLoading ? 'Đang kiểm tra voucher của bạn.' : 'Chưa có voucher phù hợp cho đơn hàng này.'}
                        </p>
                      )}
                    </div>
                  )}
                  {(itemDiscount > 0 || shippingDiscount > 0) && (
                    <div className="flex justify-between text-sm font-semibold text-primary">
                      <span>Giảm voucher</span>
                      <span>-{formatPrice(itemDiscount + shippingDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-theme-border pt-2 text-base font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-primary text-lg">{formatPrice(total)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!shippingFeeReady || isLoading}
                  className="w-full mt-4"
                  size="lg"
                >
                  {shippingFeeReady ? 'Đặt hàng và thanh toán' : 'Đang cập nhật phí vận chuyển...'}
                </Button>
                <p className="mt-3 text-center text-xs text-theme-muted">
                  {paymentMethod === 'bank_transfer' ? 'Bạn sẽ được chuyển đến trang QR code để thanh toán' : 'Đơn hàng sẽ được đóng gói và giao đến bạn'}
                </p>
                <p className="mt-4 flex items-center justify-center gap-2 border-t border-theme-border pt-4 text-xs font-semibold text-theme-muted"><ShieldCheck size={15} className="text-primary" />Thông tin của bạn được bảo mật</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

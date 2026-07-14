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
import { trackAnalyticsEvent } from '@/lib/analytics'

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
  const shippingFee = 30000
  const voucherDiscount = selectedVoucher ? Math.min(subtotal, selectedVoucher.discountAmount) : 0
  const shippingDiscount = selectedVoucher?.discountType === 'FREE_SHIPPING'
    ? Math.min(shippingFee, selectedVoucher.discountAmount)
    : 0
  const itemDiscount = selectedVoucher?.discountType === 'FREE_SHIPPING' ? 0 : voucherDiscount
  const total = Math.max(0, subtotal - itemDiscount) + Math.max(0, shippingFee - shippingDiscount)

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
        const items = data.items ?? []
        setAvailableVouchers(items)
        if (!voucherDismissed && !selectedVoucher && data.best) {
          setSelectedVoucher(data.best)
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') console.error(error)
      } finally {
        if (!controller.signal.aborted) setVoucherLoading(false)
      }
    }

    void loadVouchers()
    return () => controller.abort()
  }, [session?.user, subtotal, selectedVoucher, voucherDismissed])

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
          shipping_fee: shippingFee,
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

      if (!orderRes.ok) {
        const data = await orderRes.json().catch(() => null)
        throw new Error(typeof data?.error === 'string' ? data.error : 'Tạo đơn hàng thất bại')
      }
      const { orderId, orderCode, accessToken } = await orderRes.json()

      // Chuyển đổi "Lượt mua hàng" của Google Ads (kiểu Nhấp chuột — đo lúc khách bấm
      // đặt hàng). Bắn sau khi đơn đã tạo xong nên vẫn gửi được mã đơn và tổng tiền
      // thật, thay vì transaction_id rỗng + value 1.0 như snippet mặc định.
      // Lưu ý: đơn chuyển khoản chưa chắc được thanh toán, nên số này là ý định mua.
      trackAnalyticsEventOnce(`ads_click_${orderCode}`, 'conversion', {
        send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
        transaction_id: orderCode,
        currency: 'VND',
        value: total,
      })

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
      <div className="flex min-h-[60vh] items-center justify-center bg-secondary px-4">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-pink text-primary"><PackageCheck size={28} /></div>
          <h1 className="font-heading text-2xl font-bold mb-2">Giỏ hàng trống</h1>
          <p className="text-neutral-500 mb-6">Hãy thêm sản phẩm trước khi thanh toán nhé!</p>
          <Link href="/san-pham"><Button>Quay lại mua sắm</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary py-6 md:py-10">
      <div className="brand-container max-w-6xl">
        <CheckoutStepper currentStep={2} />
        <h1 className="sr-only">Thanh toán</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Customer info */}
            <div className="space-y-4 lg:col-span-3">
              <section className="rounded-[18px] border-[1.5px] border-[#f0e0d6] bg-white p-5 shadow-card md:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-light text-primary"><PackageCheck size={20} /></div>
                  <div><h2 className="font-heading text-xl text-text">Thông tin giao hàng</h2><p className="text-xs text-neutral-500">Điền thông tin người nhận chính xác</p></div>
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

              {/* Payment method */}
              <section className="rounded-[18px] border-[1.5px] border-[#f0e0d6] bg-white p-5 shadow-card md:p-7">
                <h2 className="mb-4 font-heading text-xl text-text">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {/* Bank Transfer */}
                  <button type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
                      paymentMethod === 'bank_transfer' ? 'border-primary bg-primary-light ring-2 ring-primary/10' : 'border-[#e2d3c8] hover:border-primary'
                    }`}
                  >
                    <Landmark size={23} className="shrink-0 text-primary" />
                    <div>
                      <div className="font-semibold text-sm text-neutral-800">Chuyển khoản ngân hàng (QR Code)</div>
                      <div className="text-xs text-neutral-500">Tự động xác nhận sau khi chuyển khoản</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'bank_transfer' ? 'border-primary' : 'border-neutral-300'
                    }`}>
                      {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>
                  
                  {/* COD */}
                  <button type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
                      paymentMethod === 'cod' ? 'border-primary bg-primary-light ring-2 ring-primary/10' : 'border-[#e2d3c8] hover:border-primary'
                    }`}
                  >
                    <PackageCheck size={23} className="shrink-0 text-primary" />
                    <div>
                      <div className="font-semibold text-sm text-neutral-800">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-xs text-neutral-500">Thanh toán bằng tiền mặt cho shipper</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-primary' : 'border-neutral-300'
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
              <div className="sticky top-5 rounded-[18px] border-[1.5px] border-[#f0e0d6] bg-white p-5 shadow-card md:p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Đơn hàng ({items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)</h2>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-50">
                        <Image src={getPublicImageUrl(item.image)} alt={item.name} fill sizes="56px" className="object-contain p-1" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                        <p className="text-xs text-neutral-500">x{item.quantity}</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-neutral-100 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Phí vận chuyển</span>
                    <span>{formatPrice(shippingFee)}</span>
                  </div>
                  {session?.user && (
                    <div className="rounded-xl border border-primary/15 bg-primary-light/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-primary">Voucher</span>
                        {voucherLoading && <span className="text-xs text-neutral-500">Đang tải...</span>}
                      </div>

                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Nhập mã voucher..."
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                          className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-mono outline-none focus:border-primary uppercase"
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
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                          >
                            <option value="">Không áp dụng voucher</option>
                            {availableVouchers.map((voucher) => (
                              <option key={voucher.id} value={voucher.id}>
                                {voucher.code} - {formatVoucherDiscountLabel(voucher)}
                              </option>
                            ))}
                          </select>
                          {selectedVoucher && (
                            <div className="rounded-lg border border-primary/15 bg-white p-3 text-xs">
                              <div className="flex justify-between gap-2">
                                <span className="font-mono font-bold text-primary">{selectedVoucher.code}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedVoucher(null)
                                    setVoucherDismissed(true)
                                    window.sessionStorage.setItem('mushroomie_checkout_voucher_dismissed', '1')
                                  }}
                                  className="font-bold text-neutral-500 hover:text-primary"
                                >
                                  Bỏ áp dụng
                                </button>
                              </div>
                              <div className="mt-1 text-neutral-500">
                                {formatVoucherDiscountLabel(selectedVoucher)}{selectedVoucher.expiresAt ? `, hạn ${new Date(selectedVoucher.expiresAt).toLocaleDateString('vi-VN')}` : ''}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500">
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
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-100">
                    <span>Tổng cộng</span>
                    <span className="text-primary text-lg">{formatPrice(total)}</span>
                  </div>
                </div>
                <Button type="submit" isLoading={isLoading} className="w-full mt-4" size="lg">
                  Đặt hàng và thanh toán
                </Button>
                <p className="text-xs text-neutral-500 text-center mt-3">
                  {paymentMethod === 'bank_transfer' ? 'Bạn sẽ được chuyển đến trang QR code để thanh toán' : 'Đơn hàng sẽ được đóng gói và giao đến bạn'}
                </p>
                <p className="mt-4 flex items-center justify-center gap-2 border-t border-neutral-100 pt-4 text-xs font-semibold text-neutral-500"><ShieldCheck size={15} className="text-primary" />Thông tin của bạn được bảo mật</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

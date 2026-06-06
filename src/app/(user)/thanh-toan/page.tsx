'use client'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { useSession } from 'next-auth/react'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Landmark, PackageCheck, ShieldCheck } from 'lucide-react'
import FormInput from '@/components/ui/FormInput'
import Textarea from '@/components/ui/Textarea'

interface CheckoutUser {
  name?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cod'>('bank_transfer')

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
  const total = subtotal + shippingFee

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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

      if (!orderRes.ok) throw new Error('Tạo đơn hàng thất bại')
      const { orderId, orderCode } = await orderRes.json()

      if (paymentMethod === 'bank_transfer') {
        const payRes = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, orderCode }),
        })
        if (!payRes.ok) throw new Error('Tạo thanh toán thất bại')
      }

      clearCart()
      router.push(`/thanh-toan/xac-nhan?orderCode=${orderCode}`)
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
        <p className="brand-kicker mb-3">Hoàn tất đơn hàng</p>
        <h1 className="mb-7 font-heading text-3xl text-text md:text-4xl">Thanh toán</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Customer info */}
            <div className="space-y-4 lg:col-span-3">
              <section className="rounded-[18px] border border-neutral-200 bg-white p-5 shadow-card md:p-7">
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
              <section className="rounded-[18px] border border-neutral-200 bg-white p-5 shadow-card md:p-7">
                <h2 className="mb-4 font-heading text-xl text-text">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {/* Bank Transfer */}
                  <button type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
                      paymentMethod === 'bank_transfer' ? 'border-primary bg-primary-light ring-2 ring-primary/10' : 'border-neutral-200 hover:border-primary'
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
                      paymentMethod === 'cod' ? 'border-primary bg-primary-light ring-2 ring-primary/10' : 'border-neutral-200 hover:border-primary'
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
              <div className="sticky top-5 rounded-[18px] border border-neutral-200 bg-white p-5 shadow-card md:p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Đơn hàng ({items.length} sản phẩm)</h2>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-50">
                        <Image src={item.image?.startsWith('http') || item.image?.startsWith('/') || item.image?.startsWith('data:') ? item.image : '/' + item.image} alt={item.name} fill className="object-contain p-1" unoptimized />
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

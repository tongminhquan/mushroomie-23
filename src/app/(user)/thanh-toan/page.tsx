'use client'
import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { useSession } from 'next-auth/react'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cod'>('bank_transfer')

  const [form, setForm] = useState({
    customer_name: (session?.user?.name as string) || '',
    customer_email: (session?.user?.email as string) || '',
    customer_phone: '',
    shipping_address: '',
    note: '',
  })

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
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="font-heading text-2xl font-bold mb-2">Giỏ hàng trống</h1>
          <p className="text-neutral-500 mb-6">Hãy thêm sản phẩm trước khi thanh toán nhé!</p>
          <Link href="/san-pham"><Button>Quay lại mua sắm</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="font-heading text-2xl font-bold mb-6">Thanh toán</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Customer info */}
            <AnimateOnScroll animation="fade-right" className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-card">
                <h2 className="font-heading font-bold text-lg mb-4">Thông tin giao hàng</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Họ tên *</label>
                    <input name="customer_name" value={form.customer_name} onChange={handleChange} required
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1">Email *</label>
                      <input name="customer_email" type="email" value={form.customer_email} onChange={handleChange} required
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                        placeholder="email@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-1">Số điện thoại *</label>
                      <input name="customer_phone" type="tel" value={form.customer_phone} onChange={handleChange} required
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                        placeholder="0912345678" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Địa chỉ giao hàng *</label>
                    <textarea name="shipping_address" value={form.shipping_address} onChange={handleChange} required rows={2}
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                      placeholder="Số nhà, đường, phường, quận, tỉnh/thành phố" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Ghi chú (tùy chọn)</label>
                    <textarea name="note" value={form.note} onChange={handleChange} rows={2}
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none transition-colors"
                      placeholder="Ghi chú thêm cho đơn hàng..." />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-2xl p-6 shadow-card">
                <h2 className="font-heading font-bold text-lg mb-4">Phương thức thanh toán</h2>
                <div className="space-y-3">
                  {/* Bank Transfer */}
                  <div 
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'bank_transfer' ? 'border-primary bg-primary-light' : 'border-neutral-200 hover:border-primary-light'
                    }`}
                  >
                    <span className="text-2xl">🏦</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-800">Chuyển khoản ngân hàng (QR Code)</div>
                      <div className="text-xs text-neutral-500">Tự động xác nhận sau khi chuyển khoản</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'bank_transfer' ? 'border-primary' : 'border-neutral-300'
                    }`}>
                      {paymentMethod === 'bank_transfer' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                  
                  {/* COD */}
                  <div 
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      paymentMethod === 'cod' ? 'border-primary bg-primary-light' : 'border-neutral-200 hover:border-primary-light'
                    }`}
                  >
                    <span className="text-2xl">📦</span>
                    <div>
                      <div className="font-semibold text-sm text-neutral-800">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-xs text-neutral-500">Thanh toán bằng tiền mặt cho shipper</div>
                    </div>
                    <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-primary' : 'border-neutral-300'
                    }`}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
            </AnimateOnScroll>

            {/* Order summary */}
            <AnimateOnScroll animation="fade-left" className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-card sticky top-20">
                <h2 className="font-heading font-bold text-lg mb-4">Đơn hàng ({items.length} sản phẩm)</h2>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-50">
                        <Image src={item.image?.startsWith('http') || item.image?.startsWith('/') || item.image?.startsWith('data:') ? item.image : '/' + item.image} alt={item.name} fill className="object-cover" unoptimized={true} />
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
              </div>
            </AnimateOnScroll>
          </div>
        </form>
      </div>
    </div>
  )
}

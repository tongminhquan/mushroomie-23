import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumb from '@/components/layout/Breadcrumb'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'
import ReviewOrderModal from '@/components/account/ReviewOrderModal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chi tiết đơn hàng | Mushroomie' }

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  MAKING: 'bg-purple-100 text-purple-700',
  PACKING: 'bg-orange-100 text-orange-700',
  SHIPPING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  MAKING: 'Đang làm hàng',
  PACKING: 'Đóng gói',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export default async function OrderDetailsPage({ params, searchParams }: { params: Promise<{ code: string }>, searchParams: Promise<{ phone?: string, email?: string }> }) {
  const session = await auth()
  const { code } = await params
  const { phone, email } = await searchParams

  const userId = session ? parseInt((session.user as any).id) : null

  const order = await prisma.order.findUnique({
    where: { order_code: code },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
  })

  if (!order) {
    notFound()
  }

  // Nếu user đã đăng nhập, phải là chủ đơn hàng
  if (userId) {
    if (order.user_id !== userId) notFound()
  } else {
    // Nếu chưa đăng nhập (khách vãng lai), phải cung cấp phone hoặc email đúng với đơn hàng
    if (!phone && !email) {
      redirect(`/tai-khoan/dang-nhap?callbackUrl=/tai-khoan/don-hang/${code}`)
    }
    const matchPhone = phone && order.customer_phone === phone
    const matchEmail = email && order.customer_email === email
    if (!matchPhone && !matchEmail) {
      notFound()
    }
  }

  const isExpired = order.payment?.status === 'EXPIRED'
  const displayStatus = isExpired ? 'CANCELLED' : order.order_status

  return (
    <div className="min-h-screen bg-secondary py-6">
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumb items={[
          { label: 'Tài khoản', href: '/tai-khoan' },
          { label: 'Đơn hàng', href: '/tai-khoan/don-hang' },
          { label: `#${order.order_code}` }
        ]} />

        <AnimateOnScroll animation="fade-down" className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Chi tiết đơn hàng <span className="text-primary font-mono">#{order.order_code}</span></h1>
            <p className="text-sm text-neutral-500 mt-1">Đặt lúc {formatDate(order.created_at)}</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full font-bold text-sm ${statusColors[displayStatus] || 'bg-neutral-100 text-neutral-700'}`}>
            {statusLabels[displayStatus] || displayStatus}
          </div>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <AnimateOnScroll animation="fade-up" className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Sản phẩm đã đặt</h2>
              <div className="space-y-4">
                {order.items.map((item: any) => {
                  const imageUrl = item.product?.featured_image || '/logo.png'
                  const safeImageUrl = imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:') ? imageUrl : '/' + imageUrl

                  return (
                    <div key={item.id} className="flex gap-4 p-3 bg-neutral-50 rounded-xl">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-white border border-neutral-100">
                        <Image src={safeImageUrl} alt={item.product_name} fill className="object-cover" unoptimized={true} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={item.product ? `/san-pham/${item.product.slug}` : '#'} className="font-bold text-neutral-800 hover:text-primary transition-colors line-clamp-1">
                          {item.product_name}
                        </Link>
                        {item.selected_options && item.selected_options !== '{}' && (
                          <div className="text-xs text-neutral-500 mt-1">
                            {Object.entries(JSON.parse(item.selected_options)).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </div>
                        )}
                        {item.custom_note && (
                          <div className="text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded inline-block mt-1">
                            Ghi chú: {item.custom_note}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-sm text-primary">{formatPrice(Number(item.price_snapshot))}</span>
                          <span className="text-sm font-semibold text-neutral-600">x{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Thông tin giao hàng</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-neutral-500 mb-1">Người nhận</div>
                  <div className="font-bold">{order.customer_name}</div>
                </div>
                <div>
                  <div className="text-neutral-500 mb-1">Số điện thoại</div>
                  <div className="font-bold">{order.customer_phone}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-neutral-500 mb-1">Địa chỉ</div>
                  <div className="font-medium text-neutral-800">{order.shipping_address}</div>
                </div>
                {order.note && (
                  <div className="sm:col-span-2">
                    <div className="text-neutral-500 mb-1">Ghi chú đơn hàng</div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-yellow-800 text-xs">{order.note}</div>
                  </div>
                )}
              </div>
            </AnimateOnScroll>
          </div>

          <div className="space-y-6">
            <AnimateOnScroll animation="fade-left" className="bg-white rounded-2xl shadow-card p-6 sticky top-20">
              <h2 className="font-heading font-bold text-lg mb-4">Tổng cộng</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tạm tính</span>
                  <span>{formatPrice(Number(order.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Phí vận chuyển</span>
                  <span>{formatPrice(Number(order.shipping_fee))}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-3 font-bold text-base">
                  <span>Tổng tiền</span>
                  <span className="text-primary text-xl">{formatPrice(Number(order.total))}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100">
                <div className="text-xs text-neutral-500 mb-2">Phương thức thanh toán</div>
                <div className="font-semibold text-sm">
                  {order.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)'}
                </div>
                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  order.payment_status === 'PAID' ? 'bg-green-100 text-green-700' :
                  order.payment_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {order.payment_status === 'PAID' ? 'Đã thanh toán' :
                   order.payment_status === 'PENDING' ? 'Chờ thanh toán' : 'Thất bại/Hủy'}
                </div>
              </div>

              {order.payment_status === 'PENDING' && order.payment_method !== 'cod' && !isExpired && (
                <div className="mt-6">
                  <Link href={`/thanh-toan/xac-nhan?orderCode=${order.order_code}`}>
                    <button className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors">
                      Thanh toán ngay
                    </button>
                  </Link>
                </div>
              )}

              {displayStatus === 'COMPLETED' && !order.is_reviewed && (
                <div className="mt-6">
                  <ReviewOrderModal orderId={order.id} />
                </div>
              )}
            </AnimateOnScroll>
          </div>
        </div>
      </div>
    </div>
  )
}

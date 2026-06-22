import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Breadcrumb from '@/components/layout/Breadcrumb'
import AnimateOnScroll, { StaggerChildren } from '@/components/ui/AnimateOnScroll'
import ReviewOrderModal from '@/components/account/ReviewOrderModal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Đơn hàng của tôi | Mushroomie' }

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

export default async function MyOrdersPage() {
  const session = await auth()
  if (!session) redirect('/tai-khoan/dang-nhap')

  const userId = parseInt((session.user as any).id)
  const orders = await prisma.order.findMany({
    where: { user_id: userId },
    include: { items: true, payment: true },
    orderBy: { created_at: 'desc' },
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-secondary py-6">
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumb items={[{ label: 'Tài khoản', href: '/tai-khoan' }, { label: 'Đơn hàng' }]} />

        <AnimateOnScroll animation="fade-down">
          <div
            className="relative overflow-hidden rounded-[24px] border-[1.5px] px-6 py-8 mt-2 mb-6 sm:px-9"
            style={{
              borderColor: '#f0e0d6',
              background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))',
            }}
          >
            <span
              className="animate-float-soft absolute right-[10%] top-6 text-2xl text-primary"
              aria-hidden
              style={{ pointerEvents: 'none' }}
            >
              🧾
            </span>
            <div className="text-xs font-extrabold tracking-[0.14em] uppercase text-primary">
              Tài khoản của bạn
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold mt-1.5 text-neutral-800">
              Đơn hàng của tôi
            </h1>
            <p className="text-neutral-500 text-sm mt-2 max-w-md">
              Theo dõi trạng thái và lịch sử mua sắm những món đồ thủ công của bạn 🍄
            </p>
          </div>
        </AnimateOnScroll>

        {orders.length === 0 ? (
          <AnimateOnScroll animation="zoom-in">
            <div
              className="bg-white rounded-[24px] shadow-card border-[1.5px] p-12 text-center"
              style={{ borderColor: '#f0e0d6' }}
            >
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                style={{ background: '#ffece6' }}
              >
                📦
              </div>
              <h2 className="font-heading font-bold text-xl mb-2 text-neutral-800">Chưa có đơn hàng nào</h2>
              <p className="text-neutral-500 mb-6">Hãy khám phá sản phẩm và đặt hàng ngay!</p>
              <Link
                href="/san-pham"
                className="inline-block bg-primary text-white px-6 py-3 rounded-full font-bold shadow-[0_8px_20px_rgba(201,20,20,0.3)] hover:bg-primary-dark transition-colors"
              >
                Mua sắm ngay
              </Link>
            </div>
          </AnimateOnScroll>
        ) : (
          <div className="space-y-4">
            <StaggerChildren animation="fade-up" staggerDelay={100}>
              {orders.map((order: any) => {
                const isExpired = order.payment?.status === 'EXPIRED'
                const displayStatus = isExpired ? 'CANCELLED' : order.order_status

                return (
                <div
                  key={order.id}
                  className="bg-white rounded-[20px] shadow-card border-[1.5px] p-5 hover:shadow-hover transition-all"
                  style={{ borderColor: '#f0e0d6' }}
                >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-12 w-12 flex-none items-center justify-center rounded-[14px] text-xl"
                      style={{ background: '#ffece6' }}
                      aria-hidden
                    >
                      🛍️
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-primary text-sm">#{order.order_code}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{formatDate(order.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[displayStatus] || 'bg-neutral-100 text-neutral-700'}`}>
                      {statusLabels[displayStatus] || displayStatus}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-accent-kraft font-semibold mb-3">
                  {order.items.length} sản phẩm • {formatPrice(Number(order.total))}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#f0e0d6]">
                  <Link href={`/tai-khoan/don-hang/${order.order_code}`}
                    className="text-primary text-sm font-semibold hover:underline mt-2">
                    Xem chi tiết →
                  </Link>
                  {order.payment_status === 'PENDING' && order.payment_method !== 'cod' && !isExpired && (
                    <Link href={`/thanh-toan/xac-nhan?orderCode=${order.order_code}`}
                      className="bg-primary text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-[0_8px_20px_rgba(201,20,20,0.3)] hover:bg-primary-dark transition-colors mt-2">
                      Thanh toán
                    </Link>
                  )}
                  {displayStatus === 'COMPLETED' && !(order as any).is_reviewed && (
                    <ReviewOrderModal orderId={order.id} />
                  )}
                </div>
              </div>
              )})}
            </StaggerChildren>
          </div>
        )}
      </div>
    </div>
  )
}

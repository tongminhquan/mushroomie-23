import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import Breadcrumb from '@/components/layout/Breadcrumb'
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
        <h1 className="font-heading text-2xl font-bold mt-2 mb-6">Đơn hàng của tôi</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="font-heading font-bold text-xl mb-2">Chưa có đơn hàng nào</h2>
            <p className="text-neutral-500 mb-6">Hãy khám phá sản phẩm và đặt hàng ngay!</p>
            <Link href="/san-pham" className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-dark transition-colors">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-card p-5 hover:shadow-hover transition-all">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-mono font-bold text-primary text-sm">#{order.order_code}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.order_status] || 'bg-neutral-100 text-neutral-700'}`}>
                      {statusLabels[order.order_status] || order.order_status}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-neutral-600 mb-3">
                  {order.items.length} sản phẩm • {formatPrice(Number(order.total))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/tai-khoan/don-hang/${order.order_code}`}
                    className="text-primary text-sm font-semibold hover:underline">
                    Xem chi tiết →
                  </Link>
                  {order.payment_status === 'PENDING' && (
                    <Link href={`/thanh-toan/xac-nhan?orderCode=${order.order_code}`}
                      className="bg-primary text-white text-xs px-4 py-1.5 rounded-full font-semibold hover:bg-primary-dark transition-colors">
                      Thanh toán
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

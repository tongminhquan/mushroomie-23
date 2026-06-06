import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import { ShoppingCart, Package, FileText, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { AdminCard, AdminPageHeader, AdminStatusBadge } from '@/components/admin/AdminUI'

export const metadata: Metadata = { title: 'Dashboard | Admin Mushroomie' }

const statusTones: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING_PAYMENT: 'warning',
  PROCESSING: 'info',
  MAKING: 'info',
  PACKING: 'warning',
  SHIPPING: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Chờ TT',
  PROCESSING: 'Xử lý',
  MAKING: 'Đang làm',
  PACKING: 'Đóng gói',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export default async function AdminDashboard() {
  const [totalOrders, revenueResult, totalProducts, totalPosts, unreadContacts, recentOrders] = await Promise.all([
    prisma.order.count().catch(() => 0),
    prisma.order.aggregate({ _sum: { total: true }, where: { order_status: { not: 'CANCELLED' }, OR: [{ payment_status: 'PAID' }, { order_status: 'COMPLETED' }] } }).catch(() => ({ _sum: { total: 0 } })),
    prisma.product.count({ where: { status: 'active' } }).catch(() => 0),
    prisma.post.count({ where: { status: 'published' } }).catch(() => 0),
    prisma.contact.count({ where: { status: 'unread' } }).catch(() => 0),
    prisma.order.findMany({ take: 8, orderBy: { created_at: 'desc' }, include: { payment: true } }).catch(() => []),
  ])

  const totalRevenue = Number(revenueResult._sum.total || 0)

  const stats = [
    { icon: ShoppingCart, label: 'Tổng đơn hàng', value: totalOrders, href: '/admin/don-hang' },
    { icon: TrendingUp, label: 'Doanh thu', value: formatPrice(totalRevenue), href: '/admin/don-hang' },
    { icon: Package, label: 'Sản phẩm', value: totalProducts, href: '/admin/san-pham' },
    { icon: FileText, label: 'Bài viết', value: totalPosts, href: '/admin/bai-viet' },
    { icon: MessageSquare, label: 'Liên hệ mới', value: unreadContacts, href: '/admin/lien-he' },
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader title="Tổng quan" description="Theo dõi nhanh hoạt động bán hàng và nội dung." />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-pink hover:shadow-hover">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
              <stat.icon size={20} />
            </div>
            <div className="text-xl font-bold text-neutral-900 truncate">{stat.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <AdminCard className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Đơn hàng gần đây</h2>
          <Link href="/admin/don-hang" className="text-primary text-sm font-semibold hover:underline">Xem tất cả →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left py-2 px-2 text-neutral-500 font-medium">Mã đơn</th>
                <th className="text-left py-2 px-2 text-neutral-500 font-medium">Khách hàng</th>
                <th className="text-left py-2 px-2 text-neutral-500 font-medium">Tổng tiền</th>
                <th className="text-left py-2 px-2 text-neutral-500 font-medium">Trạng thái</th>
                <th className="text-left py-2 px-2 text-neutral-500 font-medium">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-2">
                    <Link href={`/admin/don-hang/${order.id}`} className="font-mono text-primary hover:underline font-semibold text-xs">
                      #{order.order_code}
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-neutral-500">{order.customer_phone}</div>
                  </td>
                  <td className="py-3 px-2 font-semibold">{formatPrice(Number(order.total))}</td>
                  <td className="py-3 px-2">
                    <AdminStatusBadge tone={statusTones[order.order_status] || 'neutral'}>
                      {statusLabels[order.order_status] || order.order_status}
                    </AdminStatusBadge>
                  </td>
                  <td className="py-3 px-2 text-neutral-500 text-xs">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-sm">Chưa có đơn hàng nào</div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

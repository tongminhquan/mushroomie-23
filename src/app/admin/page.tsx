import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import { ShoppingCart, Package, FileText, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard | Admin Mushroomie' }

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
    { icon: ShoppingCart, label: 'Tổng đơn hàng', value: totalOrders, color: 'bg-blue-50 text-blue-600', href: '/admin/don-hang' },
    { icon: TrendingUp, label: 'Doanh thu', value: formatPrice(totalRevenue), color: 'bg-green-50 text-green-600', href: '/admin/don-hang' },
    { icon: Package, label: 'Sản phẩm', value: totalProducts, color: 'bg-purple-50 text-purple-600', href: '/admin/san-pham' },
    { icon: FileText, label: 'Bài viết', value: totalPosts, color: 'bg-yellow-50 text-yellow-600', href: '/admin/bai-viet' },
    { icon: MessageSquare, label: 'Liên hệ mới', value: unreadContacts, color: 'bg-red-50 text-red-600', href: '/admin/lien-he' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">🍄 Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">Xin chào! Dưới đây là tổng quan hệ thống.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="bg-white rounded-2xl p-4 shadow-card hover:shadow-hover transition-all hover:-translate-y-0.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div className="text-xl font-bold text-neutral-900 truncate">{stat.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-card p-6">
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.order_status] || 'bg-neutral-100 text-neutral-700'}`}>
                      {statusLabels[order.order_status] || order.order_status}
                    </span>
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
      </div>
    </div>
  )
}

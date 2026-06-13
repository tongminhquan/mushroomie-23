import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import { AdminCard, AdminPageHeader, AdminStatusBadge } from '@/components/admin/AdminUI'
import { DashboardContent } from '@/components/admin/dashboard/DashboardContent'

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
  const recentOrders = await prisma.order.findMany({ 
    take: 8, 
    orderBy: { created_at: 'desc' }, 
    include: { payment: true } 
  }).catch(() => [])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader title="Tổng quan" description="Theo dõi số liệu và hoạt động kinh doanh." />

      {/* Main Dashboard Stats and Charts */}
      <DashboardContent />

      {/* Recent orders table */}
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

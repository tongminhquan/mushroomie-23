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
      <AdminCard className="overflow-hidden rounded-[16px] border-[1.5px] border-[#f0e0d6]">
        <div className="flex items-center justify-between gap-4 border-b border-[#f0e0d6] px-5 py-4 sm:px-6">
          <h2 className="font-heading text-base text-neutral-900 sm:text-lg">Đơn hàng gần đây</h2>
          <Link
            href="/admin/don-hang"
            className="text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-secondary text-left">
                <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-neutral-400 sm:px-6">Mã đơn</th>
                <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-neutral-400">Khách hàng</th>
                <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-neutral-400">Tổng tiền</th>
                <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-neutral-400">Trạng thái</th>
                <th className="px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-neutral-400">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-[#f0e0d6] transition-colors hover:bg-secondary"
                >
                  <td className="px-5 py-3 sm:px-6">
                    <Link
                      href={`/admin/don-hang/${order.id}`}
                      className="font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      #{order.order_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">{order.customer_name}</div>
                    <div className="text-xs text-neutral-400">{order.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900">{formatPrice(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone={statusTones[order.order_status] || 'neutral'}>
                      {statusLabels[order.order_status] || order.order_status}
                    </AdminStatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="py-8 text-center text-sm text-neutral-400">Chưa có đơn hàng nào</div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

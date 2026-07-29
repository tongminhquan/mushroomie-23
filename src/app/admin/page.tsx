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

// Sticker hành động nhanh trên dashboard — mỗi ô một màu brand
const QUICK_ACTIONS = [
  { href: '/admin/san-pham/them', emoji: '🧸', label: 'Thêm sản phẩm', hint: 'Vòng tay, charm mới', bg: 'bg-[#ffd6d6]/60', ring: 'ring-[#ffb9b9]' },
  { href: '/admin/bai-viet/them', emoji: '✍️', label: 'Viết bài mới', hint: 'Chia sẻ câu chuyện', bg: 'bg-[#ffe7a3]/50', ring: 'ring-[#f0d98c]' },
  { href: '/admin/bai-viet/dang-hang-loat', emoji: '⚡', label: 'Đăng tự động', hint: 'Excel + hẹn giờ', bg: 'bg-[#ffece3]/70', ring: 'ring-[#ffc9b0]' },
  { href: '/admin/don-hang', emoji: '📦', label: 'Đơn hàng', hint: 'Gói quà & vận chuyển', bg: 'bg-[#f3e4d3]/60', ring: 'ring-[#dfc4a6]' },
]

function greetingByHour(): { text: string; emoji: string } {
  const hour = Number(new Intl.DateTimeFormat('vi-VN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
  if (hour >= 5 && hour < 11) return { text: 'Chào buổi sáng', emoji: '🌞' }
  if (hour >= 11 && hour < 14) return { text: 'Buổi trưa an lành', emoji: '🍵' }
  if (hour >= 14 && hour < 18) return { text: 'Chào buổi chiều', emoji: '🌤' }
  return { text: 'Buổi tối ấm áp', emoji: '🌙' }
}

export default async function AdminDashboard() {
  const recentOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { created_at: 'desc' },
    include: { payment: true }
  }).catch(() => [])

  const greeting = greetingByHour()
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title={`${greeting.text}! ${greeting.emoji}`}
        description={`Hôm nay ${today} — “Từ từng hạt nhỏ, tạo phong cách riêng”.`}
      />

      {/* Hành động nhanh — sticker style */}
      <div data-batch-reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_ACTIONS.map((qa) => (
          <Link
            key={qa.href}
            href={qa.href}
            className={`group flex items-center gap-3 rounded-[16px] px-4 py-3.5 ring-1 ring-inset ${qa.bg} ${qa.ring} transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-hover motion-reduce:transform-none motion-reduce:transition-none`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/85 text-xl shadow-[0_2px_6px_rgba(91,48,35,0.1)] transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none" aria-hidden>
              {qa.emoji}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-theme-primary">{qa.label}</span>
              <span className="block truncate text-[11px] text-neutral-500">{qa.hint}</span>
            </span>
          </Link>
        ))}
      </div>

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

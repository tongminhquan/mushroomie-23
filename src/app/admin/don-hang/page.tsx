import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quản lý đơn hàng | Admin Mushroomie' }

interface SearchParams { page?: string; status?: string; search?: string }

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

const paymentColors: Record<string, string> = {
  PENDING: 'text-yellow-600',
  PAID: 'text-green-600',
  FAILED: 'text-red-600',
  EXPIRED: 'text-neutral-500',
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Number(sp.page || 1)
  const limit = 20

  const where: any = {}
  if (sp.status) where.order_status = sp.status
  if (sp.search) {
    where.OR = [
      { order_code: { contains: sp.search } },
      { customer_name: { contains: sp.search } },
      { customer_email: { contains: sp.search } },
      { customer_phone: { contains: sp.search } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, payment: true },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }).catch(() => []),
    prisma.order.count({ where }).catch(() => 0),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Quản lý đơn hàng</h1>
          <p className="text-neutral-500 text-sm">{total} đơn hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <input
            placeholder="Tìm mã đơn, tên KH, email, SĐT..."
            defaultValue={sp.search}
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {['', 'PENDING_PAYMENT', 'PROCESSING', 'MAKING', 'PACKING', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((s) => (
            <Link key={s} href={`/admin/don-hang?${s ? `status=${s}` : ''}`}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                (sp.status || '') === s ? 'bg-primary text-white' : 'bg-neutral-100 hover:bg-neutral-200'
              }`}>
              {s ? statusLabels[s] : 'Tất cả'}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Mã đơn</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Khách hàng</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Tổng tiền</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Thanh toán</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Trạng thái</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Ngày tạo</th>
                <th className="text-right py-3 px-4 text-neutral-500 font-medium">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-primary font-semibold text-xs">#{order.order_code}</span>
                    <div className="text-xs text-neutral-400">{order.items.length} sp</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-sm">{order.customer_name}</div>
                    <div className="text-xs text-neutral-400">{order.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold">{formatPrice(Number(order.total))}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold ${paymentColors[order.payment_status] || ''}`}>
                      {order.payment_status === 'PAID' ? '✅ Đã TT' : order.payment_status === 'PENDING' ? '⏳ Chờ' : '❌ Lỗi'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[order.order_status] || 'bg-neutral-100'}`}>
                      {statusLabels[order.order_status] || order.order_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 text-xs">{formatDate(order.created_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/don-hang/${order.id}`} className="text-primary text-xs font-semibold hover:underline">Xem →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-neutral-500">Không có đơn hàng nào</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-neutral-50">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={`/admin/don-hang?${new URLSearchParams({ ...sp, page: String(p) })}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-neutral-100 hover:bg-neutral-200'
                }`}>{p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

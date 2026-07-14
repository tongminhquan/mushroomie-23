import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quản lý đơn hàng | Admin Mushroomie' }

interface SearchParams { page?: string; status?: string; search?: string }

const statusColors: Record<string, string> = {
  PENDING_PAYMENT: 'bg-[#ffe7a3] text-[#8a6410]',
  PROCESSING: 'bg-[#eaf1fd] text-[#2a6fdb]',
  MAKING: 'bg-purple-100 text-purple-700',
  PACKING: 'bg-[#ffece6] text-[#b9791b]',
  SHIPPING: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-[#e9f7ef] text-[#1f8a5b]',
  CANCELLED: 'bg-[#ffd6d6] text-[#c0392b]',
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
  PENDING: 'text-[#b9791b]',
  PAID: 'text-[#1f8a5b]',
  FAILED: 'text-[#c0392b]',
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
    <div className="p-6 bg-secondary min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-[11px] font-semibold text-neutral-400">Tổng quan / Đơn hàng</div>
          <h1 className="font-heading text-2xl text-neutral-800 mt-0.5">Quản lý đơn hàng</h1>
          <p className="text-neutral-500 text-sm mt-1">{total} đơn hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0e0d6] p-4 shadow-card mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          <input
            placeholder="Tìm mã đơn, tên KH, email, SĐT..."
            defaultValue={sp.search}
            className="w-full px-4 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1">
          {['', 'PENDING_PAYMENT', 'PROCESSING', 'MAKING', 'PACKING', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((s) => (
            <Link key={s} href={`/admin/don-hang?${s ? `status=${s}` : ''}`}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                (sp.status || '') === s ? 'bg-primary text-white' : 'bg-secondary text-neutral-600 border-[1.5px] border-[#f0e0d6] hover:border-primary hover:text-primary'
              }`}>
              {s ? statusLabels[s] : 'Tất cả'}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-secondary border-b-[1.5px] border-[#f0e0d6]">
              <tr>
                <th className="text-left py-3 px-4 text-neutral-500 font-bold text-[11px] uppercase tracking-wide">Mã đơn</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-bold text-[11px] uppercase tracking-wide">Khách hàng</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-bold text-[11px] uppercase tracking-wide">Tổng tiền</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-bold text-[11px] uppercase tracking-wide">Thanh toán</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-bold text-[11px] uppercase tracking-wide">Trạng thái</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-bold text-[11px] uppercase tracking-wide">Ngày tạo</th>
                <th className="text-right py-3 px-4 text-neutral-500 font-bold text-[11px] uppercase tracking-wide">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f6ece5]">
              {orders.map((order: any) => {
                const isExpired = order.payment?.status === 'EXPIRED'
                const displayOrderStatus = isExpired ? 'CANCELLED' : order.order_status
                const displayPaymentStatus = isExpired ? 'EXPIRED' : order.payment_status

                return (
                <tr key={order.id} className="hover:bg-[#fff7f2] transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-primary font-semibold text-xs">#{order.order_code}</span>
                    <div className="text-xs text-neutral-400">{order.items.length} sp</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-sm text-neutral-800">{order.customer_name}</div>
                    <div className="text-xs text-neutral-400">{order.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-neutral-800">{formatPrice(Number(order.total))}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-semibold ${paymentColors[displayPaymentStatus] || ''}`}>
                      {displayPaymentStatus === 'PAID' ? '✅ Đã TT' : displayPaymentStatus === 'PENDING' ? '⏳ Chờ' : displayPaymentStatus === 'EXPIRED' ? '❌ Hết hạn' : '❌ Lỗi'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[displayOrderStatus] || 'bg-secondary text-neutral-600'}`}>
                      {statusLabels[displayOrderStatus] || displayOrderStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 text-xs">{formatDate(order.created_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/don-hang/${order.id}`} className="text-primary text-xs font-semibold hover:underline">Xem →</Link>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-neutral-500">Không có đơn hàng nào</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t-[1.5px] border-[#f0e0d6]">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={`/admin/don-hang?${new URLSearchParams({ ...sp, page: String(p) })}`}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-secondary text-neutral-600 border-[1.5px] border-[#f0e0d6] hover:border-primary hover:text-primary'
                }`}>{p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

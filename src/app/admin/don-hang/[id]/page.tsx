import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import AdminOrderActions from './AdminOrderActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chi tiết đơn hàng | Admin Mushroomie' }

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
  SHIPPING: 'Đang giao hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      items: true,
      payment: true,
      status_history: { orderBy: { created_at: 'asc' } },
    },
  })
  if (!order) notFound()

  const isExpired = order.payment?.status === 'EXPIRED'
  const displayStatus = isExpired ? 'CANCELLED' : order.order_status

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/don-hang"
          className="inline-flex items-center gap-1 rounded-lg border-[1.5px] border-[#e2d3c8] bg-white px-3 py-1.5 text-sm font-semibold text-neutral-500 transition-colors hover:border-primary hover:text-primary"
        >
          ← Quay lại
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900">Đơn hàng #{order.order_code}</h1>
          <p className="text-neutral-500 text-sm">Tạo lúc {formatDate(order.created_at)}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${statusColors[displayStatus] || 'bg-neutral-100 text-neutral-700'}`}>
          {statusLabels[displayStatus] || displayStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Customer info */}
          <div className="bg-white rounded-[16px] p-5 border-[1.5px] border-[#f0e0d6] shadow-card">
            <h2 className="font-heading text-base mb-4 text-neutral-900">Thông tin khách hàng</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Họ tên', order.customer_name],
                ['Email', order.customer_email],
                ['Điện thoại', order.customer_phone],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wide">{label}</div>
                  <div className="font-semibold text-neutral-900 mt-0.5">{value}</div>
                </div>
              ))}
              <div className="col-span-2">
                <div className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wide">Địa chỉ giao hàng</div>
                <div className="font-semibold text-neutral-900 mt-0.5">{order.shipping_address}</div>
              </div>
              {order.note && (
                <div className="col-span-2 rounded-lg bg-yellow-50 border-[1.5px] border-[#f0dba8] px-3 py-2">
                  <div className="text-[#8a6410] text-[11px] font-semibold uppercase tracking-wide">Ghi chú</div>
                  <div className="font-semibold text-[#8a6410] mt-0.5">{order.note}</div>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-[16px] p-5 border-[1.5px] border-[#f0e0d6] shadow-card">
            <h2 className="font-heading text-base mb-4 text-neutral-900">Sản phẩm đặt ({order.items.length})</h2>
            <div className="space-y-1">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm py-2.5 border-b border-[#f0e0d6] last:border-0">
                  <div>
                    <div className="font-semibold text-neutral-900">{item.product_name}</div>
                    {item.selected_options && (
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {Object.entries(JSON.parse(item.selected_options)).map(([k, v]) => `${k}: ${v}`).join(', ')}
                      </div>
                    )}
                    {item.custom_note && <div className="text-xs text-primary mt-0.5">Note: {item.custom_note}</div>}
                    <div className="text-neutral-400 text-xs mt-0.5">x{item.quantity}</div>
                  </div>
                  <div className="font-bold text-right text-neutral-900">{formatPrice(Number(item.total_price))}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-3 space-y-1.5 text-sm border-t border-dashed border-[#e2d3c8]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Tạm tính</span>
                <span className="text-neutral-900">{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Phí vận chuyển</span>
                <span className="text-neutral-900">{formatPrice(Number(order.shipping_fee))}</span>
              </div>
              {Number(order.voucher_discount_amount) > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Voucher {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                  <span>-{formatPrice(Number(order.voucher_discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2.5 mt-1 border-t border-[#f0e0d6]">
                <span className="text-neutral-900">Tổng cộng</span>
                <span className="text-primary font-heading">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Status history */}
          <div className="bg-white rounded-[16px] p-5 border-[1.5px] border-[#f0e0d6] shadow-card">
            <h2 className="font-heading text-base mb-4 text-neutral-900">Lịch sử trạng thái</h2>
            <div className="space-y-3">
              {order.status_history.map((h: any, i: number) => (
                <div key={h.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary-light mt-1.5 flex-shrink-0" />
                    {i < order.status_history.length - 1 && <div className="w-0.5 h-full bg-[#f0e0d6] mt-1" />}
                  </div>
                  <div className="pb-3">
                    <div className="font-semibold text-neutral-900">{statusLabels[h.new_status] || h.new_status}</div>
                    <div className="text-neutral-400 text-xs mt-0.5">{formatDate(h.created_at)} · {h.changed_by}</div>
                    {h.note && <div className="text-neutral-600 text-xs mt-0.5">{h.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Payment info */}
          {order.payment && (
            <div className="bg-white rounded-[16px] p-5 border-[1.5px] border-[#f0e0d6] shadow-card">
              <h2 className="font-heading text-base mb-4 text-neutral-900">Thanh toán</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Trạng thái</span>
                  <span className={`font-bold ${order.payment.status === 'PAID' ? 'text-green-600' : order.payment.status === 'EXPIRED' ? 'text-neutral-500' : 'text-yellow-600'}`}>
                    {order.payment.status === 'PAID' ? '✅ Đã thanh toán' : order.payment.status === 'EXPIRED' ? '❌ Đã hết hạn' : '⏳ Chờ thanh toán'}
                  </span>
                </div>
                {order.payment.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Ngân hàng</span>
                    <span className="font-semibold text-neutral-900">{order.payment.bank_name}</span>
                  </div>
                )}
                {order.payment.paid_at && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Thanh toán lúc</span>
                    <span className="font-semibold text-xs text-neutral-900">{formatDate(order.payment.paid_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Update status */}
          <AdminOrderActions orderId={order.id} currentStatus={displayStatus} />
        </div>
      </div>
    </div>
  )
}

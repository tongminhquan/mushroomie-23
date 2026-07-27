'use client'
import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/payments?status=${filter}`)
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [filter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-[#e9f7ef] text-[#1f8a5b] border-[#c9ecd6]'
      case 'PENDING': return 'bg-[#fdf3df] text-[#b9791b] border-[#f3e4bd]'
      case 'FAILED': return 'bg-[#fdeceb] text-[#d83a2f] border-[#f6d2cf]'
      case 'EXPIRED': return 'bg-[#f1efed] text-neutral-600 border-[#e2d3c8]'
      default: return 'bg-neutral-100 text-neutral-700 border-[#f0e0d6]'
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
        <div>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Tổng quan / Thanh toán</p>
          <h1 className="text-2xl font-heading text-neutral-800 mt-0.5">Quản lý Thanh toán</h1>
          <p className="text-neutral-500 text-sm mt-1">Lịch sử giao dịch và trạng thái thanh toán đơn hàng.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap bg-white p-1.5 rounded-[14px] shadow-card border-[1.5px] border-[#f0e0d6]">
          {['ALL', 'PENDING', 'PAID', 'EXPIRED', 'FAILED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === status ? 'bg-primary text-white shadow-sm' : 'text-neutral-500 hover:bg-[#fdf2ec]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[16px] shadow-card border-[1.5px] border-[#f0e0d6] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[#fbf6f2] text-neutral-400 border-b-[1.5px] border-[#f0e0d6]">
              <tr>
                <th className="px-6 py-3.5 font-bold text-[11px] uppercase tracking-wide">Mã Đơn / Khách hàng</th>
                <th className="px-6 py-3.5 font-bold text-[11px] uppercase tracking-wide">Số tiền</th>
                <th className="px-6 py-3.5 font-bold text-[11px] uppercase tracking-wide">Phương thức</th>
                <th className="px-6 py-3.5 font-bold text-[11px] uppercase tracking-wide">Trạng thái</th>
                <th className="px-6 py-3.5 font-bold text-[11px] uppercase tracking-wide">Thời gian tạo</th>
                <th className="px-6 py-3.5 font-bold text-[11px] uppercase tracking-wide">Nội dung CK</th>
              </tr>
            </thead>
            <tbody className="m-admin-rows divide-y divide-[#f6ece4] text-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-neutral-500">Không tìm thấy giao dịch nào</p>
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id} className="hover:bg-[#fff7f2] transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-primary">
                        <Link href={`/admin/don-hang/${payment.order_id}`}>
                          #{payment.order?.order_code || 'N/A'}
                        </Link>
                      </div>
                      <div className="text-neutral-500 text-xs mt-1">{payment.order?.customer_name}</div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-neutral-800">
                      {formatPrice(Number(payment.amount))}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-medium">{payment.provider}</div>
                      <div className="text-neutral-500 text-xs uppercase">{payment.bank_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border-[1.5px] ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      {payment.paid_at && (
                        <div className="text-[10px] text-neutral-400 mt-1">
                          {format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-neutral-500">
                      {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-3.5">
                      <code className="text-xs bg-[#fbf6f2] text-neutral-600 border-[1.5px] border-[#f0e0d6] px-2 py-1 rounded">
                        {payment.transfer_content}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

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
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200'
      case 'EXPIRED': return 'bg-neutral-100 text-neutral-700 border-neutral-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Quản lý Thanh toán</h1>
          <p className="text-neutral-500 text-sm mt-1">Lịch sử giao dịch và trạng thái thanh toán đơn hàng.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap bg-white p-1 rounded-xl shadow-sm border border-neutral-200">
          {['ALL', 'PENDING', 'PAID', 'EXPIRED', 'FAILED'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === status ? 'bg-primary text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Mã Đơn / Khách hàng</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Phương thức</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Thời gian tạo</th>
                <th className="px-6 py-4">Nội dung CK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
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
                  <tr key={payment.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">
                        <Link href={`/admin/don-hang/${payment.order_id}`}>
                          #{payment.order?.order_code || 'N/A'}
                        </Link>
                      </div>
                      <div className="text-neutral-500 text-xs mt-1">{payment.order?.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatPrice(Number(payment.amount))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{payment.provider}</div>
                      <div className="text-neutral-500 text-xs uppercase">{payment.bank_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      {payment.paid_at && (
                        <div className="text-[10px] text-neutral-400 mt-1">
                          {format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded">
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

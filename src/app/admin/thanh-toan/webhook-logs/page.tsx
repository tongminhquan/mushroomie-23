'use client'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/api/webhooks/logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED': return 'bg-green-100 text-green-700 border-green-200'
      case 'VERIFIED': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'RECEIVED': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'IGNORED': return 'bg-neutral-100 text-neutral-700 border-neutral-200'
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading">Lịch sử Webhook (Logs)</h1>
        <p className="text-neutral-500 text-sm mt-1">Lịch sử các yêu cầu webhook từ cổng thanh toán (Casso/SePay).</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Nguồn (Provider)</th>
                <th className="px-6 py-4">Mã sự kiện (Event ID)</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Chi tiết lỗi / Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-3">📡</div>
                    <p className="text-neutral-500">Chưa có dữ liệu Webhook nào</p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {log.provider}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                        {log.event_id}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {log.error_message ? (
                        <span className="text-red-500 text-xs">{log.error_message}</span>
                      ) : log.status === 'PROCESSED' ? (
                        <span className="text-green-600 text-xs">Cập nhật đơn hàng thành công</span>
                      ) : (
                        <span className="text-neutral-400 text-xs">-</span>
                      )}
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

'use client'
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, processed: 0, failed: 0, last24h: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })

  const [filterProvider, setFilterProvider] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filterProvider && { provider: filterProvider }),
        ...(filterStatus && { status: filterStatus }),
        ...(searchQuery && { search: searchQuery }),
      })

      const res = await fetch(`/api/webhooks/logs?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setLogs(data.data || [])
        if (data.summary) setSummary(data.summary)
        if (data.pagination) setPagination(data.pagination)
      } else {
        setLogs([])
      }
    } catch (err) {
      console.error(err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [filterProvider, filterStatus, searchQuery, pagination.limit])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  const handleTestLog = async () => {
    setIsTestLoading(true)
    try {
      const res = await fetch('/api/admin/webhook-logs/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'casso', status: 'RECEIVED' })
      })
      if (res.ok) {
        alert('Tạo test log thành công!')
        fetchLogs(1)
      } else {
        alert('Lỗi tạo test log')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsTestLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED': return 'bg-green-100 text-green-700 border-green-200'
      case 'VERIFIED': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'RECEIVED': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'IGNORED': return 'bg-neutral-100 text-neutral-700 border-[#f0e0d6]'
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Thanh toán / Webhook</div>
          <h1 className="text-2xl font-heading text-neutral-900 mt-1">Lịch sử Webhook (Logs)</h1>
          <p className="text-neutral-500 text-sm mt-1">Lịch sử các yêu cầu webhook từ cổng thanh toán (Casso/SePay).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTestLog}
            disabled={isTestLoading}
            className="px-4 py-2 bg-white text-neutral-700 border-[1.5px] border-[#e2d3c8] hover:bg-[#fff6f1] rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {isTestLoading ? 'Đang tạo...' : 'Tạo Log Test'}
          </button>
          <button
            onClick={() => fetchLogs(1)}
            className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg text-sm font-semibold transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-2">Tổng số Webhook</div>
          <div className="text-2xl font-heading text-neutral-900">{summary.total}</div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-2">Xử lý thành công</div>
          <div className="text-2xl font-heading text-green-600">{summary.processed}</div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-2">Xử lý lỗi</div>
          <div className="text-2xl font-heading text-red-600">{summary.failed}</div>
        </div>
        <div className="bg-white p-5 rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-2">Trong 24 giờ qua</div>
          <div className="text-2xl font-heading text-blue-600">{summary.last24h}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[16px] border-[1.5px] border-[#f0e0d6] shadow-card mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tìm theo Event ID, Mã GD..."
            className="w-full px-3 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg text-sm outline-none focus:border-primary transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">Nguồn (Provider)</label>
          <select
            className="w-full px-3 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg text-sm outline-none focus:border-primary transition-colors"
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="casso">Casso</option>
            <option value="sepay">SePay</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">Trạng thái</label>
          <select
            className="w-full px-3 py-2 border-[1.5px] border-[#e2d3c8] rounded-lg text-sm outline-none focus:border-primary transition-colors"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="PROCESSED">PROCESSED</option>
            <option value="IGNORED">IGNORED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] shadow-card border-[1.5px] border-[#f0e0d6] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#fbf4ef] text-neutral-500 border-b-[1.5px] border-[#f0e0d6]">
              <tr>
                <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-[0.05em]">Thời gian</th>
                <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-[0.05em]">Nguồn</th>
                <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-[0.05em]">Mã sự kiện</th>
                <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-[0.05em]">Số tiền</th>
                <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-[0.05em]">Trạng thái</th>
                <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-[0.05em]">Ghi chú</th>
                <th className="px-6 py-3.5 font-semibold text-xs uppercase tracking-[0.05em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5ebe4]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-neutral-500 text-sm font-medium">Không tìm thấy dữ liệu Webhook nào</p>
                    <p className="text-neutral-400 text-xs mt-1">Webhook từ cổng thanh toán sẽ hiển thị tại đây.</p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#fff7f2] transition-colors">
                    <td className="px-6 py-3.5 text-neutral-600 whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-3.5 font-bold uppercase text-xs text-neutral-700">
                      {log.provider}
                    </td>
                    <td className="px-6 py-3.5">
                      <code className="text-xs bg-[#fbf4ef] border border-[#f0e0d6] text-neutral-700 px-2 py-1 rounded font-mono">
                        {log.event_id}
                      </code>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-600 whitespace-nowrap">
                      {log.amount ? `${Number(log.amount).toLocaleString('vi-VN')} ₫` : '-'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="max-w-[200px] truncate text-xs">
                        {log.error_message ? (
                          <span className="text-red-500" title={log.error_message}>{log.error_message}</span>
                        ) : (
                          <span className="text-neutral-500" title={log.message}>{log.message || '-'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-primary hover:text-primary-dark font-semibold text-xs hover:underline"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t-[1.5px] border-[#f0e0d6] flex items-center justify-between">
            <span className="text-sm text-neutral-500">
              Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total})
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-3 py-1.5 bg-white border-[1.5px] border-[#e2d3c8] rounded-lg text-sm font-medium text-neutral-700 hover:bg-[#fff6f1] disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-3 py-1.5 bg-white border-[1.5px] border-[#e2d3c8] rounded-lg text-sm font-medium text-neutral-700 hover:bg-[#fff6f1] disabled:opacity-50 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal View Details */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[16px] shadow-card border-[1.5px] border-[#f0e0d6] w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b-[1.5px] border-[#f0e0d6] flex justify-between items-center bg-[#fbf4ef] rounded-t-[14px]">
              <h3 className="font-heading text-lg text-neutral-900">Chi tiết Webhook: {selectedLog.event_id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-neutral-500 block mb-1">Trạng thái</span>
                  <span className={`px-2 py-1 inline-block rounded text-xs font-bold border ${getStatusColor(selectedLog.status)}`}>{selectedLog.status}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Nhận lúc</span>
                  <span className="font-medium text-neutral-800">{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Mã Giao Dịch</span>
                  <span className="font-medium text-neutral-800">{selectedLog.transaction_code || '-'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Mã Đơn Hàng</span>
                  <span className="font-medium text-neutral-800">{selectedLog.order_id ? `#${selectedLog.order_id}` : '-'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">IP Address</span>
                  <span className="font-medium text-neutral-800">{selectedLog.ip_address || '-'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Message</span>
                  <span className="font-medium text-neutral-800">{selectedLog.message || '-'}</span>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-800 text-sm font-semibold block mb-1">Error Message</span>
                  <p className="text-red-600 text-sm">{selectedLog.error_message}</p>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-bold text-sm mb-2 text-neutral-700">Sanitized Headers</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-xs font-mono">
                    {JSON.stringify(selectedLog.sanitized_headers || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2 text-neutral-700">Payload (Sanitized)</h4>
                <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-blue-400 text-xs font-mono">
                    {JSON.stringify(selectedLog.raw_payload || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t-[1.5px] border-[#f0e0d6] flex justify-end bg-[#fbf4ef] rounded-b-[14px]">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-white border-[1.5px] border-[#e2d3c8] hover:bg-[#fff6f1] text-neutral-700 rounded-lg text-sm font-semibold transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

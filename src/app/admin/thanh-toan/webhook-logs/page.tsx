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
      case 'IGNORED': return 'bg-neutral-100 text-neutral-700 border-neutral-200'
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Lịch sử Webhook (Logs)</h1>
          <p className="text-neutral-500 text-sm mt-1">Lịch sử các yêu cầu webhook từ cổng thanh toán (Casso/SePay).</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleTestLog} 
            disabled={isTestLoading}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg text-sm font-medium transition-colors"
          >
            {isTestLoading ? 'Đang tạo...' : 'Tạo Log Test'}
          </button>
          <button 
            onClick={() => fetchLogs(1)} 
            className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg text-sm font-medium transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm text-neutral-500 mb-1">Tổng số Webhook</div>
          <div className="text-2xl font-bold">{summary.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm text-neutral-500 mb-1">Xử lý thành công</div>
          <div className="text-2xl font-bold text-green-600">{summary.processed}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm text-neutral-500 mb-1">Xử lý lỗi</div>
          <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-sm text-neutral-500 mb-1">Trong 24 giờ qua</div>
          <div className="text-2xl font-bold text-blue-600">{summary.last24h}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Tìm kiếm</label>
          <input 
            type="text" 
            placeholder="Tìm theo Event ID, Mã GD..." 
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs text-neutral-500 mb-1">Nguồn (Provider)</label>
          <select 
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="casso">Casso</option>
            <option value="sepay">SePay</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs text-neutral-500 mb-1">Trạng thái</label>
          <select 
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
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
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Nguồn</th>
                <th className="px-6 py-4">Mã sự kiện</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ghi chú</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">Đang tải dữ liệu...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-3">📡</div>
                    <p className="text-neutral-500">Không tìm thấy dữ liệu Webhook nào</p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 font-semibold uppercase text-xs">
                      {log.provider}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-neutral-100 px-2 py-1 rounded">
                        {log.event_id}
                      </code>
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600 whitespace-nowrap">
                      {log.amount ? `${Number(log.amount).toLocaleString('vi-VN')} ₫` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px] truncate text-xs">
                        {log.error_message ? (
                          <span className="text-red-500" title={log.error_message}>{log.error_message}</span>
                        ) : (
                          <span className="text-neutral-500" title={log.message}>{log.message || '-'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs underline"
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
          <div className="p-4 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-sm text-neutral-500">
              Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total})
            </span>
            <div className="flex gap-2">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="px-3 py-1 bg-white border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="px-3 py-1 bg-white border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 rounded-t-xl">
              <h3 className="font-bold text-lg">Chi tiết Webhook: {selectedLog.event_id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-black">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-neutral-500 block mb-1">Trạng thái</span>
                  <span className={`px-2 py-1 inline-block rounded text-xs font-bold ${getStatusColor(selectedLog.status)}`}>{selectedLog.status}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Nhận lúc</span>
                  <span className="font-medium">{format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Mã Giao Dịch</span>
                  <span className="font-medium">{selectedLog.transaction_code || '-'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Mã Đơn Hàng</span>
                  <span className="font-medium">{selectedLog.order_id ? `#${selectedLog.order_id}` : '-'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">IP Address</span>
                  <span className="font-medium">{selectedLog.ip_address || '-'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Message</span>
                  <span className="font-medium">{selectedLog.message || '-'}</span>
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
            
            <div className="p-4 border-t border-neutral-200 flex justify-end bg-neutral-50 rounded-b-xl">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-sm font-medium transition-colors">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


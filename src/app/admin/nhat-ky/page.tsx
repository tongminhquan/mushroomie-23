'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface AdminLog {
  id: number
  user_id: number
  action: string
  entity: string
  details: string | null
  ip_address: string | null
  created_at: string
  user: {
    name: string
    email: string
    role: string
  }
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const query = new URLSearchParams({ page: page.toString() })
      if (actionFilter) query.append('action', actionFilter)
      if (entityFilter) query.append('entity', entityFilter)

      const res = await fetch(`/api/admin-logs?${query.toString()}`)
      if (!res.ok) {
        if (res.status === 401) throw new Error('Bạn không có quyền truy cập. Chỉ Super Admin mới được xem.')
        throw new Error('Lỗi khi tải dữ liệu nhật ký')
      }
      const data = await res.json()
      setLogs(data.logs)
      setTotalPages(data.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter, entityFilter])

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700'
      case 'UPDATE': return 'bg-blue-100 text-blue-700'
      case 'DELETE': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-800">Nhật ký hoạt động</h1>
          <p className="text-sm text-neutral-500">Giám sát các thao tác của quản trị viên hệ thống</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={actionFilter} 
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">Tất cả hành động</option>
            <option value="CREATE">Tạo mới (CREATE)</option>
            <option value="UPDATE">Cập nhật (UPDATE)</option>
            <option value="DELETE">Xóa (DELETE)</option>
          </select>
          <select 
            value={entityFilter} 
            onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
            className="border rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">Tất cả đối tượng</option>
            <option value="PRODUCT">Sản phẩm</option>
            <option value="ORDER">Đơn hàng</option>
            <option value="POST">Bài viết</option>
            <option value="USER">Người dùng</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : loading ? (
        <div className="text-center py-12 text-neutral-500">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Thời gian</th>
                    <th className="px-6 py-4 font-semibold">Tài khoản</th>
                    <th className="px-6 py-4 font-semibold">Hành động</th>
                    <th className="px-6 py-4 font-semibold">Đối tượng</th>
                    <th className="px-6 py-4 font-semibold">IP</th>
                    <th className="px-6 py-4 font-semibold">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                        Không có dữ liệu nhật ký
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-neutral-800">{log.user.name}</div>
                          <div className="text-xs text-neutral-500">{log.user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-neutral-700">
                          {log.entity}
                        </td>
                        <td className="px-6 py-4 text-neutral-500 text-xs">
                          {log.ip_address || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          {log.details ? (
                            <details className="text-xs text-neutral-600 cursor-pointer">
                              <summary className="font-semibold text-primary">Xem chi tiết</summary>
                              <pre className="mt-2 p-2 bg-neutral-100 rounded overflow-x-auto whitespace-pre-wrap max-w-xs">
                                {JSON.stringify(JSON.parse(log.details), null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-neutral-400 text-xs">Không có</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 border rounded-md disabled:opacity-50 hover:bg-neutral-50"
              >
                Trước
              </button>
              <span className="px-4 py-1.5 bg-neutral-100 rounded-md font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 border rounded-md disabled:opacity-50 hover:bg-neutral-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

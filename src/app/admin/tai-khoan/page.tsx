'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, User as UserIcon, Loader2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  name: string
  email: string
  role: string
  phone?: string
  address?: string
  password_hash?: string
  created_at: string
  avatar?: string
  google_id?: string
  is_email_verified?: boolean
}

export default function AdminAccountsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (role !== 'super_admin') {
      router.push('/admin')
      return
    }
    fetchUsers()
  }, [status, role])

  if (status === 'loading' || role !== 'super_admin') return null

  const fetchUsers = async (searchQuery = '') => {
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      alert('Lỗi khi tải danh sách người dùng')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    fetchUsers(search)
  }

  const handleUpdateRole = async (userId: number, newRole: string) => {
    setUpdatingId(userId)
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update')
      }

      alert('Cập nhật quyền thành công')
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error: any) {
      alert(error.message || 'Lỗi khi cập nhật quyền')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.')) return
    
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa')
      
      alert('Xóa tài khoản thành công')
      setUsers(users.filter(u => u.id !== userId))
    } catch (error: any) {
      alert(error.message || 'Lỗi khi xóa tài khoản')
    }
  }

  const roleLabels: Record<string, string> = {
    super_admin: 'Chủ hệ thống',
    admin: 'Admin',
    viewer: 'Viewer',
    user: 'User'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Quản lý Tài khoản</h1>
          <p className="text-neutral-500 mt-1">Cấp quyền và quản lý tài khoản người dùng</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <form onSubmit={handleSearch} className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-neutral-500 uppercase bg-neutral-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Người dùng</th>
                <th className="px-6 py-4 font-medium">Ngày đăng ký</th>
                <th className="px-6 py-4 font-medium">Vai trò</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                    Không tìm thấy tài khoản nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-neutral-100 shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="max-w-xs whitespace-normal">
                          <div className="font-medium text-neutral-900 flex items-center gap-1.5">
                            {user.name}
                            {user.google_id && (
                              <span title="Tài khoản liên kết Google" className="flex items-center justify-center bg-white border border-neutral-200 rounded-full p-0.5">
                                <svg className="w-3 h-3" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="text-neutral-500 flex items-center gap-1.5">
                            {user.email}
                            {user.is_email_verified && <span title="Email đã xác minh"><Shield size={12} className="text-green-500" /></span>}
                          </div>
                          {user.phone && <div className="text-xs text-neutral-500 mt-1">SĐT: <span className="font-medium text-neutral-700">{user.phone}</span></div>}
                          {user.address && <div className="text-xs text-neutral-500 line-clamp-2" title={user.address}>Đ/c: <span className="font-medium text-neutral-700">{user.address}</span></div>}
                          <div className="text-xs text-neutral-500 mt-0.5">MK (Mã hóa): <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[10px] break-all border border-neutral-200 inline-block mt-1" title={user.password_hash}>{user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'Không có'}</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        ['super_admin', 'admin', 'viewer'].includes(user.role) 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {['super_admin', 'admin', 'viewer'].includes(user.role) ? <Shield size={12} /> : <UserIcon size={12} />}
                        {roleLabels[user.role] || user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          disabled={updatingId === user.id}
                          className="bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-32 p-2 disabled:opacity-50"
                        >
                          <option value="user">User</option>
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Chủ hệ thống</option>
                        </select>
                        {user.id !== (session?.user as any)?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
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

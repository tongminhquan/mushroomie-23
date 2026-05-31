'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, User as UserIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface User {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export default function AdminAccountsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (searchQuery = '') => {
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setUsers(data)
    } catch (error) {
      toast.error('Lỗi khi tải danh sách người dùng')
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

      toast.success('Cập nhật quyền thành công')
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi cập nhật quyền')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Tài khoản</h1>
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
          <table className="w-full text-sm text-left">
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-neutral-900">{user.name}</div>
                          <div className="text-neutral-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {user.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        disabled={updatingId === user.id}
                        className="bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-32 p-2 ml-auto disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface EditProfileFormProps {
  initialName: string
  initialEmail: string
  initialPhone: string
  initialAddress: string
}

export function EditProfileForm({
  initialName,
  initialEmail,
  initialPhone,
  initialAddress,
}: EditProfileFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: initialName,
    phone: initialPhone || '',
    address: initialAddress || '',
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setMessage('')

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors(data.error || { name: [data.message || 'Có lỗi xảy ra'] })
      } else {
        setMessage('Cập nhật thông tin thành công! ✨')
        setIsEditing(false)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setErrors({ name: ['Không thể kết nối đến server'] })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">Họ và tên</label>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-800 font-medium">
              {form.name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">Email</label>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-800 font-medium">
              {initialEmail}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-500 mb-1">Số điện thoại</label>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-800 font-medium">
              {form.phone || <span className="text-neutral-400 italic font-normal">Chưa cập nhật</span>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-500 mb-1">Địa chỉ nhận hàng</label>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-neutral-800 font-medium">
              {form.address || <span className="text-neutral-400 italic font-normal">Chưa cập nhật</span>}
            </div>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-sm font-semibold rounded-xl text-center">
            {message}
          </div>
        )}

        <div className="pt-6 mt-6 border-t border-neutral-100 flex justify-end">
          <Button type="button" onClick={() => setIsEditing(true)} size="md">
            Chỉnh sửa thông tin
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Họ và tên *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${
              errors.name ? 'border-red-400 focus:border-red-400' : 'border-neutral-200 focus:border-primary'
            }`}
            placeholder="Nguyễn Văn A"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-500 mb-1">Email (Không thể thay đổi)</label>
          <input
            type="email"
            disabled
            value={initialEmail}
            className="w-full px-4 py-3 border-2 border-neutral-100 bg-neutral-50 rounded-xl text-sm text-neutral-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Số điện thoại *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${
              errors.phone ? 'border-red-400 focus:border-red-400' : 'border-neutral-200 focus:border-primary'
            }`}
            placeholder="0912345678"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone[0]}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-neutral-700 mb-1">Địa chỉ nhận hàng *</label>
          <textarea
            required
            rows={3}
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${
              errors.address ? 'border-red-400 focus:border-red-400' : 'border-neutral-200 focus:border-primary'
            }`}
            placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address[0]}</p>}
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-neutral-100 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsEditing(false)
            setForm({
              name: initialName,
              phone: initialPhone || '',
              address: initialAddress || '',
            })
            setErrors({})
          }}
          size="md"
        >
          Hủy
        </Button>
        <Button type="submit" isLoading={isLoading} size="md">
          Lưu thay đổi
        </Button>
      </div>
    </form>
  )
}

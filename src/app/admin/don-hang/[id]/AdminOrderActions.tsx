'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const ORDER_STATUSES = [
  { value: 'PROCESSING', label: '🔵 Đang xử lý' },
  { value: 'MAKING', label: '🟣 Đang làm hàng' },
  { value: 'PACKING', label: '🟠 Đóng gói' },
  { value: 'SHIPPING', label: '🟤 Đang giao hàng' },
  { value: 'COMPLETED', label: '🟢 Hoàn tất' },
  { value: 'CANCELLED', label: '🔴 Hủy đơn' },
]

export default function AdminOrderActions({ orderId, currentStatus }: { orderId: number; currentStatus: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [note, setNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUpdate = async () => {
    if (status === currentStatus) return
    setIsLoading(true)
    setSuccess(false)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: status, note }),
      })
      if (res.ok) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card">
      <h2 className="font-heading font-bold text-base mb-4">Cập nhật trạng thái</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Trạng thái mới</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-[#f0e0d6] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Ghi chú (tùy chọn)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ghi chú cập nhật..."
            className="w-full px-3 py-2 border border-[#f0e0d6] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
        {success && (
          <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg">✅ Đã cập nhật thành công</div>
        )}
        <Button onClick={handleUpdate} isLoading={isLoading} className="w-full" size="md">
          Cập nhật trạng thái
        </Button>
      </div>
    </div>
  )
}

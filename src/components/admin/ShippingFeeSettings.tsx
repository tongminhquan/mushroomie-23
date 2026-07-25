'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Info, Loader2, Save, Truck } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import {
  DEFAULT_SHIPPING_FEE,
  MAX_SHIPPING_FEE,
  shippingFeeValueSchema,
} from '@/lib/shipping-fee'

interface ShippingFeeResponse {
  shippingFee: number
  updatedAt: string
  changed?: boolean
}

function formatUpdatedAt(value: string) {
  if (!value || value === '1970-01-01T00:00:00.000Z') return 'Chưa có lần cập nhật'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Chưa xác định'
    : date.toLocaleString('vi-VN')
}

export default function ShippingFeeSettings() {
  const [savedFee, setSavedFee] = useState(DEFAULT_SHIPPING_FEE)
  const [draftFee, setDraftFee] = useState(String(DEFAULT_SHIPPING_FEE))
  const [updatedAt, setUpdatedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadShippingFee() {
      try {
        const response = await fetch('/api/shipping-fee', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null) as ShippingFeeResponse | null
        if (!response.ok || !data) throw new Error('Không thể tải phí vận chuyển.')

        setSavedFee(data.shippingFee)
        setDraftFee(String(data.shippingFee))
        setUpdatedAt(data.updatedAt)
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải phí vận chuyển.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadShippingFee()
    return () => controller.abort()
  }, [])

  const parsedDraft = /^\d+$/.test(draftFee.trim())
    ? shippingFeeValueSchema.safeParse(Number(draftFee))
    : null
  const draftValue = parsedDraft?.success ? parsedDraft.data : null
  const hasChanges = draftValue !== null && draftValue !== savedFee

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (draftValue === null) {
      setError(`Phí vận chuyển phải là số nguyên từ 0 đến ${formatPrice(MAX_SHIPPING_FEE)}.`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/shipping-fee', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingFee: draftValue }),
      })
      const data = await response.json().catch(() => null) as ShippingFeeResponse | null
      if (!response.ok || !data) {
        throw new Error(response.status === 401
          ? 'Bạn không có quyền thay đổi phí vận chuyển.'
          : 'Không thể lưu phí vận chuyển.')
      }

      setSavedFee(data.shippingFee)
      setDraftFee(String(data.shippingFee))
      setUpdatedAt(data.updatedAt)
      setSuccess(data.changed === false
        ? 'Phí vận chuyển không thay đổi.'
        : 'Đã cập nhật phí vận chuyển cho các đơn hàng mới.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu phí vận chuyển.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-56 items-center justify-center text-sm text-neutral-500">
        <Loader2 size={20} className="mr-2 animate-spin text-primary" />
        Đang tải phí vận chuyển...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#f0e0d6] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-light text-primary">
            <Truck size={20} />
          </span>
          <div>
            <h2 className="font-heading text-lg text-neutral-900">Phí vận chuyển toàn website</h2>
            <p className="mt-0.5 text-sm text-neutral-500">Áp dụng một lần cho mỗi đơn hàng mới.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#f0e0d6] bg-[#fffaf7] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Đang áp dụng</p>
          <p className="mt-2 font-heading text-2xl text-neutral-900">{formatPrice(savedFee)}</p>
          <p className="mt-1 text-xs text-neutral-500">Cập nhật: {formatUpdatedAt(updatedAt)}</p>
        </div>
        <div className="rounded-lg border border-[#f0e0d6] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Sau khi lưu</p>
          <p className="mt-2 font-heading text-2xl text-primary">
            {draftValue === null ? 'Chưa hợp lệ' : formatPrice(draftValue)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Khách đang mở giỏ hàng sẽ nhận cập nhật trong khoảng 5 giây.</p>
        </div>
      </div>

      <div>
        <label htmlFor="shipping-fee" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">
          Phí vận chuyển mới (VND)
        </label>
        <input
          id="shipping-fee"
          type="number"
          min={0}
          max={MAX_SHIPPING_FEE}
          step={1_000}
          inputMode="numeric"
          value={draftFee}
          onChange={(event) => {
            setDraftFee(event.target.value)
            setError('')
            setSuccess('')
          }}
          className="min-h-12 w-full rounded-lg border-[1.5px] border-[#e2d3c8] px-4 text-base font-bold text-neutral-900 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
          aria-describedby="shipping-fee-help"
        />
        <p id="shipping-fee-help" className="mt-2 text-xs leading-5 text-neutral-500">
          Nhập 0 nếu muốn miễn phí vận chuyển. Mức tối đa là {formatPrice(MAX_SHIPPING_FEE)}.
        </p>
      </div>

      <div className="flex gap-3 rounded-lg border border-[#f2d7a0] bg-[#fffaf0] p-4 text-sm leading-6 text-neutral-700">
        <Info size={19} className="mt-0.5 shrink-0 text-[#9b6500]" />
        <p>
          Thay đổi chỉ áp dụng cho đơn hàng tạo sau khi lưu. Đơn hàng, số tiền thanh toán và mã QR đã tạo trước đó được giữ nguyên.
        </p>
      </div>

      <div aria-live="polite">
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        {success && (
          <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            <CheckCircle2 size={18} />
            {success}
          </p>
        )}
      </div>

      <div className="flex justify-end border-t border-[#f0e0d6] pt-4">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          isLoading={saving}
        >
          {!saving && <Save size={18} />}
          Lưu phí vận chuyển
        </Button>
      </div>
    </div>
  )
}

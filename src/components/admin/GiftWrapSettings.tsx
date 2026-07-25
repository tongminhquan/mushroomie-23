'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Gift, Info, Loader2, Save } from 'lucide-react'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import {
  DEFAULT_GIFT_WRAP_FEE,
  MAX_GIFT_WRAP_FEE,
  giftWrapFeeValueSchema,
} from '@/lib/gift-wrap'

interface GiftWrapResponse {
  fee: number
  enabled: boolean
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

export default function GiftWrapSettings() {
  const [savedFee, setSavedFee] = useState(DEFAULT_GIFT_WRAP_FEE)
  const [savedEnabled, setSavedEnabled] = useState(true)
  const [draftFee, setDraftFee] = useState(String(DEFAULT_GIFT_WRAP_FEE))
  const [draftEnabled, setDraftEnabled] = useState(true)
  const [updatedAt, setUpdatedAt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadGiftWrap() {
      try {
        const response = await fetch('/api/gift-wrap', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null) as GiftWrapResponse | null
        if (!response.ok || !data) throw new Error('Không thể tải cấu hình gói quà.')

        setSavedFee(data.fee)
        setSavedEnabled(data.enabled)
        setDraftFee(String(data.fee))
        setDraftEnabled(data.enabled)
        setUpdatedAt(data.updatedAt)
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải cấu hình gói quà.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadGiftWrap()
    return () => controller.abort()
  }, [])

  const parsedDraft = /^\d+$/.test(draftFee.trim())
    ? giftWrapFeeValueSchema.safeParse(Number(draftFee))
    : null
  const draftValue = parsedDraft?.success ? parsedDraft.data : null
  const hasChanges = draftValue !== null
    && (draftValue !== savedFee || draftEnabled !== savedEnabled)

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (draftValue === null) {
      setError(`Phí gói quà phải là số nguyên từ 0 đến ${formatPrice(MAX_GIFT_WRAP_FEE)}.`)
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/gift-wrap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fee: draftValue, enabled: draftEnabled }),
      })
      const data = await response.json().catch(() => null) as GiftWrapResponse | null
      if (!response.ok || !data) {
        throw new Error(response.status === 401
          ? 'Bạn không có quyền thay đổi cấu hình gói quà.'
          : 'Không thể lưu cấu hình gói quà.')
      }

      setSavedFee(data.fee)
      setSavedEnabled(data.enabled)
      setDraftFee(String(data.fee))
      setDraftEnabled(data.enabled)
      setUpdatedAt(data.updatedAt)
      setSuccess(data.changed === false
        ? 'Cấu hình gói quà không thay đổi.'
        : 'Đã cập nhật gói quà cho các đơn hàng mới.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Không thể lưu cấu hình gói quà.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-56 items-center justify-center text-sm text-neutral-500">
        <Loader2 size={20} className="mr-2 animate-spin text-primary" />
        Đang tải cấu hình gói quà...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#f0e0d6] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-light text-primary">
            <Gift size={20} />
          </span>
          <div>
            <h2 className="font-heading text-lg text-neutral-900">Gói quà &amp; thư tay</h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              Áp dụng cho mọi sản phẩm, tính một lần cho mỗi đơn hàng. Thư tay viết tay miễn phí.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#f0e0d6] bg-[#fffaf7] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Đang áp dụng</p>
          <p className="mt-2 font-heading text-2xl text-neutral-900">
            {savedEnabled ? formatPrice(savedFee) : 'Đang tắt'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">Cập nhật: {formatUpdatedAt(updatedAt)}</p>
        </div>
        <div className="rounded-lg border border-[#f0e0d6] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Sau khi lưu</p>
          <p className="mt-2 font-heading text-2xl text-primary">
            {!draftEnabled ? 'Tắt dịch vụ' : draftValue === null ? 'Chưa hợp lệ' : formatPrice(draftValue)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Khách đang mở trang thanh toán sẽ nhận cập nhật trong khoảng 5 giây.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#f0e0d6] bg-white p-4">
        <input
          type="checkbox"
          checked={draftEnabled}
          onChange={(event) => {
            setDraftEnabled(event.target.checked)
            setError('')
            setSuccess('')
          }}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#c91414]"
        />
        <span className="text-sm leading-6 text-neutral-700">
          <span className="font-bold text-neutral-900">Mở dịch vụ gói quà</span>
          <br />
          Bỏ chọn khi hết hộp quà hoặc quá tải đơn — khách sẽ không thấy tuỳ chọn này nữa, đơn đã đặt không bị ảnh hưởng.
        </span>
      </label>

      <div>
        <label htmlFor="gift-wrap-fee" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">
          Phí gói quà mới (VND)
        </label>
        <input
          id="gift-wrap-fee"
          type="number"
          min={0}
          max={MAX_GIFT_WRAP_FEE}
          step={1_000}
          inputMode="numeric"
          value={draftFee}
          disabled={!draftEnabled}
          onChange={(event) => {
            setDraftFee(event.target.value)
            setError('')
            setSuccess('')
          }}
          className="min-h-12 w-full rounded-lg border-[1.5px] border-[#e2d3c8] px-4 text-base font-bold text-neutral-900 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
          aria-describedby="gift-wrap-fee-help"
        />
        <p id="gift-wrap-fee-help" className="mt-2 text-xs leading-5 text-neutral-500">
          Nhập 0 nếu muốn gói quà miễn phí. Mức tối đa là {formatPrice(MAX_GIFT_WRAP_FEE)}. Thư tay luôn miễn phí.
        </p>
      </div>

      <div className="flex gap-3 rounded-lg border border-[#f2d7a0] bg-[#fffaf0] p-4 text-sm leading-6 text-neutral-700">
        <Info size={19} className="mt-0.5 shrink-0 text-[#9b6500]" />
        <p>
          Thay đổi chỉ áp dụng cho đơn hàng tạo sau khi lưu. Nếu khách đang thanh toán với mức phí cũ, hệ thống sẽ báo giá vừa đổi và yêu cầu xác nhận lại tổng tiền.
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
          Lưu cấu hình gói quà
        </Button>
      </div>
    </div>
  )
}

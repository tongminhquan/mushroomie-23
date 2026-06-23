'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminCard, AdminPageHeader } from '@/components/admin/AdminUI'
import Button from '@/components/ui/Button'
import FormInput from '@/components/ui/FormInput'
import Textarea from '@/components/ui/Textarea'

type VoucherForm = {
  code: string
  title: string
  description: string
  type: 'PROMOTION_CODE' | 'GAME_REWARD' | 'MANUAL'
  discountType: 'PERCENT' | 'FIXED'
  discountValue: string
  maxDiscount: string
  minOrderValue: string
  usageLimit: string
  perUserLimit: string
  status: 'ACTIVE' | 'INACTIVE'
  sourceGame: string
  requiredScore: string
  startsAt: string
  expiresAt: string
}

const initialForm: VoucherForm = {
  code: '',
  title: '',
  description: '',
  type: 'PROMOTION_CODE',
  discountType: 'PERCENT',
  discountValue: '',
  maxDiscount: '',
  minOrderValue: '',
  usageLimit: '',
  perUserLimit: '1',
  status: 'ACTIVE',
  sourceGame: '',
  requiredScore: '',
  startsAt: '',
  expiresAt: '',
}

export default function AdminCreateVoucherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState<VoucherForm>(initialForm)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const readErrorMessage = async (res: Response) => {
    try {
      const data = await res.json()
      return data.message || data.error || 'Lỗi khi tạo voucher'
    } catch {
      return 'Lỗi khi tạo voucher'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        title: form.title.trim(),
        discountValue: Number(form.discountValue),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: Number(form.perUserLimit || 1),
        requiredScore: form.type === 'GAME_REWARD' && form.requiredScore ? Number(form.requiredScore) : null,
        sourceGame: form.type === 'GAME_REWARD' && form.sourceGame ? form.sourceGame : null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }

      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error(await readErrorMessage(res))
      }

      setSuccess('Tạo voucher thành công.')
      setTimeout(() => router.push('/admin/voucher'), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo voucher')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="mb-2 flex items-center gap-4">
        <Link
          href="/admin/voucher"
          className="grid h-10 w-10 place-items-center rounded-xl border-[1.5px] border-[#f0e0d6] bg-white text-neutral-500 shadow-card transition hover:border-primary hover:text-primary"
          aria-label="Quay lại danh sách voucher"
        >
          <ArrowLeft size={20} />
        </Link>
        <AdminPageHeader
          title="Tạo voucher mới"
          description="Thiết lập voucher khuyến mãi, voucher mini game hoặc mã cấp thủ công."
        />
      </div>

      <AdminCard className="rounded-[16px] border-[1.5px] border-[#f0e0d6] p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">Loại voucher</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-lg border-[1.5px] border-[#e2d3c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              >
                <option value="PROMOTION_CODE">Mã khuyến mãi user tự nhập</option>
                <option value="GAME_REWARD">Phần thưởng mini game</option>
                <option value="MANUAL">Cấp thủ công</option>
              </select>
            </div>

            <FormInput
              label="Mã voucher *"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              placeholder="VD: MUSH30"
            />
          </div>

          <FormInput
            label="Tên chương trình / tiêu đề *"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="VD: Giảm 30K cho đơn từ 199K"
          />
          <Textarea
            label="Mô tả"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            placeholder="Nhập mô tả ngắn để admin dễ nhận diện voucher..."
          />

          {form.type === 'GAME_REWARD' && (
            <div className="grid gap-6 rounded-[14px] border-[1.5px] border-primary/20 bg-primary-light/30 p-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-neutral-700">Game áp dụng</label>
                <select
                  name="sourceGame"
                  value={form.sourceGame}
                  onChange={handleChange}
                  className="w-full rounded-lg border-[1.5px] border-[#e2d3c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                >
                  <option value="">Tất cả game</option>
                  <option value="tetris">Tetris</option>
                  <option value="block-blast">Block Blast 8x8</option>
                </select>
              </div>
              <FormInput
                label="Mốc điểm yêu cầu *"
                name="requiredScore"
                type="number"
                value={form.requiredScore}
                onChange={handleChange}
                required
                placeholder="VD: 5000"
              />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">Loại giảm giá</label>
              <select
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                className="w-full rounded-lg border-[1.5px] border-[#e2d3c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (đ)</option>
              </select>
            </div>
            <FormInput
              label="Mức giảm *"
              name="discountValue"
              type="number"
              min="0"
              value={form.discountValue}
              onChange={handleChange}
              required
              placeholder="VD: 15"
            />
            {form.discountType === 'PERCENT' && (
              <FormInput
                label="Giảm tối đa (đ)"
                name="maxDiscount"
                type="number"
                min="0"
                value={form.maxDiscount}
                onChange={handleChange}
                placeholder="VD: 50000"
              />
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FormInput
              label="Đơn tối thiểu (đ)"
              name="minOrderValue"
              type="number"
              min="0"
              value={form.minOrderValue}
              onChange={handleChange}
              placeholder="VD: 199000"
            />
            <FormInput
              label="Tổng lượt phát"
              name="usageLimit"
              type="number"
              min="1"
              value={form.usageLimit}
              onChange={handleChange}
              placeholder="Để trống nếu không giới hạn"
            />
            <FormInput
              label="Lượt / user *"
              name="perUserLimit"
              type="number"
              min="1"
              value={form.perUserLimit}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">Ngày bắt đầu</label>
              <input
                type="datetime-local"
                name="startsAt"
                value={form.startsAt}
                onChange={handleChange}
                className="w-full rounded-lg border-[1.5px] border-[#e2d3c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">Ngày kết thúc</label>
              <input
                type="datetime-local"
                name="expiresAt"
                value={form.expiresAt}
                onChange={handleChange}
                className="w-full rounded-lg border-[1.5px] border-[#e2d3c8] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border-[1.5px] border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border-[1.5px] border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {success}
            </div>
          )}

          <div className="flex justify-end border-t border-[#f0e0d6] pt-6">
            <Button type="submit" isLoading={loading} className="w-full md:w-auto">
              Tạo voucher
            </Button>
          </div>
        </form>
      </AdminCard>
    </div>
  )
}

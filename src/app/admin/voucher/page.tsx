import type { Metadata } from 'next'
import Link from 'next/link'
import type { Voucher } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { AdminCard, AdminPageHeader, AdminStatusBadge } from '@/components/admin/AdminUI'

export const metadata: Metadata = { title: 'Quản lý voucher | Admin Mushroomie' }

const statusTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  EXPIRED: 'danger',
  REVOKED: 'warning',
}

type VoucherWithCount = Voucher & {
  _count?: {
    userVouchers: number
  }
}

function getVoucherTypeLabel(voucher: VoucherWithCount) {
  if (voucher.type === 'GAME_REWARD') return `Mini game (${voucher.sourceGame || 'Tất cả'})`
  if (voucher.type === 'MANUAL') return 'Cấp thủ công'
  if (voucher.type === 'AUTO_CAMPAIGN') return 'Tự động'
  return 'Khuyến mãi'
}

function getDiscountLabel(voucher: VoucherWithCount) {
  if (voucher.discountType === 'FREE_SHIPPING') return 'Miễn phí vận chuyển'
  if (voucher.discountType === 'PERCENT') return `Giảm ${Number(voucher.discountValue)}%`
  return `Giảm ${formatPrice(Number(voucher.discountValue))}`
}

export default async function AdminVoucherPage() {
  const vouchers: VoucherWithCount[] = await prisma.voucher.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { userVouchers: true },
      },
    },
  }).catch(() => [])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminPageHeader
          title="Quản lý voucher"
          description="Quản lý các mẫu voucher khuyến mãi và voucher thưởng mini game."
        />
        <Link href="/admin/voucher/them" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-primary-dark">
          + Tạo voucher mới
        </Link>
      </div>

      <AdminCard className="overflow-hidden rounded-[16px] border-[1.5px] border-[#f0e0d6] !p-0 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e0d6] px-5 py-4">
          <h2 className="font-heading text-base text-neutral-800">Danh sách voucher</h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-neutral-600">
            {vouchers.length} mẫu voucher
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead className="border-b border-[#f0e0d6] bg-secondary text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-5 py-3">Mã voucher</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Mức giảm</th>
                <th className="px-4 py-3">Điều kiện</th>
                <th className="px-4 py-3">Giới hạn</th>
                <th className="px-4 py-3">Đã phát</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f6ece5]">
              {vouchers.map((voucher) => (
                <tr key={voucher.id} className="transition-colors hover:bg-[#fff7f2]">
                  <td className="px-5 py-3">
                    <div className="font-mono font-bold text-primary">{voucher.code}</div>
                    <div className="line-clamp-1 max-w-[200px] text-xs text-neutral-500">{voucher.title}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-700">{getVoucherTypeLabel(voucher)}</td>
                  <td className="px-4 py-3 text-neutral-700">{getDiscountLabel(voucher)}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {voucher.minOrderValue ? `Từ ${formatPrice(Number(voucher.minOrderValue))}` : 'Mọi đơn hàng'}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    <p>Tổng: {voucher.usageLimit ? voucher.usageLimit : 'Không giới hạn'}</p>
                    <p>User: {voucher.perUserLimit}/người</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">{voucher._count?.userVouchers || 0}</td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone={statusTone[voucher.status] || 'neutral'}>{voucher.status}</AdminStatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vouchers.length === 0 && (
            <div className="p-10 text-center text-sm text-neutral-500">Chưa có voucher template nào.</div>
          )}
        </div>
      </AdminCard>
    </div>
  )
}

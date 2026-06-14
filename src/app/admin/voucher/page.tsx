import type { Metadata } from 'next'
import Link from 'next/link'
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

export default async function AdminVoucherPage() {
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { userVouchers: true }
      }
    }
  }).catch(() => [])

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          title="Quản lý voucher"
          description="Quản lý các mẫu voucher khuyến mãi và voucher thưởng mini game."
        />
        <Link href="/admin/voucher/them" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition">
          + Tạo voucher mới
        </Link>
      </div>

      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3">Mã voucher</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Mức giảm</th>
                <th className="px-4 py-3">Điều kiện</th>
                <th className="px-4 py-3">Giới hạn</th>
                <th className="px-4 py-3">Đã phát</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {vouchers.map((v: any) => (
                <tr key={v.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-primary">{v.code}</div>
                    <div className="text-xs text-neutral-500 line-clamp-1 max-w-[200px]">{v.title}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{v.type === 'GAME_REWARD' ? `Mini game (${v.sourceGame || 'Tất cả'})` : 'Khuyến mãi'}</td>
                  <td className="px-4 py-3">
                    {v.discountType === 'PERCENT' ? `Giảm ${Number(v.discountValue)}%` : `Giảm ${formatPrice(Number(v.discountValue))}`}
                  </td>
                  <td className="px-4 py-3">
                    {v.minOrderValue ? `Từ ${formatPrice(Number(v.minOrderValue))}` : 'Mọi đơn hàng'}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    <p>Tổng: {v.usageLimit ? v.usageLimit : 'Không giới hạn'}</p>
                    <p>User: {v.perUserLimit}/người</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">{v._count?.userVouchers || 0}</td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone={statusTone[v.status] || 'neutral'}>{v.status}</AdminStatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vouchers.length === 0 && <div className="p-8 text-center text-sm text-neutral-500">Chưa có voucher template nào.</div>}
        </div>
      </AdminCard>
    </div>
  )
}

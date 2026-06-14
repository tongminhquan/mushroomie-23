import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, formatPrice } from '@/lib/utils'
import { AdminCard, AdminPageHeader, AdminStatusBadge } from '@/components/admin/AdminUI'

export const metadata: Metadata = { title: 'Lịch sử voucher | Admin Mushroomie' }

interface SearchParams {
  page?: string
  status?: string
  game?: string
  user?: string
  code?: string
  order?: string
}

const statusTone: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  AVAILABLE: 'success',
  REVOKED: 'warning',
  USED: 'info',
  EXPIRED: 'danger',
}

const gameLabel: Record<string, string> = {
  tetris: 'Tetris',
  'block-blast': 'Block Blast',
}

export default async function AdminVoucherHistoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page || 1))
  const limit = 20

  const where: any = {}
  if (sp.status) where.status = sp.status.toUpperCase()
  if (sp.game) where.sourceGame = sp.game
  if (sp.code) where.voucher = { code: { contains: sp.code } }
  if (sp.user) {
    where.user = {
      OR: [
        { name: { contains: sp.user } },
        { email: { contains: sp.user } },
        { phone: { contains: sp.user } },
      ],
    }
  }
  if (sp.order) where.order = { order_code: { contains: sp.order } }

  const [
    vouchers,
    total,
    usedVouchers,
    totalIssued,
    totalUsed,
    totalActive,
    totalRevoked,
    totalExpired,
    discountAggregate,
    byGame,
    usedByGame,
  ] = await Promise.all([
    prisma.userVoucher.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        voucher: true,
        order: { select: { id: true, order_code: true, total: true, subtotal: true, voucher_discount_amount: true, order_status: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }).catch(() => []),
    prisma.userVoucher.count({ where }).catch(() => 0),
    prisma.userVoucher.findMany({
      where: { status: 'USED' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        voucher: true,
        order: { select: { id: true, order_code: true, total: true, subtotal: true, voucher_discount_amount: true, order_status: true } },
      },
      orderBy: { usedAt: 'desc' },
      take: 20,
    }).catch(() => []),
    prisma.userVoucher.count().catch(() => 0),
    prisma.userVoucher.count({ where: { status: 'USED' } }).catch(() => 0),
    prisma.userVoucher.count({ where: { status: 'AVAILABLE' } }).catch(() => 0),
    prisma.userVoucher.count({ where: { status: 'REVOKED' } }).catch(() => 0),
    prisma.userVoucher.count({ where: { status: 'EXPIRED' } }).catch(() => 0),
    prisma.order.aggregate({ _sum: { voucher_discount_amount: true } }).catch(() => ({ _sum: { voucher_discount_amount: 0 } })),
    prisma.userVoucher.groupBy({
      by: ['sourceGame'],
      where: { source: 'mini_game', sourceGame: { not: null } },
      _count: { _all: true },
    }).catch(() => []),
    prisma.userVoucher.groupBy({
      by: ['sourceGame'],
      where: { source: 'mini_game', sourceGame: { not: null }, status: 'USED' },
      _count: { _all: true },
    }).catch(() => []),
  ])

  const totalPages = Math.ceil(total / limit)
  const usageRate = totalIssued > 0 ? Math.round((totalUsed / totalIssued) * 100) : 0
  const totalDiscountUsed = Number(discountAggregate._sum.voucher_discount_amount || 0)
  const gameMax = Math.max(1, ...byGame.map((item) => item._count._all))

  const currentParams = new URLSearchParams()
  if (sp.status) currentParams.set('status', sp.status)
  if (sp.game) currentParams.set('game', sp.game)
  if (sp.user) currentParams.set('user', sp.user)
  if (sp.code) currentParams.set('code', sp.code)
  if (sp.order) currentParams.set('order', sp.order)

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <AdminPageHeader
        title="Lịch sử voucher"
        description="Theo dõi voucher được phát từ mini game, điểm nguồn, đơn hàng đã dùng và thống kê sử dụng."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Đã phát', totalIssued],
          ['Đã dùng', totalUsed],
          ['Còn dùng được', totalActive],
          ['Đã thu hồi', totalRevoked],
          ['Hết hạn', totalExpired],
        ].map(([label, value]) => (
          <AdminCard key={label} className="p-4">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">{label}</div>
            <div className="mt-3 text-2xl font-black text-neutral-900">{value}</div>
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <AdminCard className="p-5">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Tổng giá trị giảm đã dùng</div>
          <div className="mt-3 text-3xl font-black text-primary">{formatPrice(totalDiscountUsed)}</div>
          <div className="mt-2 text-sm font-semibold text-neutral-500">Tỷ lệ sử dụng: {usageRate}%</div>
        </AdminCard>
        <AdminCard className="p-5">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">Voucher theo game</div>
          <div className="mt-4 space-y-3">
            {byGame.length > 0 ? byGame.map((item) => (
              <div key={item.sourceGame || 'none'}>
                <div className="mb-1 flex justify-between text-sm font-semibold">
                  <span>{gameLabel[item.sourceGame || ''] || item.sourceGame}</span>
                  <span>{item._count._all}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${(item._count._all / gameMax) * 100}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-neutral-500">Chưa có voucher từ mini game.</p>}
          </div>
        </AdminCard>
      </div>

      <AdminCard className="p-4">
        <form className="grid gap-3 md:grid-cols-6" method="get">
          <input name="user" defaultValue={sp.user || ''} placeholder="User/email/SDT" className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="code" defaultValue={sp.code || ''} placeholder="Mã voucher" className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          <input name="order" defaultValue={sp.order || ''} placeholder="Mã đơn hàng" className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary" />
          <select name="game" defaultValue={sp.game || ''} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">Tất cả game</option>
            <option value="tetris">Tetris</option>
            <option value="block-blast">Block Blast</option>
          </select>
          <select name="status" defaultValue={sp.status || ''} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary">
            <option value="">Tất cả trạng thái</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="USED">USED</option>
            <option value="REVOKED">REVOKED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">Lọc</button>
        </form>
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-neutral-100 p-5">
          <h2 className="font-heading text-lg font-bold">Lịch sử nhận voucher</h2>
          <p className="text-sm text-neutral-500">{total} kết quả</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Mã voucher</th>
                <th className="px-4 py-3">Nguồn</th>
                <th className="px-4 py-3">Điểm / ID Score</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hạn dùng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {vouchers.map((uv: any) => (
                <tr key={uv.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(uv.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{uv.user?.name || 'Khách'}</div>
                    <div className="text-xs text-neutral-400">{uv.user?.email || uv.user?.phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-primary">{uv.voucher?.code || '-'}</div>
                    <div className="text-xs text-neutral-500">
                      {uv.voucher?.discountType === 'PERCENT' ? `Giảm ${uv.voucher?.discountValue}%` : `Giảm ${formatPrice(Number(uv.voucher?.discountValue || 0))}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{uv.source}</div>
                    <div className="text-xs text-neutral-500">{gameLabel[uv.sourceGame || ''] || uv.sourceGame || '-'}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{uv.score || '-'}</td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge tone={statusTone[uv.status] || 'neutral'}>{uv.status}</AdminStatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{uv.expiresAt ? formatDate(uv.expiresAt) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {vouchers.length === 0 && <div className="p-8 text-center text-sm text-neutral-500">Không có voucher phù hợp.</div>}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 border-t border-neutral-100 p-4">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => {
              const params = new URLSearchParams(currentParams)
              params.set('page', String(value))
              return (
                <Link key={value} href={`/admin/voucher-history?${params.toString()}`} className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold ${page === value ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  {value}
                </Link>
              )
            })}
          </div>
        )}
      </AdminCard>

      <AdminCard className="overflow-hidden">
        <div className="border-b border-neutral-100 p-5">
          <h2 className="font-heading text-lg font-bold">Lịch sử dùng voucher</h2>
          <p className="text-sm text-neutral-500">20 giao dịch gần nhất</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3">Thời gian dùng</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Voucher</th>
                <th className="px-4 py-3">Đơn hàng</th>
                <th className="px-4 py-3">Giảm</th>
                <th className="px-4 py-3">Còn lại</th>
                <th className="px-4 py-3">Game nguồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {usedVouchers.map((uv: any) => (
                <tr key={uv.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-xs text-neutral-500">{uv.usedAt ? formatDate(uv.usedAt) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{uv.user?.name || 'Khách'}</div>
                    <div className="text-xs text-neutral-400">{uv.user?.email || uv.user?.phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{uv.voucher?.code || '-'}</td>
                  <td className="px-4 py-3">
                    {uv.order ? (
                      <Link className="font-mono text-primary hover:underline" href={`/admin/don-hang/${uv.order.id}`}>#{uv.order.order_code}</Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(Number(uv.order?.voucher_discount_amount || 0))}</td>
                  <td className="px-4 py-3 font-semibold">{formatPrice(Number(uv.order?.total || 0))}</td>
                  <td className="px-4 py-3">{gameLabel[uv.sourceGame || ''] || uv.sourceGame || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {usedVouchers.length === 0 && <div className="p-8 text-center text-sm text-neutral-500">Chưa có voucher đã dùng.</div>}
        </div>
      </AdminCard>
    </div>
  )
}

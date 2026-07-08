import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quản lý bài viết | Admin Mushroomie' }

interface SearchParams { page?: string; status?: string }

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Number(sp.page || 1)
  const limit = 20

  const where: any = {}
  if (sp.status) where.status = sp.status

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, author: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }).catch(() => []),
    prisma.post.count({ where }).catch(() => 0),
  ])

  const statusColors: Record<string, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-yellow-100 text-yellow-700',
    hidden: 'bg-neutral-100 text-neutral-700',
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400 mb-1">Nội dung &amp; hệ thống</div>
          <h1 className="font-heading text-2xl font-bold text-neutral-800">Quản lý bài viết</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} bài viết</p>
        </div>
        <div className="flex gap-2 flex-1 md:flex-none">
          <Link href="/admin/bai-viet/dang-hang-loat" className="border-[1.5px] border-primary text-primary px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary hover:text-white transition-colors whitespace-nowrap flex-1 text-center md:flex-none">
            ⚡ Đăng tự động
          </Link>
          <Link href="/admin/bai-viet/them" className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors whitespace-nowrap flex-1 text-center md:flex-none">
            + Thêm bài viết
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        {[{ value: '', label: 'Tất cả' }, { value: 'published', label: '🟢 Đã xuất bản' }, { value: 'scheduled', label: '⏰ Chờ đăng' }, { value: 'draft', label: '🟡 Nháp' }].map((tab) => (
          <Link key={tab.value} href={`/admin/bai-viet${tab.value ? `?status=${tab.value}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              (sp.status || '') === tab.value
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-600 border-[1.5px] border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}>{tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0e0d6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-[#fcfbfa] border-b-[1.5px] border-[#f0e0d6]">
              <tr>
                <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">Tiêu đề</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">Danh mục</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">Tác giả</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">Trạng thái</th>
                <th className="text-left py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">Ngày tạo</th>
                <th className="text-right py-3 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-neutral-400">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f6ece5]">
              {posts.map((post: any) => (
                <tr key={post.id} className="hover:bg-[#fdf6f2] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-neutral-800 line-clamp-1">{post.title}</div>
                    <div className="text-xs text-[#b9794b] font-mono">{post.slug}</div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{post.category?.name || '—'}</td>
                  <td className="py-3 px-4 text-neutral-600">{post.author?.name || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors[post.status] || ''}`}>
                      {post.status === 'published' ? 'Đã xuất bản' : post.status === 'draft' ? 'Nháp' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 text-xs">{formatDate(post.created_at)}</td>
                  <td className="py-3 px-4 text-right flex justify-end gap-3">
                    <Link href={`/tin-tuc/${post.slug}`} target="_blank" className="text-neutral-500 text-xs font-medium hover:text-primary transition-colors">Xem</Link>
                    <Link href={`/admin/bai-viet/${post.id}`} className="text-primary text-xs font-semibold hover:underline">Sửa</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (
            <div className="text-center py-12 text-neutral-500">Không có bài viết nào</div>
          )}
        </div>
      </div>
    </div>
  )
}

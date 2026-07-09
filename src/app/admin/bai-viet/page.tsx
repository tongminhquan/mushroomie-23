import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'

export const metadata: Metadata = { title: 'Quản lý bài viết | Admin Mushroomie' }

interface SearchParams {
  page?: string
  status?: string
  q?: string
}

const statusTabs = [
  { value: '', label: 'Tất cả' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'draft', label: 'Nháp' },
  { value: 'hidden', label: 'Đã ẩn' },
]

const statusLabels: Record<string, string> = {
  published: 'Đã xuất bản',
  draft: 'Nháp',
  hidden: 'Đã ẩn',
}

const statusClasses: Record<string, string> = {
  published: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  draft: 'border-amber-200 bg-amber-50 text-amber-800',
  hidden: 'border-neutral-200 bg-neutral-100 text-neutral-700',
}

function buildHref(status: string, q: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (q) params.set('q', q)
  const query = params.toString()
  return `/admin/bai-viet${query ? `?${query}` : ''}`
}

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page || 1) || 1)
  const q = (sp.q || '').trim()
  const activeStatus = sp.status || ''
  const limit = 20

  const where: Prisma.PostWhereInput = {}
  if (activeStatus) where.status = activeStatus
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { slug: { contains: q } },
      { excerpt: { contains: q } },
    ]
  }

  const [
    posts,
    total,
    allCount,
    publishedCount,
    draftCount,
    hiddenCount,
  ] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true, author: { select: { name: true } } },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }).catch(() => []),
    prisma.post.count({ where }).catch(() => 0),
    prisma.post.count().catch(() => 0),
    prisma.post.count({ where: { status: 'published' } }).catch(() => 0),
    prisma.post.count({ where: { status: 'draft' } }).catch(() => 0),
    prisma.post.count({ where: { status: 'hidden' } }).catch(() => 0),
  ])

  const countByStatus: Record<string, number> = {
    '': allCount,
    published: publishedCount,
    draft: draftCount,
    hidden: hiddenCount,
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const hasPagination = totalPages > 1

  return (
    <div className="min-h-screen bg-[#f6f7f7] px-4 py-5 text-neutral-900 md:px-6">
      <div className="mx-auto max-w-[1480px] space-y-5">
        <header className="rounded-[10px] border border-[#dcdcde] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-semibold leading-tight text-[#1d2327]">Bài viết</h1>
                <Link
                  href="/admin/bai-viet/them"
                  className="inline-flex h-9 items-center justify-center rounded-[4px] border border-primary bg-white px-3 text-sm font-semibold text-primary transition hover:bg-[#fff7f2]"
                >
                  Thêm bài viết mới
                </Link>
              </div>
              <p className="mt-1 text-sm text-[#646970]">
                Quản lý nội dung tin tức, SEO, ảnh đại diện và trạng thái xuất bản theo phong cách CMS quen thuộc.
              </p>
            </div>

            <form action="/admin/bai-viet" className="flex w-full flex-col gap-2 sm:flex-row lg:w-[460px]">
              {activeStatus ? <input type="hidden" name="status" value={activeStatus} /> : null}
              <input
                name="q"
                defaultValue={q}
                placeholder="Tìm bài viết theo tiêu đề, slug, tóm tắt..."
                className="h-10 flex-1 rounded-[4px] border border-[#8c8f94] bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="h-10 rounded-[4px] border border-[#8c8f94] bg-[#f6f7f7] px-4 text-sm font-semibold text-[#1d2327] transition hover:bg-white"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-[10px] border border-[#dcdcde] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 border-b border-[#dcdcde] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
              {statusTabs.map((tab, index) => {
                const active = activeStatus === tab.value
                return (
                  <div key={tab.value || 'all'} className="flex items-center">
                    <Link
                      href={buildHref(tab.value, q)}
                      className={
                        active
                          ? 'font-semibold text-primary'
                          : 'text-[#2271b1] hover:text-primary hover:underline'
                      }
                    >
                      {tab.label} <span className="text-[#646970]">({countByStatus[tab.value] || 0})</span>
                    </Link>
                    {index < statusTabs.length - 1 ? <span className="px-2 text-[#a7aaad]">|</span> : null}
                  </div>
                )
              })}
            </nav>

            <div className="text-sm text-[#646970]">
              Hiển thị <span className="font-semibold text-[#1d2327]">{posts.length}</span> trong {total} bài
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="border-b border-[#dcdcde] bg-[#f6f7f7] text-[#2c3338]">
                  <th className="w-10 border-b border-[#dcdcde] px-4 py-3">
                    <input type="checkbox" aria-label="Chọn tất cả bài viết" className="h-4 w-4 rounded border-[#8c8f94] accent-primary" />
                  </th>
                  <th className="border-b border-[#dcdcde] px-4 py-3 font-semibold">Tiêu đề</th>
                  <th className="w-44 border-b border-[#dcdcde] px-4 py-3 font-semibold">Tác giả</th>
                  <th className="w-44 border-b border-[#dcdcde] px-4 py-3 font-semibold">Danh mục</th>
                  <th className="w-36 border-b border-[#dcdcde] px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="w-40 border-b border-[#dcdcde] px-4 py-3 font-semibold">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="group bg-white hover:bg-[#f6f7f7]">
                    <td className="border-b border-[#f0f0f1] px-4 py-4 align-top">
                      <input type="checkbox" aria-label={`Chọn ${post.title}`} className="h-4 w-4 rounded border-[#8c8f94] accent-primary" />
                    </td>
                    <td className="border-b border-[#f0f0f1] px-4 py-4 align-top">
                      <Link
                        href={`/admin/bai-viet/${post.id}`}
                        className="font-semibold text-[#2271b1] hover:text-primary hover:underline"
                      >
                        {post.title || '(Không có tiêu đề)'}
                      </Link>
                      <div className="mt-1 font-mono text-xs text-[#646970]">/{post.slug}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <Link href={`/admin/bai-viet/${post.id}`} className="text-[#2271b1] hover:text-primary hover:underline">
                          Sửa
                        </Link>
                        <span className="text-[#dcdcde]">|</span>
                        <Link href={`/tin-tuc/${post.slug}`} target="_blank" className="text-[#2271b1] hover:text-primary hover:underline">
                          Xem
                        </Link>
                        <span className="text-[#dcdcde]">|</span>
                        <span className="text-[#646970]">ID {post.id}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#f0f0f1] px-4 py-4 align-top text-[#50575e]">
                      {post.author?.name || 'Không rõ'}
                    </td>
                    <td className="border-b border-[#f0f0f1] px-4 py-4 align-top text-[#50575e]">
                      {post.category?.name || 'Chưa phân loại'}
                    </td>
                    <td className="border-b border-[#f0f0f1] px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[post.status] || statusClasses.hidden}`}>
                        {statusLabels[post.status] || post.status || 'Không rõ'}
                      </span>
                    </td>
                    <td className="border-b border-[#f0f0f1] px-4 py-4 align-top text-xs text-[#646970]">
                      <div>{post.published_at ? 'Đã đăng' : 'Tạo lúc'}</div>
                      <div className="mt-1 font-semibold text-[#50575e]">{formatDate(post.published_at || post.created_at)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {posts.length === 0 && (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff7f2] text-2xl text-primary">M</div>
                <h2 className="mt-4 text-lg font-semibold text-[#1d2327]">Chưa tìm thấy bài viết</h2>
                <p className="mt-1 text-sm text-[#646970]">Thử đổi bộ lọc hoặc tạo bài viết mới cho Mushroomie.</p>
                <Link
                  href="/admin/bai-viet/them"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-[4px] bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark"
                >
                  Thêm bài viết mới
                </Link>
              </div>
            )}
          </div>

          {hasPagination && (
            <div className="flex items-center justify-between border-t border-[#dcdcde] px-4 py-3 text-sm text-[#646970]">
              <span>Trang {page} / {totalPages}</span>
              <div className="flex gap-2">
                <Link
                  href={`${buildHref(activeStatus, q)}${buildHref(activeStatus, q).includes('?') ? '&' : '?'}page=${Math.max(1, page - 1)}`}
                  className={`rounded-[4px] border border-[#dcdcde] px-3 py-1.5 ${page <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-[#f6f7f7]'}`}
                >
                  Trước
                </Link>
                <Link
                  href={`${buildHref(activeStatus, q)}${buildHref(activeStatus, q).includes('?') ? '&' : '?'}page=${Math.min(totalPages, page + 1)}`}
                  className={`rounded-[4px] border border-[#dcdcde] px-3 py-1.5 ${page >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-[#f6f7f7]'}`}
                >
                  Sau
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

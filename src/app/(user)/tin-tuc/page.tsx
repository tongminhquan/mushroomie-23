import { prisma } from '@/lib/prisma'
import PostCard from '@/components/blog/PostCard'
import Breadcrumb from '@/components/layout/Breadcrumb'
import Link from 'next/link'
import type { Metadata } from 'next'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export const metadata: Metadata = {
  title: 'Tin tức Handmade | Mushroomie',
  description: 'Chia sẻ tips, hướng dẫn và câu chuyện handmade từ Mushroomie.',
}

interface SearchParams { category?: string; page?: string }

const LINE = '#f0e0d6'

export default async function BlogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Number(sp.page || 1)
  const limit = 9

  const where: any = { status: 'published' }
  if (sp.category) where.category = { slug: sp.category }

  const [posts, total, categories] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { category: true },
      orderBy: { published_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }).catch(() => []),
    prisma.post.count({ where }).catch(() => 0),
    prisma.category.findMany({ where: { type: 'post' } }).catch(() => []),
  ])

  const totalPages = Math.ceil(total / limit)

  const chipCls = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors border-[1.5px] ${
      active
        ? 'bg-primary text-white border-primary'
        : 'bg-white text-neutral-600 border-[#e2d3c8] hover:text-primary hover:border-primary'
    }`

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {/* Breadcrumb (JSON-LD cho SEO) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Breadcrumb items={[{ label: 'Tin tức' }]} />
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden text-center"
        style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
      >
        <span aria-hidden className="pointer-events-none select-none absolute left-[13%] top-[36%] text-xl text-coral animate-float-soft">❤</span>
        <span aria-hidden className="pointer-events-none select-none absolute right-[14%] top-[30%] text-lg text-accent-mint animate-float-soft" style={{ animationDelay: '1.1s' }}>★</span>
        <div className="relative max-w-2xl mx-auto px-6 pt-8 pb-9">
          <span className="inline-block text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2.5">Blog &amp; tin tức</span>
          <h1 className="font-heading text-3xl md:text-4xl text-neutral-900 mb-2 leading-tight">Góc cảm hứng Mushroomie</h1>
          <p className="m-0 text-sm text-neutral-500">Mẹo phối charm, hậu trường handmade &amp; câu chuyện quà tặng ♡</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        {/* Category filter */}
        {categories.length > 0 && (
          <AnimateOnScroll animation="fade-up">
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              <Link href="/tin-tuc" className={chipCls(!sp.category)}>Tất cả</Link>
              {categories.map((cat: any) => (
                <Link key={cat.id} href={`/tin-tuc?category=${cat.slug}`} className={chipCls(sp.category === cat.slug)}>
                  {cat.name}
                </Link>
              ))}
            </div>
          </AnimateOnScroll>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4" aria-hidden>📝</div>
            <p className="text-neutral-500">Chưa có bài viết nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => <PostCard key={post.id} post={post as any} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={`/tin-tuc?${new URLSearchParams({ ...sp, page: String(p) })}`}
                aria-current={p === page ? 'page' : undefined}
                className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition-colors border-[1.5px] ${
                  p === page ? 'bg-primary text-white border-primary' : 'bg-white text-neutral-600 border-[#f0e0d6] hover:text-primary hover:border-primary'
                }`}>{p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

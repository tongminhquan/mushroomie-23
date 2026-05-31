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

  return (
    <div className="min-h-screen bg-secondary">
      <section className="bg-gradient-to-br from-primary to-red-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll animation="fade-up">
            <h1 className="font-heading text-4xl font-bold mb-3">Tin tức & Cảm hứng</h1>
            <p className="text-white/80">Tips handmade, xu hướng phụ kiện và câu chuyện từ Mushroomie</p>
          </AnimateOnScroll>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimateOnScroll animation="fade" delay={100}>
          <Breadcrumb items={[{ label: 'Tin tức' }]} />
        </AnimateOnScroll>

        {/* Category filter */}
        {categories.length > 0 && (
          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="flex flex-wrap gap-2 mb-8">
              <Link href="/tin-tuc" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !sp.category ? 'bg-primary text-white' : 'bg-white text-neutral-700 hover:bg-primary-light hover:text-primary'
              }`}>Tất cả</Link>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/tin-tuc?category=${cat.slug}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    sp.category === cat.slug ? 'bg-primary text-white' : 'bg-white text-neutral-700 hover:bg-primary-light hover:text-primary'
                  }`}>
                  {cat.name}
                </Link>
              ))}
            </div>
          </AnimateOnScroll>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-neutral-500">Chưa có bài viết nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => <PostCard key={post.id} post={post as any} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={`/tin-tuc?${new URLSearchParams({ ...sp, page: String(p) })}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-white text-neutral-700 hover:bg-primary-light'
                }`}>{p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug } })
  if (!post) return { title: 'Bài viết không tồn tại' }
  return {
    title: post.seo_title || `${post.title} | Mushroomie`,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.featured_image ? [post.featured_image] : [],
    },
  }
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.post.findUnique({
    where: { slug, status: 'published' },
    include: { category: true, author: true },
  })
  if (!post) notFound()

  const relatedPosts = await prisma.post.findMany({
    where: { category_id: post.category_id, status: 'published', id: { not: post.id } },
    include: { category: true },
    take: 3,
    orderBy: { published_at: 'desc' },
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { label: 'Tin tức', href: '/tin-tuc' },
          ...(post.category ? [{ label: post.category.name, href: `/tin-tuc?category=${post.category.slug}` }] : []),
          { label: post.title },
        ]} />

        <article className="bg-white rounded-3xl shadow-card overflow-hidden mt-4">
          {post.featured_image && (
            <div className="relative h-72 md:h-96">
              <Image src={post.featured_image} alt={post.title} fill className="object-cover" priority />
            </div>
          )}
          <div className="p-6 md:p-10">
            {post.category && (
              <Link href={`/tin-tuc?category=${post.category.slug}`}
                className="inline-block bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full mb-4 hover:bg-primary hover:text-white transition-colors">
                {post.category.name}
              </Link>
            )}
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 mb-4 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-3 text-sm text-neutral-500 mb-6 pb-6 border-b border-neutral-100">
              {post.author && <span>✍️ {post.author.name}</span>}
              {post.published_at && <span>📅 {formatDate(post.published_at)}</span>}
            </div>
            <div
              className="prose prose-neutral max-w-none prose-headings:font-heading prose-img:rounded-2xl"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((p) => (
                <Link key={p.id} href={`/tin-tuc/${p.slug}`}
                  className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-hover transition-all hover:-translate-y-1">
                  {p.featured_image && (
                    <div className="relative h-40">
                      <Image src={p.featured_image} alt={p.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-sm line-clamp-2">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

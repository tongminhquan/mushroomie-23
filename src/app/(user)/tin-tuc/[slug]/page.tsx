import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'

const SITE_URL = 'https://mushroomie.io.vn'
const SITE_NAME = 'Mushroomie'
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug } })
  if (!post) return { title: 'Bài viết không tồn tại' }

  const postUrl = `${SITE_URL}/tin-tuc/${post.slug}`
  const ogImage = post.og_image || post.featured_image || DEFAULT_OG_IMAGE

  return {
    title: post.seo_title || `${post.title} | ${SITE_NAME}`,
    description: post.meta_description || post.excerpt || '',
    alternates: {
      canonical: post.canonical_url || postUrl,
    },
    robots: {
      index: post.robots_index ?? true,
      follow: post.robots_follow ?? true,
    },
    openGraph: {
      title: post.og_title || post.seo_title || post.title,
      description: post.og_description || post.meta_description || post.excerpt || '',
      url: postUrl,
      type: 'article',
      siteName: SITE_NAME,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      publishedTime: post.published_at?.toISOString(),
      modifiedTime: post.updated_at?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.twitter_title || post.og_title || post.seo_title || post.title,
      description: post.twitter_description || post.og_description || post.meta_description || '',
      images: [post.twitter_image || post.og_image || post.featured_image || DEFAULT_OG_IMAGE],
    },
  }
}

function generateJsonLd(post: any) {
  const schemaType = post.schema_type || 'BlogPosting'
  const postUrl = `${SITE_URL}/tin-tuc/${post.slug}`

  // Only generate for supported types with sufficient data
  if (schemaType === 'HowTo' || schemaType === 'FAQPage') {
    // These require specific structured data (steps/questions) that we don't have
    // Fall back to BlogPosting
  }

  return {
    '@context': 'https://schema.org',
    '@type': ['BlogPosting', 'Article', 'NewsArticle'].includes(schemaType) ? schemaType : 'BlogPosting',
    headline: post.seo_title || post.title,
    description: post.meta_description || post.excerpt || '',
    image: post.og_image || post.featured_image || DEFAULT_OG_IMAGE,
    url: postUrl,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: post.published_at?.toISOString() || post.created_at?.toISOString(),
    dateModified: post.updated_at?.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    ...(post.word_count ? { wordCount: post.word_count } : {}),
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

  const jsonLd = generateJsonLd(post)

  return (
    <div className="min-h-screen bg-secondary">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumb items={[
          { label: 'Tin tức', href: '/tin-tuc' },
          ...(post.category ? [{ label: post.category.name, href: `/tin-tuc?category=${post.category.slug}` }] : []),
          { label: post.title },
        ]} />

        <article className="bg-white rounded-3xl shadow-card overflow-hidden mt-4">
          {post.featured_image && (
            <div className="relative h-72 md:h-96">
              <Image
                src={post.featured_image}
                alt={post.featured_image_alt || post.title}
                fill
                className="object-cover"
                priority
              />
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
              {post.reading_time && <span>⏱ {post.reading_time} phút đọc</span>}
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
                      <Image src={p.featured_image} alt={p.featured_image_alt || p.title} fill className="object-cover" />
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

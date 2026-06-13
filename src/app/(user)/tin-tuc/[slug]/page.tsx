import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { formatDate } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { toAbsoluteUrl } from '@/lib/url'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Post } from '@prisma/client'
import SafeImage from '@/components/ui/SafeImage'
import { inspectImageForRender, resolveArticleImagesForRender, resolveImageUrlForRender } from '@/lib/server-image'
import { safeJsonLd } from '@/lib/security'

const SITE_URL = 'https://mushroomie.io.vn'
const SITE_NAME = 'Mushroomie'
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.webp`

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.post.findUnique({ where: { slug } })
  if (!post) return { title: 'Bài viết không tồn tại' }

  const postUrl = `${SITE_URL}/tin-tuc/${post.slug}`
  const ogImage = toAbsoluteUrl(
    await resolveImageUrlForRender(post.og_image || post.featured_image || DEFAULT_OG_IMAGE, 'post'),
  )
  const twitterImage = toAbsoluteUrl(
    await resolveImageUrlForRender(post.twitter_image || post.og_image || post.featured_image || DEFAULT_OG_IMAGE, 'post'),
  )

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
      images: twitterImage ? [twitterImage] : [],
    },
  }
}

function generateJsonLd(post: Post, imageUrl: string) {
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
    image: imageUrl,
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
        url: `${SITE_URL}/logo.webp`,
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
  const post = await prisma.post.findFirst({
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

  const [coverImage, structuredImageUrl, articleHtml, relatedPostsWithImages] = await Promise.all([
    inspectImageForRender(post.featured_image, 'post'),
    resolveImageUrlForRender(post.og_image || post.featured_image || DEFAULT_OG_IMAGE, 'post').then(toAbsoluteUrl),
    resolveArticleImagesForRender(sanitizeHtml(post.content || ''), 'post'),
    Promise.all(
      relatedPosts.map(async (relatedPost) => ({
        ...relatedPost,
        resolved_featured_image: await resolveImageUrlForRender(relatedPost.featured_image, 'post'),
      })),
    ),
  ])
  const jsonLd = generateJsonLd(post, structuredImageUrl)

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />

      {/* Article hero */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <Breadcrumb items={[
          { label: 'Tin tức', href: '/tin-tuc' },
          ...(post.category ? [{ label: post.category.name, href: `/tin-tuc?category=${post.category.slug}` }] : []),
          { label: post.title },
        ]} />

        <div className="flex flex-wrap items-center gap-2.5 mt-2 mb-3">
          {post.category && (
            <Link href={`/tin-tuc?category=${post.category.slug}`}
              className="text-[11px] font-bold text-accent-kraft bg-accent-mint px-3 py-1 rounded-full hover:opacity-90 transition-opacity">
              {post.category.name}
            </Link>
          )}
          {post.reading_time && <span className="text-xs text-neutral-400">· {post.reading_time} phút đọc</span>}
        </div>

        <h1 className="font-heading text-3xl md:text-[40px] leading-tight text-neutral-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6">
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink text-lg">🌸</span>
          <div className="text-sm">
            <div className="font-bold text-neutral-900">{post.author?.name || 'Mushroomie Team'}</div>
            {post.published_at && <div className="text-xs text-neutral-400" suppressHydrationWarning>Đăng {formatDate(post.published_at)}</div>}
          </div>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] border-[1.5px] border-[#f0e0d6] shadow-card bg-secondary">
          <SafeImage
            src={coverImage.renderSrc}
            alt={post.featured_image_alt || post.title}
            fill
            imageKind="post"
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <article
          className="prose prose-neutral max-w-none prose-headings:font-heading prose-headings:text-neutral-800 prose-img:rounded-2xl prose-a:text-primary hover:prose-a:text-primary-dark prose-strong:text-accent-kraft"
          dangerouslySetInnerHTML={{ __html: articleHtml }}
        />
      </div>

      {/* Related */}
      {relatedPosts.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-14">
          <h2 className="font-heading text-2xl text-neutral-900 mb-6">Bài viết liên quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPostsWithImages.map((p: any) => (
              <Link key={p.id} href={`/tin-tuc/${p.slug}`}
                className="group bg-white rounded-[20px] overflow-hidden border-[1.5px] border-[#f0e0d6] shadow-card transition hover:-translate-y-1 hover:shadow-hover">
                <div className="relative aspect-[16/9] bg-secondary overflow-hidden">
                  <SafeImage src={p.resolved_featured_image} alt={p.featured_image_alt || p.title} fill imageKind="post" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" sizes="(max-width:768px) 100vw, 33vw" />
                  {p.category && <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white">{p.category.name}</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-[15px] leading-snug line-clamp-2 text-neutral-900 transition-colors group-hover:text-primary">{p.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

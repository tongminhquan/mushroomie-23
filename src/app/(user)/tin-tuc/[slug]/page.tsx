import type { Metadata } from 'next'
import type { Post, Prisma } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { CalendarDays, Clock3 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Breadcrumb from '@/components/layout/Breadcrumb'
import PostCard from '@/components/blog/PostCard'
import SafeImage from '@/components/ui/SafeImage'
import { formatDate } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { toAbsoluteUrl } from '@/lib/url'
import {
  inspectImageForRender,
  resolveArticleImagesForRender,
  resolveImageUrlForRender,
} from '@/lib/server-image'
import { safeJsonLd } from '@/lib/security'

const SITE_URL = 'https://mushroomie.io.vn'
const SITE_NAME = 'Mushroomie'
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.webp`

const getPublishedPostBySlug = cache(async (slug: string) => {
  return prisma.post.findFirst({
    where: { slug, status: 'published' },
    include: { category: true, author: true },
  })
})

// Xem trước cho admin: lấy bài ở mọi trạng thái (chỉ gọi sau khi đã xác thực admin)
const getAnyPostBySlug = cache(async (slug: string) => {
  return prisma.post.findFirst({
    where: { slug },
    include: { category: true, author: true },
  })
})

const PREVIEW_LABELS: Record<string, string> = {
  draft: 'Bản nháp',
  scheduled: 'Chờ đăng theo lịch',
  private: 'Riêng tư',
  hidden: 'Đang ẩn',
  trash: 'Trong thùng rác',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)

  if (!post) {
    return { title: 'Bài viết không tồn tại | Mushroomie' }
  }

  const postUrl = `${SITE_URL}/tin-tuc/${post.slug}`
  const ogImage = toAbsoluteUrl(
    await resolveImageUrlForRender(
      post.og_image || post.featured_image || DEFAULT_OG_IMAGE,
      'post',
    ),
  )
  const twitterImage = toAbsoluteUrl(
    await resolveImageUrlForRender(
      post.twitter_image || post.og_image || post.featured_image || DEFAULT_OG_IMAGE,
      'post',
    ),
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

  return {
    '@context': 'https://schema.org',
    '@type': ['BlogPosting', 'Article', 'NewsArticle'].includes(schemaType)
      ? schemaType
      : 'BlogPosting',
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

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  let post = await getPublishedPostBySlug(slug)

  // Xem trước kiểu WordPress: admin đăng nhập xem được bài chưa xuất bản
  let isPreview = false
  if (!post) {
    const session = await auth()
    const isAdmin = ['super_admin', 'admin'].includes((session?.user as any)?.role)
    if (isAdmin) {
      post = await getAnyPostBySlug(slug)
      isPreview = Boolean(post)
    }
  }

  if (!post) {
    notFound()
  }

  const relatedWhere: Prisma.PostWhereInput = post.category_id
    ? { category_id: post.category_id, status: 'published', id: { not: post.id } }
    : { status: 'published', id: { not: post.id } }

  const [relatedPosts, coverImage, structuredImageUrl, articleHtml] = await Promise.all([
    prisma.post
      .findMany({
        where: relatedWhere,
        include: { category: true },
        take: 3,
        orderBy: { published_at: 'desc' },
      })
      .catch(() => []),
    inspectImageForRender(post.featured_image, 'post'),
    resolveImageUrlForRender(post.og_image || post.featured_image || DEFAULT_OG_IMAGE, 'post').then(
      toAbsoluteUrl,
    ),
    resolveArticleImagesForRender(sanitizeHtml(post.content || ''), 'post'),
  ])

  const jsonLd = generateJsonLd(post, structuredImageUrl)

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {isPreview && (
        <div className="bg-[#2b2b2b] text-white text-sm text-center py-2.5 px-4 sticky top-0 z-50">
          👁 <strong>Bản xem trước</strong> — {PREVIEW_LABELS[post.status] || post.status}. Chỉ admin nhìn thấy trang này.
          <Link href={`/admin/bai-viet/${post.id}`} className="underline ml-2 text-[#ffe7a3]">Sửa bài</Link>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <section
        className="relative overflow-hidden border-b border-warm-border"
        style={{
          background:
            'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))',
        }}
      >
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-4 sm:px-6">
          <Breadcrumb
            items={[
              { label: 'Tin tức', href: '/tin-tuc' },
              ...(post.category
                ? [{ label: post.category.name, href: `/tin-tuc?category=${post.category.slug}` }]
                : []),
              { label: post.title },
            ]}
          />

          <div className="rounded-[28px] border border-warm-border bg-white/92 p-6 shadow-card backdrop-blur md:p-8">
            <div className="flex flex-wrap items-center gap-2.5">
              {post.category && (
                <Link
                  href={`/tin-tuc?category=${post.category.slug}`}
                  className="rounded-full bg-primary-light px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  {post.category.name}
                </Link>
              )}
              {post.reading_time ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warm-border bg-white px-4 py-2 text-xs font-semibold text-neutral-500">
                  <Clock3 size={14} />
                  {post.reading_time} phút đọc
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 font-heading text-3xl leading-tight text-neutral-900 md:text-[44px]">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-warm-border pt-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-light text-lg font-heading text-primary"
                >
                  M
                </span>
                <div className="text-sm">
                  <div className="font-bold text-neutral-900">
                    {post.author?.name || 'Mushroomie Team'}
                  </div>
                  <div className="text-xs text-neutral-500">Biên tập nội dung thương hiệu</div>
                </div>
              </div>

              {post.published_at && (
                <span
                  className="inline-flex items-center gap-1.5 text-sm text-neutral-500"
                  suppressHydrationWarning
                >
                  <CalendarDays size={15} />
                  Đăng {formatDate(post.published_at)}
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-warm-border bg-white shadow-card">
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
      </section>

      <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
        <article className="rounded-[28px] border border-warm-border bg-white px-5 py-8 shadow-card sm:px-8 md:px-10">
          <div
            className="prose prose-neutral max-w-none prose-headings:font-heading prose-headings:text-neutral-900 prose-p:leading-8 prose-p:text-neutral-700 prose-a:text-primary hover:prose-a:text-primary-dark prose-strong:text-accent-kraft prose-img:my-8 prose-img:rounded-[22px]"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />
        </article>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                Đọc thêm
              </p>
              <h2 className="mt-2 font-heading text-2xl text-neutral-900 md:text-3xl">
                {post.category ? 'Bài viết cùng chủ đề' : 'Bài viết liên quan'}
              </h2>
            </div>
            <Link
              href="/tin-tuc"
              className="rounded-full border border-warm-border bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
            >
              Xem tất cả bài viết
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <PostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

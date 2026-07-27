import type { Metadata } from 'next'
import type { Post, Prisma } from '@prisma/client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { ArrowUpRight, CalendarDays, Clock3 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Breadcrumb from '@/components/layout/Breadcrumb'
import PostCard from '@/components/blog/PostCard'
import PostAdminAction from '@/components/blog/PostAdminAction'
import PostKeywordOwnerLink from '@/components/blog/PostKeywordOwnerLink'
import SafeImage from '@/components/ui/SafeImage'
import { formatDate } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { toAbsoluteUrl } from '@/lib/url'
import {
  inspectImageForRender,
  resolveResponsiveArticleImagesForRender,
} from '@/lib/server-image'
import { safeJsonLd } from '@/lib/security'
import { isSquareSeoArticleImage } from '@/lib/post-normalization'
import { extractImageSources } from '@/lib/post-media'
import { geoImageGraph, geoImageObject } from '@/lib/geo-image-schema'
import {
  resolvePostMetadataDescription,
  resolvePostMetadataTitle,
} from '@/lib/post-metadata'
import { brandEntityRef } from '@/lib/local-seo'
import { rankProductsForPost } from '@/lib/post-product-recommendations'
import { pickRelatedPosts } from '@/lib/related-posts'

/** 2 hàng x 3 cột trên desktop — gấp đôi link nội bộ toả ra từ mỗi bài. */
const RELATED_POST_COUNT = 6
import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo-assets'

const SITE_URL = 'https://mushroomie.io.vn'
const SITE_NAME = 'Mushroomie'
const DEFAULT_OG_IMAGE = DEFAULT_SOCIAL_IMAGE.path

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
  const description = resolvePostMetadataDescription(
    post.title,
    post.meta_description,
    post.excerpt,
  )
  const [ogImageState, twitterImageState] = await Promise.all([
    inspectImageForRender(post.og_image || post.featured_image || DEFAULT_OG_IMAGE, 'post'),
    inspectImageForRender(
      post.twitter_image || post.og_image || post.featured_image || DEFAULT_OG_IMAGE,
      'post',
    ),
  ])
  const ogImage = toAbsoluteUrl(ogImageState.renderSrc)
  const twitterImage = toAbsoluteUrl(twitterImageState.renderSrc)

  return {
    title: { absolute: resolvePostMetadataTitle(post.title, post.seo_title) },
    description,
    alternates: {
      canonical: post.canonical_url || postUrl,
    },
    robots: {
      index: post.robots_index ?? true,
      follow: post.robots_follow ?? true,
    },
    openGraph: {
      title: post.og_title || post.seo_title || post.title,
      description: post.og_description || description,
      url: postUrl,
      type: 'article',
      siteName: SITE_NAME,
      images: ogImage
        ? [{
            url: ogImage,
            ...(ogImageState.width && ogImageState.height
              ? { width: ogImageState.width, height: ogImageState.height }
              : {}),
          }]
        : [],
      publishedTime: post.published_at?.toISOString(),
      modifiedTime: post.updated_at?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.twitter_title || post.og_title || post.seo_title || post.title,
      description: post.twitter_description || post.og_description || description,
      images: twitterImage ? [twitterImage] : [],
    },
  }
}

/** Quan hệ author được include trong getPublishedPostBySlug, nhưng không nằm trong type Post. */
type PostWithAuthor = Post & { author?: { name: string | null } | null }

function generateJsonLd(
  post: PostWithAuthor,
  imageUrl: string,
  imageDimensions?: { width: number; height: number },
) {
  const schemaType = post.schema_type || 'BlogPosting'
  const postUrl = `${SITE_URL}/tin-tuc/${post.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': ['BlogPosting', 'Article', 'NewsArticle'].includes(schemaType)
      ? schemaType
      : 'BlogPosting',
    headline: post.seo_title || post.title,
    description: resolvePostMetadataDescription(
      post.title,
      post.meta_description,
      post.excerpt,
    ),
    image: geoImageObject(imageUrl, {
      name: post.title + ' - ảnh bìa bài viết',
      caption: post.featured_image_caption || post.title,
      description: post.featured_image_description || post.meta_description,
      ...imageDimensions,
    }),
    url: postUrl,
    inLanguage: 'vi-VN',
    // Tác giả là người thật khi bài có author — tín hiệu Experience trong E-E-A-T mạnh
    // hơn hẳn so với ghi tên thương hiệu. Không có thì lùi về thực thể thương hiệu.
    author: post.author?.name
      ? { '@type': 'Person', name: post.author.name }
      : brandEntityRef(),
    publisher: brandEntityRef(),
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
    const role = (session?.user as { role?: string } | undefined)?.role
    const isAdmin = Boolean(role && ['super_admin', 'admin'].includes(role))
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

  const [relatedCandidates, productCandidates, coverImage, structuredImage, articleHtml] = await Promise.all([
    // Lấy pool rộng rồi mới chọn 6 bài — xem pickRelatedPosts() để biết vì sao không
    // dùng thẳng "6 bài mới nhất".
    //
    // select thay vì include: Post.content là LongText (~1200 từ/bài). Kéo cả cột đó cho
    // 60 bài chỉ để render 6 thẻ card sẽ tốn hàng trăm KB mỗi request. Danh sách dưới đây
    // đúng bằng những gì PostCard cần.
    prisma.post
      .findMany({
        where: relatedWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featured_image: true,
          published_at: true,
          category: { select: { name: true, slug: true } },
        },
        take: 60,
        orderBy: { published_at: 'desc' },
      })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { status: 'active' },
        select: {
          id: true,
          name: true,
          slug: true,
          short_description: true,
          is_featured: true,
          stock: true,
          category: { select: { name: true, slug: true } },
        },
        orderBy: [{ is_featured: 'desc' }, { updated_at: 'desc' }],
        take: 40,
      })
      .catch(() => []),
    inspectImageForRender(post.featured_image, 'post'),
    inspectImageForRender(post.og_image || post.featured_image || DEFAULT_OG_IMAGE, 'post'),
    resolveResponsiveArticleImagesForRender(sanitizeHtml(post.content || ''), 'post'),
  ])

  const structuredImageUrl = toAbsoluteUrl(structuredImage.renderSrc)
  const imageDimensions = structuredImage.width && structuredImage.height
    ? { width: structuredImage.width, height: structuredImage.height }
    : undefined
  const jsonLd = generateJsonLd(post, structuredImageUrl, imageDimensions)
  const articleGeoImages = geoImageGraph([
    {
      url: structuredImageUrl,
      name: post.title + ' - ảnh bìa bài viết',
      caption: post.featured_image_caption || post.title,
    },
    ...extractImageSources(articleHtml).map((source, index) => ({
      url: toAbsoluteUrl(source),
      name: post.title + ' - ảnh nội dung ' + (index + 1),
      caption: (post.focus_keyword || post.title) + ' tại Mushroomie Handmade, Đồng Nai.',
    })),
  ])
  const relatedPosts = pickRelatedPosts(relatedCandidates, post.id, RELATED_POST_COUNT)
  const recommendedProducts = rankProductsForPost(
    {
      title: post.title,
      focusKeyword: post.focus_keyword,
      secondaryKeywords: post.secondary_keywords,
    },
    productCandidates,
    2,
  )
  const usesSquareSeoCover = isSquareSeoArticleImage(coverImage.renderSrc)

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {isPreview && (
        <div className="bg-[#2b2b2b] text-white text-sm text-center py-2.5 px-4 sticky top-0 z-50">
          👁 <strong>Bản xem trước</strong> — {PREVIEW_LABELS[post.status] || post.status}. Chỉ admin nhìn thấy trang này.
          <Link href={`/admin/bai-viet/${post.id}`} className="underline ml-2 text-[#ffe7a3]">Sửa bài</Link>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleGeoImages) }}
      />

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

              <div className="flex flex-wrap items-center justify-end gap-3">
                {post.published_at && (
                  <span
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500"
                    suppressHydrationWarning
                  >
                    <CalendarDays size={15} />
                    Đăng {formatDate(post.published_at)}
                  </span>
                )}
                <PostAdminAction postId={post.id} />
              </div>
            </div>
          </div>

          <div
            className={`relative mt-6 w-full overflow-hidden rounded-[28px] border border-warm-border bg-white shadow-card ${
              usesSquareSeoCover ? 'mx-auto aspect-square max-w-3xl' : 'aspect-[16/9]'
            }`}
          >
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

          <PostKeywordOwnerLink
            slug={post.slug}
            focusKeyword={post.focus_keyword}
          />

          {recommendedProducts.length >= 2 && (
            <section className="mt-10 border-t border-warm-border pt-8" aria-labelledby="post-product-suggestions">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
                Gợi ý từ Mushroomie
              </p>
              <h2 id="post-product-suggestions" className="mt-2 font-heading text-2xl text-neutral-900">
                Sản phẩm hợp với chủ đề này
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Hai thiết kế được chọn theo nội dung bạn đang đọc, ưu tiên sản phẩm còn hàng và cùng nhóm phụ kiện.
              </p>

              <ul className="mt-5 divide-y divide-warm-border border-y border-warm-border">
                {recommendedProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/san-pham/${product.slug}`}
                      className="group flex min-h-16 items-center justify-between gap-4 py-4 text-neutral-900 transition-colors hover:text-primary"
                    >
                      <span>
                        <span className="block font-semibold">{product.name}</span>
                        {product.category?.name && (
                          <span className="mt-1 block text-xs text-neutral-500">
                            {product.category.name}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight size={18} className="shrink-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                href="/san-pham"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark"
              >
                Xem toàn bộ sản phẩm
                <ArrowUpRight size={17} aria-hidden />
              </Link>
            </section>
          )}
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

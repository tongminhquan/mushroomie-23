import Link from 'next/link'
import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import PostCard from '@/components/blog/PostCard'
import Breadcrumb from '@/components/layout/Breadcrumb'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'
import BrandContainer from '@/components/ui/BrandContainer'
import EmptyState from '@/components/ui/EmptyState'
import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo-assets'

type ParamValue = string | string[] | undefined

interface SearchParams {
  category?: ParamValue
  page?: ParamValue
}

function readParam(value: ParamValue) {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const sp = await searchParams
  const categorySlug = readParam(sp.category)
  const page = Math.max(1, parseInt(readParam(sp.page) || '1', 10) || 1)
  const category = categorySlug
    ? await prisma.category.findFirst({
        where: { slug: categorySlug, type: 'post' },
        select: { name: true, slug: true },
      }).catch(() => null)
    : null
  const canonicalPath = category ? `/tin-tuc?category=${encodeURIComponent(category.slug)}` : '/tin-tuc'
  const title = category ? `${category.name} - Cảm hứng handmade` : 'Tin tức và cảm hứng handmade'
  const description = category
    ? `Bài viết về ${category.name.toLowerCase()}, cách chọn phụ kiện và quà tặng handmade từ Mushroomie.`
    : 'Chia sẻ cách chọn, phối và bảo quản vòng tay, charm, móc khóa cùng những câu chuyện quà tặng handmade từ Mushroomie.'
  const shouldIndex = (!categorySlug || Boolean(category)) && page === 1

  return {
    title,
    description,
    alternates: { canonical: `https://mushroomie.io.vn${canonicalPath}` },
    robots: { index: shouldIndex, follow: true },
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      url: `https://mushroomie.io.vn${canonicalPath}`,
      siteName: 'Mushroomie',
      title: `${title} | Mushroomie`,
      description,
      images: [
        {
          url: `https://mushroomie.io.vn${DEFAULT_SOCIAL_IMAGE.path}`,
          width: DEFAULT_SOCIAL_IMAGE.width,
          height: DEFAULT_SOCIAL_IMAGE.height,
          alt: DEFAULT_SOCIAL_IMAGE.alt,
        },
      ],
    },
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const categorySlug = readParam(sp.category)
  const pageValue = readParam(sp.page) || '1'
  const page = Math.max(1, parseInt(pageValue, 10) || 1)
  // 9 bài/trang đẩy 66 bài thành 8 trang phân trang, khiến bài cũ gần như không nhận
  // được link nội bộ nào. 24 bài/trang rút xuống 3 trang.
  const limit = 24
  const where: Prisma.PostWhereInput = { status: 'published' }

  if (categorySlug) where.category = { slug: categorySlug }

  const [posts, total, categories] = await Promise.all([
    prisma.post
      .findMany({
        where,
        include: { category: true },
        orderBy: { published_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
      .catch(() => []),
    prisma.post.count({ where }).catch(() => 0),
    prisma.category.findMany({ where: { type: 'post' } }).catch(() => []),
  ])

  const totalPages = Math.ceil(total / limit)
  const activeCategory = categories.find((category) => category.slug === categorySlug)
  const title = activeCategory?.name || 'Góc cảm hứng Mushroomie'
  const description = activeCategory
    ? `Những bài viết mới nhất trong chủ đề ${activeCategory.name.toLowerCase()} dành cho quà tặng và cảm hứng handmade.`
    : 'Mẹo phối charm, hậu trường handmade và những câu chuyện quà tặng mang dấu ấn riêng từ Mushroomie.'

  const chipClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? 'border-primary bg-primary text-white'
        : 'border-theme-border bg-theme-card text-theme-secondary hover:border-primary hover:text-primary'
    }`

  const buildUrl = (params: Partial<Record<'category' | 'page', string | undefined>>) => {
    const query = new URLSearchParams()
    const nextParams = {
      category: categorySlug,
      page: page > 1 ? String(page) : undefined,
      ...params,
    }

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })

    const search = query.toString()
    return search ? `/tin-tuc?${search}` : '/tin-tuc'
  }

  return (
    <div className="min-h-screen bg-theme-page pb-16">
      <section className="relative overflow-hidden border-b border-theme-border bg-theme-section">
        <BrandContainer className="py-5 md:py-7">
          <Breadcrumb items={[{ label: 'Tin tức' }]} />

          <div className="relative mx-auto max-w-3xl text-center">
            <span
              aria-hidden
              className="pointer-events-none absolute left-[8%] top-[24%] h-3 w-3 rounded-full bg-primary/25"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-[10%] top-[18%] h-4 w-4 rounded-full bg-primary/15"
            />
            <span className="mb-3 inline-flex rounded-full border border-theme-border bg-theme-card px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary shadow-sm">
              Blog &amp; câu chuyện thương hiệu
            </span>
            <h1 className="font-heading text-3xl leading-tight text-theme-primary md:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-theme-secondary md:text-base">
              {description}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="rounded-full border border-theme-border bg-theme-card px-4 py-2 text-sm font-semibold text-theme-secondary">
                {total} bài viết đã xuất bản
              </span>
              {activeCategory && (
                <Link
                  href={buildUrl({ category: undefined, page: undefined })}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Xem toàn bộ bài viết
                </Link>
              )}
            </div>
          </div>
        </BrandContainer>
      </section>

      <BrandContainer className="mt-8">
        {categories.length > 0 && (
          <AnimateOnScroll animation="fade-up">
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              <Link href="/tin-tuc" className={chipClass(!categorySlug)}>
                Tất cả
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={buildUrl({ category: category.slug, page: undefined })}
                  className={chipClass(categorySlug === category.slug)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </AnimateOnScroll>
        )}

        {posts.length === 0 ? (
          <EmptyState
            title="Chưa có bài viết phù hợp"
            description="Danh mục này hiện chưa có nội dung công khai. Bạn có thể quay lại trang tin tức để xem các bài viết khác."
            action={
              <Link
                href="/tin-tuc"
                className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Quay lại trang tin tức
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <Link
                key={pageNumber}
                href={buildUrl({ page: String(pageNumber) })}
                aria-current={pageNumber === page ? 'page' : undefined}
                className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-bold transition-colors ${
                  pageNumber === page
                    ? 'border-primary bg-primary text-white'
                    : 'border-theme-border bg-theme-card text-theme-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {pageNumber}
              </Link>
            ))}
          </div>
        )}
      </BrandContainer>
    </div>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import { SlidersHorizontal, X } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/product/ProductCard'
import EmptyState from '@/components/ui/EmptyState'
import Breadcrumb from '@/components/layout/Breadcrumb'
import BrandContainer from '@/components/ui/BrandContainer'

export const metadata: Metadata = {
  title: 'Sản phẩm handmade cá nhân hóa | Mushroomie',
  description:
    'Khám phá bộ sưu tập vòng tay, móc khóa, charm và phụ kiện handmade cá nhân hóa của Mushroomie.',
}

type ParamValue = string | string[] | undefined

interface SearchParams {
  category?: ParamValue
  search?: ParamValue
  sort?: ParamValue
  page?: ParamValue
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp' },
  { value: 'price_desc', label: 'Giá cao' },
]

type ProductListRecord = Prisma.ProductGetPayload<{
  include: { category: true; images: true }
}>

type ProductListItem = Omit<ProductListRecord, 'price' | 'sale_price'> & {
  price: number
  sale_price: number | null
}

function readParam(value: ParamValue) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const categorySlug = readParam(sp.category)
  const searchKeyword = readParam(sp.search)?.trim()
  const sortValue = readParam(sp.sort) || 'newest'
  const pageValue = readParam(sp.page) || '1'
  const page = Math.max(1, parseInt(pageValue, 10) || 1)
  const limit = 12
  const where: Prisma.ProductWhereInput = { status: 'active' }

  if (categorySlug) where.category = { slug: categorySlug }
  if (searchKeyword) where.name = { contains: searchKeyword }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortValue === 'price_asc'
      ? { price: 'asc' }
      : sortValue === 'price_desc'
        ? { price: 'desc' }
        : { created_at: 'desc' }

  const [products, total, categories] = await Promise.all([
    prisma.product
      .findMany({
        where,
        include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      })
      .then((items): ProductListItem[] =>
        items.map((product) => ({
          ...product,
          price: Number(product.price),
          sale_price: product.sale_price ? Number(product.sale_price) : null,
        })),
      )
      .catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category
      .findMany({ where: { type: 'product' }, orderBy: { created_at: 'asc' } })
      .catch(() => []),
  ])

  const totalPages = Math.ceil(total / limit)
  const activeCategory = categories.find((category) => category.slug === categorySlug)
  const title = searchKeyword
    ? `Kết quả cho “${searchKeyword}”`
    : activeCategory?.name || 'Tất cả sản phẩm'
  const description = searchKeyword
    ? 'Chọn mẫu phù hợp rồi cá nhân hóa màu sắc, charm và lời nhắn theo ý bạn.'
    : activeCategory
      ? `Khám phá các thiết kế ${activeCategory.name.toLowerCase()} được Mushroomie làm thủ công cho quà tặng và phong cách hằng ngày.`
      : 'Khám phá bộ sưu tập vòng tay, charm, móc khóa và quà tặng handmade cá nhân hóa từ Mushroomie.'

  const buildUrl = (
    params: Partial<Record<'category' | 'search' | 'sort' | 'page', string | undefined>>,
  ) => {
    const query = new URLSearchParams()
    const nextParams = {
      category: categorySlug,
      search: searchKeyword,
      sort: sortValue === 'newest' ? undefined : sortValue,
      page: page > 1 ? String(page) : undefined,
      ...params,
    }

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })

    const search = query.toString()
    return search ? `/san-pham?${search}` : '/san-pham'
  }

  return (
    <div className="min-h-screen bg-secondary pb-16">
      <section
        className="relative overflow-hidden border-b border-warm-border"
        style={{
          background:
            'radial-gradient(120% 120% at 85% 0%, #ffeee6, var(--color-secondary))',
        }}
      >
        <BrandContainer className="py-5 md:py-7">
          <Breadcrumb items={[{ label: 'Sản phẩm' }]} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">
                Bộ sưu tập Mushroomie
              </p>
              <h1 className="text-balance font-heading text-3xl leading-tight text-neutral-900 md:text-5xl">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
                {description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full border border-warm-border bg-white px-4 py-2 text-sm font-semibold text-neutral-700">
                  {total} sản phẩm sẵn sàng cá nhân hóa
                </span>
                {activeCategory && (
                  <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">
                    Danh mục: {activeCategory.name}
                  </span>
                )}
                {searchKeyword && (
                  <Link
                    href={buildUrl({ search: undefined, page: undefined })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-warm-border bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-primary hover:text-primary"
                  >
                    Xóa từ khóa
                    <X size={14} />
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-warm-border bg-white/90 p-5 shadow-card backdrop-blur">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-neutral-400">
                Sắp xếp nhanh
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SORT_OPTIONS.map((option) => {
                  const isActive = sortValue === option.value

                  return (
                    <Link
                      key={option.value}
                      href={buildUrl({
                        sort: option.value === 'newest' ? undefined : option.value,
                        page: undefined,
                      })}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                      }`}
                    >
                      {option.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </BrandContainer>
      </section>

      <BrandContainer className="mt-8">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside>
            <div className="sticky top-24 rounded-[24px] border border-warm-border bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center gap-2 border-b border-warm-border pb-3">
                <SlidersHorizontal size={18} className="text-primary" />
                <h2 className="text-sm font-extrabold text-text">Lọc sản phẩm</h2>
              </div>

              <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-neutral-400">
                Danh mục
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1.5 lg:overflow-visible">
                <Link
                  href={buildUrl({ category: undefined, page: undefined })}
                  className={`block shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    !categorySlug
                      ? 'bg-primary text-white'
                      : 'text-neutral-700 hover:bg-primary-light hover:text-primary'
                  }`}
                >
                  Tất cả
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={buildUrl({ category: category.slug, page: undefined })}
                    className={`block shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      categorySlug === category.slug
                        ? 'bg-primary text-white'
                        : 'text-neutral-700 hover:bg-primary-light hover:text-primary'
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <h3 className="mb-2 mt-6 text-xs font-extrabold uppercase tracking-[0.08em] text-neutral-400">
                Cách xem
              </h3>
              <p className="rounded-[20px] bg-secondary px-4 py-3 text-sm leading-relaxed text-neutral-600">
                Mỗi mẫu đều có thể được cá nhân hóa thêm khi bạn vào trang chi tiết sản phẩm.
              </p>
            </div>
          </aside>

          <main>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-700">
                  Hiển thị {products.length} trên tổng {total} sản phẩm
                </p>
                {totalPages > 1 && (
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-neutral-400">
                    Trang {page} / {totalPages}
                  </p>
                )}
              </div>
            </div>

            {products.length === 0 ? (
              <EmptyState
                title="Chưa tìm thấy mẫu phù hợp"
                description="Thử từ khóa khác hoặc quay lại toàn bộ bộ sưu tập để xem thêm các thiết kế handmade của Mushroomie."
                action={
                  <Link
                    href="/san-pham"
                    className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    Xem tất cả sản phẩm
                  </Link>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label="Phân trang sản phẩm" className="mt-10 flex flex-wrap justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Link
                    key={pageNumber}
                    href={buildUrl({ page: String(pageNumber) })}
                    aria-current={pageNumber === page ? 'page' : undefined}
                    className={`grid h-10 w-10 place-items-center rounded-full text-sm font-extrabold ${
                      pageNumber === page
                        ? 'bg-primary text-white'
                        : 'border border-warm-border bg-white text-text hover:border-primary hover:text-primary'
                    }`}
                  >
                    {pageNumber}
                  </Link>
                ))}
              </nav>
            )}
          </main>
        </div>
      </BrandContainer>
    </div>
  )
}

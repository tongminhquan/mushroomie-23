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
  title: 'Sản phẩm handmade cá nhân hóa',
  description: 'Khám phá bộ sưu tập vòng tay, móc khóa, charm và phụ kiện handmade cá nhân hóa của Mushroomie.',
}

interface SearchParams {
  category?: string
  search?: string
  sort?: string
  page?: string
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const pageRaw = sp.page
  const pageStr = Array.isArray(pageRaw) ? pageRaw[0] : String(pageRaw || '1')
  const pageNum = parseInt(pageStr, 10) || 1
  const page = Math.max(1, pageNum)
  const limit = 12
  const where: any = { status: 'active' }

  if (sp.category) where.category = { slug: sp.category }
  if (sp.search) where.name = { contains: sp.search }

  const orderBy: any =
    sp.sort === 'price_asc' ? { price: 'asc' }
      : sp.sort === 'price_desc' ? { price: 'desc' }
        : { created_at: 'desc' }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }).then((items: any[]) => items.map((product: any) => ({
      ...product,
      price: Number(product.price),
      sale_price: product.sale_price ? Number(product.sale_price) : null,
    }))).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category.findMany({ where: { type: 'product' }, orderBy: { created_at: 'asc' } }).catch(() => []),
  ])

  const totalPages = Math.ceil(total / limit)
  const activeCategory = categories.find((category: any) => category.slug === sp.category)
  const title = sp.search ? `Kết quả cho “${sp.search}”` : activeCategory?.name || 'Tất cả sản phẩm'

  const buildUrl = (params: Partial<SearchParams>) => {
    const next = { ...sp, ...params }
    Object.keys(next).forEach((key) => {
      if (!next[key as keyof SearchParams]) delete next[key as keyof SearchParams]
    })
    return `/san-pham?${new URLSearchParams(next)}`
  }

  return (
    <div className="min-h-screen bg-secondary py-5 md:py-8">
      <BrandContainer>
        <Breadcrumb items={[{ label: 'Sản phẩm' }]} />

        <header className="mt-5 border-b border-neutral-200 pb-7 md:flex md:items-end md:justify-between">
          <div>
            <p className="brand-kicker mb-3">Bộ sưu tập Mushroomie</p>
            <h1 className="text-balance font-heading text-3xl leading-[1.1] text-text md:text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-neutral-500">{total} sản phẩm đang có sẵn</p>
          </div>
          {sp.search && (
            <Link href="/san-pham" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-text md:mt-0">
              Xóa tìm kiếm <X size={15} />
            </Link>
          )}
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside>
            <div className="sticky top-5 rounded-[18px] border border-neutral-200 bg-white p-4 shadow-card">
              <div className="mb-4 flex items-center gap-2 border-b border-neutral-100 pb-3">
                <SlidersHorizontal size={18} className="text-primary" />
                <h2 className="text-sm font-extrabold text-text">Lọc sản phẩm</h2>
              </div>

              <h3 className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-neutral-400">Danh mục</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible">
                <Link href={buildUrl({ category: undefined, page: undefined })} className={`block shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${!sp.category ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-primary-light hover:text-primary'}`}>Tất cả</Link>
                {categories.map((category: any) => (
                  <Link key={category.id} href={buildUrl({ category: category.slug, page: undefined })} className={`block shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${sp.category === category.slug ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-primary-light hover:text-primary'}`}>
                    {category.name}
                  </Link>
                ))}
              </div>

              <h3 className="mb-2 mt-5 text-xs font-extrabold uppercase tracking-[0.08em] text-neutral-400">Sắp xếp</h3>
              <div className="grid grid-cols-3 gap-1 lg:grid-cols-1">
                {[
                  { value: 'newest', label: 'Mới nhất' },
                  { value: 'price_asc', label: 'Giá thấp' },
                  { value: 'price_desc', label: 'Giá cao' },
                ].map((option) => (
                  <Link key={option.value} href={buildUrl({ sort: option.value, page: undefined })} className={`rounded-lg px-3 py-2 text-center text-xs font-bold lg:text-left lg:text-sm ${(sp.sort || 'newest') === option.value ? 'bg-text text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <main>
            {products.length === 0 ? (
              <EmptyState
                title="Chưa tìm thấy món phù hợp"
                description="Thử một từ khóa khác hoặc xem toàn bộ bộ sưu tập nhé."
                action={<Link href="/san-pham" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Xem tất cả sản phẩm</Link>}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product: any) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label="Phân trang sản phẩm" className="mt-10 flex flex-wrap justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <Link
                    key={pageNumber}
                    href={buildUrl({ page: String(pageNumber) })}
                    aria-current={pageNumber === page ? 'page' : undefined}
                    className={`grid h-10 w-10 place-items-center rounded-xl text-sm font-extrabold ${pageNumber === page ? 'bg-primary text-white' : 'border border-neutral-200 bg-white text-text hover:border-primary hover:text-primary'}`}
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

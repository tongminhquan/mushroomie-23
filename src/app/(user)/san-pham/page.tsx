import { prisma } from '@/lib/prisma'
import ProductCard from '@/components/product/ProductCard'
import EmptyState from '@/components/ui/EmptyState'
import Breadcrumb from '@/components/layout/Breadcrumb'
import Link from 'next/link'
import type { Metadata } from 'next'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export const metadata: Metadata = {
  title: 'Sản phẩm | Mushroomie',
  description: 'Khám phá bộ sưu tập phụ kiện handmade cá nhân hóa của Mushroomie.',
}

interface SearchParams { category?: string; search?: string; sort?: string; page?: string }

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Number(sp.page || 1)
  const limit = 12

  const where: any = { status: 'active' }
  if (sp.category) where.category = { slug: sp.category }
  if (sp.search) where.name = { contains: sp.search }

  const orderBy: any = {}
  switch (sp.sort) {
    case 'price_asc': orderBy.price = 'asc'; break
    case 'price_desc': orderBy.price = 'desc'; break
    default: orderBy.created_at = 'desc'
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }).then(products => products.map(p => ({
      ...p,
      price: Number(p.price),
      sale_price: p.sale_price ? Number(p.sale_price) : null
    }))).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category.findMany({ where: { type: 'product' } }).catch(() => []),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[{ label: 'Sản phẩm' }]} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <AnimateOnScroll animation="fade-right">
              <div className="bg-white rounded-xl p-5 shadow-[0_4px_15px_rgba(64,64,64,0.12)] sticky top-20">
                <h2 className="font-heading font-bold text-lg gradient-text mb-4">Lọc sản phẩm</h2>
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-neutral-700 mb-2">Danh mục</h3>
                  <div className="space-y-1">
                    <Link href="/san-pham" className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                      !sp.category ? 'bg-primary text-white' : 'hover:bg-primary-light hover:text-primary'
                    }`}>Tất cả</Link>
                    {categories.map((cat) => (
                      <Link key={cat.id} href={`/san-pham?category=${cat.slug}${sp.sort ? `&sort=${sp.sort}` : ''}`}
                        className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                          sp.category === cat.slug ? 'bg-primary text-white' : 'hover:bg-primary-light hover:text-primary'
                        }`}>
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-neutral-700 mb-2">Sắp xếp</h3>
                  <div className="space-y-1">
                    {[
                      { value: 'newest', label: 'Mới nhất' },
                      { value: 'price_asc', label: 'Giá tăng dần' },
                      { value: 'price_desc', label: 'Giá giảm dần' },
                    ].map((opt) => (
                      <Link key={opt.value} href={`/san-pham?${new URLSearchParams({ ...sp, sort: opt.value })}`}
                        className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                          (sp.sort || 'newest') === opt.value ? 'bg-primary text-white' : 'hover:bg-primary-light hover:text-primary'
                        }`}>
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </aside>

          {/* Main */}
          <main className="flex-1">
            <AnimateOnScroll animation="fade-down">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h1 className="font-heading text-2xl font-bold gradient-text">Sản phẩm</h1>
                  <p className="text-neutral-500 text-sm">{total} sản phẩm</p>
                </div>
                {sp.search && (
                  <div className="bg-primary-light text-primary px-4 py-2 rounded-full text-sm">
                    Tìm kiếm: <strong>"{sp.search}"</strong>
                    <Link href="/san-pham" className="ml-2 hover:underline">✕</Link>
                  </div>
                )}
              </div>
            </AnimateOnScroll>

            {products.length === 0 ? (
              <EmptyState
                title="Không tìm thấy sản phẩm"
                description="Thử tìm kiếm với từ khóa khác hoặc xem tất cả sản phẩm."
                action={<Link href="/san-pham" className="gradient-btn px-5 py-2.5 rounded-full font-semibold text-sm">Xem tất cả sản phẩm</Link>}
              />
            ) : (
              <AnimateOnScroll animation="fade-up">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))}
                </div>
              </AnimateOnScroll>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <AnimateOnScroll animation="fade-up">
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link key={p} href={`/san-pham?${new URLSearchParams({ ...sp, page: String(p) })}`}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        p === page ? 'gradient-primary text-white shadow-md' : 'bg-white text-neutral-700 hover:bg-primary-light shadow-sm'
                      }`}>
                      {p}
                    </Link>
                  ))}
                </div>
              </AnimateOnScroll>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

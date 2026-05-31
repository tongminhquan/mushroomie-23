import { prisma } from '@/lib/prisma'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import ManageCategoriesModal from '@/components/admin/ManageCategoriesModal'
import ManageStatusesModal from '@/components/admin/ManageStatusesModal'
import DeleteProductButton from '@/components/admin/DeleteProductButton'

export const metadata: Metadata = { title: 'Quản lý sản phẩm | Admin Mushroomie' }

interface SearchParams { page?: string; search?: string; category?: string; status?: string }

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Number(sp.page || 1)
  const limit = 20

  const where: any = {}
  if (sp.search) where.name = { contains: sp.search }
  if (sp.category) where.category = { slug: sp.category }
  if (sp.status) where.status = sp.status

  const [products, total, categories, customStatuses] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: { take: 1 } },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
    prisma.category.findMany({ where: { type: 'product' } }).catch(() => []),
    prisma.category.findMany({ where: { type: 'product_status' } }).catch(() => []),
  ])

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-neutral-100 text-neutral-700',
    draft: 'bg-yellow-100 text-yellow-700',
  }
  
  const getStatusLabel = (status: string) => {
    const custom = customStatuses.find(s => s.slug === status)
    return custom ? custom.name : status
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Quản lý sản phẩm</h1>
          <p className="text-neutral-500 text-sm">{total} sản phẩm</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <ManageCategoriesModal />
          <ManageStatusesModal />
          <Link href="/admin/san-pham/them" className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm whitespace-nowrap flex-1 text-center md:flex-none">
            + Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-6 flex flex-wrap gap-3">
        <form className="flex-1 min-w-0">
          <input
            name="search"
            defaultValue={sp.search}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full px-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
        <select defaultValue={sp.category} className="px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select defaultValue={sp.status} className="px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">Tất cả trạng thái</option>
          {customStatuses.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Sản phẩm</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Danh mục</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Giá</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Tồn kho</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Trạng thái</th>
                <th className="text-left py-3 px-4 text-neutral-500 font-medium">Ngày tạo</th>
                <th className="text-right py-3 px-4 text-neutral-500 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {(product.featured_image || product.images[0]?.image_url) && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100">
                          <img src={product.featured_image || product.images[0]?.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{product.name}</div>
                        <div className="text-xs text-neutral-400 font-mono">{product.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">{product.category?.name || '—'}</td>
                  <td className="py-3 px-4 font-semibold">{formatPrice(Number(product.price))}</td>
                  <td className="py-3 px-4">
                    <span className={product.stock <= 5 ? 'text-red-600 font-bold' : 'text-neutral-700'}>{product.stock}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[product.status] || 'bg-neutral-100'}`}>
                      {getStatusLabel(product.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-neutral-500 text-xs">{formatDate(product.created_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/san-pham/${product.id}`} className="text-primary text-xs font-semibold hover:underline">Sửa</Link>
                    <DeleteProductButton id={product.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-12 text-neutral-500">Không có sản phẩm nào</div>
          )}
        </div>

        {/* Pagination */}
        {Math.ceil(total / limit) > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-neutral-50">
            {Array.from({ length: Math.ceil(total / limit) }, (_, i) => i + 1).map((p) => (
              <Link key={p} href={`/admin/san-pham?${new URLSearchParams({ ...sp, page: String(p) })}`}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors ${
                  p === page ? 'bg-primary text-white' : 'bg-neutral-100 hover:bg-neutral-200'
                }`}>{p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

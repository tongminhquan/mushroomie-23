import Link from 'next/link'
import { ArrowLeft, ArrowRight, Gift, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import EmptyState from '@/components/ui/EmptyState'
import { buildGiftFinderUrl, GIFT_BUDGETS, GIFT_PAGE_SIZE, type GiftFilters } from '@/lib/gift-finder'
import type { GiftFinderData } from '@/lib/gift-finder-server'

const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
const linkClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-theme-border bg-theme-card px-5 py-3 text-sm font-bold text-theme-primary hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary'
const inputClass = 'mt-2 min-h-12 w-full min-w-0 rounded-xl border border-theme-border bg-theme-input px-3 py-3 text-sm text-theme-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

export default function GiftFinder({ filters, data }: { filters: GiftFilters; data: GiftFinderData }) {
  const selectedCategory = data.categories.find((category) => category.slug === filters.category)
  const budget = GIFT_BUDGETS.find((option) => option.value === filters.budget)!
  const totalPages = Math.max(1, Math.ceil(data.total / GIFT_PAGE_SIZE))

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      <aside className="min-w-0 lg:sticky lg:top-24">
        <form key={buildGiftFinderUrl(filters)} method="get" action="/chon-qua#ket-qua" aria-label="Tìm quà theo ý bạn" className="rounded-[24px] border border-theme-border bg-theme-card p-5 md:p-6">
          <fieldset>
            <legend className="mb-6 flex items-center gap-2 font-heading text-lg text-theme-primary">
              <SlidersHorizontal size={19} aria-hidden="true" className="text-primary" />
              Quà theo ý bạn
            </legend>
            <div className="space-y-5">
              <div>
                <label htmlFor="gift-budget" className="text-sm font-bold text-theme-primary">Ngân sách cho một món</label>
                <select id="gift-budget" name="budget" defaultValue={filters.budget} className={inputClass} aria-describedby="gift-budget-note">
                  {GIFT_BUDGETS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <p id="gift-budget-note" className="mt-2 text-xs leading-5 text-theme-secondary">Chưa gồm phí vận chuyển, gói quà và chưa trừ voucher.</p>
              </div>
              <div>
                <label htmlFor="gift-category" className="text-sm font-bold text-theme-primary">Bạn muốn tặng gì?</label>
                <select id="gift-category" name="category" defaultValue={filters.category} className={inputClass}>
                  <option value="">Tất cả phụ kiện</option>
                  {filters.category && !selectedCategory && <option value={filters.category}>Danh mục đã chọn (chưa có dữ liệu)</option>}
                  {data.categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                </select>
              </div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-theme-subtle p-3">
                <input name="custom" type="checkbox" value="1" defaultChecked={filters.customizable} className="mt-0.5 h-5 w-5 shrink-0 accent-[#c91414] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
                <span className="text-sm font-semibold leading-6 text-theme-primary">Chỉ xem mẫu có thể cá nhân hóa</span>
              </label>
            </div>
          </fieldset>
          <button type="submit" className={`${actionClass} mt-6 w-full`}>Tìm quà hợp ý <ArrowRight size={17} aria-hidden="true" /></button>
          <Link href="/chon-qua" prefetch={false} className="mt-2 flex min-h-11 items-center justify-center rounded-xl text-sm font-semibold text-theme-secondary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">Đặt lại lựa chọn</Link>
        </form>
        <p className="mt-4 flex gap-2 px-2 text-sm leading-6 text-theme-secondary">
          <Gift size={18} className="mt-1 shrink-0 text-primary" aria-hidden="true" />
          Chọn được mẫu ưng ý? Vào trang sản phẩm để xem chi tiết và các lựa chọn cá nhân hóa.
        </p>
      </aside>

      <section id="ket-qua" aria-labelledby="gift-results-heading" className="min-w-0 scroll-mt-28">
        <div className="mb-6 border-b border-theme-border pb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Một chút handmade, nhiều chút thương</p>
          <h2 id="gift-results-heading" className="font-heading text-2xl text-theme-primary md:text-3xl">Gợi ý dành cho bạn</h2>
          {data.status === 'ready' && (
            <p className="mt-2 text-sm leading-6 text-theme-secondary">
              {data.total} món quà còn hàng · {budget.value === 'any' ? 'Mọi ngân sách' : budget.label}
              {selectedCategory ? ` · ${selectedCategory.name}` : ''}
              {filters.customizable ? ' · Có thể cá nhân hóa' : ''}
            </p>
          )}
        </div>

        {data.status === 'unavailable' ? (
          <EmptyState title="Chưa tải được gợi ý quà" description="Kết nối đang gián đoạn. Bạn thử lại sau một chút hoặc nhắn Mushroomie để được giúp chọn quà nhé."
            action={<div className="flex flex-wrap justify-center gap-3"><a href={buildGiftFinderUrl(filters)} className={actionClass}>Thử lại</a><Link href="/lien-he" className={linkClass}>Liên hệ Mushroomie</Link></div>} />
        ) : data.products.length === 0 ? (
          <EmptyState title="Chưa có món quà khớp lựa chọn" description="Thử tăng ngân sách hoặc đổi loại phụ kiện. Bạn cũng có thể bỏ lựa chọn cá nhân hóa để xem thêm mẫu."
            action={<a href="#gift-budget" className={actionClass}>Điều chỉnh lựa chọn <ArrowLeft size={16} aria-hidden="true" /></a>} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {data.products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
            {totalPages > 1 && (
              <nav aria-label="Phân trang gợi ý quà" className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {data.page > 1 && <Link href={`${buildGiftFinderUrl(filters, data.page - 1)}#ket-qua`} prefetch={false} className={linkClass}><ArrowLeft size={16} aria-hidden="true" /> Trang trước</Link>}
                <span className="px-1 text-sm font-semibold text-theme-secondary">Trang {data.page} / {totalPages}</span>
                {data.page < totalPages && <Link href={`${buildGiftFinderUrl(filters, data.page + 1)}#ket-qua`} prefetch={false} className={linkClass}>Trang sau <ArrowRight size={16} aria-hidden="true" /></Link>}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  )
}

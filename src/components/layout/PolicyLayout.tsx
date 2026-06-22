'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Breadcrumb from '@/components/layout/Breadcrumb'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

const policies = [
  { name: 'Chính sách & Quy định chung', slug: '/chinh-sach-quy-dinh', icon: '📋' },
  { name: 'Chính sách giao hàng', slug: '/chinh-sach-giao-hang', icon: '🚚' },
  { name: 'Chính sách đổi trả', slug: '/chinh-sach-doi-tra', icon: '🔄' },
  { name: 'Chính sách trả góp', slug: '/chinh-sach-tra-gop', icon: '💳' },
  { name: 'Chính sách bảo mật', slug: '/chinh-sach-bao-mat', icon: '🔒' },
]

const LINE = '#f0e0d6' // warm hairline border từ Claude Design

export default function PolicyLayout({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-secondary pb-16">
      {/* Breadcrumb (giữ JSON-LD BreadcrumbList cho SEO) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumb items={[{ label: title }]} />
      </div>

      {/* Hero / page head */}
      <section
        className="relative overflow-hidden text-center"
        style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
      >
        <span aria-hidden className="pointer-events-none select-none absolute left-[12%] top-[40%] text-xl text-coral animate-float-soft">❤</span>
        <span aria-hidden className="pointer-events-none select-none absolute right-[13%] top-[30%] text-lg text-accent-mint animate-float-soft" style={{ animationDelay: '1.2s' }}>★</span>
        <div className="relative max-w-2xl mx-auto px-6 pt-8 pb-9">
          <span className="inline-block text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2.5">
            Chính sách &amp; hỗ trợ
          </span>
          <h1 className="font-heading text-3xl md:text-4xl text-neutral-900 mb-2 leading-tight">{title}</h1>
          <p className="m-0 text-sm text-neutral-500">Minh bạch, rõ ràng &amp; luôn đặt bạn lên hàng đầu ♡</p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 grid gap-6 items-start md:grid-cols-[230px_1fr]">
        {/* Sidebar */}
        <aside className="md:sticky md:top-24">
          <AnimateOnScroll animation="fade-right">
            <nav
              aria-label="Danh mục chính sách"
              className="bg-white rounded-[18px] p-3.5 shadow-card border-[1.5px]"
              style={{ borderColor: LINE }}
            >
              <div className="px-3 py-1.5 mb-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-neutral-400">
                Danh mục chính sách
              </div>
              <ul className="space-y-0.5">
                {policies.map((policy) => {
                  const isActive = pathname === policy.slug
                  return (
                    <li key={policy.slug}>
                      <Link
                        href={policy.slug}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-2.5 px-3 py-3 rounded-[10px] text-sm font-semibold transition-colors ${
                          isActive
                            ? 'text-primary bg-primary-light'
                            : 'text-neutral-700 hover:text-primary hover:bg-primary-light/60'
                        }`}
                      >
                        <span aria-hidden className="text-base leading-none">{policy.icon}</span>
                        <span>{policy.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </AnimateOnScroll>
        </aside>

        {/* Main content */}
        <div className="flex flex-col gap-4 min-w-0">
          <AnimateOnScroll animation="fade-up">
            <article
              className="bg-white rounded-[22px] p-6 md:p-8 shadow-card border-[1.5px]"
              style={{ borderColor: LINE }}
            >
              <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-heading prose-headings:text-neutral-800 prose-a:text-primary hover:prose-a:text-primary-dark prose-strong:text-accent-kraft">
                {children}
              </div>
            </article>
          </AnimateOnScroll>

          {/* CTA liên hệ */}
          <AnimateOnScroll animation="fade-up">
            <div
              className="text-center rounded-[22px] p-6 border-[1.5px]"
              style={{ borderColor: LINE, background: 'linear-gradient(135deg,#fff0ec,#fff7f2)' }}
            >
              <div className="font-heading text-lg text-neutral-900 mb-1.5">Còn thắc mắc gì không?</div>
              <p className="m-0 mb-4 text-sm text-neutral-500">
                Nhắn cho Nhà Nấm nhỏ, chúng mình luôn sẵn sàng hỗ trợ ♡
              </p>
              <Link
                href="/lien-he"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-primary shadow-[0_8px_20px_rgba(201,20,20,0.3)] transition-transform hover:scale-[1.03]"
              >
                <span aria-hidden>💬</span> Liên hệ ngay
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  )
}

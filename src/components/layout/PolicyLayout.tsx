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

export default function PolicyLayout({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  const pathname = usePathname()

  return (
    <div className="theme-transition min-h-screen bg-theme-page pb-16 text-theme-primary">
      {/* Breadcrumb (giữ JSON-LD BreadcrumbList cho SEO) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumb items={[{ label: title }]} />
      </div>

      {/* Hero / page head */}
      <section className="relative overflow-hidden bg-theme-section text-center">
        <span aria-hidden className="pointer-events-none select-none absolute left-[12%] top-[40%] text-xl text-coral animate-float-soft">❤</span>
        <span aria-hidden className="pointer-events-none select-none absolute right-[13%] top-[30%] text-lg text-accent-mint animate-float-soft" style={{ animationDelay: '1.2s' }}>★</span>
        <div className="relative max-w-2xl mx-auto px-6 pt-8 pb-9">
          <span className="inline-block text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2.5">
            Chính sách &amp; hỗ trợ
          </span>
          <h1 className="mb-2 font-heading text-3xl leading-tight text-theme-primary md:text-4xl">{title}</h1>
          <p className="m-0 text-sm text-theme-muted">Minh bạch, rõ ràng &amp; luôn đặt bạn lên hàng đầu ♡</p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 grid gap-6 items-start md:grid-cols-[230px_1fr]">
        {/* Sidebar */}
        <aside className="md:sticky md:top-24">
          <AnimateOnScroll animation="fade-right">
            <nav
              aria-label="Danh mục chính sách"
              className="rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-3.5 shadow-card"
            >
              <div className="mb-1 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-theme-muted">
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
                            : 'text-theme-secondary hover:bg-theme-subtle hover:text-primary'
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
            <article className="rounded-[22px] border-[1.5px] border-theme-border bg-theme-card p-6 shadow-card md:p-8">
              <div className="prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-theme-primary prose-a:text-primary hover:prose-a:text-primary-dark prose-strong:text-accent-kraft md:prose-base">
                {children}
              </div>
            </article>
          </AnimateOnScroll>

          {/* CTA liên hệ */}
          <AnimateOnScroll animation="fade-up">
            <div className="rounded-[22px] border-[1.5px] border-theme-border bg-theme-subtle p-6 text-center">
              <div className="mb-1.5 font-heading text-lg text-theme-primary">Còn thắc mắc gì không?</div>
              <p className="m-0 mb-4 text-sm text-theme-muted">
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

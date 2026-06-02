'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Breadcrumb from '@/components/layout/Breadcrumb'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

const policies = [
  { name: 'Chính sách & Quy định chung', slug: '/chinh-sach-quy-dinh' },
  { name: 'Chính sách giao hàng', slug: '/chinh-sach-giao-hang' },
  { name: 'Chính sách đổi trả', slug: '/chinh-sach-doi-tra' },
  { name: 'Chính sách trả góp', slug: '/chinh-sach-tra-gop' },
  { name: 'Chính sách bảo mật', slug: '/chinh-sach-bao-mat' },
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
    <div className="min-h-screen bg-neutral-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[{ label: title }]} />

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <AnimateOnScroll animation="fade-right">
              <div className="bg-white rounded-lg p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-neutral-100 sticky top-24">
                <h2 className="font-heading font-bold text-base uppercase text-white bg-primary p-3 rounded-md mb-2">
                  Danh mục chính sách
                </h2>
                <ul className="space-y-1">
                  {policies.map((policy) => {
                    const isActive = pathname === policy.slug
                    return (
                      <li key={policy.slug}>
                        <Link
                          href={policy.slug}
                          className={`block px-3 py-2.5 rounded-md text-sm transition-colors font-medium ${
                            isActive
                              ? 'text-primary bg-primary/10'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-primary'
                          }`}
                        >
                          {policy.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </AnimateOnScroll>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white p-6 md:p-8 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-neutral-100">
            <AnimateOnScroll animation="fade-up">
              <h1 className="font-heading text-2xl font-bold text-neutral-800 mb-6 pb-4 border-b border-neutral-100">
                {title}
              </h1>
              <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-heading prose-headings:text-neutral-800 prose-a:text-primary hover:prose-a:text-primary-dark prose-strong:text-neutral-800">
                {children}
              </div>
            </AnimateOnScroll>
          </main>
        </div>
      </div>
    </div>
  )
}

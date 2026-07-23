import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import ClarityInit from '@/components/analytics/ClarityInit'
import GoogleAnalyticsInit from '@/components/analytics/GoogleAnalyticsInit'
import DeferredPublicWidgets from '@/components/layout/DeferredPublicWidgets'
import PublicProviders from '@/components/layout/PublicProviders'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const categories = await prisma.category.findMany({
    where: { type: 'product' },
    select: { id: true, name: true, slug: true },
    orderBy: { created_at: 'asc' },
    take: 8,
  }).catch(() => [])

  return (
    <PublicProviders>
        <Header categories={categories.map((category) => ({
          href: `/san-pham?category=${category.slug}`,
          label: category.name,
        }))} />
        <main id="main-content" className="pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        <Footer categories={categories.slice(0, 5)} />
        <MobileBottomNav />
        <DeferredPublicWidgets />
        <ClarityInit />
        <GoogleAnalyticsInit />
    </PublicProviders>
  )
}

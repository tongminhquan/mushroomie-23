import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import FloatingWidgets from '@/components/layout/FloatingWidgets'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import Script from 'next/script'
import ClarityInit from '@/components/analytics/ClarityInit'
import GtmInit from '@/components/analytics/GtmInit'
import PublicProviders from '@/components/layout/PublicProviders'

const GA_ID = 'G-R95TLDCP0W'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicProviders>
        <Header />
        <main id="main-content" className="pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <CartDrawer />
        <FloatingWidgets />
        <ClarityInit />
        <GtmInit />
        <Script
          id="ga4-gtag-src"
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        />
        <Script
          id="ga4-gtag-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `,
          }}
        />
    </PublicProviders>
  )
}

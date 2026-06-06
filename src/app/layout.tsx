import type { Metadata } from 'next'
import { Paytone_One, Montserrat } from 'next/font/google'
import Script from 'next/script'
import ClarityInit from '@/components/analytics/ClarityInit'
import './globals.css'

const paytoneOne = Paytone_One({
  subsets: ['latin', 'vietnamese'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mushroomie — Phụ kiện Handmade Cá nhân hóa',
    template: '%s | Mushroomie',
  },
  description: 'Phụ kiện handmade cá nhân hóa dành cho giới trẻ — vòng tay, móc khóa, charm và phụ kiện nhỏ xinh được làm thủ công 100%.',
  keywords: ['phụ kiện handmade', 'vòng tay', 'móc khóa', 'charm', 'cá nhân hóa', 'Mushroomie'],
  authors: [{ name: 'Mushroomie' }],
  creator: 'Mushroomie',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.ico?v=2',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Mushroomie',
    title: 'Mushroomie — Phụ kiện Handmade Cá nhân hóa',
    description: 'Phụ kiện handmade cá nhân hóa dành cho giới trẻ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mushroomie — Phụ kiện Handmade Cá nhân hóa',
    description: 'Phụ kiện handmade cá nhân hóa dành cho giới trẻ',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${paytoneOne.variable} ${montserrat.variable}`}>
      <head>
      </head>
      <body suppressHydrationWarning className="font-body bg-secondary min-h-screen">
        <ClarityInit />
        {children}
        <Script
          id="gtm"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-K55B6RVG');
            `,
          }}
        />
      </body>
    </html>
  )
}

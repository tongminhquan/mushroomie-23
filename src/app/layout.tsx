import type { Metadata } from 'next'
import { Paytone_One, Montserrat } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'
import ClarityInit from '@/components/analytics/ClarityInit'
import './globals.css'

const paytoneOne = Paytone_One({
  subsets: ['latin'],
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
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
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
      </body>
      <GoogleTagManager gtmId="GTM-K55B6RVG" />
    </html>
  )
}

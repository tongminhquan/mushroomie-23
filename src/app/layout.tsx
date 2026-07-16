import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo-assets'
import './globals.css'

const montserrat = localFont({
  src: './fonts/montserrat-vietnamese.woff2',
  variable: '--font-body',
  weight: '100 900',
  display: 'swap',
  preload: false,
})

const paytoneOne = localFont({
  src: './fonts/paytone-vietnamese.woff2',
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'),
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
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Mushroomie',
    title: 'Mushroomie — Phụ kiện Handmade Cá nhân hóa',
    description: 'Phụ kiện handmade cá nhân hóa dành cho giới trẻ',
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE.path,
        width: DEFAULT_SOCIAL_IMAGE.width,
        height: DEFAULT_SOCIAL_IMAGE.height,
        alt: DEFAULT_SOCIAL_IMAGE.alt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mushroomie — Phụ kiện Handmade Cá nhân hóa',
    description: 'Phụ kiện handmade cá nhân hóa dành cho giới trẻ',
    images: [DEFAULT_SOCIAL_IMAGE.path],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${montserrat.variable} ${paytoneOne.variable}`}>
      <body suppressHydrationWarning className="font-body bg-secondary min-h-screen">
        <a href="#main-content" className="skip-link">Đi đến nội dung chính</a>
        {children}
      </body>
    </html>
  )
}

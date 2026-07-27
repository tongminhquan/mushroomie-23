import type { Metadata } from 'next'
import { safeJsonLd } from '@/lib/security'
import { BRAND, SITE_URL, breadcrumbSchema, localBusinessSchema, websiteSchema } from '@/lib/local-seo'

/**
 * Layout SEO cho trang liên hệ. Trang /lien-he là client component nên metadata
 * và JSON-LD (LocalBusiness/WebSite) đặt ở layout server này. Phục vụ các từ khóa
 * "shop phụ kiện handmade Trảng Dài", "gần tôi", "gần đây"... (NAP + LocalBusiness).
 */
export const metadata: Metadata = {
  title: 'Liên Hệ – Shop Phụ Kiện Handmade Trảng Dài',
  description:
    'Liên hệ Mushroomie để đặt vòng tay handmade, móc khóa, charm và quà tặng cá nhân hóa tại Trảng Dài, Đồng Nai, gần Biên Hòa và giao online đến TP.HCM.',
  alternates: { canonical: `${SITE_URL}/lien-he` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/lien-he`,
    siteName: BRAND.name,
    locale: 'vi_VN',
    title: 'Liên Hệ Mushroomie – Phụ Kiện Handmade Đồng Nai',
    description:
      'Đặt phụ kiện handmade custom tại Đồng Nai: vòng tay, móc khóa, charm và quà tặng cá nhân hóa. Nhắn tin tư vấn, xem sản phẩm hoặc mua trên Shopee.',
    images: [{ url: BRAND.logo, width: 1200, height: 630, alt: 'Mushroomie phụ kiện handmade Đồng Nai' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liên Hệ Mushroomie – Phụ Kiện Handmade Đồng Nai',
    description: 'Đặt vòng tay, móc khóa, charm và quà tặng handmade cá nhân hóa tại Đồng Nai.',
    images: [BRAND.logo],
  },
}

export default function LienHeLayout({ children }: { children: React.ReactNode }) {
  const crumbs = [
    { name: 'Trang chủ', url: '/' },
    { name: 'Liên hệ', url: '/lien-he' },
  ]
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(localBusinessSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema(crumbs)) }} />
      {children}
    </>
  )
}

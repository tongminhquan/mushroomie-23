import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LocalLandingPage from '@/components/local/LocalLandingPage'
import { BRAND, SITE_URL, getLocalPage } from '@/lib/local-seo'

const SLUG = 'qua-tang-ca-nhan-hoa-dong-nai'

export function generateMetadata(): Metadata {
  const page = getLocalPage(SLUG)
  if (!page) return {}
  const url = `${SITE_URL}/${SLUG}`
  return {
    title: page.seoTitle,
    description: page.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      siteName: BRAND.name,
      locale: 'vi_VN',
      title: page.seoTitle,
      description: page.metaDescription,
      images: [{ url: BRAND.socialImage, width: 1200, height: 675, alt: page.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.seoTitle,
      description: page.metaDescription,
      images: [BRAND.socialImage],
    },
  }
}

export default function Page() {
  const page = getLocalPage(SLUG)
  if (!page) notFound()
  return <LocalLandingPage page={page} />
}

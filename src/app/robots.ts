import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Utility pages stay crawlable so search engines can read their noindex metadata.
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

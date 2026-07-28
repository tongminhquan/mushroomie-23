import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/auth/session'],
        // Utility pages stay crawlable so search engines can read their noindex metadata.
        // API responses use X-Robots-Tag for index control so rendering tools can still
        // load public dependencies such as /api/auth/session.
        disallow: '/admin',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/auth/session'],
        // Utility pages stay crawlable so search engines can read their noindex metadata.
        // The public session endpoint is required by SessionProvider during rendering checks.
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

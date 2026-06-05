import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/tai-khoan/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

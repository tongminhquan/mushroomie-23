import { prisma } from '@/lib/prisma'
import { toAbsoluteUrl } from '@/lib/url'

export const dynamic = 'force-dynamic'

const SITE_URL = 'https://mushroomie.io.vn'

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** RSS 2.0 feed — CHỈ chứa bài đã xuất bản */
export async function GET() {
  let posts: Array<{ title: string; slug: string; excerpt: string | null; published_at: Date | null; updated_at: Date; featured_image: string | null }> = []
  try {
    posts = await prisma.post.findMany({
      where: { status: 'published' },
      orderBy: { published_at: 'desc' },
      take: 30,
      select: { title: true, slug: true, excerpt: true, published_at: true, updated_at: true, featured_image: true },
    })
  } catch {
    // DB lỗi → feed rỗng thay vì 500
  }

  const items = posts
    .filter((p) => /^[a-z0-9-]+$/i.test(p.slug))
    .map((p) => {
      const url = `${SITE_URL}/tin-tuc/${p.slug}`
      const pubDate = (p.published_at || p.updated_at).toUTCString()
      return [
        '    <item>',
        `      <title>${xmlEscape(p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        p.excerpt ? `      <description>${xmlEscape(p.excerpt)}</description>` : '',
        p.featured_image ? `      <enclosure url="${xmlEscape(toAbsoluteUrl(p.featured_image))}" type="image/webp" />` : '',
        '    </item>',
      ].filter(Boolean).join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Mushroomie — Tin tức &amp; Mẹo handmade</title>
    <link>${SITE_URL}/tin-tuc</link>
    <description>Từ từng hạt nhỏ, tạo phong cách riêng — bài viết về vòng tay handmade, charm, phụ kiện cá nhân hóa.</description>
    <language>vi</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600',
    },
  })
}

import { prisma } from '@/lib/prisma'
import { BRAND, PUBLISHED_LOCAL_PAGES, SITE_URL } from '@/lib/local-seo'

/**
 * /llms.txt — bản tóm tắt site cho các LLM (ChatGPT, Claude, Perplexity, Gemini).
 * Đề xuất tại llmstxt.org: markdown phẳng, link tuyệt đối, ưu tiên nội dung có giá trị
 * trích dẫn thay vì liệt kê toàn bộ URL (đó là việc của sitemap.xml).
 */
export const revalidate = 3600

function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && !/[\s/?#]/.test(slug) && !slug.includes('://')
}

export async function GET() {
  let products: Array<{ name: string; slug: string; short_description: string | null }> = []
  let posts: Array<{ title: string; slug: string; excerpt: string | null }> = []

  try {
    ;[products, posts] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'active' },
        orderBy: { created_at: 'desc' },
        take: 40,
        select: { name: true, slug: true, short_description: true },
      }),
      prisma.post.findMany({
        where: { status: 'published' },
        orderBy: { published_at: 'desc' },
        take: 40,
        select: { title: true, slug: true, excerpt: true },
      }),
    ])
  } catch {
    // DB lỗi → vẫn trả phần tĩnh thay vì 500
  }

  const line = (label: string, url: string, note?: string | null) =>
    `- [${label}](${url})${note ? `: ${note.replace(/\s+/g, ' ').trim()}` : ''}`

  const body = [
    `# ${BRAND.name}`,
    '',
    `> ${BRAND.description}`,
    '',
    `${BRAND.name} (${BRAND.legalName}) là xưởng phụ kiện handmade đặt tại `
      + `${BRAND.formattedAddress}, phục vụ ${BRAND.areaServed.join(', ')}. Sản phẩm được làm thủ công; `
      + `các sản phẩm có hỗ trợ cá nhân hóa có thể chọn màu sắc, charm hoặc kích thước theo yêu cầu.`,
    '',
    '## Thông tin liên hệ',
    '',
    `- Website: ${SITE_URL}`,
    `- Điện thoại: ${BRAND.phoneDisplay} (${BRAND.phoneE164})`,
    `- Email: ${BRAND.email}`,
    `- Địa chỉ: ${BRAND.formattedAddress}`,
    `- Giờ mở cửa: ${BRAND.openingHours.opens}–${BRAND.openingHours.closes} hằng ngày`,
    ...BRAND.sameAs.map((url) => `- ${url}`),
    '',
    '## Chính sách',
    '',
    line('Chính sách giao hàng', `${SITE_URL}/chinh-sach-giao-hang`, 'Xử lý 1–3 ngày làm việc, giao 1–2 ngày nội tỉnh Đồng Nai và 3–5 ngày các tỉnh khác'),
    line('Chính sách đổi trả', `${SITE_URL}/chinh-sach-doi-tra`, 'Đổi trả trong 3 ngày với sản phẩm lỗi sản xuất hoặc hư hỏng khi vận chuyển'),
    line('Chính sách bảo mật', `${SITE_URL}/chinh-sach-bao-mat`),
    line('Điều khoản dịch vụ', `${SITE_URL}/dieu-khoan-dich-vu`),
    '',
    '## Trang chính',
    '',
    line('Trang chủ', SITE_URL),
    line('Tất cả sản phẩm', `${SITE_URL}/san-pham`),
    line('Tin tức & hướng dẫn', `${SITE_URL}/tin-tuc`),
    line('Giới thiệu', `${SITE_URL}/gioi-thieu`),
    line('Liên hệ', `${SITE_URL}/lien-he`),
    '',
    '## Khu vực phục vụ',
    '',
    ...PUBLISHED_LOCAL_PAGES.map((p) => line(p.h1, `${SITE_URL}/${p.slug}`)),
    '',
    '## Sản phẩm',
    '',
    ...products
      .filter((p) => isValidSlug(p.slug))
      .map((p) => line(p.name, `${SITE_URL}/san-pham/${p.slug}`, p.short_description)),
    '',
    '## Bài viết',
    '',
    ...posts
      .filter((p) => isValidSlug(p.slug))
      .map((p) => line(p.title, `${SITE_URL}/tin-tuc/${p.slug}`, p.excerpt)),
    '',
    '## Tham khảo thêm',
    '',
    line('Sitemap XML', `${SITE_URL}/sitemap.xml`),
    line('RSS feed', `${SITE_URL}/feed.xml`),
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}

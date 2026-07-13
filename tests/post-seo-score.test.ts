import assert from 'node:assert/strict'
import test from 'node:test'
import { calculatePostSeoAnalysis, getPostSeoRating } from '../src/lib/post-seo-score'

test('SEO score is zero when the focus keyword is missing', () => {
  const analysis = calculatePostSeoAnalysis({
    title: 'Bài viết chưa có từ khóa',
    slug: 'bai-viet-chua-co-tu-khoa',
    content: '<p>Nội dung mẫu</p>',
  })

  assert.equal(analysis.score, 0)
  assert.equal(analysis.checks.length, 1)
  assert.equal(getPostSeoRating(analysis.score).label, 'Chưa chấm')
})

test('SEO score uses the same complete checklist as the editor', () => {
  const keyword = 'vòng tay handmade'
  const paragraph = `${keyword} ${Array.from({ length: 45 }, () => 'phụ kiện').join(' ')}`
  const content = [
    `<p>${paragraph}</p>`,
    `<h2>${keyword} cho phong cách riêng</h2>`,
    ...Array.from({ length: 6 }, () => `<p>${paragraph}</p>`),
    '<h2>Cách chọn chất liệu phù hợp</h2>',
    `<img src="/uploads/vong-tay.webp" alt="${keyword}">`,
    '<p><a href="/san-pham">Xem sản phẩm</a> <a href="https://example.com/reference">Nguồn tham khảo</a></p>',
  ].join('')

  const analysis = calculatePostSeoAnalysis({
    title: 'Vòng tay handmade 2026',
    seo_title: 'Vòng tay handmade 2026: hướng dẫn lựa chọn',
    slug: 'vong-tay-handmade-2026',
    meta_description: `${keyword} được làm thủ công, dễ cá nhân hóa và phù hợp làm quà tặng. Khám phá cách chọn màu sắc, chất liệu và kích thước phù hợp.`,
    focus_keyword: keyword,
    secondary_keywords: JSON.stringify(['phụ kiện']),
    content,
    featured_image: '/uploads/featured.webp',
    featured_image_alt: keyword,
  })

  assert.equal(analysis.score, 95)
  assert.equal(getPostSeoRating(analysis.score).label, 'Tốt')
  assert.deepEqual(
    analysis.checks.filter((check) => check.status !== 'success').map((check) => check.text),
    ['Nên đưa từ khoá chính vào Đường dẫn tĩnh (Slug).'],
  )
})

test('SEO rating thresholds remain stable for the post list', () => {
  assert.deepEqual(getPostSeoRating(80), { label: 'Tốt', tone: 'good' })
  assert.deepEqual(getPostSeoRating(79), { label: 'Cần cải thiện', tone: 'warning' })
  assert.deepEqual(getPostSeoRating(49), { label: 'Kém', tone: 'poor' })
  assert.deepEqual(getPostSeoRating(0), { label: 'Chưa chấm', tone: 'empty' })
})

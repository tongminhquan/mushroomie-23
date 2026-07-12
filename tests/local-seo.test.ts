import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BRAND,
  LOCAL_PAGES,
  PUBLISHED_LOCAL_PAGES,
  PUBLISHED_LOCAL_SLUGS,
  faqPageSchema,
  getLocalFaqs,
  getRelatedPages,
  localBusinessSchema,
} from '../src/lib/local-seo'

test('local SEO chỉ xuất bản các landing đã có route', () => {
  const configuredSlugs = new Set(LOCAL_PAGES.map((page) => page.slug))
  const publishedSlugs = PUBLISHED_LOCAL_PAGES.map((page) => page.slug)

  assert.equal(PUBLISHED_LOCAL_PAGES.length, PUBLISHED_LOCAL_SLUGS.length)
  assert.equal(new Set(publishedSlugs).size, publishedSlugs.length)

  for (const slug of PUBLISHED_LOCAL_SLUGS) {
    assert.ok(configuredSlugs.has(slug), `Thiếu dữ liệu local SEO cho route ${slug}`)
    assert.ok(publishedSlugs.includes(slug), `Route ${slug} chưa được đưa vào danh sách xuất bản`)
    assert.ok(
      existsSync(resolve(process.cwd(), 'src', 'app', '(user)', slug, 'page.tsx')),
      `Landing ${slug} đã được đánh dấu xuất bản nhưng chưa có route page.tsx`,
    )
  }
})

test('liên kết local liên quan không trỏ đến landing chưa xuất bản', () => {
  const publishedSlugs = new Set<string>(PUBLISHED_LOCAL_SLUGS)

  for (const page of PUBLISHED_LOCAL_PAGES) {
    for (const related of getRelatedPages(page.slug)) {
      assert.ok(publishedSlugs.has(related.slug), `${page.slug} đang liên kết đến route chưa xuất bản ${related.slug}`)
    }
  }
})

test('LocalBusiness schema giữ NAP, tọa độ và giờ hoạt động nhất quán', () => {
  const schema = localBusinessSchema()

  assert.equal(schema.telephone, BRAND.phoneE164)
  assert.equal(schema.address.streetAddress, BRAND.streetAddress)
  assert.equal(schema.geo.latitude, BRAND.geo.latitude)
  assert.equal(schema.geo.longitude, BRAND.geo.longitude)
  assert.equal(schema.openingHoursSpecification.opens, BRAND.openingHours.opens)
  assert.equal(schema.openingHoursSpecification.closes, BRAND.openingHours.closes)
  assert.equal(schema.hasMap, BRAND.mapUrl)
})

test('FAQ schema phản ánh đúng câu hỏi đang hiển thị trên landing', () => {
  const page = PUBLISHED_LOCAL_PAGES[0]
  assert.ok(page)

  const faqs = getLocalFaqs(page)
  const schema = faqPageSchema(faqs)

  assert.equal(faqs.length, 4)
  assert.equal(schema.mainEntity.length, faqs.length)
  assert.equal(schema.mainEntity[0]?.name, faqs[0]?.question)
  assert.equal(schema.mainEntity[0]?.acceptedAnswer.text, faqs[0]?.answer)
})

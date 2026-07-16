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
  localServiceSchema,
} from '../src/lib/local-seo'

test('BRAND dùng đúng NAP và tọa độ đã được xác minh', () => {
  assert.equal(BRAND.phone, '0947192590')
  assert.equal(BRAND.phoneE164, '+84947192590')
  assert.equal(BRAND.email, 'cskh@mushroomie.io.vn')
  assert.equal(BRAND.streetAddress, 'Hẻm 2, tổ 11, phường Trảng Dài')
  assert.equal(BRAND.addressLocality, 'Trảng Dài')
  assert.equal(BRAND.addressRegion, 'Đồng Nai')
  assert.equal(BRAND.formattedAddress, 'Hẻm 2, tổ 11, phường Trảng Dài, tỉnh Đồng Nai')
  assert.equal(BRAND.geo.latitude, 10.996333)
  assert.equal(BRAND.geo.longitude, 106.882306)

  const coordinatePair = `${BRAND.geo.latitude},${BRAND.geo.longitude}`
  assert.ok(BRAND.mapUrl.includes(coordinatePair))
  assert.ok(BRAND.mapEmbedUrl.includes(coordinatePair))
  assert.ok(BRAND.mapEmbedUrl.startsWith('https://www.google.com/maps/'))
})

test('BRAND tập trung URL và handle social canonical', () => {
  assert.deepEqual(BRAND.socials, {
    facebook: {
      url: 'https://www.facebook.com/mushr00mie',
      handle: 'fb.com/mushr00mie',
    },
    instagram: {
      url: 'https://www.instagram.com/mushr00mie._/',
      handle: '@mushr00mie._',
    },
    tiktok: {
      url: 'https://www.tiktok.com/@mushr00mie._',
      handle: '@mushr00mie._',
    },
    shopee: {
      url: 'https://shopee.vn/shop/475544379',
      handle: 'Mushroomie',
    },
  })
  assert.ok(BRAND.sameAs.includes(BRAND.socials.facebook.url))
  assert.ok(BRAND.sameAs.includes(BRAND.socials.instagram.url))
  assert.ok(BRAND.sameAs.includes(BRAND.socials.tiktok.url))
  assert.ok(BRAND.sameAs.includes(BRAND.socials.shopee.url))
  assert.equal(
    BRAND.socialImage,
    'https://mushroomie.io.vn/uploads/1002a915-1479-49e8-b3c2-b04a21eef81f.webp',
  )
})

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
  assert.equal(schema.email, BRAND.email)
  assert.equal(schema.address.streetAddress, BRAND.streetAddress)
  assert.equal(schema.address.addressLocality, BRAND.addressLocality)
  assert.equal(schema.address.addressRegion, BRAND.addressRegion)
  assert.equal(schema.address.addressCountry, BRAND.addressCountry)
  assert.equal(schema.geo.latitude, BRAND.geo.latitude)
  assert.equal(schema.geo.longitude, BRAND.geo.longitude)
  assert.equal(schema.openingHoursSpecification.opens, BRAND.openingHours.opens)
  assert.equal(schema.openingHoursSpecification.closes, BRAND.openingHours.closes)
  assert.equal(schema.hasMap, BRAND.mapUrl)
  assert.deepEqual(
    schema.areaServed.map((area) => area.name),
    ['Đồng Nai', 'Biên Hòa', 'Trảng Dài', 'TP. Hồ Chí Minh'],
  )
  assert.equal('aggregateRating' in schema, false)
  assert.equal('review' in schema, false)
})

test('Service schema chuẩn hóa nhãn TP.HCM nhưng giữ nhãn tìm kiếm trên landing', () => {
  const page = LOCAL_PAGES.find((candidate) => candidate.area === 'TP.HCM')
  assert.ok(page)

  const schema = localServiceSchema(page)

  assert.equal(page.area, 'TP.HCM')
  assert.equal(schema.areaServed.name, 'TP. Hồ Chí Minh')
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

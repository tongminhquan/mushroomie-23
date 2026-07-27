import assert from 'node:assert/strict'
import test from 'node:test'
import { BRAND, LOCAL_PAGES, aboutPageSchema, brandEntityRef, localBusinessSchema } from '../src/lib/local-seo'
import {
  RETURN_WINDOW_DAYS,
  merchantReturnPolicySchema,
  offerShippingDetailsSchema,
  priceValidUntil,
} from '../src/lib/merchant-schema'
import { pickRelatedPosts } from '../src/lib/related-posts'

/** Root layout dùng template '%s | Mushroomie'. */
const TITLE_SUFFIX_LENGTH = ' | Mushroomie'.length
/** Ngưỡng an toàn để title không bị Google cắt trên SERP. */
const MAX_TITLE_LENGTH = 60

test('local landing titles stay within the SERP truncation limit once the brand suffix is applied', () => {
  const tooLong = LOCAL_PAGES
    .filter((page) => page.seoTitle.length + TITLE_SUFFIX_LENGTH > MAX_TITLE_LENGTH)
    .map((page) => `${page.slug} (${page.seoTitle.length + TITLE_SUFFIX_LENGTH})`)

  assert.deepEqual(tooLong, [])
})

test('every local landing page still has a non-empty, unique title', () => {
  const titles = LOCAL_PAGES.map((page) => page.seoTitle)
  assert.ok(titles.every((title) => title.trim().length > 0))
  assert.equal(new Set(titles).size, titles.length)
})

test('product offers expose the merchant fields Google needs for shopping results', () => {
  const returnPolicy = merchantReturnPolicySchema()
  assert.equal(returnPolicy['@type'], 'MerchantReturnPolicy')
  assert.equal(returnPolicy.applicableCountry, 'VN')
  // Đổi trả hữu hạn 3 ngày — phải khớp /chinh-sach-doi-tra.
  assert.equal(
    returnPolicy.returnPolicyCategory,
    'https://schema.org/MerchantReturnFiniteReturnWindow',
  )
  assert.equal(returnPolicy.merchantReturnDays, RETURN_WINDOW_DAYS)
  assert.equal(RETURN_WINDOW_DAYS, 3)

  const shipping = offerShippingDetailsSchema(30_000)
  assert.equal(shipping['@type'], 'OfferShippingDetails')
  assert.equal(shipping.shippingRate.value, 30_000)
  assert.equal(shipping.shippingRate.currency, 'VND')
  assert.equal(shipping.shippingDestination.addressCountry, 'VN')
  assert.equal(shipping.deliveryTime.handlingTime.unitCode, 'DAY')
  assert.ok(
    shipping.deliveryTime.transitTime.maxValue >= shipping.deliveryTime.transitTime.minValue,
  )
})

test('priceValidUntil is one year out and formatted as a plain ISO date', () => {
  const until = priceValidUntil(new Date('2026-07-27T10:00:00.000Z'))
  assert.equal(until, '2027-07-27')
  assert.match(until, /^\d{4}-\d{2}-\d{2}$/)
})

test('about page schema links the story page to the LocalBusiness entity', () => {
  const schema = aboutPageSchema()
  assert.equal(schema['@type'], 'AboutPage')
  assert.equal(schema.about['@id'], 'https://mushroomie.io.vn/#localbusiness')
  assert.equal(schema.isPartOf['@id'], 'https://mushroomie.io.vn/#website')
})

test('publisher and seller resolve to the same brand entity as the homepage', () => {
  // Bài viết và sản phẩm trước đây khai Organization riêng lẻ, không @id, không sameAs —
  // Google và các LLM thấy nhiều thực thể rời rạc thay vì một thương hiệu.
  const ref = brandEntityRef()
  const home = localBusinessSchema()

  assert.equal(ref['@id'], home['@id'], 'publisher không trỏ về cùng entity với trang chủ')
  assert.equal(ref['@id'], 'https://mushroomie.io.vn/#localbusiness')
})

test('the brand entity carries enough identity to stand alone on any page', () => {
  // @id giúp hợp nhất, nhưng crawler chỉ đọc riêng một trang bài viết vẫn phải nhận ra
  // thương hiệu — nên node phải tự mang name/url/logo/sameAs.
  const ref = brandEntityRef()

  assert.equal(ref.name, BRAND.name)
  assert.equal(ref.url, 'https://mushroomie.io.vn')
  assert.equal(ref.logo['@type'], 'ImageObject')
  assert.ok(ref.logo.url.startsWith('https://'))
  assert.ok(Array.isArray(ref.sameAs) && ref.sameAs.length >= 4, 'thiếu liên kết mạng xã hội')
  for (const url of ref.sameAs) assert.match(url, /^https:\/\//)
})

test('related posts spread internal links instead of always pointing at the newest posts', () => {
  const pool = Array.from({ length: 40 }, (_, i) => ({ id: `post-${i}` }))

  // Mỗi bài phải nhận đúng số lượng yêu cầu, không trùng lặp trong cùng một bài.
  for (const post of pool.slice(0, 5)) {
    const picked = pickRelatedPosts(pool, post.id, 6)
    assert.equal(picked.length, 6)
    assert.equal(new Set(picked.map((p) => p.id)).size, 6)
  }

  // Điểm mấu chốt: toàn bộ archive phải được phủ, không chỉ vài bài mới nhất.
  const linked = new Set<string>()
  for (const post of pool) {
    for (const related of pickRelatedPosts(pool, post.id, 6)) linked.add(related.id)
  }
  assert.ok(
    linked.size > pool.length * 0.5,
    `chỉ ${linked.size}/${pool.length} bài nhận được link nội bộ`,
  )
})

test('related post selection is deterministic across renders', () => {
  const pool = Array.from({ length: 20 }, (_, i) => ({ id: i }))
  const first = pickRelatedPosts(pool, 7, 6).map((p) => p.id)
  const second = pickRelatedPosts(pool, 7, 6).map((p) => p.id)
  assert.deepEqual(first, second)
})

test('related post selection degrades gracefully when the pool is small', () => {
  const pool = [{ id: 'a' }, { id: 'b' }]
  assert.deepEqual(pickRelatedPosts(pool, 'a', 6), pool)
  assert.deepEqual(pickRelatedPosts([], 'a', 6), [])
})

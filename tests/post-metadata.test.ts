import assert from 'node:assert/strict'
import test from 'node:test'
import {
  resolvePostMetadataDescription,
  resolvePostMetadataTitle,
} from '../src/lib/post-metadata'

test('uses the configured SEO title as the final absolute title', () => {
  assert.equal(
    resolvePostMetadataTitle('Fallback title', 'Custom SEO title | Mushroomie'),
    'Custom SEO title | Mushroomie',
  )
})

test('adds the brand exactly once when no SEO title is configured', () => {
  assert.equal(
    resolvePostMetadataTitle('Handmade bracelet guide', null),
    'Handmade bracelet guide | Mushroomie',
  )
})

test('adds a brand suffix when it brings a short configured title into range', () => {
  const title = resolvePostMetadataTitle(
    'Fallback title',
    'Vòng tay charm – Cẩm nang chọn mẫu phù hợp',
  )

  assert.equal(title, 'Vòng tay charm – Cẩm nang chọn mẫu phù hợp | Mushroomie')
  assert.equal(title.length >= 50 && title.length <= 60, true)
})

test('trims an overlong configured title at a word boundary', () => {
  const title = resolvePostMetadataTitle(
    'Fallback title',
    'Gợi ý quà tặng handmade Đồng Nai cho sinh nhật và dịp đặc biệt',
  )

  assert.equal(title.length <= 60, true)
  assert.equal(title.endsWith('…'), true)
})

test('fits short and long post descriptions into the requested range', () => {
  const short = resolvePostMetadataDescription(
    'Xu hướng phụ kiện handmade 2026',
    'Khám phá xu hướng phụ kiện handmade mới.',
    null,
  )
  const long = resolvePostMetadataDescription(
    'Vòng tay handmade',
    'M'.repeat(240),
    null,
  )

  for (const description of [short, long]) {
    assert.equal(description.length >= 140 && description.length <= 160, true)
    assert.equal(description.endsWith('.') || description.endsWith('…'), true)
  }
})

test('adds a short semantic qualifier to remaining near-range titles', () => {
  const titles = [
    'Cách làm vòng tay handmade tại nhà | Mushroomie',
    'Xu hướng phụ kiện handmade 2024 | Mushroomie',
    'Phụ kiện handmade nữ – Cẩm nang chọn mẫu phù hợp',
    'Phụ kiện handmade phối đồ – Cách phối màu hài hòa',
    'Vòng tay handmade nữ – Cẩm nang chọn mẫu phù hợp',
    'Vòng tay đôi handmade – Cẩm nang chọn mẫu phù hợp',
  ].map((seoTitle) => resolvePostMetadataTitle('Fallback title', seoTitle))

  for (const title of titles) {
    assert.equal(title.length >= 50 && title.length <= 60, true, `${title.length}: ${title}`)
  }
})

test('bounds branded and fallback titles for future long content', () => {
  const longConfigured = resolvePostMetadataTitle(
    'Fallback title',
    `${'Hướng dẫn vòng tay handmade '.repeat(8)}| Mushroomie`,
  )
  const longFallback = resolvePostMetadataTitle(
    'Bộ sưu tập phụ kiện handmade cá nhân hóa '.repeat(8),
    null,
  )

  assert.equal(longConfigured.length <= 60, true, longConfigured)
  assert.equal(longFallback.length <= 60, true, longFallback)
})

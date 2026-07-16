import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldIncludePostInSitemap } from '../src/lib/sitemap-post-inclusion'

const slug = 'vong-tay-handmade'

test('sitemap excludes published posts that opt out of indexing', () => {
  assert.equal(shouldIncludePostInSitemap({ slug, robotsIndex: false, canonicalUrl: null }), false)
  assert.equal(
    shouldIncludePostInSitemap({
      slug,
      robotsIndex: false,
      canonicalUrl: `https://mushroomie.io.vn/tin-tuc/${slug}`,
    }),
    false,
  )
})

test('sitemap includes posts with blank canonical directives', () => {
  for (const canonicalUrl of [null, '', '   ']) {
    assert.equal(shouldIncludePostInSitemap({ slug, robotsIndex: true, canonicalUrl }), true)
  }
})

test('sitemap includes exact self-canonical post URLs with trailing slash equivalence', () => {
  assert.equal(
    shouldIncludePostInSitemap({
      slug,
      robotsIndex: true,
      canonicalUrl: `https://mushroomie.io.vn/tin-tuc/${slug}`,
    }),
    true,
  )
  assert.equal(
    shouldIncludePostInSitemap({
      slug,
      robotsIndex: true,
      canonicalUrl: `https://mushroomie.io.vn/tin-tuc/${slug}/`,
    }),
    true,
  )
})

test('sitemap excludes posts canonicalized to any different URL', () => {
  const differentCanonicals = [
    'https://mushroomie.io.vn/tin-tuc/bai-viet-khac',
    `http://mushroomie.io.vn/tin-tuc/${slug}`,
    `https://www.mushroomie.io.vn/tin-tuc/${slug}`,
    `https://mushroomie.io.vn/tin-tuc/${slug}?source=canonical`,
    `https://mushroomie.io.vn/tin-tuc/${slug}#noi-dung`,
    `https://mushroomie.io.vn/san-pham/${slug}`,
  ]

  for (const canonicalUrl of differentCanonicals) {
    assert.equal(
      shouldIncludePostInSitemap({ slug, robotsIndex: true, canonicalUrl }),
      false,
      canonicalUrl,
    )
  }
})

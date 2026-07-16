import assert from 'node:assert/strict'
import test from 'node:test'
import {
  auditPostOnPageSeo,
  auditProductOnPageSeo,
  buildOnPageSeoAudit,
} from '../src/lib/on-page-seo-audit'

const siteUrl = 'https://mushroomie.io.vn'

function issueCodes(issues: Array<{ code: string }>) {
  return new Set(issues.map((issue) => issue.code))
}

test('audits malformed post metadata, headings, image alts, and commercial links', () => {
  const result = auditPostOnPageSeo({
    id: 1,
    title: 'Short',
    slug: 'short',
    excerpt: null,
    content: [
      '<h1>Duplicate page heading</h1>',
      '<h2>Materials</h2>',
      '<h4>Skipped heading</h4>',
      '<img src="/uploads/one.webp">',
      '<img src="/uploads/two.webp" alt="vong tay vong tay handmade handmade Mushroomie">',
      '<a href="/san-pham/one">One product</a>',
    ].join(''),
    featured_image: null,
    featured_image_alt: null,
    seo_title: null,
    meta_description: 'Tiny',
    canonical_url: 'https://example.com/wrong',
    robots_index: false,
    robots_follow: true,
  }, siteUrl)

  const codes = issueCodes(result.issues)
  assert.equal(codes.has('title_length'), true)
  assert.equal(codes.has('meta_length'), false)
  assert.equal(result.metrics.metaLength >= 140 && result.metrics.metaLength <= 160, true)
  assert.equal(codes.has('canonical_mismatch'), true)
  assert.equal(codes.has('robots_noindex'), true)
  assert.equal(codes.has('content_h1'), true)
  assert.equal(codes.has('heading_jump'), true)
  assert.equal(codes.has('image_alt_missing'), true)
  assert.equal(codes.has('image_alt_stuffed'), true)
  assert.equal(codes.has('featured_image_missing'), true)
  assert.equal(codes.has('internal_commercial_links'), true)
})

test('accepts a post with a self canonical and two relevant internal links', () => {
  const result = auditPostOnPageSeo({
    id: 2,
    title: 'Article title',
    slug: 'article-title',
    excerpt: null,
    content: [
      '<h2>Materials</h2>',
      '<h3>How to choose</h3>',
      '<img src="/uploads/one.webp" alt="Red beaded bracelet on a cream tray">',
      '<a href="/san-pham/red-bracelet">Red bracelet</a>',
      '<a href="https://mushroomie.io.vn/san-pham?category=vong-tay">Bracelet category</a>',
    ].join(''),
    featured_image: '/uploads/cover.webp',
    featured_image_alt: 'Red bracelet collection',
    seo_title: 'A'.repeat(54),
    meta_description: 'M'.repeat(150),
    canonical_url: null,
    robots_index: true,
    robots_follow: true,
  }, siteUrl)

  const codes = issueCodes(result.issues)
  assert.equal(codes.has('canonical_mismatch'), false)
  assert.equal(codes.has('content_h1'), false)
  assert.equal(codes.has('heading_jump'), false)
  assert.equal(codes.has('image_alt_missing'), false)
  assert.equal(codes.has('image_alt_stuffed'), false)
  assert.equal(codes.has('internal_commercial_links'), false)
})

test('reports duplicate effective titles and descriptions across pages', () => {
  const post = {
    title: 'Post',
    excerpt: null,
    content: '<h2>Details</h2><a href="/san-pham/a">A</a><a href="/san-pham/b">B</a>',
    featured_image: '/uploads/cover.webp',
    featured_image_alt: 'Bracelet cover',
    seo_title: 'T'.repeat(54),
    meta_description: 'D'.repeat(150),
    canonical_url: null,
    robots_index: true,
    robots_follow: true,
  }
  const report = buildOnPageSeoAudit({
    siteUrl,
    generatedAt: '2026-07-16T00:00:00.000Z',
    posts: [
      { ...post, id: 1, slug: 'one' },
      { ...post, id: 2, slug: 'two' },
    ],
    products: [],
  })

  assert.equal(report.summary.duplicateTitleGroups, 1)
  assert.equal(report.summary.duplicateMetaGroups, 1)
  assert.equal(issueCodes(report.posts[0].issues).has('duplicate_title'), true)
  assert.equal(issueCodes(report.posts[1].issues).has('duplicate_meta'), true)
})

test('audits generated alt copy and template product links as rendered', () => {
  const report = buildOnPageSeoAudit({
    siteUrl,
    generatedAt: '2026-07-16T00:00:00.000Z',
    postTemplateCommercialLinkCount: 2,
    posts: [{
      id: 3,
      title: 'Post',
      slug: 'rendered-post',
      content: '<h2>Details</h2><img src="/uploads/one.webp" alt="vòng tay handmade - phụ kiện handmade cá nhân hóa Mushroomie">',
      featured_image: '/uploads/cover.webp',
      featured_image_alt: 'Bracelet cover',
      seo_title: 'T'.repeat(54),
      meta_description: 'D'.repeat(150),
      canonical_url: null,
      robots_index: true,
      robots_follow: true,
    }],
    products: [],
  })

  const codes = issueCodes(report.posts[0].issues)
  assert.equal(codes.has('image_alt_stuffed'), false)
  assert.equal(codes.has('internal_commercial_links'), false)
})

test('audits product slug, description headings, and gallery alt text', () => {
  const result = auditProductOnPageSeo({
    id: 7,
    name: 'N'.repeat(45),
    slug: 'Vong-tay-qu\u1ea3-t\u00e1o',
    short_description: 'S'.repeat(150),
    description: '<h1>Duplicate title</h1><h3>Details</h3>',
    featured_image: '/uploads/product.webp',
    images: [{ image_url: '/uploads/product-detail.webp', alt_text: null }],
  }, siteUrl)

  const codes = issueCodes(result.issues)
  assert.equal(codes.has('slug_not_normalized'), true)
  assert.equal(codes.has('content_h1'), true)
  assert.equal(codes.has('heading_jump'), true)
  assert.equal(codes.has('image_alt_missing'), true)
})

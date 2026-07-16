import assert from 'node:assert/strict'
import test from 'node:test'

import { geoImageGraph, geoImageObject } from '../src/lib/geo-image-schema'
import {
  buildArticleFigureHtml,
  createArticleFigures,
  extractImageSources,
  insertArticleFigures,
  normalizeArticleFigures,
  planArticleMediaNormalization,
  postNeedsArticleMediaWork,
  type ArticleFigure,
} from '../src/lib/post-media'

const figures: ArticleFigure[] = [
  {
    slot: 'content-1',
    src: '/uploads/one.webp',
    alt: 'Ảnh một',
    caption: 'Chú thích một',
  },
  {
    slot: 'content-2',
    src: '/uploads/two.webp',
    alt: 'Ảnh hai',
    caption: 'Chú thích hai',
  },
]

test('extractImageSources returns normalized unique source order', () => {
  const html = [
    '<img src="/uploads/one.webp" alt="">',
    '<p>Text</p>',
    "<img loading='lazy' src='/uploads/two.webp'>",
    '<img src="/uploads/one.webp">',
  ].join('')

  assert.deepEqual(extractImageSources(html), [
    '/uploads/one.webp',
    '/uploads/two.webp',
  ])
})

test('insertArticleFigures places the two slots after the first two H2 sections', () => {
  const html = '<p>Mở bài</p><h2>Phần một</h2><p>A</p><h2>Phần hai</h2><p>B</p>'
  const result = insertArticleFigures(html, figures)

  assert.ok(result.indexOf('content-1') > result.indexOf('Phần một'))
  assert.ok(result.indexOf('content-1') < result.indexOf('Phần hai'))
  assert.ok(result.indexOf('content-2') > result.indexOf('Phần hai'))
  assert.deepEqual(extractImageSources(result), [
    '/uploads/one.webp',
    '/uploads/two.webp',
  ])
})

test('insertArticleFigures is idempotent and escapes metadata', () => {
  const unsafeFigures: ArticleFigure[] = [{
    ...figures[0],
    alt: 'Charm "đỏ" <mẫu>',
  }]
  const once = insertArticleFigures('<p>Nội dung</p>', unsafeFigures)
  const twice = insertArticleFigures(once, unsafeFigures)

  assert.equal(once, twice)
  assert.match(once, /alt="Charm &quot;đỏ&quot; &lt;mẫu&gt;"/)
})

test('buildArticleFigureHtml serializes supplied natural dimensions without a fallback size', () => {
  const html = buildArticleFigureHtml({
    ...figures[0],
    width: 1200,
    height: 675,
  })

  assert.match(html, /width="1200"/)
  assert.match(html, /height="675"/)
  assert.doesNotMatch(html, /width="960"/)
})

test('createArticleFigures preserves dimensions from reused square media', () => {
  const [figure] = createArticleFigures(
    [{ src: '/uploads/reused.webp', width: 1024, height: 1024 }],
    [{ alt: 'Ảnh tái sử dụng', caption: 'Chú thích ảnh tái sử dụng' }],
  )

  assert.equal(figure.src, '/uploads/reused.webp')
  assert.equal(figure.width, 1024)
  assert.equal(figure.height, 1024)
})

test('normalization-only article plan replaces a production-like three-figure fixture with two slots', () => {
  const html = [
    '<p>Mở bài</p><h2>Phần một</h2>',
    '<figure><img src="/uploads/wide.webp" width="1920" height="960"><figcaption>Ảnh rộng cũ</figcaption></figure>',
    '<p>Nội dung</p><h2>Phần hai</h2>',
    '<figure class="mushroomie-article-media" data-mushroomie-media-slot="content-1"><img src="/uploads/square-one.webp" width="960" height="960"></figure>',
    '<figure class="mushroomie-article-media" data-mushroomie-media-slot="content-2"><img src="/uploads/square-two.webp" width="960" height="960"></figure>',
  ].join('')
  const plan = planArticleMediaNormalization('vong-tay-handmade', html)
  const reusedFigures = createArticleFigures(
    [
      { src: '/uploads/square-one.webp', width: 960, height: 960 },
      { src: '/uploads/square-two.webp', width: 960, height: 960 },
    ],
    [
      { alt: 'Ảnh vuông một', caption: 'Chú thích một' },
      { alt: 'Ảnh vuông hai', caption: 'Chú thích hai' },
    ],
  )
  const normalized = normalizeArticleFigures(html, reusedFigures)

  assert.deepEqual(plan, {
    normalizationNeeded: true,
    oldFigureCount: 3,
    newFigureCount: 2,
  })
  assert.equal(postNeedsArticleMediaWork(0, plan.normalizationNeeded), true)
  assert.equal(normalized.oldFigureCount, 3)
  assert.equal(normalized.newFigureCount, 2)
  assert.deepEqual(extractImageSources(normalized.html), [
    '/uploads/square-one.webp',
    '/uploads/square-two.webp',
  ])
  assert.doesNotMatch(normalized.html, /wide\.webp/)
  assert.match(normalized.html, /data-mushroomie-media-slot="content-1"/)
  assert.match(normalized.html, /data-mushroomie-media-slot="content-2"/)
  assert.equal(planArticleMediaNormalization('vong-tay-handmade', normalized.html).normalizationNeeded, false)
})

test('article normalization preserves figures that do not contain managed images', () => {
  const html = [
    '<figure class="customer-quote"><blockquote>Made with care</blockquote><figcaption>Customer note</figcaption></figure>',
    '<figure><img src="/uploads/old.webp"><figcaption>Old image</figcaption></figure>',
  ].join('')
  const normalized = normalizeArticleFigures(html, figures)

  assert.equal(normalized.oldFigureCount, 1)
  assert.equal(normalized.newFigureCount, 2)
  assert.match(normalized.html, /class="customer-quote"/)
  assert.match(normalized.html, /Made with care/)
  assert.doesNotMatch(normalized.html, /old\.webp/)
})

test('geo image schema links media to the public Mushroomie store location', () => {
  const image = geoImageObject('https://mushroomie.io.vn/uploads/example.webp', {
    name: 'Vòng tay handmade',
    width: 1200,
    height: 675,
  })

  assert.equal(image.contentLocation.geo.latitude, 10.996333)
  assert.equal(image.contentLocation.geo.longitude, 106.882306)
  assert.equal(image.contentLocation.address.addressCountry, 'VN')

  const graph = geoImageGraph([
    { url: image.url, name: 'Ảnh 1' },
    { url: image.url, name: 'Ảnh trùng' },
  ])
  assert.equal(graph['@graph'].length, 1)
})

import assert from 'node:assert/strict'
import test from 'node:test'

import { geoImageGraph, geoImageObject } from '../src/lib/geo-image-schema'
import {
  buildArticleFigureHtml,
  extractImageSources,
  insertArticleFigures,
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

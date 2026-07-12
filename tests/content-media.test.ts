import assert from 'node:assert/strict'
import test from 'node:test'
import { getImageFallback, normalizeImageUrl, normalizeStoredImagePath } from '../src/lib/image-url'
import {
  calculateReadingTime,
  calculateWordCount,
  normalizeArticleImages,
  sanitizeHtml,
} from '../src/lib/sanitize'
import {
  buildPostContentMetrics,
  extractTagNames,
  normalizeOptionalPostImage,
  normalizeStoredPostImage,
  serializeStringArray,
} from '../src/lib/post-normalization'
import { isValidPostStatus, makeExcerpt, restoreData, trashData } from '../src/lib/post-workflow'

test('image paths normalize legacy, local and production upload formats', () => {
  assert.equal(normalizeStoredImagePath('/public/uploads/a.webp'), '/uploads/a.webp')
  assert.equal(normalizeStoredImagePath('public/uploads/a.webp'), '/uploads/a.webp')
  assert.equal(normalizeStoredImagePath('uploads/a.webp'), '/uploads/a.webp')
  assert.equal(normalizeStoredImagePath('a.webp'), '/uploads/a.webp')
  assert.equal(normalizeStoredImagePath('http://localhost:3001/uploads/a.webp'), '/uploads/a.webp')
  assert.equal(normalizeStoredImagePath('https://mushroomie.io.vn/uploads/a.webp'), '/uploads/a.webp')
  assert.equal(normalizeStoredImagePath('https://cdn.example.com/a.webp'), 'https://cdn.example.com/a.webp')
  assert.equal(normalizeStoredImagePath('null'), '')
  assert.equal(normalizeImageUrl('/var/www/private/a.webp', 'post'), getImageFallback('post'))
  assert.equal(normalizeImageUrl('/wp-content/uploads/a.webp', 'post'), getImageFallback('post'))
})

test('article HTML sanitizer removes executable content but keeps safe markup', () => {
  const sanitized = sanitizeHtml('<p>Hello <a href="https://example.com" target="_blank">link</a></p><img src="/uploads/a.webp" onerror="alert(1)"><script>alert(1)</script><iframe src="https://evil.example"></iframe>')
  assert.match(sanitized, /<p>/)
  assert.match(sanitized, /target="_blank"/)
  assert.match(sanitized, /<img/)
  assert.doesNotMatch(sanitized, /onerror|script|iframe/i)
})

test('article image normalization supports storage and render modes', () => {
  const html = '<p><img src="public/uploads/a.webp"><img src="missing-name.webp"></p>'
  assert.equal(normalizeArticleImages(html, 'storage'), '<p><img src="/uploads/a.webp"><img src="/uploads/missing-name.webp"></p>')
  assert.equal(normalizeArticleImages('', 'render'), '')
})

test('post content metrics, tags and optional images have stable shapes', () => {
  const content = `<p>${Array.from({ length: 201 }, () => 'word').join(' ')}</p>`
  const metrics = buildPostContentMetrics(content)
  assert.equal(metrics.wordCount, 201)
  assert.equal(metrics.readingTime, 2)
  assert.equal(calculateWordCount('<p>one two three</p>'), 3)
  assert.equal(calculateReadingTime(''), 1)

  assert.deepEqual(extractTagNames([' handmade ', { name: 'custom' }, { tag: { name: 'gift' } }, null]), ['handmade', 'custom', 'gift'])
  assert.deepEqual(extractTagNames('not-array'), [])
  assert.equal(serializeStringArray([' one ', '', 'two']), '["one","two"]')
  assert.equal(serializeStringArray([]), null)
  assert.equal(normalizeStoredPostImage('a.webp'), '/uploads/a.webp')
  assert.equal(normalizeOptionalPostImage('  '), null)
})

test('post workflow validates statuses, excerpts, trash and restore transitions', () => {
  assert.equal(isValidPostStatus('published'), true)
  assert.equal(isValidPostStatus('unknown'), false)
  assert.equal(makeExcerpt('<p>Hello &amp; welcome</p>', null), 'Hello & welcome')
  assert.equal(makeExcerpt('<p>ignored</p>', ' Existing excerpt '), 'Existing excerpt')
  assert.equal(makeExcerpt('', null), null)

  const longExcerpt = makeExcerpt(`<p>${'word '.repeat(60)}</p>`, null)
  assert.ok(longExcerpt)
  assert.ok(longExcerpt.length <= 181)

  const trashed = trashData('published')
  assert.equal(trashed.status, 'trash')
  assert.equal(trashed.status_before_trash, 'published')
  assert.ok(trashed.deleted_at instanceof Date)

  assert.deepEqual(restoreData({ status_before_trash: 'published', published_at: new Date() }), {
    status: 'published', deleted_at: null, status_before_trash: null,
  })
  assert.deepEqual(restoreData({ status_before_trash: 'scheduled', published_at: new Date(Date.now() - 1_000) }), {
    status: 'draft', deleted_at: null, status_before_trash: null,
  })
  assert.deepEqual(restoreData({ status_before_trash: 'trash', published_at: null }), {
    status: 'draft', deleted_at: null, status_before_trash: null,
  })
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { matchImagesForRow, parseCsv, rewriteContentImages } from '../src/lib/bulk-import'
import { clampImageLimit, normalizeWordPressStatus } from '../src/lib/wordpress-auto-poster'

test('CSV parser preserves quoted commas, newlines and escaped quotes', () => {
  assert.deepEqual(parseCsv('title,content\r\n"Hello, world","Line 1\nLine 2"\r\n"Quote","He said ""Hi"""'), [
    ['title', 'content'],
    ['Hello, world', 'Line 1\nLine 2'],
    ['Quote', 'He said "Hi"'],
  ])
})

test('bulk image matching is case-insensitive and sorts content images numerically', () => {
  assert.deepEqual(matchImagesForRow('POST01', [
    'post01_10.webp',
    'POST01_bg.jpg',
    'post01_2.png',
    'other_bg.jpg',
  ]), {
    featured: 'POST01_bg.jpg',
    content: ['post01_2.png', 'post01_10.webp'],
  })
})

test('content image rewriting replaces exact filenames without touching unrelated sources', () => {
  const html = '<img src="images/post01_1.jpg"><img src="post01_10.jpg"><img src="other.jpg">'
  const rewritten = rewriteContentImages(html, new Map([
    ['post01_1.jpg', '/uploads/one.webp'],
    ['post01_10.jpg', '/uploads/ten.webp'],
  ]))
  assert.equal(rewritten, '<img src="/uploads/one.webp"><img src="/uploads/ten.webp"><img src="other.jpg">')
})

test('WordPress status and image limits fail to safe defaults', () => {
  assert.equal(normalizeWordPressStatus('PUBLISH'), 'publish')
  assert.equal(normalizeWordPressStatus('invalid'), 'draft')
  assert.equal(clampImageLimit(Number.NaN), 2)
  assert.equal(clampImageLimit(-1), 0)
  assert.equal(clampImageLimit(999), 6)
})

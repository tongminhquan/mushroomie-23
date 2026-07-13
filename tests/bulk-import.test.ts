import assert from 'node:assert/strict'
import test from 'node:test'
import ExcelJS from 'exceljs'
import {
  matchImagesForRow,
  normalizePostCanonicalUrl,
  parseBulkImportFile,
  parseCsv,
  rewriteContentImages,
} from '../src/lib/bulk-import'
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

test('bulk import maps SEO fields and Vietnamese boolean values', async () => {
  const csv = [
    'title,content,slug,seo_title,focus_keyword,secondary_keywords,canonical_url,robots_index,robots_follow,featured_image_alt',
    'Vòng tay handmade,<p>Nội dung hữu ích</p>,vong-tay-handmade,Vòng tay handmade Đồng Nai,vòng tay handmade,"vòng tay custom, charm",/tin-tuc/vong-tay-handmade,có,không,Ảnh vòng tay handmade',
  ].join('\n')

  const parsed = await parseBulkImportFile(Buffer.from(csv), 'posts.csv', [])
  const row = parsed.rows[0]

  assert.deepEqual(parsed.errors, [])
  assert.ok(row)
  assert.equal(row.seo_title, 'Vòng tay handmade Đồng Nai')
  assert.equal(row.focus_keyword, 'vòng tay handmade')
  assert.equal(row.secondary_keywords, 'vòng tay custom, charm')
  assert.equal(row.canonical_url, 'https://mushroomie.io.vn/tin-tuc/vong-tay-handmade')
  assert.equal(row.robots_index, true)
  assert.equal(row.robots_follow, false)
  assert.equal(row.featured_image_alt, 'Ảnh vòng tay handmade')
})

test('canonical URL is restricted to the Mushroomie origin', () => {
  assert.equal(
    normalizePostCanonicalUrl('https://example.com/fake', 'vong-tay-handmade'),
    'https://mushroomie.io.vn/tin-tuc/vong-tay-handmade',
  )
})

test('bulk import prefers the Import_60_Bai worksheet in a multi-sheet workbook', async () => {
  const workbook = new ExcelJS.Workbook()
  const overview = workbook.addWorksheet('Tong quan')
  overview.addRow(['Huong dan', 'Khong phai du lieu nhap'])

  const importSheet = workbook.addWorksheet('Import_60_Bai')
  importSheet.addRow(['title', 'content', 'slug', 'status'])
  importSheet.addRow(['Vong tay handmade', '<p>Noi dung huu ich</p>', 'vong-tay-handmade', 'draft'])

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const parsed = await parseBulkImportFile(buffer, 'posts.xlsx', [])

  assert.deepEqual(parsed.errors, [])
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0]?.slug, 'vong-tay-handmade')
})

test('WordPress status and image limits fail to safe defaults', () => {
  assert.equal(normalizeWordPressStatus('PUBLISH'), 'publish')
  assert.equal(normalizeWordPressStatus('invalid'), 'draft')
  assert.equal(clampImageLimit(Number.NaN), 2)
  assert.equal(clampImageLimit(-1), 0)
  assert.equal(clampImageLimit(999), 6)
})

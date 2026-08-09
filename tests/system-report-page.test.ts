import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const ROOT = path.resolve(__dirname, '..')
const PAGE_PATH = path.join(ROOT, 'src/app/(user)/bao-cao-he-thong/page.tsx')
const STYLES_PATH = path.join(ROOT, 'src/app/(user)/bao-cao-he-thong/report.module.css')
const README_PATH = path.join(ROOT, 'README.md')

function readSource(filePath: string) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

test('system report route presents the verified project architecture', () => {
  const page = readSource(PAGE_PATH)

  assert.ok(page, 'Trang /bao-cao-he-thong chưa được tạo')
  assert.match(page, /Báo cáo hệ thống Mushroomie/)
  assert.match(page, /77 route nghiệp vụ/)
  assert.match(page, /78 page route/)
  assert.match(page, /73 API route/)
  assert.match(page, /29 Prisma model/)
  assert.match(page, /VietQR \+ Casso/)
  assert.match(page, /VietQR \+ SePay/)
  assert.match(page, /PayOS/)
  assert.match(page, /id="kien-truc"/)
  assert.match(page, /id="phan-he"/)
  assert.match(page, /id="co-so-du-lieu"/)
  assert.match(page, /id="bao-mat"/)
  assert.match(page, /id="van-hanh"/)
  assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/)
  assert.doesNotMatch(page, /^['"]use client['"]/m)
  assert.doesNotMatch(page, /103\.173\.226\.86/)
})

test('system report has responsive and printable presentation styles', () => {
  const styles = readSource(STYLES_PATH)

  assert.ok(styles, 'CSS module của trang báo cáo chưa được tạo')
  assert.match(styles, /@media\s*\(max-width:\s*\d+px\)/)
  assert.match(styles, /@media\s+print/)
  assert.match(styles, /@page\s*\{/)
  assert.match(styles, /scroll-margin-top/)
  assert.match(styles, /overflow-x:\s*auto/)
  assert.match(styles, /break-inside:\s*avoid/)
})

test('README links to the public system report and documents production accurately', () => {
  const readme = readSource(README_PATH)

  assert.match(readme, /https:\/\/mushroomie\.io\.vn\/bao-cao-he-thong/)
  assert.match(readme, /Next\.js 16\.2\.11/)
  assert.match(readme, /React 19\.2\.4/)
  assert.match(readme, /VietQR \+ Casso/)
  assert.match(readme, /PM2/)
  assert.match(readme, /Nginx/)
  assert.match(readme, /Cloudflare/)
  assert.doesNotMatch(readme, /103\.173\.226\.86/)
  assert.doesNotMatch(readme, /Admin@123|User@123/)
})

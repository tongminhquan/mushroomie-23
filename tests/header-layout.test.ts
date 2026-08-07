import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const ROOT = path.resolve(__dirname, '..')
const HEADER = fs.readFileSync(path.join(ROOT, 'src/components/layout/Header.tsx'), 'utf8')
const COMPACT_HEADER_PATH = path.join(ROOT, 'src/components/layout/CompactHeader.tsx')
const COMPACT_HEADER = fs.existsSync(COMPACT_HEADER_PATH)
  ? fs.readFileSync(COMPACT_HEADER_PATH, 'utf8')
  : ''

test('desktop header rows do not overlap while the page starts scrolling', () => {
  assert.doesNotMatch(
    HEADER,
    /className="[^"]*\bsticky\b[^"]*\btop-0\b[^"]*"[\s\S]*?<div className="brand-container flex h-\[74px\]/,
  )
})

test('a dedicated compact header appears after the full header leaves the viewport', () => {
  assert.match(HEADER, /import dynamic from 'next\/dynamic'/)
  assert.match(
    HEADER,
    /const CompactHeader = dynamic\(\(\) => import\('@\/components\/layout\/CompactHeader'\)/,
  )
  assert.doesNotMatch(HEADER, /import CompactHeader from '@\/components\/layout\/CompactHeader'/)
  assert.match(HEADER, /new IntersectionObserver/)
  assert.match(HEADER, /compactSentinelRef/)
  assert.match(HEADER, /compactMounted/)
  assert.match(HEADER, /\{compactMounted && \(/)
  assert.match(HEADER, /<CompactHeader/)
})

test('compact header keeps all primary navigation actions available', () => {
  assert.ok(COMPACT_HEADER, 'CompactHeader.tsx chưa được tạo')

  for (const expected of [
    'Mushroomie - Trang chủ',
    'Danh mục',
    'Tìm sản phẩm',
    'Tài khoản',
    'ThemeToggle',
    'Giỏ hàng',
  ]) {
    assert.ok(COMPACT_HEADER.includes(expected), `compact header thiếu ${expected}`)
  }

  assert.match(COMPACT_HEADER, /inert=\{!visible/)
  assert.match(COMPACT_HEADER, /translate-y-0 opacity-100/)
  assert.match(COMPACT_HEADER, /-translate-y-full/)
  assert.doesNotMatch(COMPACT_HEADER, /transition-all/)
})

test('mobile header exposes the light and dark theme toggle without opening the drawer', () => {
  assert.match(HEADER, /<ThemeToggle variant="icon" \/>/)
  assert.doesNotMatch(HEADER, /<ThemeToggle variant="icon" className="hidden md:grid"/)
})

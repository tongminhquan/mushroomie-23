import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PRIORITY_LOCAL_KEYWORD_OWNERS,
  getPriorityLocalHomeCards,
  getPriorityLocalLinks,
} from '../src/lib/priority-local-keywords'
import {
  PUBLISHED_LOCAL_SLUGS,
  getLocalPage,
  getLocalSeoLastModified,
  localServiceSchema,
} from '../src/lib/local-seo'
import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'

const EXPECTED_OWNERS = new Map([
  ['vòng tay handmade Đồng Nai', '/vong-tay-handmade-dong-nai'],
  ['vòng tay custom Biên Hòa', '/vong-tay-custom-bien-hoa'],
  ['móc khóa handmade Đồng Nai', '/moc-khoa-handmade-dong-nai'],
  ['quà tặng handmade Đồng Nai', '/qua-tang-handmade-dong-nai'],
])

test('bốn owner local ưu tiên là UI subset của canonical B30 registry', () => {
  assert.equal(PRIORITY_LOCAL_KEYWORD_OWNERS.length, 4)
  for (const featured of PRIORITY_LOCAL_KEYWORD_OWNERS) {
    const canonical = LOCAL_B30_TARGETS.find((target) => target.query === featured.keyword)
    assert.ok(canonical, `${featured.keyword} thiếu canonical B30 target`)
    assert.equal(canonical.ownerHref, featured.href)
  }

  const actualOwners = new Map(
    PRIORITY_LOCAL_KEYWORD_OWNERS.map((owner) => [owner.keyword, owner.href]),
  )

  assert.deepEqual(actualOwners, EXPECTED_OWNERS)
  assert.equal(new Set(actualOwners.keys()).size, 4)
  assert.equal(new Set(actualOwners.values()).size, 4)
})

test('mọi owner URL đều là landing đã xuất bản và tự mô tả đúng ý định', () => {
  const published = new Set<string>(PUBLISHED_LOCAL_SLUGS)

  for (const owner of PRIORITY_LOCAL_KEYWORD_OWNERS) {
    assert.ok(published.has(owner.slug), `${owner.slug} chưa được xuất bản`)
    assert.ok(
      existsSync(resolve(process.cwd(), 'src', 'app', '(user)', owner.slug, 'page.tsx')),
      `${owner.slug} thiếu route`,
    )

    const page = getLocalPage(owner.slug)
    assert.ok(page, `${owner.slug} thiếu cấu hình local SEO`)
    assert.ok(
      page.seoTitle.toLocaleLowerCase('vi').includes(owner.keyword.toLocaleLowerCase('vi')),
      `${owner.slug} có title lệch từ khóa owner`,
    )
    assert.equal(localServiceSchema(page).url, `https://mushroomie.io.vn${owner.href}`)
    assert.equal(getLocalSeoLastModified(owner.slug).toISOString(), '2026-08-12T00:00:00.000Z')

    const routeSource = readFileSync(
      resolve(process.cwd(), 'src', 'app', '(user)', owner.slug, 'page.tsx'),
      'utf8',
    )
    assert.match(routeSource, /alternates:\s*\{\s*canonical:\s*url\s*\}/)
  }
})

test('helper cung cấp đủ bốn owner với anchor khác nhau theo ngữ cảnh', () => {
  const homeCards = getPriorityLocalHomeCards()
  const contactLinks = getPriorityLocalLinks('contact')
  const footerLinks = getPriorityLocalLinks('footer')

  assert.equal(homeCards.length, 4)
  assert.equal(contactLinks.length, 4)
  assert.equal(footerLinks.length, 4)
  assert.deepEqual(
    new Set(homeCards.map((link) => link.href)),
    new Set(EXPECTED_OWNERS.values()),
  )
  assert.deepEqual(
    new Set(contactLinks.map((link) => link.href)),
    new Set(EXPECTED_OWNERS.values()),
  )
  assert.deepEqual(
    new Set(footerLinks.map((link) => link.href)),
    new Set(EXPECTED_OWNERS.values()),
  )

  for (const owner of PRIORITY_LOCAL_KEYWORD_OWNERS) {
    assert.notEqual(owner.home.label, owner.contactLabel)
    assert.notEqual(owner.contactLabel, owner.footerLabel)
  }
})

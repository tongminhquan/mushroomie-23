import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ContactPage from '../src/app/(user)/lien-he/page'
import HomeLocalAreas from '../src/components/home/landing/HomeLocalAreas'
import Footer from '../src/components/layout/Footer'
import LocalLandingPage from '../src/components/local/LocalLandingPage'
import { PUBLISHED_LOCAL_PAGES } from '../src/lib/local-seo'
import { LOCAL_AREA_HUBS, getLocalHubMemberLinks } from '../src/lib/local-seo-link-graph'

const OWNER_HREFS = [
  '/vong-tay-handmade-dong-nai',
  '/vong-tay-custom-bien-hoa',
  '/moc-khoa-handmade-dong-nai',
  '/qua-tang-handmade-dong-nai',
]

const HUB_HREFS = [
  '/phu-kien-handmade-dong-nai',
  '/phu-kien-handmade-trang-dai',
  '/phu-kien-handmade-bien-hoa',
  '/phu-kien-handmade-tphcm',
]

const HOME_LINKS = [
  { href: HUB_HREFS[0], label: 'Phụ kiện handmade Đồng Nai' },
  { href: HUB_HREFS[1], label: 'Phụ kiện handmade Trảng Dài' },
  { href: HUB_HREFS[2], label: 'Phụ kiện handmade Biên Hòa' },
  { href: HUB_HREFS[3], label: 'Phụ kiện handmade giao TP.HCM' },
  { href: OWNER_HREFS[0], label: 'Vòng tay làm thủ công tại Đồng Nai' },
  { href: OWNER_HREFS[1], label: 'Vòng tay custom gần Biên Hòa' },
  { href: OWNER_HREFS[2], label: 'Móc khóa thủ công tại Đồng Nai' },
  { href: OWNER_HREFS[3], label: 'Quà handmade gửi tại Đồng Nai' },
]

const CONTACT_LINKS = [
  { href: HUB_HREFS[0], label: 'Khám phá phụ kiện handmade phục vụ Đồng Nai' },
  { href: HUB_HREFS[1], label: 'Xem phụ kiện handmade tại Trảng Dài' },
  { href: HUB_HREFS[2], label: 'Khám phá phụ kiện handmade giao Biên Hòa' },
  { href: HUB_HREFS[3], label: 'Đặt phụ kiện handmade giao online đến TP.HCM' },
  { href: OWNER_HREFS[0], label: 'Xem vòng tay handmade tại Đồng Nai' },
  { href: OWNER_HREFS[1], label: 'Đặt vòng tay custom gần Biên Hòa' },
  { href: OWNER_HREFS[2], label: 'Chọn móc khóa handmade tại Đồng Nai' },
  { href: OWNER_HREFS[3], label: 'Gợi ý quà handmade giao tại Đồng Nai' },
]

const LOCAL_DIRECTORY_HREFS = PUBLISHED_LOCAL_PAGES.map((page) => `/${page.slug}`)

function textContent(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#x27;', "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function getAnchorData(markup: string) {
  return Array.from(markup.matchAll(/<a\s+([^>]+)>([\s\S]*?)<\/a>/g), (match) => {
    const attributes = match[1]
    const content = match[2]
    const heading = content.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]
    return {
      href: attributes.match(/href="([^"]+)"/)?.[1] ?? '',
      className: attributes.match(/class="([^"]+)"/)?.[1] ?? '',
      label: textContent(heading ?? content),
    }
  })
}

test('trang chu render dung thu tu hub va bon owner local uu tien', () => {
  const anchors = getAnchorData(renderToStaticMarkup(createElement(HomeLocalAreas)))
  const localAnchors = anchors.filter((anchor) => LOCAL_DIRECTORY_HREFS.includes(anchor.href))

  assert.deepEqual(localAnchors.map(({ href, label }) => ({ href, label })), HOME_LINKS)
  assert.equal(new Set(localAnchors.map((anchor) => anchor.href)).size, 8)
  assert.ok(!anchors.some((anchor) => anchor.href === '/vong-tay-custom-dong-nai'))
})

test('trang lien he render bon hub va bon owner voi tap target 44px', () => {
  const anchors = getAnchorData(renderToStaticMarkup(createElement(ContactPage)))
  const localAnchors = anchors.filter((anchor) => LOCAL_DIRECTORY_HREFS.includes(anchor.href))

  assert.deepEqual(localAnchors.map(({ href, label }) => ({ href, label })), CONTACT_LINKS)
  assert.ok(localAnchors.every((anchor) => anchor.className.includes('min-h-11')))
})

test('footer khong render nhom lien ket local SEO uu tien', () => {
  const anchors = getAnchorData(renderToStaticMarkup(createElement(Footer, { categories: [] })))

  assert.ok(!anchors.some((anchor) => LOCAL_DIRECTORY_HREFS.includes(anchor.href)))
})

test('moi hub render dung mot link co nhan rieng cho tung member', () => {
  for (const hub of LOCAL_AREA_HUBS) {
    const page = PUBLISHED_LOCAL_PAGES.find((candidate) => candidate.slug === hub.slug)
    assert.ok(page)
    const members = getLocalHubMemberLinks(hub.slug)
    const memberHrefs = members.map((member) => member.href)
    const anchors = getAnchorData(renderToStaticMarkup(createElement(LocalLandingPage, { page })))
      .filter((anchor) => memberHrefs.includes(anchor.href as `/${string}`))

    assert.deepEqual(
      anchors.map(({ href, label }) => ({ href, label })),
      members.map(({ href, label }) => ({ href, label })),
    )
    assert.ok(anchors.every((anchor) => anchor.className.includes('min-h-11')))
  }
})

test('cac danh sach local Link tat eager prefetch trong source', () => {
  const sources = {
    home: readFileSync(resolve(process.cwd(), 'src/components/home/landing/HomeLocalAreas.tsx'), 'utf8'),
    contact: readFileSync(resolve(process.cwd(), 'src/app/(user)/lien-he/page.tsx'), 'utf8'),
    landing: readFileSync(resolve(process.cwd(), 'src/components/local/LocalLandingPage.tsx'), 'utf8'),
  }

  assert.match(sources.home, /href=\{a\.href\}[\s\S]{0,100}prefetch=\{false\}/)
  assert.match(sources.contact, /href=\{l\.href\}[\s\S]{0,100}prefetch=\{false\}/)
  assert.match(sources.landing, /href=\{member\.href\}[\s\S]{0,100}prefetch=\{false\}/)
  assert.match(sources.landing, /href=\{r\.href\}[\s\S]{0,100}prefetch=\{false\}/)
})

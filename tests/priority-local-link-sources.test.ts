import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ContactPage from '../src/app/(user)/lien-he/page'
import HomeLocalAreas from '../src/components/home/landing/HomeLocalAreas'
import Footer from '../src/components/layout/Footer'

const OWNER_HREFS = [
  '/vong-tay-handmade-dong-nai',
  '/vong-tay-custom-bien-hoa',
  '/moc-khoa-handmade-dong-nai',
  '/qua-tang-handmade-dong-nai',
]

function getAnchorData(markup: string) {
  return Array.from(markup.matchAll(/<a\s+([^>]+)>/g), (match) => {
    const attributes = match[1]
    return {
      href: attributes.match(/href="([^"]+)"/)?.[1] ?? '',
      className: attributes.match(/class="([^"]+)"/)?.[1] ?? '',
    }
  })
}

test('trang chu render dung thu tu hub va bon owner local uu tien', () => {
  const anchors = getAnchorData(renderToStaticMarkup(createElement(HomeLocalAreas)))

  assert.deepEqual(
    anchors.map((anchor) => anchor.href),
    [
      '/phu-kien-handmade-dong-nai',
      ...OWNER_HREFS,
      '/phu-kien-handmade-bien-hoa',
    ],
  )
  assert.equal(new Set(anchors.map((anchor) => anchor.href)).size, 6)
  assert.ok(!anchors.some((anchor) => anchor.href === '/vong-tay-custom-dong-nai'))
})

test('trang lien he render du bon owner voi tap target 44px', () => {
  const anchors = getAnchorData(renderToStaticMarkup(createElement(ContactPage)))
  const ownerAnchors = anchors.filter((anchor) => OWNER_HREFS.includes(anchor.href))

  assert.deepEqual(ownerAnchors.map((anchor) => anchor.href), OWNER_HREFS)
  assert.ok(ownerAnchors.every((anchor) => anchor.className.includes('min-h-11')))
})

test('footer khong render nhom lien ket local SEO uu tien', () => {
  const anchors = getAnchorData(renderToStaticMarkup(createElement(Footer, { categories: [] })))
  const localFooterHrefs = ['/phu-kien-handmade-dong-nai', ...OWNER_HREFS]

  assert.ok(!anchors.some((anchor) => localFooterHrefs.includes(anchor.href)))
})

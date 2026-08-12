import assert from 'node:assert/strict'
import test from 'node:test'
import { PUBLISHED_LOCAL_PAGES } from '../src/lib/local-seo'
import {
  LOCAL_AREA_HUBS,
  getLocalDiscoveryLinks,
  getLocalHubForPage,
  getLocalHubMemberLinks,
} from '../src/lib/local-seo-link-graph'
import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'

const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi')

function getEmittedLinks(sourceSlug: string) {
  return [...getLocalHubMemberLinks(sourceSlug), ...getLocalDiscoveryLinks(sourceSlug)]
}

test('published graph is exactly the 23 canonical B30 primary owners', () => {
  const published = PUBLISHED_LOCAL_PAGES.map((page) => page.slug).sort()
  const owners = LOCAL_B30_TARGETS
    .filter((target) => target.role === 'primary')
    .map((target) => target.ownerSlug)
    .sort()

  assert.equal(PUBLISHED_LOCAL_PAGES.length, 23)
  assert.equal(new Set(owners).size, 23)
  assert.deepEqual(published, owners)
})

test('every owner receives at least three distinct contextual landing links', () => {
  const incoming = new Map(PUBLISHED_LOCAL_PAGES.map((page) => [page.slug, new Set<string>()]))

  for (const source of PUBLISHED_LOCAL_PAGES) {
    for (const link of getEmittedLinks(source.slug)) {
      incoming.get(link.slug)?.add(source.slug)
    }
  }

  for (const [slug, sources] of incoming) {
    assert.ok(sources.size >= 3, `${slug} chỉ có ${sources.size} nguồn contextual`)
  }
})

test('discovery links are deterministic, canonical, distinct and never self-link', () => {
  const publishedSlugs = new Set(PUBLISHED_LOCAL_PAGES.map((page) => page.slug))

  for (const source of PUBLISHED_LOCAL_PAGES) {
    const links = getLocalDiscoveryLinks(source.slug)
    assert.deepEqual(links, getLocalDiscoveryLinks(source.slug))
    assert.equal(new Set(links.map((link) => link.slug)).size, links.length)
    assert.ok(links.every((link) => link.slug !== source.slug))
    assert.ok(links.every((link) => publishedSlugs.has(link.slug)))
    assert.ok(links.every((link) => link.href === `/${link.slug}`))
  }

  assert.deepEqual(getLocalDiscoveryLinks('khong-ton-tai'), [])
})

test('each landing emits unique targets with destination-distinguishable labels', () => {
  for (const source of PUBLISHED_LOCAL_PAGES) {
    const links = getEmittedLinks(source.slug)

    assert.equal(
      new Set(links.map((link) => link.slug)).size,
      links.length,
      `${source.slug} render trùng target`,
    )
    assert.equal(
      new Set(links.map((link) => normalize(link.label))).size,
      links.length,
      `${source.slug} có anchor không phân biệt được destination`,
    )
  }
})

test('every non-hub owner links back to its truthful area hub', () => {
  for (const source of PUBLISHED_LOCAL_PAGES) {
    const hub = getLocalHubForPage(source.slug)
    assert.ok(hub)
    if (source.slug !== hub.slug) {
      assert.ok(getLocalDiscoveryLinks(source.slug).some((link) => link.slug === hub.slug))
    }
  }
})

test('exact-match anchors stay at or below 40 percent per owner', () => {
  for (const target of LOCAL_B30_TARGETS.filter((item) => item.role === 'primary')) {
    const labels = PUBLISHED_LOCAL_PAGES.flatMap((source) => (
      getEmittedLinks(source.slug)
        .filter((link) => link.slug === target.ownerSlug)
        .map((link) => link.label)
    ))

    assert.ok(labels.length >= 3)
    const exact = labels.filter((label) => normalize(label) === normalize(target.query)).length
    assert.ok(exact / labels.length <= 0.4, `${target.query}: ${exact}/${labels.length}`)
  }
})

test('hubs expose every member in their truthful service cluster', () => {
  assert.deepEqual(LOCAL_AREA_HUBS.map((hub) => hub.slug), [
    'phu-kien-handmade-dong-nai',
    'phu-kien-handmade-trang-dai',
    'phu-kien-handmade-bien-hoa',
    'phu-kien-handmade-tphcm',
  ])

  for (const hub of LOCAL_AREA_HUBS) {
    const canonicalHub = PUBLISHED_LOCAL_PAGES.find((page) => page.slug === hub.slug)
    assert.ok(canonicalHub, `${hub.slug} không phải published page`)
    assert.equal(canonicalHub.area, hub.area)
    if (hub.area === 'TP.HCM') assert.equal(canonicalHub.onlineOnly, true)

    const expected = PUBLISHED_LOCAL_PAGES
      .filter((page) => page.area === hub.area && page.slug !== hub.slug)
      .map((page) => page.slug)
    const members = getLocalHubMemberLinks(hub.slug)

    assert.deepEqual(members.map((page) => page.slug), expected)
    assert.equal(new Set(members.map((page) => page.slug)).size, members.length)
  }
})

test('TP.HCM discovery links only describe online delivery pages', () => {
  const hcm = PUBLISHED_LOCAL_PAGES.filter((page) => page.area === 'TP.HCM')
  assert.ok(hcm.every((page) => page.onlineOnly === true))

  for (const source of PUBLISHED_LOCAL_PAGES) {
    for (const link of getEmittedLinks(source.slug)) {
      const target = PUBLISHED_LOCAL_PAGES.find((page) => page.slug === link.slug)
      if (target?.area !== 'TP.HCM') continue

      assert.equal(target.onlineOnly, true)
      assert.doesNotMatch(link.label, /cửa hàng|ghé|xưởng|nhận trực tiếp/i)
      if (normalize(link.label) !== normalize(target.crumb)) {
        assert.match(link.label, /giao|online/i)
      }
    }
  }
})

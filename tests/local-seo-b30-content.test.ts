import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import LocalLandingPage from '../src/components/local/LocalLandingPage'
import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'
import { PUBLISHED_LOCAL_PAGES, getLocalPage } from '../src/lib/local-seo'

const normalize = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('vi')

const ALLOWED_PRIMARY_TITLE_COLLISIONS = new Set([
  'shop-phu-kien-handmade-dong-nai->phu-kien-handmade-dong-nai',
  'shop-phu-kien-handmade-bien-hoa->phu-kien-handmade-bien-hoa',
])

test('all 23 owners have useful metadata in the reference range', () => {
  for (const page of PUBLISHED_LOCAL_PAGES) {
    const primary = LOCAL_B30_TARGETS.find((target) => (
      target.role === 'primary' && target.ownerSlug === page.slug
    ))
    assert.ok(primary)
    assert.ok(page.seoTitle.toLocaleLowerCase('vi').includes(primary.query.toLocaleLowerCase('vi')))
    assert.ok(page.seoTitle.length >= 50 && page.seoTitle.length <= 60)
    assert.ok(page.metaDescription.length >= 140, `${page.slug}: ${page.metaDescription.length}`)
    assert.ok(page.metaDescription.length <= 165, `${page.slug}: ${page.metaDescription.length}`)
    assert.ok(page.metaDescription.includes('Mushroomie'))
  }
})

test('primary titles reject cross-owner queries except strict-subquery shop owners', () => {
  const collisions = new Set<string>()
  const primaryTargets = LOCAL_B30_TARGETS.filter((target) => target.role === 'primary')

  for (const page of PUBLISHED_LOCAL_PAGES) {
    for (const target of primaryTargets) {
      if (target.ownerSlug === page.slug) continue
      if (!normalize(page.seoTitle).includes(normalize(target.query))) continue

      collisions.add(`${page.slug}->${target.ownerSlug}`)
    }
  }

  assert.deepEqual(collisions, ALLOWED_PRIMARY_TITLE_COLLISIONS)
})

test('every secondary query owns one visible, stable content section', () => {
  for (const target of LOCAL_B30_TARGETS.filter((item) => item.role === 'secondary')) {
    const page = getLocalPage(target.ownerSlug)
    assert.ok(page)
    const section = page.intentSections?.find((item) => item.id === target.contentSectionId)
    assert.ok(section, `${target.query} thiếu section ${target.contentSectionId}`)
    assert.ok(normalize(`${section.title} ${section.body}`).includes(normalize(target.query)))
    const html = normalize(renderToStaticMarkup(createElement(LocalLandingPage, { page })))
    assert.ok(html.includes(normalize(target.query)))
  }
})

test('secondary queries do not become title or H1 owners', () => {
  for (const target of LOCAL_B30_TARGETS.filter((item) => item.role === 'secondary')) {
    const page = getLocalPage(target.ownerSlug)!
    assert.ok(!normalize(page.seoTitle).includes(normalize(target.query)))
    assert.ok(!normalize(page.h1).includes(normalize(target.query)))
  }
})

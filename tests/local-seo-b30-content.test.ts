import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import LocalLandingPage from '../src/components/local/LocalLandingPage'
import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'
import { getLocalPage } from '../src/lib/local-seo'

const normalize = (text: string) => text.normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('vi')

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

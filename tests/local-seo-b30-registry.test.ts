import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  LOCAL_B30_OWNER_SLUGS,
  LOCAL_B30_TARGETS,
  getLocalB30TargetsByOwner,
} from '../src/lib/local-seo-b30'
import { PUBLISHED_LOCAL_SLUGS, getLocalPage } from '../src/lib/local-seo'

const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi')

test('B30 has exactly 30 unique queries, 23 primary owners and 7 secondary queries', () => {
  assert.equal(LOCAL_B30_TARGETS.length, 30)
  assert.deepEqual(LOCAL_B30_TARGETS.map((target) => target.id), Array.from({ length: 30 }, (_, i) => i + 1))
  assert.equal(new Set(LOCAL_B30_TARGETS.map((target) => normalize(target.query))).size, 30)
  assert.equal(LOCAL_B30_TARGETS.filter((target) => target.role === 'primary').length, 23)
  assert.equal(LOCAL_B30_TARGETS.filter((target) => target.role === 'secondary').length, 7)
  assert.equal(LOCAL_B30_OWNER_SLUGS.length, 23)
})

test('every target owns one published canonical route', () => {
  const published = new Set<string>(PUBLISHED_LOCAL_SLUGS)
  for (const target of LOCAL_B30_TARGETS) {
    assert.equal(target.ownerHref, `/${target.ownerSlug}`)
    assert.ok(published.has(target.ownerSlug))
    assert.ok(existsSync(resolve('src', 'app', '(user)', target.ownerSlug, 'page.tsx')))
    assert.ok(getLocalPage(target.ownerSlug))
  }
})

test('only secondary targets name a visible content section', () => {
  for (const target of LOCAL_B30_TARGETS) {
    if (target.role === 'secondary') {
      assert.ok('contentSectionId' in target)
      assert.ok(target.contentSectionId)
    } else {
      assert.ok(!('contentSectionId' in target))
    }
    assert.ok(getLocalB30TargetsByOwner(target.ownerSlug).includes(target))
  }
})

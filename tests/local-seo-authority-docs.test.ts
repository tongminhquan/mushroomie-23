import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

import { BRAND } from '../src/lib/local-seo'

const REPOSITORY_ROOT = join(import.meta.dirname, '..')
const TRACKER_PATH = join(
  REPOSITORY_ROOT,
  'docs',
  'seo-local-b30',
  'citation-tracker.csv',
)
const RUNBOOK_PATH = join(
  REPOSITORY_ROOT,
  'docs',
  'operations',
  'seo-local-b30-authority.md',
)
const EVIDENCE_TEMPLATE_PATH = join(
  REPOSITORY_ROOT,
  'docs',
  'seo-local-b30',
  'authority-evidence-template.md',
)

const EXACT_TRACKER_HEADER = [
  'platform',
  'public_url',
  'profile_type',
  'name',
  'address',
  'phone',
  'website',
  'target_url',
  'anchor',
  'relationship',
  'link_attribute',
  'verification_status',
  'last_checked',
  'owner_action',
  'notes',
]

function nonEmptyLines(value: string): string[] {
  return value.replaceAll('\r\n', '\n').split('\n').filter(Boolean)
}

test('authority evidence template is reusable, redacted and approval-gated', async () => {
  const template = await readFile(EVIDENCE_TEMPLATE_PATH, 'utf8')

  for (const requiredText of [
    '# B30 Authority Evidence Template',
    '- Measurement date (ISO `YYYY-MM-DD`):',
    '- Public profile URL:',
    'Ownership state: absent | unclaimed | claimed-unverified | verified',
    'Duplicate candidates found: 0 | count',
    'Sensitive verification evidence stored outside Git: yes | not-applicable',
    '## Public NAP profiles',
    '## Proposed mutations awaiting approval',
    '| Platform | Field | Before | Proposed | Truth source | Rollback value |',
  ]) {
    assert.ok(template.includes(requiredText), `missing template contract: ${requiredText}`)
  }

  assert.doesNotMatch(template, /ya29\.|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/i)
  assert.doesNotMatch(template, /(?:cookie|session|verification[-_ ]?(?:code|token))\s*[:=]\s*\S+/i)
  assert.doesNotMatch(template, /@gmail\.com/i)
})

test('citation tracker has the exact schema and only the four canonical owned profiles', async () => {
  const tracker = await readFile(TRACKER_PATH, 'utf8')
  const lines = nonEmptyLines(tracker)

  assert.deepEqual(lines[0]?.split(','), EXACT_TRACKER_HEADER)
  assert.equal(lines.length, 5)

  const expectedProfiles = new Map([
    ['Facebook', { url: BRAND.socials.facebook.url, status: 'not_exposed', action: 'inspect_authenticated' }],
    ['Instagram', { url: BRAND.socials.instagram.url, status: 'not_exposed', action: 'review_display_name' }],
    ['TikTok', { url: BRAND.socials.tiktok.url, status: 'unavailable', action: 'inspect_authenticated' }],
    ['Shopee', { url: BRAND.socials.shopee.url, status: 'unavailable', action: 'inspect_authenticated' }],
  ])

  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    assert.equal(cells.length, EXACT_TRACKER_HEADER.length)
    const row = Object.fromEntries(EXACT_TRACKER_HEADER.map((header, index) => [header, cells[index]]))
    const expected = expectedProfiles.get(row.platform)

    assert.ok(expected, `unexpected platform: ${row.platform}`)
    assert.equal(row.public_url, expected.url)
    assert.ok(row.name?.trim(), `missing audited name state: ${row.platform}`)
    assert.equal(row.target_url, 'https://mushroomie.io.vn/')
    assert.equal(row.anchor, BRAND.name)
    assert.equal(row.relationship, 'owned')
    assert.equal(row.link_attribute, 'unknown')
    assert.equal(row.verification_status, expected.status)
    assert.equal(row.last_checked, '2026-08-14')
    assert.equal(row.owner_action, expected.action)
    assert.ok(row.notes?.trim(), `missing audit note: ${row.platform}`)
    assert.equal(row.address, 'not exposed')
    assert.equal(row.phone, 'not exposed')
    assert.equal(row.website, 'not exposed')
    assert.doesNotMatch(`${row.address} ${row.notes}`, /TP\.?\s*HCM/i)
    assert.doesNotMatch(row.notes, /cookie|session|token|verification code/i)

    expectedProfiles.delete(row.platform)
  }

  assert.equal(expectedProfiles.size, 0)
  assert.doesNotMatch(tracker, /pending_live_check|verified_live|citation_win/i)
})

test('authority runbook preserves truthful NAP, ethical review and mutation boundaries', async () => {
  const runbook = await readFile(RUNBOOK_PATH, 'utf8')
  const lower = runbook.toLocaleLowerCase('en-US')

  for (const requiredText of [
    BRAND.name,
    BRAND.formattedAddress,
    BRAND.phone,
    'https://mushroomie.io.vn',
    `${BRAND.geo.latitude}, ${BRAND.geo.longitude}`,
    'Weekly: new/recent review count, unanswered reviews, GBP warnings/suspensions, profile edits.',
    'Monthly: NAP diff, citation live status, broken/redirected target URLs, new legitimate mentions.',
    'Quarterly: category/services/photos accuracy, duplicate profile search, competitor relevance/prominence delta.',
    'Rollback: restore recorded prior field; do not create a replacement profile to bypass a suspension.',
    'https://support.google.com/business/answer/7091/improve-your-local-ranking-on-google',
  ]) {
    assert.ok(runbook.includes(requiredText), `missing runbook contract: ${requiredText}`)
  }

  for (const exactPolicy of [ 'no review gating', 'no duplicate profile', 'no bulk backlinks', 'no pbn', 'no paid reviews' ]) {
    assert.ok(lower.includes(exactPolicy), `missing exact policy: ${exactPolicy}`)
  }

  for (const exactBoundary of [
    'TP.HCM: online delivery only; no storefront or location.',
    'Organic and Local Pack are measured separately.',
    'External mutation approval is required immediately before save, send or publish.',
    'Only real customers after a completed transaction may receive an invitation.',
    'Every satisfaction level receives the same review link and opt-out.',
  ]) {
    assert.ok(runbook.includes(exactBoundary), `missing boundary: ${exactBoundary}`)
  }

})

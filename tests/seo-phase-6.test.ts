import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { SeoPhase4KeywordRow } from '../src/lib/seo-phase-4'
import {
  buildSeoPhase6KeywordBaseline,
  buildSeoPhase6ScorecardCsv,
  serializeSeoPhase6KeywordCsv,
} from '../src/lib/seo-phase-6'

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

const keywordRows: SeoPhase4KeywordRow[] = Array.from({ length: 30 }, (_, index) => ({
  index: index + 1,
  keyword: `từ khóa ${index + 1}`,
  cluster: `Cụm ${Math.floor(index / 5) + 1}`,
  intent: 'Thương mại',
  priority: index < 5 ? 'Rất cao' : 'Cao',
  proposedPage: 'Trang đích',
  proposedSlug: `tu-khoa-${index + 1}`,
  note: index === 0 ? 'Ghi chú có, dấu phẩy' : '',
}))

test('phase 6 baseline preserves all 30 keywords without inventing authenticated metrics', () => {
  const rows = buildSeoPhase6KeywordBaseline(keywordRows, '2026-07-17')

  assert.equal(rows.length, 30)
  assert.equal(new Set(rows.map((row) => row.ownerUrl)).size, 9)
  assert.equal(rows[0].ownerUrl, 'https://mushroomie.io.vn/san-pham?category=vong-tay')
  assert.equal(rows[16].ownerUrl, 'https://mushroomie.io.vn/')
  assert.equal(rows[29].ownerUrl, 'https://mushroomie.io.vn/tin-tuc/qua-handmade-tang-nguoi-yeu')

  for (const row of rows) {
    assert.equal(row.baselineDate, '2026-07-17')
    assert.equal(row.measurementStatus, 'pending_authenticated_data')
    assert.equal(row.gscClicks28d, null)
    assert.equal(row.gscImpressions28d, null)
    assert.equal(row.gscCtr, null)
    assert.equal(row.gscAveragePosition, null)
    assert.equal(row.observedSerpRank, null)
    assert.equal(row.indexStatus, null)
    assert.equal(row.localPackStatus, null)
  }
})

test('phase 6 CSV exports blank metric cells and correctly escapes Vietnamese notes', () => {
  const csv = serializeSeoPhase6KeywordCsv(
    buildSeoPhase6KeywordBaseline(keywordRows, '2026-07-17'),
  )
  const lines = csv.trimEnd().split(/\r?\n/)

  assert.equal(lines.length, 31)
  assert.match(lines[0], /gsc_clicks_28d,gsc_impressions_28d,gsc_ctr,gsc_average_position/)
  assert.match(lines[1], /"Ghi chú có, dấu phẩy"/)
  assert.doesNotMatch(csv, /pending_authenticated_data,\d+,\d+/)
})

test('phase 6 weekly scorecard covers GSC, GA4, index, CWV and Local Pack', () => {
  const csv = buildSeoPhase6ScorecardCsv('2026-07-17', 123)
  const [header, row] = csv.trimEnd().split(/\r?\n/)

  for (const column of [
    'gsc_clicks',
    'gsc_impressions',
    'gsc_ctr',
    'gsc_average_position',
    'ga4_organic_sessions',
    'ga4_purchase_conversions',
    'indexed_urls',
    'lcp_ms',
    'inp_ms',
    'cls',
    'local_pack_top3_keywords',
  ]) {
    assert.match(header, new RegExp(`(?:^|,)${column}(?:,|$)`))
  }
  assert.match(row, /^2026-07-17,123,/)
  assert.match(row, /pending_authenticated_data/)
})

test('phase 6 audit is read-only and declares authenticated data limitations', () => {
  const script = read('scripts/audit-seo-phase-6.ts')
  const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

  assert.equal(packageJson.scripts['seo:audit:phase-6'], 'tsx scripts/audit-seo-phase-6.ts')
  assert.match(script, /mushroomie_30_tu_khoa_seo\.csv/)
  assert.match(script, /sitemap\.xml/)
  assert.match(script, /robots\.txt/)
  assert.match(script, /resolveTxt/)
  assert.match(script, /GOOGLE_ANALYTICS_ID/)
  assert.match(script, /GOOGLE_ADS_ID/)
  assert.doesNotMatch(script, /GTM-K55B6RVG/)
  assert.match(script, /pending_authenticated_data/)
  assert.match(script, /if \(!response\.ok\)/)
  assert.doesNotMatch(script, /prisma\.\w+\.(?:create|update|delete|upsert)/)
})

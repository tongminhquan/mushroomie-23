import { resolveKeywordOwner, type SeoPhase4KeywordRow } from './seo-phase-4'

const SITE_URL = 'https://mushroomie.io.vn'

export interface SeoPhase6KeywordBaselineRow {
  index: number
  keyword: string
  cluster: string
  intent: string
  priority: string
  ownerUrl: string
  baselineDate: string
  measurementStatus: 'pending_authenticated_data'
  gscClicks28d: number | null
  gscImpressions28d: number | null
  gscCtr: number | null
  gscAveragePosition: number | null
  observedSerpRank: number | null
  indexStatus: string | null
  localPackStatus: string | null
  note: string
}

export function buildSeoPhase6KeywordBaseline(
  keywordRows: SeoPhase4KeywordRow[],
  baselineDate: string,
): SeoPhase6KeywordBaselineRow[] {
  return keywordRows.map((row) => ({
    index: row.index,
    keyword: row.keyword,
    cluster: row.cluster,
    intent: row.intent,
    priority: row.priority,
    ownerUrl: new URL(resolveKeywordOwner(row.index).href, SITE_URL).toString(),
    baselineDate,
    measurementStatus: 'pending_authenticated_data',
    gscClicks28d: null,
    gscImpressions28d: null,
    gscCtr: null,
    gscAveragePosition: null,
    observedSerpRank: null,
    indexStatus: null,
    localPackStatus: null,
    note: row.note,
  }))
}

function csvCell(value: string | number | null): string {
  if (value === null) return ''
  const text = String(value)
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

export function serializeSeoPhase6KeywordCsv(rows: SeoPhase6KeywordBaselineRow[]): string {
  const header = [
    'stt',
    'keyword',
    'cluster',
    'intent',
    'priority',
    'owner_url',
    'baseline_date',
    'measurement_status',
    'gsc_clicks_28d',
    'gsc_impressions_28d',
    'gsc_ctr',
    'gsc_average_position',
    'observed_serp_rank',
    'index_status',
    'local_pack_status',
    'note',
  ]

  const data = rows.map((row) => [
    row.index,
    row.keyword,
    row.cluster,
    row.intent,
    row.priority,
    row.ownerUrl,
    row.baselineDate,
    row.measurementStatus,
    row.gscClicks28d,
    row.gscImpressions28d,
    row.gscCtr,
    row.gscAveragePosition,
    row.observedSerpRank,
    row.indexStatus,
    row.localPackStatus,
    row.note,
  ])

  return [header, ...data].map((row) => row.map(csvCell).join(',')).join('\n') + '\n'
}

export function buildSeoPhase6ScorecardCsv(
  baselineDate: string,
  sitemapPublicUrls: number,
): string {
  const header = [
    'week_start',
    'sitemap_public_urls',
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
    'measurement_status',
    'notes',
  ]
  const row = [
    baselineDate,
    sitemapPublicUrls,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'pending_authenticated_data',
    'Awaiting authenticated GSC, GA4, CrUX and verified GBP data.',
  ]

  return [header, row].map((values) => values.map(csvCell).join(',')).join('\n') + '\n'
}

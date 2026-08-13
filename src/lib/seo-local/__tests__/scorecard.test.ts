import { describe, expect, it } from 'vitest'

import {
  LOCAL_B30_TARGETS,
  type LocalB30Target,
} from '@/lib/local-seo-b30'
import type { SearchAnalyticsRow } from '@/lib/seo-discovery/gsc-client'
import {
  buildKeywordMeasurement,
  evaluateB30Success,
  normalizeSearchQuery,
  validateRankObservation,
  type KeywordMeasurement,
  type RankObservation,
} from '@/lib/seo-local/scorecard'

const TARGET = LOCAL_B30_TARGETS[4]
const AS_OF_DATE = '2026-08-31'
const OWNER_URL = `https://mushroomie.io.vn${TARGET.ownerHref}`

function makeRow(
  overrides: Partial<SearchAnalyticsRow> = {},
): SearchAnalyticsRow {
  return {
    query: TARGET.query,
    page: OWNER_URL,
    device: 'MOBILE',
    clicks: 1,
    impressions: 10,
    ctr: 0.1,
    position: 1,
    ...overrides,
  }
}

function makeObservation(
  overrides: Partial<RankObservation> = {},
): RankObservation {
  return {
    query: TARGET.query,
    ownerUrl: OWNER_URL,
    organicPosition: 1,
    localPackPosition: null,
    location: TARGET.area,
    country: 'VN',
    language: 'vi',
    device: 'mobile',
    measuredAt: '2026-08-03',
    source: 'rank-tracker',
    ...overrides,
  }
}

function weeklyObservations(
  dates: readonly string[] = ['2026-08-03', '2026-08-10', '2026-08-17'],
): RankObservation[] {
  return dates.map((measuredAt) => makeObservation({ measuredAt }))
}

function build(
  rows: readonly SearchAnalyticsRow[] = [],
  observations: readonly unknown[] = [],
  asOfDate = AS_OF_DATE,
): KeywordMeasurement {
  return buildKeywordMeasurement(TARGET, rows, observations, asOfDate)
}

function makeCompleteMeasurement(target: LocalB30Target): KeywordMeasurement {
  return {
    targetId: target.id,
    query: target.query,
    ownerUrl: `https://mushroomie.io.vn${target.ownerHref}`,
    gsc: {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      averagePosition: null,
    },
    observedPages: [],
    ownerConflict: false,
    rankEvidenceStatus: 'verified',
    organicTopOne: true,
    localPackPosition: null,
  }
}

describe('normalizeSearchQuery', () => {
  it('normalizes NFC, collapses whitespace, trims and lowercases in Vietnamese', () => {
    const decomposed = `  ${TARGET.query.normalize('NFD')
      .replaceAll(' ', '   \n\t')}  `

    expect(normalizeSearchQuery(decomposed)).toBe(
      TARGET.query.normalize('NFC').toLocaleLowerCase('vi'),
    )
  })
})

describe('buildKeywordMeasurement Search Analytics aggregation', () => {
  it('does not treat GSC average position 1 as exact top-one proof', () => {
    const measurement = build([makeRow({ position: 1 })])

    expect(measurement.gsc.averagePosition).toBe(1)
    expect(measurement.organicTopOne).toBe(false)
    expect(measurement.rankEvidenceStatus).toBe('missing')
  })

  it('aggregates clicks, impressions, CTR and impression-weighted position', () => {
    const measurement = build([
      makeRow({ clicks: 2, impressions: 10, ctr: 0.2, position: 2 }),
      makeRow({
        page: `${OWNER_URL}?utm_source=search`,
        clicks: 3,
        impressions: 30,
        ctr: 0.1,
        position: 4,
      }),
    ])

    expect(measurement.gsc).toEqual({
      clicks: 5,
      impressions: 40,
      ctr: 0.125,
      averagePosition: 3.5,
    })
    expect(measurement.observedPages).toEqual([OWNER_URL])
    expect(measurement.ownerConflict).toBe(false)
  })

  it('keeps a zero-impression target and reports zero CTR with null position', () => {
    const measurement = build([
      makeRow({ clicks: 7, impressions: 0, ctr: 0, position: 18 }),
    ])

    expect(measurement.gsc).toEqual({
      clicks: 7,
      impressions: 0,
      ctr: 0,
      averagePosition: null,
    })
    expect(measurement.observedPages).toEqual([OWNER_URL])
  })

  it('matches GSC query rows only after exact Unicode/space normalization', () => {
    const measurement = build([
      makeRow({
        query: `  ${TARGET.query.normalize('NFD').replaceAll(' ', '  ')} `,
        clicks: 2,
        impressions: 20,
        ctr: 0.1,
      }),
      makeRow({
        query: `${TARGET.query} giá rẻ`,
        clicks: 99,
        impressions: 99,
        ctr: 1,
      }),
    ])

    expect(measurement.gsc.clicks).toBe(2)
    expect(measurement.gsc.impressions).toBe(20)
  })

  it('discards rows with malformed or unsafe metrics instead of corrupting totals', () => {
    const malformedRows = [
      makeRow({ clicks: Number.NaN }),
      makeRow({ impressions: -1 }),
      makeRow({ ctr: 1.1 }),
      makeRow({ position: Number.POSITIVE_INFINITY }),
      { ...makeRow(), device: 'PHONE' },
    ] as unknown as SearchAnalyticsRow[]

    const measurement = build([
      makeRow({ clicks: 4, impressions: 8, ctr: 0.5, position: 2 }),
      ...malformedRows,
    ])

    expect(measurement.gsc).toEqual({
      clicks: 4,
      impressions: 8,
      ctr: 0.5,
      averagePosition: 2,
    })
  })

  it('retains a positive-impression off-owner identity when another metric is malformed', () => {
    const otherPage = 'https://mushroomie.io.vn/qua-tang-handmade-dong-nai'
    const measurement = build([
      makeRow({
        page: otherPage,
        impressions: 7,
        ctr: Number.NaN,
      }),
    ])

    expect(measurement.gsc).toEqual({
      clicks: 0,
      impressions: 0,
      ctr: 0,
      averagePosition: null,
    })
    expect(measurement.observedPages).toEqual([otherPage])
    expect(measurement.ownerConflict).toBe(true)
  })

  it('does not fabricate a conflict from an off-owner row with invalid impressions', () => {
    const otherPage = 'https://mushroomie.io.vn/qua-tang-handmade-dong-nai'
    const measurement = build([
      makeRow({
        page: otherPage,
        impressions: Number.NaN,
      }),
    ])

    expect(measurement.observedPages).toEqual([otherPage])
    expect(measurement.ownerConflict).toBe(false)
  })

  it('keeps overflow handling and owner identity independent of input order', () => {
    const otherPage = 'https://mushroomie.io.vn/qua-tang-handmade-dong-nai'
    const ownerRow = makeRow({
      clicks: Number.MAX_VALUE,
      impressions: Number.MAX_VALUE,
      ctr: 1,
      position: 1,
    })
    const offOwnerRow = makeRow({
      page: otherPage,
      clicks: Number.MAX_VALUE / 2,
      impressions: Number.MAX_VALUE / 2,
      ctr: 1,
      position: 1,
    })

    const ownerFirst = build([ownerRow, offOwnerRow])
    const offOwnerFirst = build([offOwnerRow, ownerRow])

    expect(ownerFirst).toEqual(offOwnerFirst)
    expect(ownerFirst.observedPages).toEqual([OWNER_URL, otherPage].sort())
    expect(ownerFirst.ownerConflict).toBe(true)
  })

  it('excludes a finite metric row whose derived CTR would overflow', () => {
    const otherPage = 'https://mushroomie.io.vn/qua-tang-handmade-dong-nai'
    const measurement = build([
      makeRow({
        page: otherPage,
        clicks: Number.MAX_VALUE,
        impressions: Number.MIN_VALUE,
        ctr: 0,
        position: 1,
      }),
    ])

    expect(measurement.gsc).toEqual({
      clicks: 0,
      impressions: 0,
      ctr: 0,
      averagePosition: null,
    })
    expect(measurement.observedPages).toEqual([otherPage])
    expect(measurement.ownerConflict).toBe(true)
  })

  it('sorts and de-duplicates normalized canonical observed pages', () => {
    const otherPage = 'https://mushroomie.io.vn/qua-tang-handmade-dong-nai'
    const measurement = build([
      makeRow({ page: otherPage, impressions: 0 }),
      makeRow({ page: `${OWNER_URL}?utm_campaign=b30`, impressions: 0 }),
      makeRow({ page: OWNER_URL, impressions: 0 }),
    ])

    expect(measurement.observedPages).toEqual([OWNER_URL, otherPage].sort())
    expect(measurement.ownerConflict).toBe(false)
  })

  it('flags only positive-impression rows assigned to a valid non-owner page', () => {
    const otherPage = 'https://mushroomie.io.vn/qua-tang-handmade-dong-nai'

    expect(build([makeRow({ page: otherPage, impressions: 0 })]).ownerConflict)
      .toBe(false)
    expect(build([makeRow({ page: otherPage, impressions: 1 })]).ownerConflict)
      .toBe(true)
  })

  it.each([
    ['cross-origin', 'https://evil.example/vong-tay-handmade-dong-nai'],
    ['credentials', 'https://user:pass@mushroomie.io.vn/vong-tay-handmade-dong-nai'],
    ['HTTP', 'http://mushroomie.io.vn/vong-tay-handmade-dong-nai'],
    ['port', 'https://mushroomie.io.vn:444/vong-tay-handmade-dong-nai'],
    ['traversal', 'https://mushroomie.io.vn/qua/../vong-tay-handmade-dong-nai'],
    ['fragment', `${OWNER_URL}#reviews`],
    ['encoded path', 'https://mushroomie.io.vn/%76ong-tay-handmade-dong-nai'],
  ])('fails closed for a %s Search Analytics page URL', (_case, page) => {
    const measurement = build([makeRow({ page, impressions: 1 })])

    expect(measurement.ownerConflict).toBe(true)
    expect(measurement.observedPages).toEqual([])
  })
})

describe('validateRankObservation', () => {
  it('accepts an exact, canonical record and returns only its domain fields', () => {
    const input = makeObservation({
      organicPosition: 2,
      localPackPosition: 1,
      source: 'manual-serp',
    })

    expect(validateRankObservation(TARGET, input, AS_OF_DATE)).toEqual(input)
  })

  it.each([
    ['wrong query', { query: `${TARGET.query} khác` }],
    ['wrong owner', { ownerUrl: 'https://mushroomie.io.vn/' }],
    ['wrong location', { location: 'Biên Hòa' }],
    ['wrong country', { country: 'US' }],
    ['wrong language', { language: 'en' }],
    ['unknown device', { device: 'tablet' }],
    ['unknown source', { source: 'gsc' }],
    ['extra key', { extra: 'not-allowed' }],
  ])('rejects a record with %s', (_case, patch) => {
    const input = { ...makeObservation(), ...patch }

    expect(validateRankObservation(TARGET, input, AS_OF_DATE)).toBeNull()
  })

  it.each([
    ['query string', `${OWNER_URL}?utm_source=rank`],
    ['fragment', `${OWNER_URL}#result`],
    ['trailing slash', `${OWNER_URL}/`],
    ['HTTP', OWNER_URL.replace('https:', 'http:')],
    ['credentials', OWNER_URL.replace('https://', 'https://user@')],
    ['port', OWNER_URL.replace('.io.vn', '.io.vn:444')],
    ['encoded path', OWNER_URL.replace('/vong', '/%76ong')],
    ['traversal', OWNER_URL.replace('/vong', '/other/../vong')],
  ])('rejects a noncanonical owner URL with %s', (_case, ownerUrl) => {
    expect(validateRankObservation(
      TARGET,
      makeObservation({ ownerUrl }),
      AS_OF_DATE,
    )).toBeNull()
  })

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['fraction', 1.5],
    ['infinity', Number.POSITIVE_INFINITY],
    ['NaN', Number.NaN],
  ])('rejects %s rank positions', (_case, position) => {
    expect(validateRankObservation(
      TARGET,
      makeObservation({ organicPosition: position }),
      AS_OF_DATE,
    )).toBeNull()
    expect(validateRankObservation(
      TARGET,
      makeObservation({ localPackPosition: position }),
      AS_OF_DATE,
    )).toBeNull()
  })

  it('accepts null for either independently measured rank position', () => {
    expect(validateRankObservation(
      TARGET,
      makeObservation({ organicPosition: null, localPackPosition: null }),
      AS_OF_DATE,
    )).not.toBeNull()
  })

  it.each([
    ['non-calendar date', '2026-02-30'],
    ['missing zero padding', '2026-8-03'],
    ['timestamp', '2026-08-03T00:00:00.000Z'],
    ['future date', '2026-09-01'],
  ])('rejects a %s', (_case, measuredAt) => {
    expect(validateRankObservation(
      TARGET,
      makeObservation({ measuredAt }),
      AS_OF_DATE,
    )).toBeNull()
  })

  it('rejects invalid evaluation dates rather than consulting global time', () => {
    expect(validateRankObservation(
      TARGET,
      makeObservation(),
      '2026-02-30',
    )).toBeNull()
  })

  it.each([
    ['NFD query', { query: TARGET.query.normalize('NFD') }],
    ['query control', { query: `${TARGET.query}\u0000` }],
    ['location control', { location: `${TARGET.area}\u0009` }],
  ])('rejects Unicode/control ambiguity in %s', (_case, patch) => {
    expect(validateRankObservation(
      TARGET,
      { ...makeObservation(), ...patch },
      AS_OF_DATE,
    )).toBeNull()
  })
})

describe('buildKeywordMeasurement exact-rank gate', () => {
  it('requires the correct owner and three consecutive weekly mobile observations', () => {
    const measurement = build([], weeklyObservations())

    expect(measurement.rankEvidenceStatus).toBe('verified')
    expect(measurement.organicTopOne).toBe(true)
  })

  it.each([
    ['5-day gap', ['2026-08-05', '2026-08-10', '2026-08-17'], false],
    ['6-day gap', ['2026-08-04', '2026-08-10', '2026-08-17'], true],
    ['8-day gap', ['2026-08-02', '2026-08-10', '2026-08-18'], true],
    ['9-day gap', ['2026-08-01', '2026-08-10', '2026-08-17'], false],
  ] as const)('%s is evaluated against the 6-8 day rule', (_case, dates, expected) => {
    const measurement = build([], weeklyObservations(dates))

    expect(measurement.organicTopOne).toBe(expected)
    expect(measurement.rankEvidenceStatus).toBe(
      expected ? 'verified' : 'insufficient',
    )
  })

  it('treats organic position 2 as valid evidence but not completion', () => {
    const observations = weeklyObservations()
    observations[1] = makeObservation({
      measuredAt: observations[1].measuredAt,
      organicPosition: 2,
    })

    const measurement = build([], observations)

    expect(measurement.rankEvidenceStatus).toBe('insufficient')
    expect(measurement.organicTopOne).toBe(false)
  })

  it('reports desktop-only evidence without allowing it to satisfy completion', () => {
    const observations = weeklyObservations().map((observation) => ({
      ...observation,
      device: 'desktop' as const,
    }))

    const measurement = build([], observations)

    expect(measurement.rankEvidenceStatus).toBe('insufficient')
    expect(measurement.organicTopOne).toBe(false)
  })

  it('reports Local Pack independently and never substitutes it for organic rank', () => {
    const observations = weeklyObservations().map((observation, index) => ({
      ...observation,
      organicPosition: null,
      localPackPosition: 3 - index,
    }))

    const measurement = build([], observations)

    expect(measurement.localPackPosition).toBe(1)
    expect(measurement.rankEvidenceStatus).toBe('insufficient')
    expect(measurement.organicTopOne).toBe(false)
  })

  it('marks malformed target evidence invalid instead of dropping it', () => {
    const evidence = [
      ...weeklyObservations(),
      { ...makeObservation(), ownerUrl: 'https://mushroomie.io.vn/' },
    ]

    const measurement = build([], evidence)

    expect(measurement.rankEvidenceStatus).toBe('invalid')
    expect(measurement.organicTopOne).toBe(false)
  })

  it('marks duplicate or conflicting date/profile observations invalid', () => {
    const duplicate = makeObservation({
      measuredAt: '2026-08-10',
      organicPosition: 2,
    })
    const measurement = build([], [...weeklyObservations(), duplicate])

    expect(measurement.rankEvidenceStatus).toBe('invalid')
    expect(measurement.organicTopOne).toBe(false)
    expect(measurement.localPackPosition).toBeNull()
  })

  it('reports no latest Local Pack rank when the latest date is duplicated', () => {
    const earlierObservations = weeklyObservations().slice(0, 2)
    const latestAtOne = makeObservation({
      measuredAt: '2026-08-17',
      localPackPosition: 1,
    })
    const latestAtTwo = makeObservation({
      measuredAt: '2026-08-17',
      localPackPosition: 2,
    })

    const firstOrder = build(
      [],
      [...earlierObservations, latestAtOne, latestAtTwo],
    )
    const secondOrder = build(
      [],
      [...earlierObservations, latestAtTwo, latestAtOne],
    )

    expect(firstOrder).toEqual(secondOrder)
    expect(firstOrder.rankEvidenceStatus).toBe('invalid')
    expect(firstOrder.organicTopOne).toBe(false)
    expect(firstOrder.localPackPosition).toBeNull()
  })

  it('marks conflicting observations inside one measurement week invalid', () => {
    const observations = [
      ...weeklyObservations(),
      makeObservation({
        measuredAt: '2026-08-12',
        organicPosition: 4,
      }),
    ]

    const measurement = build([], observations)

    expect(measurement.rankEvidenceStatus).toBe('invalid')
    expect(measurement.organicTopOne).toBe(false)
  })

  it('marks mixed required-profile sources invalid instead of cherry-picking', () => {
    const observations = weeklyObservations()
    observations[2] = makeObservation({
      measuredAt: observations[2].measuredAt,
      source: 'manual-serp',
    })

    const measurement = build([], observations)

    expect(measurement.rankEvidenceStatus).toBe('invalid')
    expect(measurement.organicTopOne).toBe(false)
  })

  it('uses the newest three required-profile observations', () => {
    const observations = [
      makeObservation({ measuredAt: '2026-07-27', organicPosition: 8 }),
      ...weeklyObservations(),
    ]

    const measurement = build([], observations)

    expect(measurement.rankEvidenceStatus).toBe('verified')
    expect(measurement.organicTopOne).toBe(true)
  })

  it('marks future observations invalid relative to the explicit evaluation date', () => {
    const observations = [
      ...weeklyObservations(),
      makeObservation({ measuredAt: '2026-09-01' }),
    ]

    const measurement = build([], observations)

    expect(measurement.rankEvidenceStatus).toBe('invalid')
    expect(measurement.organicTopOne).toBe(false)
  })
})

describe('evaluateB30Success', () => {
  const completeMeasurements = LOCAL_B30_TARGETS.map(makeCompleteMeasurement)

  it('returns complete only for all 30 exact expected targets', () => {
    expect(evaluateB30Success(completeMeasurements)).toEqual({ complete: true })
  })

  it.each([
    ['missing ID', completeMeasurements.slice(0, -1)],
    ['duplicate ID', [
      ...completeMeasurements.slice(0, -1),
      completeMeasurements[0],
    ]],
    ['unknown ID', [
      ...completeMeasurements.slice(0, -1),
      { ...completeMeasurements.at(-1)!, targetId: 31 },
    ]],
  ])('rejects a scorecard with a %s', (_case, measurements) => {
    expect(evaluateB30Success(measurements).complete).toBe(false)
  })

  it('fails closed for a malformed measurement record', () => {
    const measurements = [
      ...completeMeasurements.slice(0, -1),
      null,
    ] as unknown as KeywordMeasurement[]

    expect(evaluateB30Success(measurements)).toEqual({ complete: false })
  })

  it.each([
    ['organic top one false', { organicTopOne: false }],
    ['unverified evidence status', { rankEvidenceStatus: 'insufficient' as const }],
    ['owner conflict', { ownerConflict: true }],
    ['wrong query', { query: 'mismatched query' }],
    ['wrong owner', { ownerUrl: 'https://mushroomie.io.vn/' }],
  ])('rejects an otherwise complete scorecard with %s', (_case, patch) => {
    const measurements = completeMeasurements.map((measurement, index) => (
      index === 0 ? { ...measurement, ...patch } : measurement
    ))

    expect(evaluateB30Success(measurements).complete).toBe(false)
  })
})

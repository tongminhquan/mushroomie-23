import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { createRequire, syncBuiltinESMExports } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'
import type {
  SearchAnalyticsRequest,
  SearchAnalyticsRow,
} from '../src/lib/seo-discovery/gsc-client'
import type { RankObservation } from '../src/lib/seo-local/scorecard'
import {
  RANK_OBSERVATION_COLUMNS,
  escapeCsvCell,
  parseBoundedCsvRows,
  parseRankObservationsCsv,
} from '../src/lib/seo-local/csv'
import {
  parseB30ScorecardArguments,
  runB30Scorecard,
  runB30ScorecardCli,
  serializeB30ScorecardCsv,
} from '../scripts/seo-local-b30-scorecard'

const NOW = new Date('2026-08-14T10:00:00.000Z')
const START_DATE = '2026-07-15'
const END_DATE = '2026-08-11'
const CSV_MAX_BYTES = 256 * 1024
const CSV_MAX_ROWS = 1_000
const DAY_MS = 86_400_000

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function assertErrorCode(action: () => unknown, code: string): void {
  assert.throws(action, (error) => errorMessage(error) === code)
}

async function assertRejectsCode(
  action: () => Promise<unknown>,
  code: string,
): Promise<void> {
  await assert.rejects(action, (error) => errorMessage(error) === code)
}

function makeObservation(
  targetIndex = 0,
  overrides: Partial<RankObservation> = {},
): RankObservation {
  const target = LOCAL_B30_TARGETS[targetIndex]
  return {
    query: target.query,
    ownerUrl: `https://mushroomie.io.vn${target.ownerHref}`,
    organicPosition: 1,
    localPackPosition: null,
    location: target.area,
    country: 'VN',
    language: 'vi',
    device: 'mobile',
    measuredAt: '2026-08-03',
    source: 'rank-tracker',
    ...overrides,
  }
}

function testCsvCell(value: string | number | null): string {
  const raw = value === null ? '' : String(value)
  return /[",\r\n]/u.test(raw)
    ? `"${raw.replaceAll('"', '""')}"`
    : raw
}

function observationsToCsv(
  observations: readonly RankObservation[],
  newline = '\n',
): string {
  const rows = observations.map((observation) => [
    observation.query,
    observation.ownerUrl,
    observation.organicPosition,
    observation.localPackPosition,
    observation.location,
    observation.country,
    observation.language,
    observation.device,
    observation.measuredAt,
    observation.source,
  ].map(testCsvCell).join(','))

  return [RANK_OBSERVATION_COLUMNS.join(','), ...rows].join(newline)
}

function dateFrom(base: string, offsetDays: number): string {
  return new Date(Date.parse(`${base}T00:00:00.000Z`) + (offsetDays * DAY_MS))
    .toISOString()
    .slice(0, 10)
}

function makeManyObservations(count: number): RankObservation[] {
  return Array.from({ length: count }, (_, index) => {
    const targetIndex = index % LOCAL_B30_TARGETS.length
    const cycle = Math.floor(index / LOCAL_B30_TARGETS.length)
    return makeObservation(targetIndex, {
      measuredAt: dateFrom('2024-01-01', cycle),
    })
  })
}

function makeAnalyticsRow(request: SearchAnalyticsRequest): SearchAnalyticsRow {
  const target = LOCAL_B30_TARGETS.find((item) => item.query === request.query)
  assert.ok(target)
  return {
    query: request.query,
    page: `https://mushroomie.io.vn${target.ownerHref}`,
    device: 'MOBILE',
    clicks: 1,
    impressions: 10,
    ctr: 0.1,
    position: target.id,
  }
}

function makeClient(
  handler: (
    request: SearchAnalyticsRequest,
    callIndex: number,
  ) => Promise<SearchAnalyticsRow[]> = async (request) => [makeAnalyticsRow(request)],
) {
  const calls: SearchAnalyticsRequest[] = []
  return {
    calls,
    client: {
      async querySearchAnalytics(request: SearchAnalyticsRequest) {
        calls.push({ ...request })
        return handler(request, calls.length - 1)
      },
    },
  }
}

async function withTemporaryDirectory(
  action: (directory: string) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'mushroomie-b30-'))
  try {
    await action(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('bounded CSV parser supports quoted commas, CRLF/LF and doubled quotes', () => {
  const source = 'first,second\r\n"comma,value","line 1\r\nline 2 ""quoted"""\nlast,row'

  assert.deepEqual(parseBoundedCsvRows(source), [
    ['first', 'second'],
    ['comma,value', 'line 1\r\nline 2 "quoted"'],
    ['last', 'row'],
  ])
})

test('rank CSV accepts the exact header, CRLF and blank rank positions', () => {
  const observation = makeObservation(0, {
    organicPosition: null,
    localPackPosition: null,
  })
  const csv = `${observationsToCsv([observation], '\r\n')}\r\n`

  assert.deepEqual(parseRankObservationsCsv(csv, END_DATE), [observation])
})

test('CSV byte limit admits exactly 256 KiB and rejects one extra byte', () => {
  const prefix = 'a\n"'
  const suffix = '"'
  const exact = `${prefix}${'x'.repeat(CSV_MAX_BYTES - prefix.length - suffix.length)}${suffix}`
  assert.equal(Buffer.byteLength(exact, 'utf8'), CSV_MAX_BYTES)
  assert.equal(parseBoundedCsvRows(exact).length, 2)

  assertErrorCode(
    () => parseBoundedCsvRows(`${exact}x`),
    'SEO_LOCAL_B30_CSV_TOO_LARGE',
  )
})

test('rank CSV admits exactly 1,000 observations and rejects 1,001', () => {
  const exact = makeManyObservations(CSV_MAX_ROWS)
  assert.equal(
    parseRankObservationsCsv(
      observationsToCsv(exact),
      '2026-12-31',
    ).length,
    CSV_MAX_ROWS,
  )

  assertErrorCode(
    () => parseRankObservationsCsv(
      observationsToCsv(makeManyObservations(CSV_MAX_ROWS + 1)),
      '2026-12-31',
    ),
    'SEO_LOCAL_B30_CSV_TOO_MANY_ROWS',
  )
})

test('CSV rejects BOM, NUL/control bytes and malformed quote state without echoing input', () => {
  const cases = [
    ['\ufeffa,b', 'SEO_LOCAL_B30_CSV_BOM'],
    ['a,b\nvalue,\u0000secret-marker', 'SEO_LOCAL_B30_CSV_CONTROL_CHARACTER'],
    ['a,b\nvalue,\tsecret-marker', 'SEO_LOCAL_B30_CSV_CONTROL_CHARACTER'],
    ['a,b\n"unclosed,value', 'SEO_LOCAL_B30_CSV_MALFORMED'],
    ['a,b\nva"lue,other', 'SEO_LOCAL_B30_CSV_MALFORMED'],
    ['a,b\n"value"junk,other', 'SEO_LOCAL_B30_CSV_MALFORMED'],
    ['a,b\rvalue,other', 'SEO_LOCAL_B30_CSV_MALFORMED'],
  ] as const

  for (const [source, code] of cases) {
    assertErrorCode(() => parseBoundedCsvRows(source), code)
    try {
      parseBoundedCsvRows(source)
    } catch (error) {
      assert.equal(errorMessage(error).includes('secret-marker'), false)
    }
  }
})

test('rank CSV rejects every non-exact header shape', () => {
  const row = observationsToCsv([makeObservation()]).split('\n')[1]
  const headers = [
    '',
    RANK_OBSERVATION_COLUMNS.slice(0, -1).join(','),
    [...RANK_OBSERVATION_COLUMNS, 'extra'].join(','),
    [RANK_OBSERVATION_COLUMNS[1], RANK_OBSERVATION_COLUMNS[0], ...RANK_OBSERVATION_COLUMNS.slice(2)].join(','),
    [...RANK_OBSERVATION_COLUMNS.slice(0, -1), RANK_OBSERVATION_COLUMNS[0]].join(','),
    ` ${RANK_OBSERVATION_COLUMNS.join(',')}`,
  ]

  for (const header of headers) {
    assertErrorCode(
      () => parseRankObservationsCsv(`${header}\n${row}`, END_DATE),
      'SEO_LOCAL_B30_CSV_HEADER',
    )
  }
})

test('rank CSV rejects extra and missing row columns', () => {
  const [header, row] = observationsToCsv([makeObservation()]).split('\n')
  assertErrorCode(
    () => parseRankObservationsCsv(`${header}\n${row},extra`, END_DATE),
    'SEO_LOCAL_B30_CSV_COLUMN_COUNT',
  )
  assertErrorCode(
    () => parseRankObservationsCsv(`${header}\n${row.split(',').slice(0, -1).join(',')}`, END_DATE),
    'SEO_LOCAL_B30_CSV_COLUMN_COUNT',
  )
})

test('rank CSV rejects formula-capable string cells after leading whitespace', () => {
  const observation = makeObservation()
  const values = [
    observation.query,
    observation.ownerUrl,
    '',
    '',
    observation.location,
    observation.country,
    observation.language,
    observation.device,
    observation.measuredAt,
    observation.source,
  ]
  const stringIndexes = [0, 1, 4, 5, 6, 7, 8, 9]

  for (const index of stringIndexes) {
    for (const prefix of ['=', '+', '-', '@']) {
      const malicious = [...values]
      malicious[index] = `  ${prefix}secret-marker`
      const csv = `${RANK_OBSERVATION_COLUMNS.join(',')}\n${malicious.map(testCsvCell).join(',')}`
      assertErrorCode(
        () => parseRankObservationsCsv(csv, END_DATE),
        'SEO_LOCAL_B30_CSV_FORMULA',
      )
    }
  }
})

test('CSV serializer prefixes unsafe formulas before standard escaping', () => {
  assert.equal(escapeCsvCell('=1+1'), "'=1+1")
  assert.equal(escapeCsvCell('  +SUM(A1:A2)'), "'  +SUM(A1:A2)")
  assert.equal(escapeCsvCell('-10'), "'-10")
  assert.equal(escapeCsvCell('@cmd'), "'@cmd")
  assert.equal(escapeCsvCell('safe, "quoted"'), '"safe, ""quoted"""')
  assert.equal(escapeCsvCell(null), '')
})

test('rank CSV positions must be blank or canonical safe integers at least one', () => {
  const [header, row] = observationsToCsv([makeObservation()]).split('\n')
  const values = row.split(',')
  for (const position of ['0', '-1', '+1', '01', '1.0', '1e1', ' 1', '1 ', 'Infinity', '9007199254740992']) {
    const modified = [...values]
    modified[2] = position
    assertErrorCode(
      () => parseRankObservationsCsv(`${header}\n${modified.join(',')}`, END_DATE),
      'SEO_LOCAL_B30_CSV_POSITION',
    )
  }
})

test('rank CSV delegates semantic acceptance to the exact B30 target contract', () => {
  const invalidCases: Array<[string, RankObservation, string]> = [
    ['unknown query', makeObservation(0, { query: 'unknown local query' }), 'SEO_LOCAL_B30_CSV_UNKNOWN_QUERY'],
    ['wrong owner', makeObservation(0, { ownerUrl: 'https://mushroomie.io.vn/' }), 'SEO_LOCAL_B30_CSV_INVALID_OBSERVATION'],
    ['wrong location', makeObservation(0, { location: 'Biên Hòa' }), 'SEO_LOCAL_B30_CSV_INVALID_OBSERVATION'],
    ['wrong country', { ...makeObservation(0), country: 'US' as 'VN' }, 'SEO_LOCAL_B30_CSV_INVALID_OBSERVATION'],
    ['wrong language', { ...makeObservation(0), language: 'en' as 'vi' }, 'SEO_LOCAL_B30_CSV_INVALID_OBSERVATION'],
    ['wrong profile', { ...makeObservation(0), device: 'tablet' as 'mobile' }, 'SEO_LOCAL_B30_CSV_INVALID_OBSERVATION'],
    ['future date', makeObservation(0, { measuredAt: '2026-08-12' }), 'SEO_LOCAL_B30_CSV_INVALID_OBSERVATION'],
    ['wrong source', { ...makeObservation(0), source: 'gsc' as 'rank-tracker' }, 'SEO_LOCAL_B30_CSV_INVALID_OBSERVATION'],
  ]

  for (const [, observation, code] of invalidCases) {
    assertErrorCode(
      () => parseRankObservationsCsv(observationsToCsv([observation]), END_DATE),
      code,
    )
  }
})

test('rank CSV rejects duplicate and conflicting exact observation identities', () => {
  const observation = makeObservation()
  assertErrorCode(
    () => parseRankObservationsCsv(
      observationsToCsv([observation, { ...observation }]),
      END_DATE,
    ),
    'SEO_LOCAL_B30_CSV_DUPLICATE_OBSERVATION',
  )

  assertErrorCode(
    () => parseRankObservationsCsv(
      observationsToCsv([
        observation,
        { ...observation, organicPosition: 2 },
      ]),
      END_DATE,
    ),
    'SEO_LOCAL_B30_CSV_CONFLICTING_OBSERVATION',
  )
})

test('runner makes exactly 30 calls, observes concurrency at most two and preserves registry order', async () => {
  let active = 0
  let maxActive = 0
  const { client, calls } = makeClient(async (request, callIndex) => {
    active += 1
    maxActive = Math.max(maxActive, active)
    await new Promise((resolve) => setTimeout(resolve, (31 - callIndex) % 3))
    active -= 1
    return [makeAnalyticsRow(request)]
  })

  const result = await runB30Scorecard({
    startDate: START_DATE,
    endDate: END_DATE,
    client,
    rankObservations: [],
    now: NOW,
  })

  assert.equal(calls.length, 30)
  assert.ok(maxActive <= 2)
  assert.deepEqual(calls.map((call) => call.query), LOCAL_B30_TARGETS.map((target) => target.query))
  assert.deepEqual(result.measurements.map((measurement) => measurement.targetId), Array.from({ length: 30 }, (_, index) => index + 1))
  assert.equal(result.measurements.length, 30)
  assert.equal(result.errors.length, 0)
  assert.equal(result.complete, false)
})

test('runner honors concurrency one and rejects every other runtime value before calling GSC', async () => {
  let active = 0
  let maxActive = 0
  const serial = makeClient(async (request) => {
    active += 1
    maxActive = Math.max(maxActive, active)
    await Promise.resolve()
    active -= 1
    return [makeAnalyticsRow(request)]
  })
  await runB30Scorecard({
    startDate: START_DATE,
    endDate: END_DATE,
    client: serial.client,
    rankObservations: [],
    concurrency: 1,
    now: NOW,
  })
  assert.equal(maxActive, 1)

  for (const concurrency of [0, 3, 1.5, '2'] as unknown as Array<1 | 2>) {
    const invalid = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client: invalid.client,
        rankObservations: [],
        concurrency,
        now: NOW,
      }),
      'SEO_LOCAL_B30_INVALID_CONCURRENCY',
    )
    assert.equal(invalid.calls.length, 0)
  }
})

test('zero-row targets remain present with missing rank evidence', async () => {
  const { client } = makeClient(async () => [])
  const result = await runB30Scorecard({
    startDate: START_DATE,
    endDate: END_DATE,
    client,
    rankObservations: [],
    now: NOW,
  })

  assert.equal(result.measurements.length, 30)
  for (const measurement of result.measurements) {
    assert.deepEqual(measurement.gsc, {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      averagePosition: null,
    })
    assert.equal(measurement.rankEvidenceStatus, 'missing')
    assert.equal(measurement.organicTopOne, false)
  }
})

test('partial provider failure is bounded, redacted, never retried and does not omit targets', async () => {
  const secret = 'ya29.secret-token query=private-query https://private.example'
  const { client, calls } = makeClient(async (request) => {
    if (request.query === LOCAL_B30_TARGETS[6].query) {
      throw new Error(secret)
    }
    return [makeAnalyticsRow(request)]
  })

  const result = await runB30Scorecard({
    startDate: START_DATE,
    endDate: END_DATE,
    client,
    rankObservations: [],
    now: NOW,
  })
  const serialized = JSON.stringify(result)

  assert.equal(calls.length, 30)
  assert.equal(calls.filter((call) => call.query === LOCAL_B30_TARGETS[6].query).length, 1)
  assert.equal(result.measurements.length, 30)
  assert.deepEqual(result.errors, [{ targetId: 7, code: 'GSC_REQUEST_FAILED' }])
  assert.equal(result.complete, false)
  assert.equal(serialized.includes(secret), false)
  assert.equal(serialized.includes('ya29.'), false)
  assert.equal(serialized.includes('private.example'), false)
})

test('a malformed provider result is a bounded target failure, not silent zero data', async () => {
  const { client } = makeClient(async () => 'not-an-array' as unknown as SearchAnalyticsRow[])
  const result = await runB30Scorecard({
    startDate: START_DATE,
    endDate: END_DATE,
    client,
    rankObservations: [],
    now: NOW,
  })

  assert.equal(result.measurements.length, 30)
  assert.deepEqual(result.errors, LOCAL_B30_TARGETS.map((target) => ({
    targetId: target.id,
    code: 'GSC_REQUEST_FAILED',
  })))
  assert.equal(result.complete, false)
})

test('a hostile provider row array becomes one bounded redacted target failure', async () => {
  const target = LOCAL_B30_TARGETS[0]
  const secret = 'provider-proxy-secret-marker'
  const hostileRows = new Proxy([{
    query: target.query,
    page: `https://mushroomie.io.vn${target.ownerHref}`,
    device: 'MOBILE' as const,
    clicks: 1,
    impressions: 1,
    ctr: 1,
    position: 1,
  }], {
    get(rows, property, receiver) {
      if (property === Symbol.iterator) {
        throw new Error(secret)
      }
      return Reflect.get(rows, property, receiver)
    },
  })
  const { client } = makeClient(async (request) => (
    request.query === target.query
      ? hostileRows as unknown as SearchAnalyticsRow[]
      : []
  ))

  const result = await runB30Scorecard({
    startDate: START_DATE,
    endDate: END_DATE,
    client,
    rankObservations: [],
    now: NOW,
  })

  assert.equal(result.measurements.length, 30)
  assert.deepEqual(result.errors, [{ targetId: target.id, code: 'GSC_REQUEST_FAILED' }])
  assert.equal(JSON.stringify(result).includes(secret), false)
})

test('GSC average position one never fabricates exact organic top-one evidence', async () => {
  const { client } = makeClient(async (request) => [{
    ...makeAnalyticsRow(request),
    position: 1,
  }])
  const result = await runB30Scorecard({
    startDate: START_DATE,
    endDate: END_DATE,
    client,
    rankObservations: [],
    now: NOW,
  })

  assert.ok(result.measurements.every((measurement) => measurement.gsc.averagePosition === 1))
  assert.ok(result.measurements.every((measurement) => measurement.organicTopOne === false))
  assert.equal(result.complete, false)
})

test('runner rejects malformed programmatic rank evidence before any provider request', async () => {
  const { client, calls } = makeClient()
  await assertRejectsCode(
    () => runB30Scorecard({
      startDate: START_DATE,
      endDate: END_DATE,
      client,
      rankObservations: [makeObservation(0, { ownerUrl: 'https://mushroomie.io.vn/' })],
      now: NOW,
    }),
    'SEO_LOCAL_B30_INVALID_RANK_OBSERVATION',
  )
  assert.equal(calls.length, 0)
})

test('default CLI dates are a finalized 28-day inclusive UTC range', () => {
  assert.deepEqual(parseB30ScorecardArguments([], { now: NOW, cwd: process.cwd() }), {
    startDate: '2026-07-15',
    endDate: '2026-08-11',
    concurrency: 2,
  })
  assert.deepEqual(parseB30ScorecardArguments(
    ['--end-date', '2026-08-01'],
    { now: NOW, cwd: process.cwd() },
  ), {
    startDate: '2026-07-05',
    endDate: '2026-08-01',
    concurrency: 2,
  })
})

test('runner rejects invalid, reversed, unfinalized and unbounded date ranges before GSC', async () => {
  const invalidRanges = [
    ['2026-02-30', END_DATE, 'SEO_LOCAL_B30_INVALID_DATE_RANGE'],
    ['2026-8-01', END_DATE, 'SEO_LOCAL_B30_INVALID_DATE_RANGE'],
    [END_DATE, START_DATE, 'SEO_LOCAL_B30_INVALID_DATE_RANGE'],
    [START_DATE, '2026-08-12', 'SEO_LOCAL_B30_UNFINALIZED_DATE_RANGE'],
    ['2025-01-01', END_DATE, 'SEO_LOCAL_B30_UNSUPPORTED_DATE_WINDOW'],
  ] as const

  for (const [startDate, endDate, code] of invalidRanges) {
    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate,
        endDate,
        client,
        rankObservations: [],
        now: NOW,
      }),
      code,
    )
    assert.equal(calls.length, 0)
  }
})

test('CLI accepts only the exact one-occurrence flag grammar', () => {
  const cwd = process.cwd()
  const parsed = parseB30ScorecardArguments([
    '--start-date', START_DATE,
    '--end-date', END_DATE,
    '--rank-input', 'rank.csv',
    '--output-dir', 'reports',
    '--concurrency', '1',
  ], { now: NOW, cwd })
  assert.deepEqual(parsed, {
    startDate: START_DATE,
    endDate: END_DATE,
    rankInput: path.resolve(cwd, 'rank.csv'),
    outputDir: path.resolve(cwd, 'reports'),
    concurrency: 1,
  })

  const invalid = [
    ['--unknown', 'value'],
    ['positional'],
    ['--start-date'],
    ['--start-date', '--end-date', END_DATE],
    ['--start-date', START_DATE, '--start-date', START_DATE],
    [`--start-date=${START_DATE}`],
    ['--concurrency', '0'],
    ['--concurrency', '3'],
    ['--concurrency', '02'],
  ]
  for (const arguments_ of invalid) {
    assertErrorCode(
      () => parseB30ScorecardArguments(arguments_, { now: NOW, cwd }),
      'SEO_LOCAL_B30_INVALID_ARGUMENTS',
    )
  }
})

test('default runner mode performs no filesystem writes', async () => {
  await withTemporaryDirectory(async (directory) => {
    const before = await readdir(directory)
    const { client } = makeClient()
    await runB30Scorecard({
      startDate: START_DATE,
      endDate: END_DATE,
      client,
      rankObservations: [],
      now: NOW,
    })
    assert.deepEqual(await readdir(directory), before)
  })
})

test('non-Linux hosts fail closed before provider work when report output is requested', async (t) => {
  if (process.platform === 'linux') {
    t.skip('Linux binds report writes to an open directory descriptor')
    return
  }

  await withTemporaryDirectory(async (directory) => {
    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client,
        rankObservations: [],
        outputDir: directory,
        now: NOW,
      }),
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.equal(calls.length, 0)
    assert.deepEqual(await readdir(directory), [])
  })
})

test('explicit safe output writes deterministic JSON and formula-safe CSV atomically', async (t) => {
  if (process.platform !== 'linux') {
    t.skip('descriptor-bound report publication is supported only on Linux')
    return
  }

  await withTemporaryDirectory(async (directory) => {
    const { client } = makeClient()
    const first = await runB30Scorecard({
      startDate: START_DATE,
      endDate: END_DATE,
      client,
      rankObservations: [],
      outputDir: directory,
      now: NOW,
    })
    const firstJson = await readFile(path.join(directory, 'b30-scorecard.json'), 'utf8')
    const firstCsv = await readFile(path.join(directory, 'b30-scorecard.csv'), 'utf8')
    assert.deepEqual(JSON.parse(firstJson), first)
    assert.match(firstCsv, /^target_id,query,owner_url,/u)
    assert.equal(firstCsv.includes('=HYPERLINK'), false)
    assert.deepEqual((await readdir(directory)).sort(), ['b30-scorecard.csv', 'b30-scorecard.json'])

    const second = makeClient()
    await runB30Scorecard({
      startDate: START_DATE,
      endDate: END_DATE,
      client: second.client,
      rankObservations: [],
      outputDir: directory,
      now: NOW,
    })
    assert.equal(await readFile(path.join(directory, 'b30-scorecard.json'), 'utf8'), firstJson)
    assert.equal(await readFile(path.join(directory, 'b30-scorecard.csv'), 'utf8'), firstCsv)
  })
})

test('scorecard CSV serialization neutralizes any unsafe future string field', () => {
  const measurement = {
    targetId: 1,
    query: '=HYPERLINK("https://evil.example")',
    ownerUrl: '+cmd',
    gsc: { clicks: 0, impressions: 0, ctr: 0, averagePosition: null },
    observedPages: ['@page'],
    ownerConflict: false,
    rankEvidenceStatus: 'missing' as const,
    organicTopOne: false,
    localPackPosition: null,
  }
  const csv = serializeB30ScorecardCsv([measurement])
  assert.match(csv, /'=HYPERLINK/u)
  assert.match(csv, /'\+cmd/u)
  assert.match(csv, /'@page/u)
})

test('output identity is revalidated after pending provider work before report writes', async (t) => {
  if (process.platform !== 'linux') {
    t.skip('descriptor-bound report publication is supported only on Linux')
    return
  }

  await withTemporaryDirectory(async (directory) => {
    const reports = path.join(directory, 'reports')
    const outside = path.join(directory, 'outside')
    await mkdir(reports)
    await mkdir(outside)

    let releaseProvider!: () => void
    const providerGate = new Promise<void>((resolve) => {
      releaseProvider = resolve
    })
    let notifyProviderStarted!: () => void
    const providerStarted = new Promise<void>((resolve) => {
      notifyProviderStarted = resolve
    })
    let started = false
    const { client } = makeClient(async () => {
      if (!started) {
        started = true
        notifyProviderStarted()
      }
      await providerGate
      return []
    })
    const scorecard = runB30Scorecard({
      startDate: START_DATE,
      endDate: END_DATE,
      client,
      rankObservations: [],
      outputDir: reports,
      now: NOW,
    })

    await providerStarted
    try {
      await rm(reports, { recursive: true, force: true })
      await symlink(outside, reports, process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      releaseProvider()
      await scorecard
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOTSUP') {
        t.skip(`platform cannot create test link: ${code}`)
        return
      }
      throw error
    }

    releaseProvider()
    await assertRejectsCode(
      () => scorecard,
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.deepEqual(await readdir(outside), [])
  })
})

test('a failed second report publish leaves no new first report behind', async (t) => {
  if (process.platform !== 'linux') {
    t.skip('descriptor-bound report publication is supported only on Linux')
    return
  }

  await withTemporaryDirectory(async (directory) => {
    const require = createRequire(import.meta.url)
    const fsPromises = require('node:fs/promises') as typeof import('node:fs/promises')
    const originalRename = fsPromises.rename
    fsPromises.rename = async function failCsvPublish(
      source: Parameters<typeof originalRename>[0],
      destination: Parameters<typeof originalRename>[1],
    ) {
      const sourceName = path.basename(String(source))
      if (
        sourceName.startsWith('.b30-scorecard.csv.')
        && sourceName.endsWith('.tmp')
        && path.basename(String(destination)) === 'b30-scorecard.csv'
      ) {
        throw new Error('second-report-rename-marker')
      }
      return originalRename(source, destination)
    }
    syncBuiltinESMExports()

    try {
      const { client } = makeClient()
      await assertRejectsCode(
        () => runB30Scorecard({
          startDate: START_DATE,
          endDate: END_DATE,
          client,
          rankObservations: [],
          outputDir: directory,
          now: NOW,
        }),
        'SEO_LOCAL_B30_OUTPUT_WRITE_FAILED',
      )
      assert.deepEqual(await readdir(directory), [])
    } finally {
      fsPromises.rename = originalRename
      syncBuiltinESMExports()
    }
  })
})

test('a failed second report publish restores both prior reports', async (t) => {
  if (process.platform !== 'linux') {
    t.skip('descriptor-bound report publication is supported only on Linux')
    return
  }

  await withTemporaryDirectory(async (directory) => {
    const previousJson = '{"previous":true}\n'
    const previousCsv = 'previous,csv\r\n'
    await writeFile(path.join(directory, 'b30-scorecard.json'), previousJson, 'utf8')
    await writeFile(path.join(directory, 'b30-scorecard.csv'), previousCsv, 'utf8')

    const require = createRequire(import.meta.url)
    const fsPromises = require('node:fs/promises') as typeof import('node:fs/promises')
    const originalRename = fsPromises.rename
    fsPromises.rename = async function failCsvPublish(
      source: Parameters<typeof originalRename>[0],
      destination: Parameters<typeof originalRename>[1],
    ) {
      const sourceName = path.basename(String(source))
      if (
        sourceName.startsWith('.b30-scorecard.csv.')
        && sourceName.endsWith('.tmp')
        && path.basename(String(destination)) === 'b30-scorecard.csv'
      ) {
        throw new Error('second-report-rename-marker')
      }
      return originalRename(source, destination)
    }
    syncBuiltinESMExports()

    try {
      const { client } = makeClient()
      await assertRejectsCode(
        () => runB30Scorecard({
          startDate: START_DATE,
          endDate: END_DATE,
          client,
          rankObservations: [],
          outputDir: directory,
          now: NOW,
        }),
        'SEO_LOCAL_B30_OUTPUT_WRITE_FAILED',
      )
      assert.equal(await readFile(path.join(directory, 'b30-scorecard.json'), 'utf8'), previousJson)
      assert.equal(await readFile(path.join(directory, 'b30-scorecard.csv'), 'utf8'), previousCsv)
      assert.deepEqual(await readdir(directory).then((items) => items.sort()), [
        'b30-scorecard.csv',
        'b30-scorecard.json',
      ])
    } finally {
      fsPromises.rename = originalRename
      syncBuiltinESMExports()
    }
  })
})

test('a best-effort backup cleanup failure never rolls back a committed report pair', async (t) => {
  if (process.platform !== 'linux') {
    t.skip('descriptor-bound report publication is supported only on Linux')
    return
  }

  for (const reportName of ['b30-scorecard.json', 'b30-scorecard.csv']) {
    await withTemporaryDirectory(async (directory) => {
      await writeFile(path.join(directory, 'b30-scorecard.json'), '{"previous":true}\n', 'utf8')
      await writeFile(path.join(directory, 'b30-scorecard.csv'), 'previous,csv\r\n', 'utf8')

      const require = createRequire(import.meta.url)
      const fsPromises = require('node:fs/promises') as typeof import('node:fs/promises')
      const originalRm = fsPromises.rm
      let failedCleanup = false
      fsPromises.rm = async function failOneBackupCleanup(
        candidate: Parameters<typeof originalRm>[0],
        ...arguments_: Parameters<typeof originalRm> extends [unknown, ...infer Rest] ? Rest : never
      ) {
        const candidateName = path.basename(String(candidate))
        if (
          !failedCleanup
          && candidateName.startsWith(`.${reportName}.`)
          && candidateName.endsWith('.backup')
        ) {
          failedCleanup = true
          throw new Error('backup-cleanup-marker')
        }
        return originalRm(candidate, ...arguments_)
      }
      syncBuiltinESMExports()

      try {
        const { client } = makeClient()
        const result = await runB30Scorecard({
          startDate: START_DATE,
          endDate: END_DATE,
          client,
          rankObservations: [],
          outputDir: directory,
          now: NOW,
        })

        assert.equal(failedCleanup, true)
        assert.deepEqual(
          JSON.parse(await readFile(path.join(directory, 'b30-scorecard.json'), 'utf8')),
          result,
        )
        assert.match(
          await readFile(path.join(directory, 'b30-scorecard.csv'), 'utf8'),
          /^target_id,query,owner_url,/u,
        )
      } finally {
        fsPromises.rm = originalRm
        syncBuiltinESMExports()
      }
    })
  }
})

test('a final report rename never follows an output directory swap', async (t) => {
  if (process.platform !== 'linux') {
    t.skip('directory-FD publication is supported only on Linux')
    return
  }

  await withTemporaryDirectory(async (directory) => {
    const reports = path.join(directory, 'reports')
    const outside = path.join(directory, 'outside')
    const outsideJson = path.join(outside, 'b30-scorecard.json')
    await mkdir(reports)
    await mkdir(outside)
    await writeFile(outsideJson, 'outside-marker\n', 'utf8')

    const require = createRequire(import.meta.url)
    const fsPromises = require('node:fs/promises') as typeof import('node:fs/promises')
    const originalRename = fsPromises.rename
    let swapped = false
    fsPromises.rename = async function swapDuringFinalJsonRename(
      source: Parameters<typeof originalRename>[0],
      destination: Parameters<typeof originalRename>[1],
    ) {
      const sourceName = path.basename(String(source))
      if (
        !swapped
        && sourceName.startsWith('.b30-scorecard.json.')
        && sourceName.endsWith('.tmp')
        && path.basename(String(destination)) === 'b30-scorecard.json'
      ) {
        swapped = true
        await rm(reports, { recursive: true, force: true })
        await symlink(outside, reports, 'dir')
        await writeFile(path.join(outside, sourceName), 'attacker-temp\n', 'utf8')
      }
      return originalRename(source, destination)
    }
    syncBuiltinESMExports()

    try {
      const { client } = makeClient()
      await assertRejectsCode(
        () => runB30Scorecard({
          startDate: START_DATE,
          endDate: END_DATE,
          client,
          rankObservations: [],
          outputDir: reports,
          now: NOW,
        }),
        'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
      )
      assert.equal(swapped, true)
      assert.equal(await readFile(outsideJson, 'utf8'), 'outside-marker\n')
    } finally {
      fsPromises.rename = originalRename
      syncBuiltinESMExports()
    }
  })
})

test('output path rejects repository public, descendants and regular files before GSC', async () => {
  const publicDirectory = path.resolve('public')
  for (const outputDir of [publicDirectory, path.join(publicDirectory, 'seo-reports')]) {
    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client,
        rankObservations: [],
        outputDir,
        now: NOW,
      }),
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.equal(calls.length, 0)
  }

  await withTemporaryDirectory(async (directory) => {
    const file = path.join(directory, 'not-a-directory')
    await writeFile(file, 'safe')
    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client,
        rankObservations: [],
        outputDir: file,
        now: NOW,
      }),
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.equal(calls.length, 0)
  })
})

test('output path requires an existing safe directory instead of creating one during report setup', async () => {
  await withTemporaryDirectory(async (directory) => {
    const missing = path.join(directory, 'not-created-by-scorecard')
    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client,
        rankObservations: [],
        outputDir: missing,
        now: NOW,
      }),
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.equal(calls.length, 0)
    await assert.rejects(stat(missing), { code: 'ENOENT' })
  })
})

test('output path rejects symlink or junction escapes when the platform permits creating one', async (t) => {
  await withTemporaryDirectory(async (directory) => {
    const outside = path.join(directory, 'outside')
    const linked = path.join(directory, 'linked')
    await mkdir(outside)
    try {
      await symlink(outside, linked, process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOTSUP') {
        t.skip(`platform cannot create test link: ${code}`)
        return
      }
      throw error
    }

    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client,
        rankObservations: [],
        outputDir: linked,
        now: NOW,
      }),
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.equal(calls.length, 0)
  })
})

test('output validation does not create a child through a symlink or junction ancestor', async (t) => {
  await withTemporaryDirectory(async (directory) => {
    const outside = path.join(directory, 'outside')
    const linked = path.join(directory, 'linked')
    const escapedChild = path.join(outside, 'must-not-be-created')
    await mkdir(outside)
    try {
      await symlink(outside, linked, process.platform === 'win32' ? 'junction' : 'dir')
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOTSUP') {
        t.skip(`platform cannot create test link: ${code}`)
        return
      }
      throw error
    }

    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client,
        rankObservations: [],
        outputDir: path.join(linked, 'must-not-be-created'),
        now: NOW,
      }),
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.equal(calls.length, 0)
    await assert.rejects(stat(escapedChild), { code: 'ENOENT' })
  })
})

test('reserved report paths are validated before any provider request', async () => {
  await withTemporaryDirectory(async (directory) => {
    await mkdir(path.join(directory, 'b30-scorecard.json'))
    const { client, calls } = makeClient()
    await assertRejectsCode(
      () => runB30Scorecard({
        startDate: START_DATE,
        endDate: END_DATE,
        client,
        rankObservations: [],
        outputDir: directory,
        now: NOW,
      }),
      'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED',
    )
    assert.equal(calls.length, 0)
  })
})

test('CLI reads a valid regular rank file but never overwrites rank input or credentials', async (t) => {
  if (process.platform !== 'linux') {
    t.skip('descriptor-bound report publication is supported only on Linux')
    return
  }

  await withTemporaryDirectory(async (directory) => {
    const rankInput = path.join(directory, 'b30-scorecard.csv')
    await writeFile(rankInput, observationsToCsv([makeObservation()]), 'utf8')
    const stdout: string[] = []
    const stderr: string[] = []
    const { client, calls } = makeClient()
    const collision = await runB30ScorecardCli([
      '--start-date', START_DATE,
      '--end-date', END_DATE,
      '--rank-input', rankInput,
      '--output-dir', directory,
    ], {
      client,
      now: NOW,
      cwd: process.cwd(),
      env: {},
      writeStdout: (value) => stdout.push(value),
      writeStderr: (value) => stderr.push(value),
    })
    assert.equal(collision.exitCode, 1)
    assert.equal(calls.length, 0)
    assert.equal(stdout.join('').includes(rankInput), false)
    assert.equal(stderr.join('').includes(rankInput), false)
    assert.match(stderr.join(''), /SEO_LOCAL_B30_OUTPUT_COLLISION/u)

    const credential = path.join(directory, 'b30-scorecard.json')
    await writeFile(credential, '{"type":"service_account"}', 'utf8')
    const credentialAttempt = makeClient()
    const credentialError: string[] = []
    const credentialCollision = await runB30ScorecardCli([
      '--start-date', START_DATE,
      '--end-date', END_DATE,
      '--output-dir', directory,
    ], {
      client: credentialAttempt.client,
      now: NOW,
      cwd: process.cwd(),
      env: { GOOGLE_APPLICATION_CREDENTIALS: credential },
      writeStdout: () => undefined,
      writeStderr: (value) => credentialError.push(value),
    })
    assert.equal(credentialCollision.exitCode, 1)
    assert.equal(credentialAttempt.calls.length, 0)
    assert.equal(credentialError.join('').includes(credential), false)
    assert.match(credentialError.join(''), /SEO_LOCAL_B30_OUTPUT_COLLISION/u)
  })
})

test('CLI rank input must be a readable regular bounded file and errors never expose its path/content', async () => {
  await withTemporaryDirectory(async (directory) => {
    const secretPath = path.join(directory, 'secret-path-marker.csv')
    await writeFile(secretPath, Buffer.alloc(CSV_MAX_BYTES + 1, 0x78))
    const output: string[] = []
    const errors: string[] = []
    const { client, calls } = makeClient()

    const outcome = await runB30ScorecardCli([
      '--start-date', START_DATE,
      '--end-date', END_DATE,
      '--rank-input', secretPath,
    ], {
      client,
      now: NOW,
      cwd: process.cwd(),
      env: {},
      writeStdout: (value) => output.push(value),
      writeStderr: (value) => errors.push(value),
    })

    assert.equal(outcome.exitCode, 1)
    assert.equal(calls.length, 0)
    assert.equal(output.join('').includes('secret-path-marker'), false)
    assert.equal(errors.join('').includes('secret-path-marker'), false)
    assert.match(errors.join(''), /SEO_LOCAL_B30_CSV_TOO_LARGE/u)
  })
})

test('CLI preserves bounded CSV parser codes without exposing rejected content', async () => {
  await withTemporaryDirectory(async (directory) => {
    const rankInput = path.join(directory, 'secret-content-marker.csv')
    await writeFile(rankInput, 'wrong,header\nsecret-content-marker', 'utf8')
    const errors: string[] = []
    const { client, calls } = makeClient()
    const outcome = await runB30ScorecardCli([
      '--start-date', START_DATE,
      '--end-date', END_DATE,
      '--rank-input', rankInput,
    ], {
      client,
      now: NOW,
      cwd: process.cwd(),
      env: {},
      writeStdout: () => undefined,
      writeStderr: (value) => errors.push(value),
    })

    assert.equal(outcome.exitCode, 1)
    assert.equal(calls.length, 0)
    assert.equal(errors.join('').includes('secret-content-marker'), false)
    assert.match(errors.join(''), /^SEO_LOCAL_B30_CSV_HEADER\n$/u)
  })
})

test('CLI rejects a rank input symlink or junction before provider requests', async (t) => {
  await withTemporaryDirectory(async (directory) => {
    const realDirectory = path.join(directory, 'real')
    const linkedDirectory = path.join(directory, 'linked')
    const realInput = path.join(realDirectory, 'rank.csv')
    const linkedInput = path.join(linkedDirectory, 'rank.csv')
    await mkdir(realDirectory)
    await writeFile(realInput, observationsToCsv([makeObservation()]), 'utf8')
    try {
      await symlink(
        realDirectory,
        linkedDirectory,
        process.platform === 'win32' ? 'junction' : 'dir',
      )
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOTSUP') {
        t.skip(`platform cannot create test link: ${code}`)
        return
      }
      throw error
    }

    const errors: string[] = []
    const { client, calls } = makeClient()
    const outcome = await runB30ScorecardCli([
      '--start-date', START_DATE,
      '--end-date', END_DATE,
      '--rank-input', linkedInput,
    ], {
      client,
      now: NOW,
      cwd: process.cwd(),
      env: {},
      writeStdout: () => undefined,
      writeStderr: (value) => errors.push(value),
    })

    assert.equal(outcome.exitCode, 1)
    assert.equal(calls.length, 0)
    assert.match(errors.join(''), /^SEO_LOCAL_B30_RANK_INPUT_REJECTED\n$/u)
  })
})

test('CLI rejects a rank-input parent junction swapped between identity check and open', async (t) => {
  await withTemporaryDirectory(async (directory) => {
    const inputDirectory = path.join(directory, 'input')
    const outside = path.join(directory, 'outside')
    const rankInput = path.join(inputDirectory, 'rank.csv')
    await mkdir(inputDirectory)
    await mkdir(outside)
    await writeFile(rankInput, observationsToCsv([makeObservation()]), 'utf8')
    await writeFile(
      path.join(outside, 'rank.csv'),
      observationsToCsv([makeObservation(1)]),
      'utf8',
    )

    const require = createRequire(import.meta.url)
    const fsPromises = require('node:fs/promises') as typeof import('node:fs/promises')
    const originalOpen = fsPromises.open
    let swapped = false
    fsPromises.open = async function guardedOpen(
      candidate: Parameters<typeof originalOpen>[0],
      ...arguments_: Parameters<typeof originalOpen> extends [unknown, ...infer Rest] ? Rest : never
    ) {
      if (!swapped && path.resolve(String(candidate)) === path.resolve(rankInput)) {
        swapped = true
        await rm(inputDirectory, { recursive: true, force: true })
        await symlink(outside, inputDirectory, process.platform === 'win32' ? 'junction' : 'dir')
      }
      return originalOpen(candidate, ...arguments_)
    }
    syncBuiltinESMExports()

    try {
      const errors: string[] = []
      const { client, calls } = makeClient()
      const outcome = await runB30ScorecardCli([
        '--start-date', START_DATE,
        '--end-date', END_DATE,
        '--rank-input', rankInput,
      ], {
        client,
        now: NOW,
        cwd: process.cwd(),
        env: {},
        writeStdout: () => undefined,
        writeStderr: (value) => errors.push(value),
      })

      assert.equal(outcome.exitCode, 1)
      assert.equal(calls.length, 0)
      assert.match(errors.join(''), /^SEO_LOCAL_B30_RANK_INPUT_REJECTED\n$/u)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'EPERM' || code === 'EACCES' || code === 'ENOTSUP') {
        t.skip(`platform cannot create test link: ${code}`)
        return
      }
      throw error
    } finally {
      fsPromises.open = originalOpen
      syncBuiltinESMExports()
    }
  })
})

test('CLI prints one bounded summary, exits nonzero only for operational errors and redacts provider failures', async () => {
  const safeOutput: string[] = []
  const safeErrors: string[] = []
  const successful = makeClient(async () => [])
  const success = await runB30ScorecardCli([
    '--start-date', START_DATE,
    '--end-date', END_DATE,
  ], {
    client: successful.client,
    now: NOW,
    cwd: process.cwd(),
    env: {},
    writeStdout: (value) => safeOutput.push(value),
    writeStderr: (value) => safeErrors.push(value),
  })
  assert.equal(success.exitCode, 0)
  assert.equal(safeOutput.length, 1)
  assert.equal(safeErrors.length, 0)
  const summary = JSON.parse(safeOutput[0]) as Record<string, unknown>
  assert.equal(summary.complete, false)
  assert.equal('measurements' in summary, false)
  assert.ok(Buffer.byteLength(safeOutput[0], 'utf8') < 16 * 1024)

  const secret = 'Authorization: Bearer secret-token private-query.example'
  const failedOutput: string[] = []
  const failedErrors: string[] = []
  const failed = makeClient(async (request) => {
    if (request.query === LOCAL_B30_TARGETS[0].query) throw new Error(secret)
    return []
  })
  const failure = await runB30ScorecardCli([
    '--start-date', START_DATE,
    '--end-date', END_DATE,
  ], {
    client: failed.client,
    now: NOW,
    cwd: process.cwd(),
    env: {},
    writeStdout: (value) => failedOutput.push(value),
    writeStderr: (value) => failedErrors.push(value),
  })
  assert.equal(failure.exitCode, 1)
  assert.equal(failedOutput.length, 1)
  assert.equal(failedErrors.length, 0)
  assert.equal(`${failedOutput.join('')}${failedErrors.join('')}`.includes(secret), false)
  assert.deepEqual((JSON.parse(failedOutput[0]) as { errors: unknown }).errors, [
    { targetId: 1, code: 'GSC_REQUEST_FAILED' },
  ])
})

test('the exact package CLI entrypoint loads the server-only GSC adapter without network access', () => {
  const execution = spawnSync(process.execPath, [
    path.resolve('node_modules/tsx/dist/cli.mjs'),
    path.resolve('scripts/seo-local-b30-scorecard.ts'),
    '--start-date',
    '2026-07-14',
    '--end-date',
    '2026-08-10',
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      SEO_DISCOVERY_ENABLED: 'false',
      GSC_INTEGRATION_ENABLED: 'false',
      GOOGLE_APPLICATION_CREDENTIALS: '',
    },
    timeout: 30_000,
  })

  assert.equal(execution.error, undefined)
  assert.equal(execution.status, 1)
  assert.equal(execution.stderr.includes('server-only'), false)
  assert.equal(execution.stderr.includes('Cannot find module'), false)
  const jsonLine = execution.stdout.trim().split(/\r?\n/u).at(-1)
  assert.ok(jsonLine)
  const summary = JSON.parse(jsonLine) as {
    targets: number
    providerFailures: number
  }
  assert.equal(summary.targets, 30)
  assert.equal(summary.providerFailures, 30)
})

test('the entrypoint validates argv before it touches a configured GSC credential', async () => {
  await withTemporaryDirectory(async (directory) => {
    const credential = path.join(directory, 'credential.json')
    const marker = path.join(directory, 'credential-read-marker')
    const bootstrap = path.join(directory, 'credential-read-guard.cjs')
    await writeFile(credential, JSON.stringify({ type: 'service_account' }), 'utf8')
    await writeFile(bootstrap, [
      "const fs = require('node:fs')",
      "const path = require('node:path')",
      "const { syncBuiltinESMExports } = require('node:module')",
      `const credential = ${JSON.stringify(credential)}`,
      `const marker = ${JSON.stringify(marker)}`,
      'const originalReadFileSync = fs.readFileSync',
      'const originalWriteFileSync = fs.writeFileSync',
      'fs.readFileSync = function guardedReadFileSync(candidate, ...arguments_) {',
      "  if (typeof candidate === 'string' && path.resolve(candidate).toLocaleLowerCase('en-US') === path.resolve(credential).toLocaleLowerCase('en-US')) {",
      "    originalWriteFileSync(marker, 'read')",
      "    throw new Error('credential-read-marker')",
      '  }',
      '  return originalReadFileSync.call(this, candidate, ...arguments_)',
      '}',
      'syncBuiltinESMExports()',
      '',
    ].join('\n'), 'utf8')

    const nodeOptions = [
      process.env.NODE_OPTIONS,
      `--require=${bootstrap}`,
    ].filter((value): value is string => Boolean(value)).join(' ')
    const execution = spawnSync(process.execPath, [
      path.resolve('node_modules/tsx/dist/cli.mjs'),
      path.resolve('scripts/seo-local-b30-scorecard.ts'),
      '--unknown-flag',
      'value',
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions,
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GOOGLE_APPLICATION_CREDENTIALS: credential,
      },
      timeout: 30_000,
    })

    assert.equal(execution.error, undefined)
    assert.equal(execution.status, 1)
    assert.match(execution.stderr, /^SEO_LOCAL_B30_INVALID_ARGUMENTS\n$/u)
    await assert.rejects(stat(marker), { code: 'ENOENT' })
  })
})

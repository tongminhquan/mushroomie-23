import { LOCAL_B30_TARGETS } from '../local-seo-b30'
import {
  validateRankObservation,
  type RankObservation,
} from './scorecard'

export const RANK_OBSERVATION_COLUMNS = [
  'query',
  'owner_url',
  'organic_position',
  'local_pack_position',
  'location',
  'country',
  'language',
  'device',
  'measured_at',
  'source',
] as const

export const RANK_CSV_MAX_BYTES = 256 * 1024
export const RANK_CSV_MAX_OBSERVATIONS = 1_000

const CONTROL_CHARACTER = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/u
const FORMULA_PREFIX = /^\s*[=+\-@]/u
const CANONICAL_POSITION = /^[1-9]\d*$/u

type CsvState = 'unquoted' | 'quoted' | 'after-quote'

function fail(code: string): never {
  throw new Error(code)
}

function assertBoundedInput(input: unknown): asserts input is string {
  if (typeof input !== 'string') {
    fail('SEO_LOCAL_B30_CSV_MALFORMED')
  }
  if (Buffer.byteLength(input, 'utf8') > RANK_CSV_MAX_BYTES) {
    fail('SEO_LOCAL_B30_CSV_TOO_LARGE')
  }
  if (input.includes('\ufeff')) {
    fail('SEO_LOCAL_B30_CSV_BOM')
  }
  if (CONTROL_CHARACTER.test(input)) {
    fail('SEO_LOCAL_B30_CSV_CONTROL_CHARACTER')
  }
}

export function parseBoundedCsvRows(input: string): string[][] {
  assertBoundedInput(input)

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let state: CsvState = 'unquoted'
  let endedWithRecordDelimiter = false

  const appendRow = () => {
    row.push(field)
    rows.push(row)
    if (rows.length > RANK_CSV_MAX_OBSERVATIONS + 1) {
      fail('SEO_LOCAL_B30_CSV_TOO_MANY_ROWS')
    }
    row = []
    field = ''
    state = 'unquoted'
  }

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]
    endedWithRecordDelimiter = false

    if (state === 'quoted') {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          state = 'after-quote'
        }
      } else if (character === '\r') {
        if (input[index + 1] !== '\n') {
          fail('SEO_LOCAL_B30_CSV_MALFORMED')
        }
        field += '\r\n'
        index += 1
      } else {
        field += character
      }
      continue
    }

    if (state === 'after-quote') {
      if (character === ',') {
        row.push(field)
        field = ''
        state = 'unquoted'
      } else if (character === '\n') {
        appendRow()
        endedWithRecordDelimiter = true
      } else if (character === '\r') {
        if (input[index + 1] !== '\n') {
          fail('SEO_LOCAL_B30_CSV_MALFORMED')
        }
        appendRow()
        endedWithRecordDelimiter = true
        index += 1
      } else {
        fail('SEO_LOCAL_B30_CSV_MALFORMED')
      }
      continue
    }

    if (character === '"') {
      if (field.length !== 0) {
        fail('SEO_LOCAL_B30_CSV_MALFORMED')
      }
      state = 'quoted'
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      appendRow()
      endedWithRecordDelimiter = true
    } else if (character === '\r') {
      if (input[index + 1] !== '\n') {
        fail('SEO_LOCAL_B30_CSV_MALFORMED')
      }
      appendRow()
      endedWithRecordDelimiter = true
      index += 1
    } else {
      field += character
    }
  }

  if (state === 'quoted') {
    fail('SEO_LOCAL_B30_CSV_MALFORMED')
  }
  if (input.length > 0 && !endedWithRecordDelimiter) {
    appendRow()
  }

  return rows
}

function parsePosition(value: string): number | null {
  if (value === '') return null
  if (!CANONICAL_POSITION.test(value)) {
    fail('SEO_LOCAL_B30_CSV_POSITION')
  }

  const position = Number(value)
  if (!Number.isSafeInteger(position) || position < 1) {
    fail('SEO_LOCAL_B30_CSV_POSITION')
  }
  return position
}

function hasExactHeader(header: readonly string[]): boolean {
  return header.length === RANK_OBSERVATION_COLUMNS.length
    && header.every((column, index) => column === RANK_OBSERVATION_COLUMNS[index])
}

function identityOf(observation: RankObservation): string {
  return [
    observation.query,
    observation.measuredAt,
    observation.country,
    observation.language,
    observation.device,
    observation.location,
  ].join('\u0000')
}

function contentOf(observation: RankObservation): string {
  return [
    observation.query,
    observation.ownerUrl,
    observation.organicPosition ?? '',
    observation.localPackPosition ?? '',
    observation.location,
    observation.country,
    observation.language,
    observation.device,
    observation.measuredAt,
    observation.source,
  ].join('\u0000')
}

export function parseRankObservationsCsv(
  input: string,
  asOfDate: string,
): RankObservation[] {
  const rows = parseBoundedCsvRows(input)
  const header = rows[0]
  if (header === undefined || !hasExactHeader(header)) {
    fail('SEO_LOCAL_B30_CSV_HEADER')
  }

  const observations: RankObservation[] = []
  const seen = new Map<string, string>()

  for (const cells of rows.slice(1)) {
    if (cells.length !== RANK_OBSERVATION_COLUMNS.length) {
      fail('SEO_LOCAL_B30_CSV_COLUMN_COUNT')
    }

    for (const index of [0, 1, 4, 5, 6, 7, 8, 9]) {
      if (FORMULA_PREFIX.test(cells[index])) {
        fail('SEO_LOCAL_B30_CSV_FORMULA')
      }
    }

    const target = LOCAL_B30_TARGETS.find((candidate) => (
      candidate.query === cells[0]
    ))
    if (target === undefined) {
      fail('SEO_LOCAL_B30_CSV_UNKNOWN_QUERY')
    }

    const candidate = {
      query: cells[0],
      ownerUrl: cells[1],
      organicPosition: parsePosition(cells[2]),
      localPackPosition: parsePosition(cells[3]),
      location: cells[4],
      country: cells[5],
      language: cells[6],
      device: cells[7],
      measuredAt: cells[8],
      source: cells[9],
    }
    const validated = validateRankObservation(target, candidate, asOfDate)
    if (validated === null) {
      fail('SEO_LOCAL_B30_CSV_INVALID_OBSERVATION')
    }

    const identity = identityOf(validated)
    const content = contentOf(validated)
    const previous = seen.get(identity)
    if (previous !== undefined) {
      fail(previous === content
        ? 'SEO_LOCAL_B30_CSV_DUPLICATE_OBSERVATION'
        : 'SEO_LOCAL_B30_CSV_CONFLICTING_OBSERVATION')
    }
    seen.set(identity, content)
    observations.push(validated)
  }

  return observations
}

export function escapeCsvCell(value: string | number | boolean | null): string {
  const raw = value === null ? '' : String(value)
  const safe = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw
  return /[",\r\n]/u.test(safe)
    ? `"${safe.replaceAll('"', '""')}"`
    : safe
}

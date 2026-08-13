import {
  LOCAL_B30_TARGETS,
  type LocalB30Target,
} from '@/lib/local-seo-b30'
import type { SearchAnalyticsRow } from '@/lib/seo-discovery/gsc-client'

const PRODUCTION_ORIGIN = 'https://mushroomie.io.vn'
const MILLISECONDS_PER_DAY = 86_400_000
const STRICT_ISO_DATE = /^(?!0000)(\d{4})-(\d{2})-(\d{2})$/
const AMBIGUOUS_UNICODE =
  /[\u0000-\u001f\u007f-\u009f\u00ad\u034f\u061c\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/u

const RANK_OBSERVATION_KEYS = [
  'country',
  'device',
  'language',
  'localPackPosition',
  'location',
  'measuredAt',
  'organicPosition',
  'ownerUrl',
  'query',
  'source',
] as const

export interface RankObservation {
  query: string
  ownerUrl: string
  organicPosition: number | null
  localPackPosition: number | null
  location: string
  country: 'VN'
  language: 'vi'
  device: 'mobile' | 'desktop'
  measuredAt: string
  source: 'rank-tracker' | 'manual-serp'
}

export interface KeywordMeasurement {
  targetId: number
  query: string
  ownerUrl: string
  gsc: {
    clicks: number
    impressions: number
    ctr: number
    averagePosition: number | null
  }
  observedPages: readonly string[]
  ownerConflict: boolean
  rankEvidenceStatus: 'missing' | 'insufficient' | 'invalid' | 'verified'
  organicTopOne: boolean
  localPackPosition: number | null
}

export interface B30SuccessEvaluation {
  complete: boolean
}

export function normalizeSearchQuery(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\s+/gu, ' ')
    .trim()
    .toLocaleLowerCase('vi')
}

function canonicalOwnerUrl(target: LocalB30Target): string {
  return `${PRODUCTION_ORIGIN}${target.ownerHref}`
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isValidRankPosition(value: unknown): value is number | null {
  return value === null || (
    typeof value === 'number'
    && Number.isFinite(value)
    && Number.isInteger(value)
    && value >= 1
  )
}

function parseStrictIsoDate(value: unknown): number | null {
  if (typeof value !== 'string' || !STRICT_ISO_DATE.test(value)) {
    return null
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(timestamp)) {
    return null
  }

  return new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null
}

function hasExactObservationKeys(value: Record<string, unknown>): boolean {
  const keys = Reflect.ownKeys(value)
  if (keys.some((key) => typeof key !== 'string')) {
    return false
  }

  const sortedKeys = (keys as string[]).sort()
  if (
    sortedKeys.length !== RANK_OBSERVATION_KEYS.length
    || sortedKeys.some((key, index) => key !== RANK_OBSERVATION_KEYS[index])
  ) {
    return false
  }

  const descriptors = Object.getOwnPropertyDescriptors(value)
  return RANK_OBSERVATION_KEYS.every((key) => {
    const descriptor = descriptors[key]
    return descriptor !== undefined
      && descriptor.enumerable === true
      && 'value' in descriptor
  })
}

function isUnambiguousExactString(
  value: unknown,
  expected: string,
): value is string {
  return typeof value === 'string'
    && value === expected
    && value === value.normalize('NFC')
    && !AMBIGUOUS_UNICODE.test(value)
}

function canonicalizeObservedPage(value: string): string | null {
  if (AMBIGUOUS_UNICODE.test(value) || value.includes('#')) {
    return null
  }

  const queryStart = value.indexOf('?')
  const pageWithoutQuery = queryStart === -1
    ? value
    : value.slice(0, queryStart)
  const boundary = pageWithoutQuery.slice(
    PRODUCTION_ORIGIN.length,
    PRODUCTION_ORIGIN.length + 1,
  )

  if (
    !pageWithoutQuery.startsWith(PRODUCTION_ORIGIN)
    || (boundary !== '' && boundary !== '/')
  ) {
    return null
  }

  const rawPath = pageWithoutQuery.slice(PRODUCTION_ORIGIN.length) || '/'
  if (
    rawPath.includes('%')
    || rawPath.includes('\\')
    || rawPath.includes('//')
    || rawPath === '/.'
    || rawPath === '/..'
    || rawPath.includes('/./')
    || rawPath.includes('/../')
  ) {
    return null
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }

  if (
    parsed.protocol !== 'https:'
    || parsed.hostname !== 'mushroomie.io.vn'
    || parsed.host !== 'mushroomie.io.vn'
    || parsed.username !== ''
    || parsed.password !== ''
    || parsed.port !== ''
    || parsed.hash !== ''
    || parsed.pathname !== rawPath
  ) {
    return null
  }

  const canonicalPath = rawPath.length > 1 && rawPath.endsWith('/')
    ? rawPath.slice(0, -1)
    : rawPath
  return `${PRODUCTION_ORIGIN}${canonicalPath}`
}

function isSearchAnalyticsRow(value: unknown): value is SearchAnalyticsRow {
  if (!isPlainRecord(value)) {
    return false
  }

  return typeof value.query === 'string'
    && typeof value.page === 'string'
    && (
      value.device === 'DESKTOP'
      || value.device === 'MOBILE'
      || value.device === 'TABLET'
    )
    && isFiniteNonNegative(value.clicks)
    && isFiniteNonNegative(value.impressions)
    && isFiniteNonNegative(value.ctr)
    && value.ctr <= 1
    && isFiniteNonNegative(value.position)
    && (
      value.impressions === 0
      || Number.isFinite(value.clicks / value.impressions)
    )
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareNumber(left: number, right: number): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareMetricRows(
  left: { page: string; row: SearchAnalyticsRow },
  right: { page: string; row: SearchAnalyticsRow },
): number {
  return compareText(left.page, right.page)
    || compareText(left.row.device, right.row.device)
    || compareNumber(left.row.clicks, right.row.clicks)
    || compareNumber(left.row.impressions, right.row.impressions)
    || compareNumber(left.row.position, right.row.position)
    || compareNumber(left.row.ctr, right.row.ctr)
}

function aggregateSearchAnalytics(
  target: LocalB30Target,
  rows: readonly SearchAnalyticsRow[],
): Pick<KeywordMeasurement, 'gsc' | 'observedPages' | 'ownerConflict'> {
  const normalizedTargetQuery = normalizeSearchQuery(target.query)
  const ownerUrl = canonicalOwnerUrl(target)
  const observedPages = new Set<string>()
  const metricRows: Array<{ page: string; row: SearchAnalyticsRow }> = []
  let clicks = 0
  let impressions = 0
  let weightedPosition = 0
  let ownerConflict = false

  for (const candidate of rows as readonly unknown[]) {
    if (
      !isPlainRecord(candidate)
      || typeof candidate.query !== 'string'
      || normalizeSearchQuery(candidate.query) !== normalizedTargetQuery
    ) {
      continue
    }

    const page = typeof candidate.page === 'string'
      ? canonicalizeObservedPage(candidate.page)
      : null
    const hasPositiveImpressions = isFiniteNonNegative(candidate.impressions)
      && candidate.impressions > 0

    if (page !== null) {
      observedPages.add(page)
    }
    if (hasPositiveImpressions && page !== ownerUrl) {
      ownerConflict = true
    }

    if (page === null || !isSearchAnalyticsRow(candidate)) {
      continue
    }

    metricRows.push({ page, row: candidate })
  }

  metricRows.sort(compareMetricRows)
  for (const { row } of metricRows) {
    const nextClicks = clicks + row.clicks
    const nextImpressions = impressions + row.impressions
    const nextWeightedPosition = weightedPosition
      + (row.position * row.impressions)
    const nextCtr = nextImpressions === 0
      ? 0
      : nextClicks / nextImpressions
    if (
      !Number.isFinite(nextClicks)
      || !Number.isFinite(nextImpressions)
      || !Number.isFinite(nextWeightedPosition)
      || !Number.isFinite(nextCtr)
    ) {
      continue
    }

    clicks = nextClicks
    impressions = nextImpressions
    weightedPosition = nextWeightedPosition
  }

  return {
    gsc: {
      clicks,
      impressions,
      ctr: impressions === 0 ? 0 : clicks / impressions,
      averagePosition: impressions === 0
        ? null
        : weightedPosition / impressions,
    },
    observedPages: [...observedPages].sort(),
    ownerConflict,
  }
}

export function validateRankObservation(
  target: LocalB30Target,
  value: unknown,
  asOfDate: string,
): RankObservation | null {
  const asOfTimestamp = parseStrictIsoDate(asOfDate)
  if (
    asOfTimestamp === null
    || !isPlainRecord(value)
    || !hasExactObservationKeys(value)
  ) {
    return null
  }

  const measuredAtTimestamp = parseStrictIsoDate(value.measuredAt)
  if (
    measuredAtTimestamp === null
    || typeof value.measuredAt !== 'string'
    || measuredAtTimestamp > asOfTimestamp
    || !isUnambiguousExactString(value.query, target.query)
    || !isUnambiguousExactString(value.ownerUrl, canonicalOwnerUrl(target))
    || !isUnambiguousExactString(value.location, target.area)
    || value.country !== 'VN'
    || value.language !== 'vi'
    || (value.device !== 'mobile' && value.device !== 'desktop')
    || (value.source !== 'rank-tracker' && value.source !== 'manual-serp')
    || !isValidRankPosition(value.organicPosition)
    || !isValidRankPosition(value.localPackPosition)
  ) {
    return null
  }

  return {
    query: value.query,
    ownerUrl: value.ownerUrl,
    organicPosition: value.organicPosition,
    localPackPosition: value.localPackPosition,
    location: value.location,
    country: value.country,
    language: value.language,
    device: value.device,
    measuredAt: value.measuredAt,
    source: value.source,
  }
}

function dayGap(earlier: RankObservation, later: RankObservation): number {
  const earlierTimestamp = parseStrictIsoDate(earlier.measuredAt)
  const laterTimestamp = parseStrictIsoDate(later.measuredAt)
  if (earlierTimestamp === null || laterTimestamp === null) {
    return Number.NaN
  }

  return (laterTimestamp - earlierTimestamp) / MILLISECONDS_PER_DAY
}

function hasDuplicateOrConflictingObservations(
  observations: readonly RankObservation[],
): boolean {
  const seenDateProfiles = new Set<string>()

  for (const observation of observations) {
    const key = `${observation.device}\u0000${observation.measuredAt}`
    if (seenDateProfiles.has(key)) {
      return true
    }
    seenDateProfiles.add(key)
  }

  const byProfile = new Map<RankObservation['device'], RankObservation[]>()
  for (const observation of observations) {
    const profile = byProfile.get(observation.device) ?? []
    profile.push(observation)
    byProfile.set(observation.device, profile)
  }

  for (const profile of byProfile.values()) {
    const ordered = [...profile].sort((left, right) => (
      left.measuredAt.localeCompare(right.measuredAt)
    ))
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]
      const current = ordered[index]
      const gap = dayGap(previous, current)
      const ranksConflict = previous.organicPosition !== current.organicPosition
        || previous.localPackPosition !== current.localPackPosition
      if (gap > 0 && gap < 6 && ranksConflict) {
        return true
      }
    }
  }

  return false
}

function evaluateRankEvidence(
  target: LocalB30Target,
  observations: readonly unknown[],
  asOfDate: string,
): Pick<
  KeywordMeasurement,
  'rankEvidenceStatus' | 'organicTopOne' | 'localPackPosition'
> {
  if (observations.length === 0) {
    return {
      rankEvidenceStatus: parseStrictIsoDate(asOfDate) === null
        ? 'invalid'
        : 'missing',
      organicTopOne: false,
      localPackPosition: null,
    }
  }

  const validObservations: RankObservation[] = []
  let malformed = false
  for (const observation of observations) {
    const validated = validateRankObservation(target, observation, asOfDate)
    if (validated === null) {
      malformed = true
    } else {
      validObservations.push(validated)
    }
  }

  const requiredProfile = validObservations
    .filter((observation) => observation.device === 'mobile')
    .sort((left, right) => left.measuredAt.localeCompare(right.measuredAt))
  const sources = new Set(requiredProfile.map((observation) => observation.source))
  const conflicting = hasDuplicateOrConflictingObservations(validObservations)
  const latestRequiredObservation = requiredProfile.at(-1)
  const latestRequiredDate = latestRequiredObservation?.measuredAt
  const latestRequiredDateObservations = latestRequiredDate === undefined
    ? []
    : requiredProfile.filter((observation) => (
        observation.measuredAt === latestRequiredDate
      ))
  const localPackPosition = latestRequiredDateObservations.length === 1
    ? latestRequiredDateObservations[0].localPackPosition
    : null

  if (malformed || conflicting || sources.size > 1) {
    return {
      rankEvidenceStatus: 'invalid',
      organicTopOne: false,
      localPackPosition,
    }
  }

  const latestThree = requiredProfile.slice(-3)
  const consecutive = latestThree.length === 3
    && latestThree.slice(1).every((observation, index) => {
      const gap = dayGap(latestThree[index], observation)
      return gap >= 6 && gap <= 8
    })
  const organicTopOne = consecutive
    && latestThree.every((observation) => observation.organicPosition === 1)

  return {
    rankEvidenceStatus: organicTopOne ? 'verified' : 'insufficient',
    organicTopOne,
    localPackPosition,
  }
}

export function buildKeywordMeasurement(
  target: LocalB30Target,
  rows: readonly SearchAnalyticsRow[],
  observations: readonly unknown[],
  asOfDate: string,
): KeywordMeasurement {
  const analytics = aggregateSearchAnalytics(target, rows)
  const rankEvidence = evaluateRankEvidence(target, observations, asOfDate)

  return {
    targetId: target.id,
    query: target.query,
    ownerUrl: canonicalOwnerUrl(target),
    ...analytics,
    ...rankEvidence,
  }
}

export function evaluateB30Success(
  measurements: readonly KeywordMeasurement[],
): B30SuccessEvaluation {
  if (measurements.length !== LOCAL_B30_TARGETS.length) {
    return { complete: false }
  }

  const expectedTargets = new Map<number, LocalB30Target>(
    LOCAL_B30_TARGETS.map((target) => [target.id, target] as const),
  )
  const seenIds = new Set<number>()

  for (const candidate of measurements as readonly unknown[]) {
    if (
      !isPlainRecord(candidate)
      || typeof candidate.targetId !== 'number'
      || !Number.isInteger(candidate.targetId)
    ) {
      return { complete: false }
    }

    const target = expectedTargets.get(candidate.targetId)
    if (
      target === undefined
      || seenIds.has(candidate.targetId)
      || candidate.query !== target.query
      || candidate.ownerUrl !== canonicalOwnerUrl(target)
      || candidate.rankEvidenceStatus !== 'verified'
      || candidate.organicTopOne !== true
      || candidate.ownerConflict !== false
    ) {
      return { complete: false }
    }

    seenIds.add(candidate.targetId)
  }

  return { complete: seenIds.size === LOCAL_B30_TARGETS.length }
}

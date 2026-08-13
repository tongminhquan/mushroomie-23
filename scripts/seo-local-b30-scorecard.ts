#!/usr/bin/env tsx

import {
  lstat,
  open,
  realpath,
  rename,
  rm,
  stat,
} from 'node:fs/promises'
import { constants } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { LOCAL_B30_TARGETS } from '../src/lib/local-seo-b30'
import type {
  GoogleSearchConsoleAnalyticsClient,
  SearchAnalyticsRow,
} from '../src/lib/seo-discovery/gsc-client'
import {
  escapeCsvCell,
  parseRankObservationsCsv,
  RANK_CSV_MAX_BYTES,
} from '../src/lib/seo-local/csv'
import {
  buildKeywordMeasurement,
  evaluateB30Success,
  validateRankObservation,
  type KeywordMeasurement,
  type RankObservation,
} from '../src/lib/seo-local/scorecard'

const DAY_MS = 86_400_000
const FINALIZATION_LAG_DAYS = 3
const DEFAULT_WINDOW_DAYS = 28
const MAX_SUPPORTED_WINDOW_DAYS = 90
const STRICT_DATE = /^(?!0000)\d{4}-\d{2}-\d{2}$/u
const REPORT_JSON = 'b30-scorecard.json'
const REPORT_CSV = 'b30-scorecard.csv'
const RANK_INPUT_OPEN_FLAGS = process.platform === 'win32'
  ? constants.O_RDONLY
  : constants.O_RDONLY | constants.O_NOFOLLOW

export interface RunB30ScorecardOptions {
  startDate: string
  endDate: string
  client: Pick<GoogleSearchConsoleAnalyticsClient, 'querySearchAnalytics'>
  rankObservations: readonly RankObservation[]
  outputDir?: string
  concurrency?: 1 | 2
  now?: Date
}

export interface B30ScorecardError {
  targetId: number
  code: 'GSC_REQUEST_FAILED'
}

export interface B30ScorecardResult {
  startDate: string
  endDate: string
  generatedAt: string
  measurements: readonly KeywordMeasurement[]
  errors: readonly B30ScorecardError[]
  complete: boolean
  summary: {
    targets: number
    gscRequests: number
    providerFailures: number
    ownerConflicts: number
    verifiedOrganicTopOne: number
    missingRankEvidence: number
    insufficientRankEvidence: number
    invalidRankEvidence: number
  }
}

export interface ParsedB30ScorecardArguments {
  startDate: string
  endDate: string
  rankInput?: string
  outputDir?: string
  concurrency: 1 | 2
}

export interface RunB30ScorecardCliDependencies {
  client: Pick<GoogleSearchConsoleAnalyticsClient, 'querySearchAnalytics'>
  now?: Date
  cwd?: string
  env?: Readonly<Record<string, string | undefined>>
  writeStdout?: (value: string) => void
  writeStderr?: (value: string) => void
}

export interface RunB30ScorecardCliOutcome {
  exitCode: 0 | 1
  result?: B30ScorecardResult
}

function fail(code: string): never {
  throw new Error(code)
}

function parseDate(value: string): number | null {
  if (!STRICT_DATE.test(value)) return null
  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(timestamp)) return null
  return new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null
}

function dateAtUtcMidnight(value: Date): number {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    fail('SEO_LOCAL_B30_INVALID_DATE_RANGE')
  }
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function validateDateRange(startDate: string, endDate: string, now: Date): void {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (start === null || end === null || start > end) {
    fail('SEO_LOCAL_B30_INVALID_DATE_RANGE')
  }

  const latestFinalDate = dateAtUtcMidnight(now) - (FINALIZATION_LAG_DAYS * DAY_MS)
  if (end > latestFinalDate) {
    fail('SEO_LOCAL_B30_UNFINALIZED_DATE_RANGE')
  }

  const inclusiveDays = ((end - start) / DAY_MS) + 1
  if (!Number.isInteger(inclusiveDays) || inclusiveDays > MAX_SUPPORTED_WINDOW_DAYS) {
    fail('SEO_LOCAL_B30_UNSUPPORTED_DATE_WINDOW')
  }
}

function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate)
  return relative === '' || (
    relative !== '..'
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  )
}

function sameResolvedPath(left: string, right: string): boolean {
  const resolvedLeft = path.resolve(left)
  const resolvedRight = path.resolve(right)
  return process.platform === 'win32'
    ? resolvedLeft.toLocaleLowerCase('en-US') === resolvedRight.toLocaleLowerCase('en-US')
    : resolvedLeft === resolvedRight
}

interface SafeOutputDirectory {
  configuredPath: string
  canonicalPath: string
  device: number
  inode: number
}

function hasSameDirectoryIdentity(
  left: SafeOutputDirectory,
  right: SafeOutputDirectory,
): boolean {
  return left.device === right.device && left.inode === right.inode
}

async function assertExistingSafeDirectory(
  directory: string,
): Promise<SafeOutputDirectory> {
  const directoryStat = await lstat(directory)
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
  const canonicalPath = await realpath(directory)
  if (!sameResolvedPath(canonicalPath, directory)) {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
  return {
    configuredPath: path.resolve(directory),
    canonicalPath,
    device: directoryStat.dev,
    inode: directoryStat.ino,
  }
}

async function assertSafeOutputDirectoryIdentity(
  identity: SafeOutputDirectory,
): Promise<void> {
  const current = await assertExistingSafeDirectory(identity.configuredPath)
  if (
    !sameResolvedPath(current.canonicalPath, identity.canonicalPath)
    || !hasSameDirectoryIdentity(identity, current)
  ) {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
}

async function ensureSafeOutputDirectory(
  configuredDirectory: string,
  repositoryRoot = process.cwd(),
): Promise<SafeOutputDirectory> {
  if (typeof configuredDirectory !== 'string' || configuredDirectory.trim() === '') {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }

  const absoluteDirectory = path.resolve(configuredDirectory)
  const publicDirectory = path.resolve(repositoryRoot, 'public')
  if (isPathInside(publicDirectory, absoluteDirectory)) {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }

  // Safe report publication is deliberately Linux-only. On that platform we
  // bind every mutation below to an already-open directory descriptor; Node's
  // pathname APIs alone cannot close the check/use window on junction swaps.
  if (process.platform !== 'linux') {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }

  try {
    return await assertExistingSafeDirectory(absoluteDirectory)
  } catch (error) {
    if (error instanceof Error && error.message === 'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED') {
      throw error
    }
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
}

async function sameCanonicalPath(left: string, right: string): Promise<boolean> {
  if (path.resolve(left) === path.resolve(right)) return true
  try {
    return await realpath(left) === await realpath(right)
  } catch {
    return false
  }
}

async function rejectOutputCollisions(
  outputDirectory: string,
  protectedPaths: readonly (string | undefined)[],
): Promise<void> {
  const outputs = [
    path.join(outputDirectory, REPORT_JSON),
    path.join(outputDirectory, REPORT_CSV),
  ]
  for (const protectedPath of protectedPaths) {
    if (!protectedPath) continue
    for (const output of outputs) {
      if (await sameCanonicalPath(output, protectedPath)) {
        fail('SEO_LOCAL_B30_OUTPUT_COLLISION')
      }
    }
  }

  for (const output of outputs) {
    try {
      const outputStat = await lstat(output)
      if (!outputStat.isFile() || outputStat.isSymbolicLink()) {
        fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== 'ENOENT') throw error
    }
  }
}

interface BoundOutputDirectory {
  identity: SafeOutputDirectory
  handle: Awaited<ReturnType<typeof open>>
  operationsPath: string
}

interface PreparedOutputFile {
  destinationName: string
  temporaryName: string
}

interface OutputBackup {
  destinationName: string
  backupName?: string
}

function isSafeOutputName(fileName: string): boolean {
  return fileName.length > 0
    && fileName !== '.'
    && fileName !== '..'
    && path.posix.basename(fileName) === fileName
    && path.win32.basename(fileName) === fileName
}

function boundOutputPath(
  directory: BoundOutputDirectory,
  fileName: string,
): string {
  if (!isSafeOutputName(fileName)) {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
  return path.posix.join(directory.operationsPath, fileName)
}

function hiddenSiblingName(
  destinationName: string,
  suffix: 'tmp' | 'backup',
): string {
  if (!isSafeOutputName(destinationName)) {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
  return `.${destinationName}.${process.pid}.${crypto.randomUUID()}.${suffix}`
}

function hasBoundOutputDirectoryIdentity(
  identity: SafeOutputDirectory,
  candidate: Awaited<ReturnType<typeof stat>>,
): boolean {
  return candidate.isDirectory()
    && candidate.dev === identity.device
    && candidate.ino === identity.inode
}

async function bindSafeOutputDirectory(
  identity: SafeOutputDirectory,
): Promise<BoundOutputDirectory> {
  if (process.platform !== 'linux') {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }

  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    await assertSafeOutputDirectoryIdentity(identity)
    handle = await open(
      identity.configuredPath,
      constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
    )
    const opened = await handle.stat()
    if (!hasBoundOutputDirectoryIdentity(identity, opened)) {
      fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
    }

    const operationsPath = `/proc/self/fd/${handle.fd}`
    const procDirectory = await stat(operationsPath)
    if (!hasBoundOutputDirectoryIdentity(identity, procDirectory)) {
      fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
    }

    return { identity, handle, operationsPath }
  } catch (error) {
    await handle?.close().catch(() => undefined)
    if (
      error instanceof Error
      && error.message === 'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED'
    ) {
      throw error
    }
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
}

async function assertBoundOutputDirectoryIdentity(
  directory: BoundOutputDirectory,
): Promise<void> {
  const current = await directory.handle.stat()
  if (!hasBoundOutputDirectoryIdentity(directory.identity, current)) {
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }
}

function isSafeOutputFile(stat: Awaited<ReturnType<typeof lstat>>): boolean {
  return stat.isFile() && !stat.isSymbolicLink()
}

async function removeOwnedOutputFile(
  fileName: string,
  outputDirectory: BoundOutputDirectory,
): Promise<void> {
  const filePath = boundOutputPath(outputDirectory, fileName)
  await assertBoundOutputDirectoryIdentity(outputDirectory)
  try {
    const fileStat = await lstat(filePath)
    if (!isSafeOutputFile(fileStat)) {
      fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
    }
    await rm(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
    throw error
  }
}

async function prepareOutputFile(
  destinationName: string,
  content: string,
  outputDirectory: BoundOutputDirectory,
): Promise<PreparedOutputFile> {
  const temporaryName = hiddenSiblingName(destinationName, 'tmp')
  const temporary = boundOutputPath(outputDirectory, temporaryName)
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    await assertBoundOutputDirectoryIdentity(outputDirectory)
    handle = await open(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    )
    await handle.writeFile(content, { encoding: 'utf8' })
    await handle.sync()
    await handle.close()
    handle = undefined
    await assertBoundOutputDirectoryIdentity(outputDirectory)
    return { destinationName, temporaryName }
  } catch (error) {
    try {
      await handle?.close()
    } catch {
      // Preserve the bounded error below.
    }
    try {
      await removeOwnedOutputFile(temporaryName, outputDirectory)
    } catch {
      // A descriptor-bound cleanup failure never falls back to a pathname.
    }
    if (
      error instanceof Error
      && error.message === 'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED'
    ) {
      throw error
    }
    fail('SEO_LOCAL_B30_OUTPUT_WRITE_FAILED')
  }
}

async function moveExistingOutputToBackup(
  destinationName: string,
  outputDirectory: BoundOutputDirectory,
): Promise<OutputBackup> {
  const destination = boundOutputPath(outputDirectory, destinationName)
  try {
    const existing = await lstat(destination)
    if (!isSafeOutputFile(existing)) {
      fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { destinationName }
    }
    throw error
  }

  const backupName = hiddenSiblingName(destinationName, 'backup')
  const backup = boundOutputPath(outputDirectory, backupName)
  await assertBoundOutputDirectoryIdentity(outputDirectory)
  await rename(destination, backup)
  return { destinationName, backupName }
}

async function restoreOutputBackups(
  backups: readonly OutputBackup[],
  publishedDestinations: ReadonlySet<string>,
  prepared: readonly PreparedOutputFile[],
  outputDirectory: BoundOutputDirectory,
): Promise<void> {
  for (const destinationName of publishedDestinations) {
    await removeOwnedOutputFile(destinationName, outputDirectory)
  }
  for (const backup of [...backups].reverse()) {
    if (backup.backupName === undefined) continue
    await assertBoundOutputDirectoryIdentity(outputDirectory)
    await rename(
      boundOutputPath(outputDirectory, backup.backupName),
      boundOutputPath(outputDirectory, backup.destinationName),
    )
  }
  for (const file of prepared) {
    await removeOwnedOutputFile(file.temporaryName, outputDirectory)
  }
}

function isBoundedOutputError(error: unknown): error is Error {
  return error instanceof Error && (
    error.message === 'SEO_LOCAL_B30_OUTPUT_PATH_REJECTED'
    || error.message === 'SEO_LOCAL_B30_OUTPUT_COLLISION'
  )
}

async function publishScorecardReports(
  outputDirectory: SafeOutputDirectory,
  json: string,
  csv: string,
): Promise<void> {
  const destinationNames = [REPORT_JSON, REPORT_CSV]
  const prepared: PreparedOutputFile[] = []
  const backups: OutputBackup[] = []
  const publishedDestinations = new Set<string>()
  let boundDirectory: BoundOutputDirectory | undefined
  let committed = false

  try {
    boundDirectory = await bindSafeOutputDirectory(outputDirectory)
    prepared.push(await prepareOutputFile(destinationNames[0], json, boundDirectory))
    prepared.push(await prepareOutputFile(destinationNames[1], csv, boundDirectory))
    await assertSafeOutputDirectoryIdentity(outputDirectory)
    await rejectOutputCollisions(outputDirectory.configuredPath, [])
    for (const destinationName of destinationNames) {
      backups.push(await moveExistingOutputToBackup(destinationName, boundDirectory))
    }
    for (const file of prepared) {
      await assertBoundOutputDirectoryIdentity(boundDirectory)
      await rename(
        boundOutputPath(boundDirectory, file.temporaryName),
        boundOutputPath(boundDirectory, file.destinationName),
      )
      publishedDestinations.add(file.destinationName)
    }
    // Once both final names have been replaced, the report pair is committed.
    // No later cleanup or validation error may roll this pair back.
    committed = true
  } catch (error) {
    if (boundDirectory !== undefined && !committed) {
      try {
        await restoreOutputBackups(
          backups,
          publishedDestinations,
          prepared,
          boundDirectory,
        )
      } catch {
        // Keep the primary bounded publication error; recovery is descriptor-
        // bound and never falls back to an attacker-controlled pathname.
      }
    }
    if (boundDirectory !== undefined) {
      await boundDirectory.handle.close().catch(() => undefined)
    }
    try {
      await assertSafeOutputDirectoryIdentity(outputDirectory)
    } catch {
      fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
    }
    if (isBoundedOutputError(error)) {
      throw error
    }
    fail('SEO_LOCAL_B30_OUTPUT_WRITE_FAILED')
  }

  try {
    // A swap after commit is reported, but cannot redirect the descriptor-bound
    // report pair or trigger rollback of the committed files.
    await assertSafeOutputDirectoryIdentity(outputDirectory)
  } catch {
    await boundDirectory?.handle.close().catch(() => undefined)
    fail('SEO_LOCAL_B30_OUTPUT_PATH_REJECTED')
  }

  for (const backup of backups) {
    if (backup.backupName === undefined) continue
    await removeOwnedOutputFile(backup.backupName, boundDirectory!).catch(() => undefined)
  }
  await boundDirectory?.handle.close().catch(() => undefined)
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: 1 | 2,
  mapper: (value: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await mapper(values[index], index)
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(concurrency, values.length) },
    () => worker(),
  ))
  return results
}

function groupValidatedObservations(
  observations: readonly RankObservation[],
  asOfDate: string,
): Map<number, RankObservation[]> {
  const grouped = new Map<number, RankObservation[]>(
    LOCAL_B30_TARGETS.map((target) => [target.id, []]),
  )
  const seen = new Map<string, string>()

  for (const observation of observations as readonly unknown[]) {
    const target = LOCAL_B30_TARGETS.find((candidate) => (
      typeof observation === 'object'
      && observation !== null
      && 'query' in observation
      && candidate.query === observation.query
    ))
    if (target === undefined) {
      fail('SEO_LOCAL_B30_INVALID_RANK_OBSERVATION')
    }
    const validated = validateRankObservation(target, observation, asOfDate)
    if (validated === null) {
      fail('SEO_LOCAL_B30_INVALID_RANK_OBSERVATION')
    }

    const identity = [
      validated.query,
      validated.measuredAt,
      validated.country,
      validated.language,
      validated.device,
      validated.location,
    ].join('\u0000')
    const content = JSON.stringify(validated)
    if (seen.has(identity)) {
      fail('SEO_LOCAL_B30_INVALID_RANK_OBSERVATION')
    }
    seen.set(identity, content)
    grouped.get(target.id)!.push(validated)
  }

  return grouped
}

const SCORECARD_COLUMNS = [
  'target_id',
  'query',
  'owner_url',
  'clicks',
  'impressions',
  'ctr',
  'gsc_average_position',
  'observed_pages',
  'owner_conflict',
  'rank_evidence_status',
  'organic_top_one',
  'local_pack_position',
] as const

export function serializeB30ScorecardCsv(
  measurements: readonly KeywordMeasurement[],
): string {
  const rows = measurements.map((measurement) => [
    measurement.targetId,
    measurement.query,
    measurement.ownerUrl,
    measurement.gsc.clicks,
    measurement.gsc.impressions,
    measurement.gsc.ctr,
    measurement.gsc.averagePosition,
    measurement.observedPages.join('|'),
    measurement.ownerConflict,
    measurement.rankEvidenceStatus,
    measurement.organicTopOne,
    measurement.localPackPosition,
  ].map(escapeCsvCell).join(','))
  return [SCORECARD_COLUMNS.join(','), ...rows].join('\r\n') + '\r\n'
}

function buildSummary(
  measurements: readonly KeywordMeasurement[],
  errors: readonly B30ScorecardError[],
): B30ScorecardResult['summary'] {
  return {
    targets: measurements.length,
    gscRequests: LOCAL_B30_TARGETS.length,
    providerFailures: errors.length,
    ownerConflicts: measurements.filter((item) => item.ownerConflict).length,
    verifiedOrganicTopOne: measurements.filter((item) => item.organicTopOne).length,
    missingRankEvidence: measurements.filter((item) => item.rankEvidenceStatus === 'missing').length,
    insufficientRankEvidence: measurements.filter((item) => item.rankEvidenceStatus === 'insufficient').length,
    invalidRankEvidence: measurements.filter((item) => item.rankEvidenceStatus === 'invalid').length,
  }
}

export async function runB30Scorecard(
  options: RunB30ScorecardOptions,
): Promise<B30ScorecardResult> {
  const now = options.now ?? new Date()
  const concurrency = options.concurrency ?? 2
  if (concurrency !== 1 && concurrency !== 2) {
    fail('SEO_LOCAL_B30_INVALID_CONCURRENCY')
  }
  validateDateRange(options.startDate, options.endDate, now)
  if (
    typeof options.client !== 'object'
    || options.client === null
    || typeof options.client.querySearchAnalytics !== 'function'
  ) {
    fail('SEO_LOCAL_B30_GSC_CLIENT_REQUIRED')
  }

  const observationsByTarget = groupValidatedObservations(
    options.rankObservations,
    options.endDate,
  )
  let outputDirectory: SafeOutputDirectory | undefined
  if (options.outputDir !== undefined) {
    outputDirectory = await ensureSafeOutputDirectory(options.outputDir)
    await rejectOutputCollisions(outputDirectory.configuredPath, [])
  }

  const analytics = await mapWithConcurrency(
    LOCAL_B30_TARGETS,
    concurrency,
    async (target): Promise<{
      rows: readonly SearchAnalyticsRow[]
      error?: B30ScorecardError
    }> => {
      try {
        const rows = await options.client.querySearchAnalytics({
          startDate: options.startDate,
          endDate: options.endDate,
          query: target.query,
        })
        if (!Array.isArray(rows)) {
          throw new Error('SEO_LOCAL_B30_INVALID_PROVIDER_RESULT')
        }
        return { rows }
      } catch {
        return {
          rows: [],
          error: { targetId: target.id, code: 'GSC_REQUEST_FAILED' },
        }
      }
    },
  )

  const errors: B30ScorecardError[] = []
  const measurements = LOCAL_B30_TARGETS.map((target, index) => {
    const result = analytics[index]
    const observations = observationsByTarget.get(target.id) ?? []
    if (result.error) {
      errors.push(result.error)
      return buildKeywordMeasurement(target, [], observations, options.endDate)
    }

    try {
      return buildKeywordMeasurement(
        target,
        result.rows,
        observations,
        options.endDate,
      )
    } catch {
      errors.push({ targetId: target.id, code: 'GSC_REQUEST_FAILED' })
      return buildKeywordMeasurement(target, [], observations, options.endDate)
    }
  })
  const evaluation = evaluateB30Success(measurements)
  const result: B30ScorecardResult = {
    startDate: options.startDate,
    endDate: options.endDate,
    generatedAt: new Date(dateAtUtcMidnight(now)).toISOString(),
    measurements,
    errors,
    complete: errors.length === 0 && evaluation.complete,
    summary: buildSummary(measurements, errors),
  }

  if (outputDirectory !== undefined) {
    await assertSafeOutputDirectoryIdentity(outputDirectory)
    await rejectOutputCollisions(outputDirectory.configuredPath, [])
    await publishScorecardReports(
      outputDirectory,
      `${JSON.stringify(result, null, 2)}\n`,
      serializeB30ScorecardCsv(measurements),
    )
  }

  return result
}

export function parseB30ScorecardArguments(
  arguments_: readonly string[],
  context: { now?: Date; cwd?: string } = {},
): ParsedB30ScorecardArguments {
  const now = context.now ?? new Date()
  const cwd = context.cwd ?? process.cwd()
  const values = new Map<string, string>()
  const allowed = new Set([
    '--start-date',
    '--end-date',
    '--rank-input',
    '--output-dir',
    '--concurrency',
  ])

  for (let index = 0; index < arguments_.length; index += 2) {
    const flag = arguments_[index]
    const value = arguments_[index + 1]
    if (
      typeof flag !== 'string'
      || typeof value !== 'string'
      || !allowed.has(flag)
      || flag.includes('=')
      || values.has(flag)
      || value.startsWith('--')
      || value.length === 0
    ) {
      fail('SEO_LOCAL_B30_INVALID_ARGUMENTS')
    }
    values.set(flag, value)
  }

  const finalTimestamp = dateAtUtcMidnight(now) - (FINALIZATION_LAG_DAYS * DAY_MS)
  const endDate = values.get('--end-date') ?? formatDate(finalTimestamp)
  const endTimestamp = parseDate(endDate)
  const startDate = values.get('--start-date') ?? (
    endTimestamp === null
      ? ''
      : formatDate(endTimestamp - ((DEFAULT_WINDOW_DAYS - 1) * DAY_MS))
  )
  validateDateRange(startDate, endDate, now)

  const concurrencyValue = values.get('--concurrency') ?? '2'
  if (concurrencyValue !== '1' && concurrencyValue !== '2') {
    fail('SEO_LOCAL_B30_INVALID_ARGUMENTS')
  }

  const rankInput = values.get('--rank-input')
  const outputDir = values.get('--output-dir')
  return {
    startDate,
    endDate,
    ...(rankInput === undefined ? {} : { rankInput: path.resolve(cwd, rankInput) }),
    ...(outputDir === undefined ? {} : { outputDir: path.resolve(cwd, outputDir) }),
    concurrency: Number(concurrencyValue) as 1 | 2,
  }
}

function isCsvError(error: unknown): error is Error {
  return error instanceof Error && /^SEO_LOCAL_B30_CSV_[A-Z0-9_]+$/u.test(error.message)
}

interface SafeRankInput {
  configuredPath: string
  parentPath: string
  canonicalParentPath: string
  fileDevice: number
  fileInode: number
  parentDevice: number
  parentInode: number
}

function hasSameFileIdentity(
  identity: Pick<SafeRankInput, 'fileDevice' | 'fileInode'>,
  candidate: Awaited<ReturnType<typeof lstat>>,
): boolean {
  return identity.fileDevice === candidate.dev && identity.fileInode === candidate.ino
}

async function captureSafeRankInput(filePath: string): Promise<SafeRankInput> {
  const configuredPath = path.resolve(filePath)
  const parentPath = path.dirname(configuredPath)
  const parent = await lstat(parentPath)
  if (!parent.isDirectory() || parent.isSymbolicLink()) {
    fail('SEO_LOCAL_B30_RANK_INPUT_REJECTED')
  }
  const canonicalParentPath = await realpath(parentPath)
  if (!sameResolvedPath(canonicalParentPath, parentPath)) {
    fail('SEO_LOCAL_B30_RANK_INPUT_REJECTED')
  }

  const input = await lstat(configuredPath)
  if (input.isSymbolicLink() || !input.isFile()) {
    fail('SEO_LOCAL_B30_RANK_INPUT_REJECTED')
  }
  if (input.size > RANK_CSV_MAX_BYTES) {
    fail('SEO_LOCAL_B30_CSV_TOO_LARGE')
  }
  const canonicalPath = await realpath(configuredPath)
  if (
    !sameResolvedPath(canonicalPath, configuredPath)
    || !sameResolvedPath(path.dirname(canonicalPath), canonicalParentPath)
  ) {
    fail('SEO_LOCAL_B30_RANK_INPUT_REJECTED')
  }

  return {
    configuredPath,
    parentPath,
    canonicalParentPath,
    fileDevice: input.dev,
    fileInode: input.ino,
    parentDevice: parent.dev,
    parentInode: parent.ino,
  }
}

async function assertSafeRankInputParent(identity: SafeRankInput): Promise<void> {
  const parent = await lstat(identity.parentPath)
  if (
    !parent.isDirectory()
    || parent.isSymbolicLink()
    || parent.dev !== identity.parentDevice
    || parent.ino !== identity.parentInode
    || !sameResolvedPath(await realpath(identity.parentPath), identity.canonicalParentPath)
  ) {
    fail('SEO_LOCAL_B30_RANK_INPUT_REJECTED')
  }
}

async function readBoundedRankInput(filePath: string, asOfDate: string): Promise<RankObservation[]> {
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    const safeInput = await captureSafeRankInput(filePath)
    handle = await open(safeInput.configuredPath, RANK_INPUT_OPEN_FLAGS)
    const openedStat = await handle.stat()
    if (!openedStat.isFile() || !hasSameFileIdentity(safeInput, openedStat)) {
      fail('SEO_LOCAL_B30_RANK_INPUT_REJECTED')
    }
    if (openedStat.size > RANK_CSV_MAX_BYTES) {
      fail('SEO_LOCAL_B30_CSV_TOO_LARGE')
    }
    await assertSafeRankInputParent(safeInput)

    const boundedBuffer = Buffer.allocUnsafe(RANK_CSV_MAX_BYTES + 1)
    let bytesRead = 0
    while (bytesRead <= RANK_CSV_MAX_BYTES) {
      const result = await handle.read(
        boundedBuffer,
        bytesRead,
        boundedBuffer.length - bytesRead,
        null,
      )
      if (result.bytesRead === 0) break
      bytesRead += result.bytesRead
    }
    if (bytesRead > RANK_CSV_MAX_BYTES) {
      fail('SEO_LOCAL_B30_CSV_TOO_LARGE')
    }

    let input: string
    try {
      input = new TextDecoder('utf-8', { fatal: true }).decode(
        boundedBuffer.subarray(0, bytesRead),
      )
    } catch {
      fail('SEO_LOCAL_B30_CSV_INVALID_ENCODING')
    }
    return parseRankObservationsCsv(input, asOfDate)
  } catch (error) {
    if (
      isCsvError(error)
      || (error instanceof Error && error.message === 'SEO_LOCAL_B30_RANK_INPUT_REJECTED')
    ) {
      throw error
    }
    return fail('SEO_LOCAL_B30_RANK_INPUT_REJECTED')
  } finally {
    await handle?.close().catch(() => undefined)
  }
}

function publicSummary(result: B30ScorecardResult) {
  return {
    startDate: result.startDate,
    endDate: result.endDate,
    generatedAt: result.generatedAt,
    complete: result.complete,
    ...result.summary,
    errors: result.errors,
  }
}

function boundedCliCode(error: unknown): string {
  if (!(error instanceof Error)) return 'SEO_LOCAL_B30_SCORECARD_FAILED'
  return /^SEO_LOCAL_B30_[A-Z0-9_]+$/u.test(error.message)
    ? error.message
    : 'SEO_LOCAL_B30_SCORECARD_FAILED'
}

export async function runB30ScorecardCli(
  arguments_: readonly string[],
  dependencies: RunB30ScorecardCliDependencies,
): Promise<RunB30ScorecardCliOutcome> {
  const writeStdout = dependencies.writeStdout ?? ((value) => process.stdout.write(value))
  const writeStderr = dependencies.writeStderr ?? ((value) => process.stderr.write(value))
  const now = dependencies.now ?? new Date()
  try {
    const parsed = parseB30ScorecardArguments(arguments_, {
      now,
      cwd: dependencies.cwd,
    })
    const outputDirectory = parsed.outputDir === undefined
      ? undefined
      : await ensureSafeOutputDirectory(parsed.outputDir, dependencies.cwd)
    if (outputDirectory !== undefined) {
      await rejectOutputCollisions(outputDirectory.configuredPath, [
        parsed.rankInput,
        dependencies.env?.GOOGLE_APPLICATION_CREDENTIALS,
      ])
    }
    const rankObservations = parsed.rankInput === undefined
      ? []
      : await readBoundedRankInput(parsed.rankInput, parsed.endDate)
    const result = await runB30Scorecard({
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      client: dependencies.client,
      rankObservations,
      outputDir: outputDirectory?.configuredPath,
      concurrency: parsed.concurrency,
      now,
    })
    writeStdout(`${JSON.stringify(publicSummary(result))}\n`)
    return { exitCode: result.errors.length > 0 ? 1 : 0, result }
  } catch (error) {
    writeStderr(`${boundedCliCode(error)}\n`)
    return { exitCode: 1 }
  }
}

export async function main(arguments_: readonly string[] = process.argv.slice(2)): Promise<void> {
  const now = new Date()
  try {
    parseB30ScorecardArguments(arguments_, { now })
  } catch (error) {
    process.stderr.write(`${boundedCliCode(error)}\n`)
    process.exitCode = 1
    return
  }

  // Next aliases this marker to its empty server implementation during server
  // compilation. The direct `tsx` entrypoint needs the same server-only alias
  // before loading the existing GSC adapter; the client poison module remains
  // untouched for browser builds.
  const serverRequire = createRequire(import.meta.url)
  const requireHook = serverRequire('next/dist/server/require-hook') as {
    addHookAliases(aliases: readonly (readonly [string, string])[]): void
  }
  requireHook.addHookAliases([[
    'server-only',
    serverRequire.resolve('next/dist/compiled/server-only/empty'),
  ]])
  const { createGoogleSearchConsoleClient } = await import(
    '../src/lib/seo-discovery/google-gsc-client'
  )
  const outcome = await runB30ScorecardCli(arguments_, {
    client: createGoogleSearchConsoleClient(),
    now,
    env: process.env,
  })
  process.exitCode = outcome.exitCode
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  void main()
}

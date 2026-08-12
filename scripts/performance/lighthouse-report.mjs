import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

const EXPECTED_LIGHTHOUSE_VERSION = '13.4.1'
const ROLLOUT_ROUTES = Object.freeze(['home', 'san-pham', 'tin-tuc'])
const ROLLOUT_DEVICES = Object.freeze(['mobile', 'desktop'])
const THROTTLING_FIELDS = Object.freeze([
  'rttMs',
  'throughputKbps',
  'requestLatencyMs',
  'downloadThroughputKbps',
  'uploadThroughputKbps',
  'cpuSlowdownMultiplier',
])
const SCREEN_EMULATION_FIELDS = Object.freeze([
  'width',
  'height',
  'deviceScaleFactor',
])

function requiredNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid Lighthouse ${label}`)
  }
  return value
}

function auditNumber(report, auditId) {
  return requiredNumber(report?.audits?.[auditId]?.numericValue, `${auditId} value`)
}

function findLcpNode(report) {
  const items = report?.audits?.['lcp-breakdown-insight']?.details?.items
  if (!Array.isArray(items)) return ''
  return items.find((item) => item?.type === 'node')?.nodeLabel || ''
}

function requiredBoolean(value, label) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`Invalid Lighthouse ${label}`)
  }
  return value
}

function normalizeRuntimeProfile(report) {
  const settings = report?.configSettings
  if (!settings || typeof settings !== 'object') {
    throw new TypeError('Invalid Lighthouse runtime profile')
  }
  if (settings.formFactor !== 'mobile' && settings.formFactor !== 'desktop') {
    throw new TypeError('Invalid Lighthouse runtime profile formFactor')
  }
  if (typeof settings.throttlingMethod !== 'string' || settings.throttlingMethod.length === 0) {
    throw new TypeError('Invalid Lighthouse runtime profile throttlingMethod')
  }

  const throttling = settings.throttling
  const screenEmulation = settings.screenEmulation
  if (!throttling || typeof throttling !== 'object') {
    throw new TypeError('Invalid Lighthouse runtime profile throttling')
  }
  if (!screenEmulation || typeof screenEmulation !== 'object') {
    throw new TypeError('Invalid Lighthouse runtime profile screenEmulation')
  }

  return {
    formFactor: settings.formFactor,
    throttlingMethod: settings.throttlingMethod,
    throttling: Object.fromEntries(THROTTLING_FIELDS.map((field) => [
      field,
      requiredNumber(throttling[field], `runtime profile throttling.${field}`),
    ])),
    screenEmulation: {
      mobile: requiredBoolean(
        screenEmulation.mobile,
        'runtime profile screenEmulation.mobile',
      ),
      ...Object.fromEntries(SCREEN_EMULATION_FIELDS.map((field) => [
        field,
        requiredNumber(screenEmulation[field], `runtime profile screenEmulation.${field}`),
      ])),
      disabled: requiredBoolean(
        screenEmulation.disabled,
        'runtime profile screenEmulation.disabled',
      ),
    },
  }
}

function serializedRuntimeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new TypeError('Invalid Lighthouse runtime profile')
  }
  return JSON.stringify(profile)
}

function networkEvidence(report) {
  const items = report?.audits?.['network-requests']?.details?.items
  if (!Array.isArray(items)) {
    throw new TypeError('Invalid Lighthouse network-requests details')
  }

  let failedRequestCount = 0
  let scriptBytes = 0
  let stylesheetBytes = 0

  for (const item of items) {
    const statusCode = item?.statusCode
    if (
      item?.failed === true
      || (Number.isFinite(statusCode) && (statusCode === 0 || statusCode >= 400))
    ) {
      failedRequestCount += 1
    }

    const transferSize = Number.isFinite(item?.transferSize) && item.transferSize > 0
      ? item.transferSize
      : 0
    const resourceType = typeof item?.resourceType === 'string'
      ? item.resourceType.toLowerCase()
      : ''
    if (resourceType === 'script') scriptBytes += transferSize
    if (resourceType === 'stylesheet') stylesheetBytes += transferSize
  }

  return {
    requestCount: items.length,
    failedRequestCount,
    jsKiB: Math.round(scriptBytes / 1024),
    cssKiB: Math.round(stylesheetBytes / 1024),
  }
}

export function summarizeLighthouse(report) {
  if (report?.lighthouseVersion !== EXPECTED_LIGHTHOUSE_VERSION) {
    throw new TypeError(`Performance comparison requires Lighthouse ${EXPECTED_LIGHTHOUSE_VERSION}`)
  }
  const hostUserAgent = report?.environment?.hostUserAgent
  if (typeof hostUserAgent !== 'string' || hostUserAgent.length === 0) {
    throw new TypeError('Invalid Lighthouse Chrome runtime')
  }
  const performanceScore = requiredNumber(
    report?.categories?.performance?.score,
    'performance score',
  )
  const network = networkEvidence(report)
  const runtimeProfile = normalizeRuntimeProfile(report)

  return {
    lighthouseVersion: EXPECTED_LIGHTHOUSE_VERSION,
    hostUserAgent,
    runtimeProfile,
    score: Math.round(performanceScore * 100),
    finalUrl: typeof report.finalUrl === 'string' ? report.finalUrl : '',
    fcpMs: auditNumber(report, 'first-contentful-paint'),
    lcpMs: auditNumber(report, 'largest-contentful-paint'),
    tbtMs: auditNumber(report, 'total-blocking-time'),
    cls: auditNumber(report, 'cumulative-layout-shift'),
    totalKiB: auditNumber(report, 'total-byte-weight') / 1024,
    mainThreadMs: auditNumber(report, 'mainthread-work-breakdown'),
    ttfbMs: auditNumber(report, 'server-response-time'),
    ...network,
    lcpNode: findLcpNode(report),
  }
}

const MEDIAN_FIELDS = [
  'score',
  'fcpMs',
  'lcpMs',
  'tbtMs',
  'cls',
  'totalKiB',
  'mainThreadMs',
  'ttfbMs',
  'requestCount',
  'failedRequestCount',
  'jsKiB',
  'cssKiB',
]

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

export function medianLighthouseSummaries(summaries) {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    throw new TypeError('At least one Lighthouse summary is required')
  }

  const numericMedians = Object.fromEntries(MEDIAN_FIELDS.map((field) => [
    field,
    median(summaries.map((summary) => requiredNumber(summary?.[field], field))),
  ]))
  const lighthouseVersions = new Set(summaries.map((summary) => summary.lighthouseVersion))
  const hostUserAgents = new Set(summaries.map((summary) => summary.hostUserAgent))
  if (lighthouseVersions.size !== 1 || hostUserAgents.size !== 1) {
    throw new Error('Mixed Lighthouse or Chrome runtimes within one median group')
  }
  const runtimeProfiles = new Set(summaries.map((summary) => (
    serializedRuntimeProfile(summary.runtimeProfile)
  )))
  if (runtimeProfiles.size !== 1) {
    throw new Error('Mixed Lighthouse runtime profiles within one median group')
  }
  const medianLcp = numericMedians.lcpMs
  const representative = summaries.find((summary) => summary.lcpMs === medianLcp)

  return {
    lighthouseVersion: summaries[0].lighthouseVersion,
    hostUserAgent: summaries[0].hostUserAgent,
    runtimeProfile: summaries[0].runtimeProfile,
    ...numericMedians,
    finalUrl: typeof summaries[0].finalUrl === 'string' ? summaries[0].finalUrl : '',
    lcpNode: representative?.lcpNode ?? '',
  }
}

function parseArtifactName(filePath) {
  const match = /^(before|after)-(.+)-(mobile|desktop)-([1-9]\d*)\.json$/.exec(
    basename(filePath),
  )
  if (!match) {
    throw new Error(`Invalid Lighthouse artifact filename: ${basename(filePath)}`)
  }

  return {
    phase: match[1],
    route: match[2],
    device: match[3],
    run: Number(match[4]),
  }
}

function normalizedExpectedUrl(route) {
  const pathname = route === 'home' ? '/' : `/${route}`
  return `https://mushroomie.io.vn${pathname}`
}

function normalizedArtifactUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return ''
  try {
    const parsed = new URL(value)
    if (parsed.search || parsed.hash || parsed.username || parsed.password) return ''
    const pathname = parsed.pathname === '/'
      ? '/'
      : parsed.pathname.replace(/\/+$/, '')
    return `${parsed.origin}${pathname}`
  } catch {
    return ''
  }
}

export function groupLighthouseArtifacts(artifacts) {
  const groups = new Map()

  for (const artifact of artifacts) {
    const identity = parseArtifactName(artifact.file)
    const formFactor = artifact.summary?.runtimeProfile?.formFactor
    if (identity.device !== formFactor) {
      throw new Error(
        `${identity.phase}-${identity.route}-${identity.device} device/formFactor mismatch`,
      )
    }
    if (
      !ROLLOUT_ROUTES.includes(identity.route)
      || normalizedArtifactUrl(artifact.summary?.finalUrl) !== normalizedExpectedUrl(identity.route)
    ) {
      throw new Error(`${identity.phase}-${identity.route}-${identity.device} final URL mismatch`)
    }
    const key = `${identity.phase}\u0000${identity.route}\u0000${identity.device}`
    const group = groups.get(key) ?? {
      phase: identity.phase,
      route: identity.route,
      device: identity.device,
      runs: new Set(),
      summaries: [],
    }
    if (group.runs.has(identity.run)) {
      throw new Error(`Duplicate Lighthouse artifact run: ${basename(artifact.file)}`)
    }
    group.runs.add(identity.run)
    group.summaries.push(artifact.summary)
    groups.set(key, group)
  }

  return [...groups.values()].map((group) => {
    const runNumbers = [...group.runs].sort((left, right) => left - right)
    if (runNumbers.join(',') !== '1,2,3') {
      throw new Error(
        `${group.phase}-${group.route}-${group.device} requires Lighthouse runs 1, 2, 3`,
      )
    }

    return {
      phase: group.phase,
      route: group.route,
      device: group.device,
      runs: group.summaries.length,
      ...medianLighthouseSummaries(group.summaries),
    }
  })
}

export function validateLighthouseMatrix(groups) {
  const expected = new Set(ROLLOUT_ROUTES.flatMap((route) => (
    ROLLOUT_DEVICES.map((device) => `${route}\u0000${device}`)
  )))
  const phases = new Set(groups.map((group) => group.phase))

  for (const phase of phases) {
    if (phase !== 'before' && phase !== 'after') {
      throw new Error(`Unexpected Lighthouse phase: ${phase}`)
    }
    const phaseGroups = groups.filter((group) => group.phase === phase)
    const actual = new Set()
    for (const group of phaseGroups) {
      const identity = `${group.route}\u0000${group.device}`
      if (!expected.has(identity)) {
        throw new Error(`Unexpected ${phase} Lighthouse matrix entry: ${group.route}-${group.device}`)
      }
      if (actual.has(identity)) {
        throw new Error(`Duplicate ${phase} Lighthouse matrix entry: ${group.route}-${group.device}`)
      }
      actual.add(identity)
    }
    const missing = [...expected].filter((identity) => !actual.has(identity))
    if (missing.length > 0) {
      throw new Error(`Incomplete ${phase} Lighthouse matrix: missing ${missing.join(', ')}`)
    }
  }

  const lighthouseVersions = new Set(groups.map((group) => group.lighthouseVersion))
  const hostUserAgents = new Set(groups.map((group) => group.hostUserAgent))
  if (lighthouseVersions.size !== 1 || hostUserAgents.size !== 1) {
    throw new Error('Mixed Lighthouse or Chrome runtimes across rollout matrix')
  }
  for (const device of ROLLOUT_DEVICES) {
    const profiles = new Set(
      groups
        .filter((group) => group.device === device)
        .map((group) => serializedRuntimeProfile(group.runtimeProfile)),
    )
    if (profiles.size !== 1) {
      throw new Error(`Mixed Lighthouse runtime profiles for ${device} across rollout matrix`)
    }
  }
}

const FIVE_PERCENT_REGRESSION_FIELDS = [
  'fcpMs',
  'lcpMs',
  'tbtMs',
  'cls',
  'totalKiB',
  'mainThreadMs',
]

function regressedByMoreThanFivePercent(before, after) {
  const baseline = requiredNumber(before, 'before comparison value')
  const candidate = requiredNumber(after, 'after comparison value')
  if (baseline === 0) return candidate > 0
  return candidate > baseline * 1.05
}

export function compareLighthouseMedians(groups) {
  const byIdentity = new Map(groups.map((group) => [
    `${group.phase}\u0000${group.route}\u0000${group.device}`,
    group,
  ]))
  const comparisons = []
  const afterGroups = groups.filter((group) => group.phase === 'after')

  if (afterGroups.length > 0) {
    for (const before of groups.filter((group) => group.phase === 'before')) {
      if (!byIdentity.has(`after\u0000${before.route}\u0000${before.device}`)) {
        throw new Error(`Missing after Lighthouse median for ${before.route}-${before.device}`)
      }
    }
  }

  for (const after of afterGroups) {
    const before = byIdentity.get(`before\u0000${after.route}\u0000${after.device}`)
    if (!before) {
      throw new Error(`Missing before Lighthouse median for ${after.route}-${after.device}`)
    }

    const beforeScore = requiredNumber(before.score, 'before score')
    const afterScore = requiredNumber(after.score, 'after score')
    const regressions = []

    if (before.lighthouseVersion !== after.lighthouseVersion) {
      throw new Error(`Lighthouse version mismatch for ${after.route}-${after.device}`)
    }
    if (before.hostUserAgent !== after.hostUserAgent) {
      throw new Error(`Chrome runtime mismatch for ${after.route}-${after.device}`)
    }
    if (
      serializedRuntimeProfile(before.runtimeProfile)
      !== serializedRuntimeProfile(after.runtimeProfile)
    ) {
      throw new Error(`Lighthouse runtime profile mismatch for ${after.route}-${after.device}`)
    }

    if (after.route === 'home' && afterScore < 100) {
      regressions.push('home-performance-score-target')
    }
    if (afterScore < beforeScore - 2) {
      regressions.push('performance-score-drop')
    }
    for (const field of FIVE_PERCENT_REGRESSION_FIELDS) {
      if (regressedByMoreThanFivePercent(before[field], after[field])) {
        regressions.push(`${field}>5%`)
      }
    }

    comparisons.push({
      route: after.route,
      device: after.device,
      beforeScore,
      afterScore,
      scoreDelta: afterScore - beforeScore,
      regressions,
      passed: regressions.length === 0,
    })
  }

  return comparisons
}

export async function readLighthouseReport(filePath) {
  const source = await readFile(filePath, 'utf8')
  return summarizeLighthouse(JSON.parse(source))
}

function globBasenamePattern(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replaceAll('*', '.*').replaceAll('?', '.')}$`)
}

export async function expandLighthouseArtifactPaths(
  filePaths,
  readDirectory = (directory) => readdir(directory),
) {
  const expanded = []
  for (const filePath of filePaths) {
    if (!/[*?]/.test(filePath)) {
      expanded.push(filePath)
      continue
    }

    const directory = dirname(filePath)
    const pattern = basename(filePath)
    if (/[*?]/.test(directory)) {
      throw new Error(`Lighthouse artifact glob directories are not supported: ${filePath}`)
    }
    const matcher = globBasenamePattern(pattern)
    const matches = (await readDirectory(directory))
      .filter((entry) => matcher.test(entry))
      .sort((left, right) => left.localeCompare(right))
    if (matches.length === 0) {
      throw new Error(`No Lighthouse artifacts matched: ${filePath}`)
    }
    expanded.push(...matches.map((entry) => join(directory, entry)))
  }
  return expanded
}

async function main(filePaths) {
  if (filePaths.length === 0) {
    throw new Error('Usage: npm run perf:report -- <lighthouse.json> [...]')
  }

  const expandedFilePaths = await expandLighthouseArtifactPaths(filePaths)
  const artifacts = []
  for (const filePath of expandedFilePaths) {
    const summary = await readLighthouseReport(filePath)
    artifacts.push({ file: filePath, summary })
    process.stdout.write(`${JSON.stringify({ type: 'run', file: filePath, ...summary })}\n`)
  }

  const groups = groupLighthouseArtifacts(artifacts)
  validateLighthouseMatrix(groups)
  for (const group of groups) {
    process.stdout.write(`${JSON.stringify({ type: 'median', ...group })}\n`)
  }

  const comparisons = compareLighthouseMedians(groups)
  for (const comparison of comparisons) {
    process.stdout.write(`${JSON.stringify({ type: 'comparison', ...comparison })}\n`)
  }
  if (comparisons.some((comparison) => !comparison.passed)) {
    process.exitCode = 1
  }
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

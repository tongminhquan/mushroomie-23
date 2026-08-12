import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { PERFORMANCE_ROUTES } from '../scripts/performance/routes.mjs'
import { summarizeLighthouse } from '../scripts/performance/lighthouse-report.mjs'

const report = {
  lighthouseVersion: '13.4.1',
  finalUrl: 'https://mushroomie.io.vn/tin-tuc',
  finalDisplayedUrl: 'https://mushroomie.io.vn/tin-tuc?display-only=1',
  configSettings: {
    formFactor: 'mobile',
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: {
      mobile: true,
      width: 412,
      height: 823,
      deviceScaleFactor: 1.75,
      disabled: false,
    },
  },
  environment: {
    hostUserAgent: 'HeadlessChrome/149.0.0.0',
  },
  categories: { performance: { score: 0.996 } },
  audits: {
    'first-contentful-paint': { numericValue: 1010 },
    'largest-contentful-paint': { numericValue: 1420 },
    'total-blocking-time': { numericValue: 7.6 },
    'cumulative-layout-shift': { numericValue: 0.0021 },
    'total-byte-weight': { numericValue: 450_560 },
    'mainthread-work-breakdown': { numericValue: 880 },
    'server-response-time': { numericValue: 210.4 },
    'network-requests': {
      details: {
        items: [
          { resourceType: 'Document', transferSize: 50_000, statusCode: 200 },
          { resourceType: 'Script', transferSize: 100_000, statusCode: 200 },
          { resourceType: 'Stylesheet', transferSize: 20_000, statusCode: 200 },
          { resourceType: 'Image', transferSize: 200_000, statusCode: 404 },
        ],
      },
    },
    'lcp-breakdown-insight': {
      details: { items: [{ type: 'node', nodeLabel: 'First article' }] },
    },
  },
}

test('summarizes required Lighthouse evidence', () => {
  assert.deepEqual(summarizeLighthouse(report), {
    lighthouseVersion: '13.4.1',
    hostUserAgent: 'HeadlessChrome/149.0.0.0',
    runtimeProfile: report.configSettings,
    score: 100,
    finalUrl: 'https://mushroomie.io.vn/tin-tuc',
    fcpMs: 1010,
    lcpMs: 1420,
    tbtMs: 7.6,
    cls: 0.0021,
    totalKiB: 440,
    mainThreadMs: 880,
    ttfbMs: 210.4,
    requestCount: 4,
    failedRequestCount: 1,
    jsKiB: 98,
    cssKiB: 20,
    lcpNode: 'First article',
  })
})

test('rejects an invalid Lighthouse performance report', () => {
  assert.throws(
    () => summarizeLighthouse({
      lighthouseVersion: '13.4.1',
      environment: { hostUserAgent: 'HeadlessChrome/149.0.0.0' },
      categories: {},
      audits: {},
    }),
    /performance score/,
  )
  assert.throws(
    () => summarizeLighthouse({ ...report, lighthouseVersion: '13.5.0' }),
    /requires Lighthouse 13\.4\.1/,
  )
  assert.throws(
    () => summarizeLighthouse({ ...report, configSettings: undefined }),
    /runtime profile/,
  )
  assert.throws(
    () => summarizeLighthouse({
      ...report,
      configSettings: {
        ...report.configSettings,
        throttling: { ...report.configSettings.throttling, rttMs: '150' },
      },
    }),
    /runtime profile/,
  )
})

test('keeps redirect contracts separate from rendered destinations', () => {
  assert.deepEqual(
    PERFORMANCE_ROUTES.filter((route) => route.expectedDestination),
    [
      {
        key: 'cau-chuyen',
        path: '/cau-chuyen',
        expectedStatus: 308,
        expectedDestination: '/gioi-thieu',
      },
      {
        key: 'admin-anonymous',
        path: '/admin',
        expectedStatus: 307,
        expectedDestination: '/tai-khoan/dang-nhap',
      },
    ],
  )
})

test('computes three-run medians and keeps the median LCP element as evidence', async () => {
  const reportModule = await import('../scripts/performance/lighthouse-report.mjs') as {
    medianLighthouseSummaries?: (
      summaries: Array<Record<string, unknown>>,
    ) => Record<string, unknown>
  }
  assert.equal(
    typeof reportModule.medianLighthouseSummaries,
    'function',
    'the Lighthouse median reporter is not implemented',
  )

  const middle = summarizeLighthouse(report)
  const median = reportModule.medianLighthouseSummaries!([
    {
      ...middle,
      score: 98,
      fcpMs: 900,
      lcpMs: 1200,
      tbtMs: 0,
      cls: 0,
      totalKiB: 400,
      mainThreadMs: 700,
      ttfbMs: 180,
      requestCount: 3,
      failedRequestCount: 0,
      jsKiB: 90,
      cssKiB: 15,
      lcpNode: 'Hero A',
    },
    middle,
    {
      ...middle,
      score: 99,
      fcpMs: 1100,
      lcpMs: 1600,
      tbtMs: 15,
      cls: 0.01,
      totalKiB: 500,
      mainThreadMs: 1000,
      ttfbMs: 230,
      requestCount: 5,
      failedRequestCount: 2,
      jsKiB: 110,
      cssKiB: 25,
      lcpNode: 'Hero C',
    },
  ])

  assert.deepEqual(median, { ...middle, score: 99 })

  assert.throws(
    () => reportModule.medianLighthouseSummaries!([
      middle,
      middle,
      {
        ...middle,
        runtimeProfile: {
          ...middle.runtimeProfile,
          throttling: { ...middle.runtimeProfile.throttling, cpuSlowdownMultiplier: 1 },
        },
      },
    ]),
    /Mixed Lighthouse runtime profiles/,
  )

  const medianNodeMissing = reportModule.medianLighthouseSummaries!([
    { ...middle, lcpMs: 1200, lcpNode: 'Faster node' },
    { ...middle, lcpMs: 1420, lcpNode: '' },
    { ...middle, lcpMs: 1600, lcpNode: 'Slower node' },
  ])
  assert.equal(
    medianNodeMissing.lcpNode,
    '',
    'the median run must not borrow LCP evidence from a different run',
  )
})

test('groups exact before/after artifact names into route and device medians', async () => {
  const reportModule = await import('../scripts/performance/lighthouse-report.mjs') as {
    groupLighthouseArtifacts?: (
      artifacts: Array<{ file: string; summary: Record<string, unknown> }>,
    ) => Array<Record<string, unknown>>
  }
  assert.equal(
    typeof reportModule.groupLighthouseArtifacts,
    'function',
    'the Lighthouse artifact grouper is not implemented',
  )

  const middle = summarizeLighthouse(report)
  const groups = reportModule.groupLighthouseArtifacts!([
    { file: 'artifacts/performance/before-tin-tuc-mobile-1.json', summary: { ...middle, score: 98 } },
    { file: 'artifacts/performance/before-tin-tuc-mobile-2.json', summary: middle },
    { file: 'artifacts/performance/before-tin-tuc-mobile-3.json', summary: { ...middle, score: 99 } },
  ])

  assert.deepEqual(groups, [{
    phase: 'before',
    route: 'tin-tuc',
    device: 'mobile',
    runs: 3,
    ...middle,
    score: 99,
  }])

  assert.throws(
    () => reportModule.groupLighthouseArtifacts!([
      {
        file: 'artifacts/performance/before-tin-tuc-desktop-1.json',
        summary: middle,
      },
      {
        file: 'artifacts/performance/before-tin-tuc-desktop-2.json',
        summary: middle,
      },
      {
        file: 'artifacts/performance/before-tin-tuc-desktop-3.json',
        summary: middle,
      },
    ]),
    /device\/formFactor mismatch/,
  )
  assert.throws(
    () => reportModule.groupLighthouseArtifacts!([
      {
        file: 'artifacts/performance/before-home-mobile-1.json',
        summary: middle,
      },
      {
        file: 'artifacts/performance/before-home-mobile-2.json',
        summary: middle,
      },
      {
        file: 'artifacts/performance/before-home-mobile-3.json',
        summary: middle,
      },
    ]),
    /final URL mismatch/,
  )
})

test('requires exactly the three reproducible run numbers for every median', async () => {
  const reportModule = await import('../scripts/performance/lighthouse-report.mjs') as {
    groupLighthouseArtifacts?: (
      artifacts: Array<{ file: string; summary: Record<string, unknown> }>,
    ) => Array<Record<string, unknown>>
  }
  const middle = summarizeLighthouse(report)
  const home = { ...middle, finalUrl: 'https://mushroomie.io.vn/' }

  assert.throws(
    () => reportModule.groupLighthouseArtifacts!([
      { file: 'artifacts/performance/before-home-mobile-1.json', summary: home },
      { file: 'artifacts/performance/before-home-mobile-3.json', summary: home },
    ]),
    /requires Lighthouse runs 1, 2, 3/,
  )
  assert.throws(
    () => reportModule.groupLighthouseArtifacts!([
      { file: 'artifacts/performance/before-home-mobile-1.json', summary: home },
      { file: 'artifacts/performance/before-home-mobile-2.json', summary: home },
      { file: 'artifacts/performance/before-home-mobile-4.json', summary: home },
    ]),
    /requires Lighthouse runs 1, 2, 3/,
  )
})

test('compares before and after medians against rollout performance thresholds', async () => {
  const reportModule = await import('../scripts/performance/lighthouse-report.mjs') as {
    compareLighthouseMedians?: (
      groups: Array<Record<string, unknown>>,
    ) => Array<Record<string, unknown>>
  }
  assert.equal(
    typeof reportModule.compareLighthouseMedians,
    'function',
    'the Lighthouse before/after comparator is not implemented',
  )

  const middle = summarizeLighthouse(report)
  const before = {
    phase: 'before', route: 'home', device: 'mobile', runs: 3,
    ...middle, score: 100, fcpMs: 1000, lcpMs: 2000, tbtMs: 0, cls: 0,
    totalKiB: 500, mainThreadMs: 1000,
  }
  const afterPassing = {
    ...before, phase: 'after', score: 100, fcpMs: 1050, lcpMs: 2100,
    totalKiB: 525, mainThreadMs: 1050,
  }
  const afterFailing = {
    ...afterPassing, score: 97, fcpMs: 1051, lcpMs: 2200, tbtMs: 1,
    cls: 0.0001, totalKiB: 526, mainThreadMs: 1051,
  }

  assert.deepEqual(reportModule.compareLighthouseMedians!([before, afterPassing]), [{
    route: 'home',
    device: 'mobile',
    beforeScore: 100,
    afterScore: 100,
    scoreDelta: 0,
    regressions: [],
    passed: true,
  }])

  assert.deepEqual(reportModule.compareLighthouseMedians!([before, afterFailing]), [{
    route: 'home',
    device: 'mobile',
    beforeScore: 100,
    afterScore: 97,
    scoreDelta: -3,
    regressions: [
      'home-performance-score-target',
      'performance-score-drop',
      'fcpMs>5%',
      'lcpMs>5%',
      'tbtMs>5%',
      'cls>5%',
      'totalKiB>5%',
      'mainThreadMs>5%',
    ],
    passed: false,
  }])

  assert.throws(
    () => reportModule.compareLighthouseMedians!([
      before,
      { ...before, route: 'tin-tuc' },
      afterPassing,
    ]),
    /Missing after Lighthouse median for tin-tuc-mobile/,
  )
  assert.throws(
    () => reportModule.compareLighthouseMedians!([
      before,
      { ...afterPassing, hostUserAgent: 'HeadlessChrome/150.0.0.0' },
    ]),
    /Chrome runtime mismatch for home-mobile/,
  )
  assert.throws(
    () => reportModule.compareLighthouseMedians!([
      before,
      {
        ...afterPassing,
        runtimeProfile: {
          ...afterPassing.runtimeProfile,
          screenEmulation: {
            ...afterPassing.runtimeProfile.screenEmulation,
            width: 390,
          },
        },
      },
    ]),
    /Lighthouse runtime profile mismatch for home-mobile/,
  )
})

test('requires the full rollout route and device matrix for each present phase', async () => {
  const reportModule = await import('../scripts/performance/lighthouse-report.mjs') as {
    validateLighthouseMatrix?: (groups: Array<Record<string, unknown>>) => void
  }
  assert.equal(
    typeof reportModule.validateLighthouseMatrix,
    'function',
    'the Lighthouse route/device matrix validator is not implemented',
  )

  const requiredGroups = ['home', 'san-pham', 'tin-tuc'].flatMap((route) => (
    ['mobile', 'desktop'].map((device) => ({ phase: 'before', route, device }))
  ))
  assert.throws(
    () => reportModule.validateLighthouseMatrix!(requiredGroups.slice(0, -1)),
    /Incomplete before Lighthouse matrix/,
  )
  assert.throws(
    () => reportModule.validateLighthouseMatrix!([
      ...requiredGroups,
      { phase: 'before', route: 'mini-game', device: 'mobile' },
    ]),
    /Unexpected before Lighthouse matrix entry/,
  )

  const completeGroups = requiredGroups.map((group) => ({
    ...group,
    lighthouseVersion: '13.4.1',
    hostUserAgent: 'HeadlessChrome/149.0.0.0',
    runtimeProfile: {
      ...report.configSettings,
      formFactor: group.device,
      screenEmulation: {
        ...report.configSettings.screenEmulation,
        mobile: group.device === 'mobile',
      },
    },
  }))
  assert.doesNotThrow(() => reportModule.validateLighthouseMatrix!(completeGroups))
  assert.throws(
    () => reportModule.validateLighthouseMatrix!([
      ...completeGroups.slice(0, -1),
      { ...completeGroups.at(-1), hostUserAgent: 'HeadlessChrome/150.0.0.0' },
    ]),
    /Mixed Lighthouse or Chrome runtimes across rollout matrix/,
  )
  assert.throws(
    () => reportModule.validateLighthouseMatrix!(completeGroups.map((group, index) => (
      index === completeGroups.length - 2
        ? {
            ...group,
            runtimeProfile: {
              ...group.runtimeProfile,
              throttling: { ...group.runtimeProfile.throttling, rttMs: 151 },
            },
          }
        : group
    ))),
    /Mixed Lighthouse runtime profiles for mobile across rollout matrix/,
  )
})

test('expands PowerShell-style artifact globs before reading reports', async () => {
  const reportModule = await import('../scripts/performance/lighthouse-report.mjs') as {
    expandLighthouseArtifactPaths?: (
      patterns: readonly string[],
      readDirectory: (directory: string) => Promise<string[]>,
    ) => Promise<string[]>
  }
  assert.equal(
    typeof reportModule.expandLighthouseArtifactPaths,
    'function',
    'the reporter does not expand literal PowerShell glob arguments',
  )

  const directory = path.join('artifacts', 'performance')
  const expanded = await reportModule.expandLighthouseArtifactPaths!(
    [
      path.join(directory, 'before-*.json'),
      path.join(directory, 'after-*.json'),
    ],
    async () => [
      'notes.txt',
      'before-home-mobile-2.json',
      'after-home-mobile-1.json',
      'before-home-mobile-1.json',
    ],
  )
  assert.deepEqual(expanded, [
    path.join(directory, 'before-home-mobile-1.json'),
    path.join(directory, 'before-home-mobile-2.json'),
    path.join(directory, 'after-home-mobile-1.json'),
  ])
})

test('compares exact audit medians without rounding away a five-percent regression', async () => {
  const reportModule = await import('../scripts/performance/lighthouse-report.mjs') as {
    compareLighthouseMedians?: (
      groups: Array<Record<string, unknown>>,
    ) => Array<{ regressions: string[] }>
  }
  const beforeSummary = summarizeLighthouse({
    ...report,
    audits: {
      ...report.audits,
      'first-contentful-paint': { numericValue: 1000.51 },
    },
  })
  const afterSummary = summarizeLighthouse({
    ...report,
    audits: {
      ...report.audits,
      'first-contentful-paint': { numericValue: 1050.6 },
    },
  })

  const result = reportModule.compareLighthouseMedians!([
    { phase: 'before', route: 'tin-tuc', device: 'mobile', runs: 3, ...beforeSummary },
    { phase: 'after', route: 'tin-tuc', device: 'mobile', runs: 3, ...afterSummary },
  ])
  assert.ok(result[0]?.regressions.includes('fcpMs>5%'))
})

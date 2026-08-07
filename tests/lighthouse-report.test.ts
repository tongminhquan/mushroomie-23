import assert from 'node:assert/strict'
import test from 'node:test'
import { PERFORMANCE_ROUTES } from '../scripts/performance/routes.mjs'
import { summarizeLighthouse } from '../scripts/performance/lighthouse-report.mjs'

const report = {
  finalDisplayedUrl: 'https://mushroomie.io.vn/tin-tuc',
  categories: { performance: { score: 0.996 } },
  audits: {
    'first-contentful-paint': { numericValue: 1010 },
    'largest-contentful-paint': { numericValue: 1420 },
    'total-blocking-time': { numericValue: 7.6 },
    'cumulative-layout-shift': { numericValue: 0.0021 },
    'total-byte-weight': { numericValue: 450_560 },
    'mainthread-work-breakdown': { numericValue: 880 },
    'lcp-breakdown-insight': {
      details: { items: [{ type: 'node', nodeLabel: 'First article' }] },
    },
  },
}

test('summarizes required Lighthouse evidence', () => {
  assert.deepEqual(summarizeLighthouse(report), {
    score: 100,
    finalUrl: 'https://mushroomie.io.vn/tin-tuc',
    fcpMs: 1010,
    lcpMs: 1420,
    tbtMs: 8,
    cls: 0.0021,
    totalKiB: 440,
    mainThreadMs: 880,
    lcpNode: 'First article',
  })
})

test('rejects an invalid Lighthouse performance report', () => {
  assert.throws(
    () => summarizeLighthouse({ categories: {}, audits: {} }),
    /performance score/,
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

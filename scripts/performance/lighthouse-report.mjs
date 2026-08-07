import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

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

export function summarizeLighthouse(report) {
  const performanceScore = requiredNumber(
    report?.categories?.performance?.score,
    'performance score',
  )

  return {
    score: Math.round(performanceScore * 100),
    finalUrl: typeof report.finalDisplayedUrl === 'string' ? report.finalDisplayedUrl : '',
    fcpMs: Math.round(auditNumber(report, 'first-contentful-paint')),
    lcpMs: Math.round(auditNumber(report, 'largest-contentful-paint')),
    tbtMs: Math.round(auditNumber(report, 'total-blocking-time')),
    cls: auditNumber(report, 'cumulative-layout-shift'),
    totalKiB: Math.round(auditNumber(report, 'total-byte-weight') / 1024),
    mainThreadMs: Math.round(auditNumber(report, 'mainthread-work-breakdown')),
    lcpNode: findLcpNode(report),
  }
}

export async function readLighthouseReport(filePath) {
  const source = await readFile(filePath, 'utf8')
  return summarizeLighthouse(JSON.parse(source))
}

async function main(filePaths) {
  if (filePaths.length === 0) {
    throw new Error('Usage: npm run perf:report -- <lighthouse.json> [...]')
  }

  for (const filePath of filePaths) {
    const summary = await readLighthouseReport(filePath)
    process.stdout.write(`${JSON.stringify({ file: filePath, ...summary })}\n`)
  }
}

const entryPath = process.argv[1]
if (entryPath && import.meta.url === pathToFileURL(entryPath).href) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

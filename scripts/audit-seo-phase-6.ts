#!/usr/bin/env tsx

import { promises as dns } from 'node:dns'
import fs from 'node:fs'
import path from 'node:path'
import { parseCsv } from '../src/lib/bulk-import'
import {
  GOOGLE_ADS_ID,
  GOOGLE_ANALYTICS_ID,
  GOOGLE_TAG_MANAGER_ID,
} from '../src/lib/google-tags'
import type { SeoPhase4KeywordRow } from '../src/lib/seo-phase-4'
import {
  buildSeoPhase6KeywordBaseline,
  buildSeoPhase6ScorecardCsv,
  serializeSeoPhase6KeywordCsv,
} from '../src/lib/seo-phase-6'

const SITE_URL = 'https://mushroomie.io.vn'
const projectRoot = process.cwd()
const csvPath = path.join(projectRoot, 'mushroomie_30_tu_khoa_seo.csv')
const outputRoot = path.join(projectRoot, 'docs', 'seo-phase-6')

interface PublicCheck {
  url: string
  status: number
  contentType: string | null
}

function baselineDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function parseKeywordRows(): SeoPhase4KeywordRow[] {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
  const headers = rows[0].map((header) => header.trim())
  const column = (name: string) => {
    const index = headers.indexOf(name)
    if (index < 0) throw new Error(`Missing CSV column: ${name}`)
    return index
  }

  return rows.slice(1).map((row) => ({
    index: Number(row[column('STT')]),
    keyword: row[column('Tu_khoa_chinh')].trim(),
    cluster: row[column('Cum_tu_khoa')].trim(),
    intent: row[column('Y_dinh_tim_kiem')].trim(),
    priority: row[column('Muc_do_uu_tien')].trim(),
    proposedPage: row[column('Trang_dich_de_xuat')].trim(),
    proposedSlug: row[column('Slug_de_xuat')].trim(),
    note: row[column('Ghi_chu_trien_khai')].trim(),
  }))
}

async function fetchText(relativeUrl: string): Promise<{
  check: PublicCheck
  body: string
}> {
  const url = new URL(relativeUrl, SITE_URL).toString()
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'Mushroomie-SEO-Phase6-Audit/1.0' },
  })
  if (!response.ok) {
    throw new Error(`Public check failed: ${url} returned HTTP ${response.status}`)
  }
  const body = await response.text()
  return {
    check: {
      url: response.url,
      status: response.status,
      contentType: response.headers.get('content-type'),
    },
    body,
  }
}

function extractNextScriptSources(html: string): string[] {
  return [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((src) => src.startsWith('/_next/static/'))
}

async function resolveGoogleVerificationTokens(): Promise<string[]> {
  try {
    const records = await dns.resolveTxt('mushroomie.io.vn')
    return records
      .map((parts) => parts.join(''))
      .filter((value) => value.startsWith('google-site-verification='))
  } catch {
    return []
  }
}

function envConfigured(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function renderBaselineMarkdown(input: {
  generatedAt: string
  date: string
  keywordCount: number
  ownerCount: number
  sitemapUrlCount: number
  readiness: Record<string, unknown>
}): string {
  return `# Mushroomie SEO Phase 6 - Measurement Baseline

Generated: ${input.generatedAt}

## Kết luận

- Baseline date: \`${input.date}\`
- Keyword plan: ${input.keywordCount} từ khóa, ${input.ownerCount} canonical owner URL.
- Public sitemap: ${input.sitemapUrlCount} URL tại thời điểm audit.
- Trạng thái dữ liệu tài khoản: \`pending_authenticated_data\`.
- Không có thứ hạng, click, impression, CTR, index count, CWV field data, GA4
  organic traffic hoặc Local Pack position nào được suy đoán.

## Bằng chứng đã xác minh công khai

- Production JavaScript bundle chứa GTM \`${GOOGLE_TAG_MANAGER_ID}\`; container
  quản lý GA4 \`${GOOGLE_ANALYTICS_ID}\`, Google Ads \`${GOOGLE_ADS_ID}\` và Clarity.
- Website chỉ nạp một GTM container; không nạp thêm gtag.js hoặc Clarity trực tiếp,
  tránh ghi nhận trùng page view và conversion.
- \`https://mushroomie.io.vn/sitemap.xml\` truy cập được và robots.txt trỏ tới
  sitemap này.
- DNS TXT có token \`google-site-verification\`. Token này không chứng minh phiên
  audit có quyền đọc property hoặc sitemap đã được submit trong Search Console.

## Dữ liệu còn chờ xác thực

| Nhóm | Nguồn bắt buộc | Trạng thái |
|---|---|---|
| Click, impression, CTR, position 30 từ khóa | GSC Search Analytics | pending_authenticated_data |
| Sitemap submitted/last read/status | GSC Sitemaps report hoặc API | pending_authenticated_data |
| Index status và Google-selected canonical | GSC URL Inspection | pending_authenticated_data |
| Organic sessions và purchase conversion | GA4 reports | pending_authenticated_data |
| LCP, INP, CLS field data | CrUX/PageSpeed Insights | pending_authenticated_data |
| Search terms, views, calls, directions, website clicks | Verified GBP Performance | pending_authenticated_data |
| Local Pack position | Geo-grid/manual neutral-location tracking | pending_authenticated_data |

## Owner actions

1. Mở Search Console property \`sc-domain:mushroomie.io.vn\`, vào **Sitemaps**,
   submit \`https://mushroomie.io.vn/sitemap.xml\`, rồi ghi Submitted, Last read,
   Status và Discovered pages vào scorecard.
2. Export GSC Search Analytics 28 ngày theo dimensions \`query,page\`; đối chiếu
   đúng 30 từ khóa trong \`keyword-baseline.csv\`.
3. Kiểm tra ít nhất chín canonical owner URL bằng URL Inspection; không dùng
   lệnh \`site:\` làm bằng chứng index chính thức.
4. Mở GA4 Realtime hoặc DebugView để xác nhận \`page_view\`, ecommerce events và
   \`purchase\`; không tạo tag GA4 thứ hai.
5. Ghi CrUX/PageSpeed mobile p75 cho LCP, INP và CLS hằng tuần khi có dữ liệu.
6. Sau khi GBP được xác minh, export Performance và theo dõi Local Pack ở vị trí
   tìm kiếm phù hợp tại Đồng Nai/Biên Hòa.

## File vận hành

- \`keyword-baseline.csv\`: 30 từ khóa và owner URL, để trống metric chưa có nguồn.
- \`weekly-scorecard.csv\`: mẫu theo dõi GSC, GA4, index, CWV và Local Pack.
- \`measurement-readiness.json\`: bằng chứng máy đọc được của lần audit này.

## Official references

- Search Console Sitemaps report:
  https://support.google.com/webmasters/answer/7451001
- GA4 Realtime and events:
  https://support.google.com/analytics/answer/9322688
- GA4 DebugView:
  https://support.google.com/analytics/answer/7201382
- Google Business Profile Performance:
  https://support.google.com/business/answer/9918094

## Machine-readable readiness

\`\`\`json
${JSON.stringify(input.readiness, null, 2)}
\`\`\`
`
}

async function main() {
  const date = baselineDate()
  const keywordRows = parseKeywordRows()
  if (keywordRows.length !== 30) {
    throw new Error(`Expected 30 keyword rows, received ${keywordRows.length}`)
  }

  const [homepage, sitemap, robots, health, verificationTokens] = await Promise.all([
    fetchText('/'),
    fetchText('/sitemap.xml'),
    fetchText('/robots.txt'),
    fetchText('/api/health'),
    resolveGoogleVerificationTokens(),
  ])

  const scriptSources = extractNextScriptSources(homepage.body)
  const scriptBodies = await Promise.all(
    scriptSources.map(async (src) => {
      const response = await fetch(new URL(src, SITE_URL))
      if (!response.ok) {
        throw new Error(`Production script returned HTTP ${response.status}: ${src}`)
      }
      return response.text()
    }),
  )
  const productionJavaScript = scriptBodies.join('\n')
  const sitemapUrlCount = (sitemap.body.match(/<loc>/g) || []).length
  const keywordBaseline = buildSeoPhase6KeywordBaseline(keywordRows, date)
  const ownerCount = new Set(keywordBaseline.map((row) => row.ownerUrl)).size

  const readiness = {
    generatedAt: new Date().toISOString(),
    baselineDate: date,
    measurementStatus: 'pending_authenticated_data',
    publicChecks: {
      homepage: homepage.check,
      sitemap: sitemap.check,
      robots: robots.check,
      health: health.check,
    },
    tags: {
      googleTagManagerId: GOOGLE_TAG_MANAGER_ID,
      googleAnalyticsId: GOOGLE_ANALYTICS_ID,
      googleAdsId: GOOGLE_ADS_ID,
      productionBundleHasGtm: productionJavaScript.includes(GOOGLE_TAG_MANAGER_ID),
      productionBundleHasGa4: productionJavaScript.includes(GOOGLE_ANALYTICS_ID),
      productionBundleHasGoogleAds: productionJavaScript.includes(GOOGLE_ADS_ID),
    },
    searchConsole: {
      dnsVerificationTokenPresent: verificationTokens.length > 0,
      dnsVerificationTokenCount: verificationTokens.length,
      sitemapReferencedInRobots: robots.body.includes(`${SITE_URL}/sitemap.xml`),
      sitemapPublicUrlCount: sitemapUrlCount,
      authenticatedAccessConfigured: envConfigured('GOOGLE_SEARCH_CONSOLE_PROPERTY')
        && envConfigured('GOOGLE_APPLICATION_CREDENTIALS'),
      submittedSitemapStatus: 'pending_authenticated_data',
      searchAnalyticsStatus: 'pending_authenticated_data',
      urlInspectionStatus: 'pending_authenticated_data',
    },
    analytics: {
      ga4ReportingConfigured: envConfigured('GA4_PROPERTY_ID')
        && envConfigured('GOOGLE_APPLICATION_CREDENTIALS'),
      organicTrafficStatus: 'pending_authenticated_data',
      purchaseReportingStatus: 'pending_authenticated_data',
    },
    performance: {
      cruxApiConfigured: envConfigured('GOOGLE_API_KEY'),
      coreWebVitalsStatus: 'pending_authenticated_data',
    },
    local: {
      gbpReportingConfigured: envConfigured('GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID'),
      performanceStatus: 'pending_authenticated_data',
      localPackStatus: 'pending_authenticated_data',
    },
    keywords: {
      count: keywordBaseline.length,
      canonicalOwnerCount: ownerCount,
      rankingStatus: 'pending_authenticated_data',
    },
  }

  fs.mkdirSync(outputRoot, { recursive: true })
  fs.writeFileSync(
    path.join(outputRoot, 'measurement-readiness.json'),
    `${JSON.stringify(readiness, null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(outputRoot, 'measurement-baseline.md'),
    renderBaselineMarkdown({
      generatedAt: readiness.generatedAt,
      date,
      keywordCount: keywordBaseline.length,
      ownerCount,
      sitemapUrlCount,
      readiness,
    }),
    'utf8',
  )
  fs.writeFileSync(
    path.join(outputRoot, 'keyword-baseline.csv'),
    serializeSeoPhase6KeywordCsv(keywordBaseline),
    'utf8',
  )
  fs.writeFileSync(
    path.join(outputRoot, 'weekly-scorecard.csv'),
    buildSeoPhase6ScorecardCsv(date, sitemapUrlCount),
    'utf8',
  )

  console.log(JSON.stringify({
    outputRoot,
    keywordCount: keywordBaseline.length,
    canonicalOwnerCount: ownerCount,
    sitemapUrlCount,
    measurementStatus: readiness.measurementStatus,
    tags: readiness.tags,
    searchConsole: readiness.searchConsole,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

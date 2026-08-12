# SEO Local B30 Measurement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo scorecard trung thực cho đủ 30 truy vấn bằng Search Console first-party metrics và rank observations có cấu hình cố định, đồng thời chỉ công nhận top 1 khi đúng owner URL trong ba tuần liên tiếp.

**Architecture:** Mở rộng adapter GSC hiện hữu bằng một capability Search Analytics tách interface để không làm vỡ worker mocks. Một domain module thuần dữ liệu ghép GSC metrics với rank observations và đánh giá success gate; CLI chỉ điều phối API/CSV, mặc định không ghi file. Search Console average position là tín hiệu tối ưu, không phải bằng chứng exact rank; exact rank phải đến từ input có profile địa lý/ngôn ngữ/thiết bị được validate.

**Tech Stack:** TypeScript, `google-auth-library@11.0.0`, Search Console REST v3, Node streams/fetch hiện hữu, `tsx --test`, CSV không dependency mới.

## Global Constraints

- Query Search Analytics endpoint chính thức: `POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query`.
- Property cố định: `sc-domain:mushroomie.io.vn`; type `web`; dataState `final`; country filter `VNM`.
- Query filter dùng `contains` để không mất khác biệt hoa/thường, sau đó normalize NFC/lowercase/space và lọc exact ở client.
- API row limit tối đa 25.000; B30 chạy một request/target, concurrency tối đa 2 và không retry vô hạn.
- Không log credential path, auth header, response body thô, private key hoặc URL có query nhạy cảm.
- GSC average position không được đánh dấu là exact top 1.
- Exact rank observation phải có query, owner URL, organic position, location, country, language, device, measuredAt và source.
- Required mobile profile: `country=VN`, `language=vi`, `device=mobile`, location đúng area của target; desktop được báo riêng nhưng không trộn.
- Success gate: 30/30 query, owner đúng, organic position `1`, ba weekly observations liên tiếp cách nhau 6–8 ngày trên cùng profile.
- Local Pack là metric riêng, không được dùng thay organic top 1.
- CLI mặc định chỉ in stdout; chỉ ghi khi có `--output-dir`, dùng atomic rename và từ chối ghi vào repo `public/`.
- Không thêm schema/migration, cron gọi Search Analytics hoặc API public/admin mới trong kế hoạch này.

---

## File Structure

- Modify `src/lib/seo-discovery/gsc-client.ts`: capability types Search Analytics.
- Modify `src/lib/seo-discovery/google-gsc-client.ts`: request/mapping an toàn dùng auth/deadline hiện hữu.
- Modify `src/lib/seo-discovery/__tests__/gsc-client.test.ts`: endpoint, payload, response, timeout/error tests.
- Create `src/lib/seo-local/scorecard.ts`: pure normalization, aggregation, rank validation và success evaluator.
- Create `src/lib/seo-local/csv.ts`: parser/serializer bounded cho rank input/output.
- Create `src/lib/seo-local/__tests__/scorecard.test.ts`: domain tests.
- Create `scripts/seo-local-b30-scorecard.ts`: CLI/injected runner.
- Create `tests/seo-local-b30-scorecard.test.ts`: argument, no-write, 30-query, redaction tests.
- Modify `package.json`: `seo:local:b30:scorecard` script.
- Create `docs/seo-local-b30/measurement-contract.md`: vận hành và ý nghĩa metric.
- Create `docs/seo-local-b30/rank-observation.example.csv`: schema mẫu không chứa số liệu giả.

### Task 1: Search Analytics capability in the GSC adapter

**Files:**
- Modify: `src/lib/seo-discovery/gsc-client.ts`
- Modify: `src/lib/seo-discovery/google-gsc-client.ts:24-32,152-267,277-389`
- Modify: `src/lib/seo-discovery/__tests__/gsc-client.test.ts`

**Interfaces:**
- Consumes: existing `executeRequest()`, credential boundary and `GscClientError` mapping.
- Produces: `GoogleSearchConsoleAnalyticsClient.querySearchAnalytics(request)`.

- [ ] **Step 1: Write RED transport and mapping tests**

```ts
it('queries exact B30 evidence through the canonical Search Analytics endpoint', async () => {
  fetchMock.mockResolvedValue(jsonResponse({
    rows: [{
      keys: ['Vòng tay Handmade Đồng Nai', 'https://mushroomie.io.vn/vong-tay-handmade-dong-nai', 'MOBILE'],
      clicks: 2,
      impressions: 20,
      ctr: 0.1,
      position: 3.5,
    }],
  }))
  const client = createGoogleSearchConsoleClient(options)
  const rows = await client.querySearchAnalytics({
    startDate: '2026-07-12',
    endDate: '2026-08-09',
    query: 'vòng tay handmade Đồng Nai',
  })

  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Amushroomie.io.vn/searchAnalytics/query')
  expect(JSON.parse(String(init?.body))).toEqual({
    startDate: '2026-07-12',
    endDate: '2026-08-09',
    type: 'web',
    dataState: 'final',
    dimensions: ['query', 'page', 'device'],
    aggregationType: 'auto',
    rowLimit: 25000,
    dimensionFilterGroups: [{
      groupType: 'and',
      filters: [
        { dimension: 'country', operator: 'equals', expression: 'VNM' },
        { dimension: 'query', operator: 'contains', expression: 'vòng tay handmade Đồng Nai' },
      ],
    }],
  })
  expect(rows[0]).toEqual({
    query: 'Vòng tay Handmade Đồng Nai',
    page: 'https://mushroomie.io.vn/vong-tay-handmade-dong-nai',
    device: 'MOBILE',
    clicks: 2,
    impressions: 20,
    ctr: 0.1,
    position: 3.5,
  })
})
```

Also add cases for missing `rows` → `[]`, malformed keys/counts/NaN → `GSC_INVALID_RESPONSE`, disabled/configuration-required clients, 401/403/429/5xx mapping, bounded body and the existing 15-second absolute deadline.

- [ ] **Step 2: Run focused adapter tests and verify RED**

Run: `npm run test:vitest -- src/lib/seo-discovery/__tests__/gsc-client.test.ts`

Expected: compile/test FAIL because `querySearchAnalytics` and its types do not exist.

- [ ] **Step 3: Add the separate capability types**

```ts
export type SearchAnalyticsDevice = 'DESKTOP' | 'MOBILE' | 'TABLET'

export interface SearchAnalyticsRequest {
  startDate: string
  endDate: string
  query: string
}

export interface SearchAnalyticsRow {
  query: string
  page: string
  device: SearchAnalyticsDevice
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GoogleSearchConsoleAnalyticsClient {
  querySearchAnalytics(request: SearchAnalyticsRequest): Promise<SearchAnalyticsRow[]>
}

export type GoogleSearchConsoleFullClient =
  GoogleSearchConsoleClient & GoogleSearchConsoleAnalyticsClient
```

Change only the factory return type to `GoogleSearchConsoleFullClient`; existing worker/admin parameters remain `GoogleSearchConsoleClient`, so their mocks do not gain a fake method.

- [ ] **Step 4: Implement strict request and response mapping**

Add `querySearchAnalytics()` to all three concrete clients. Disabled/configuration clients throw their existing stable errors. Authenticated implementation validates dates with `/^\d{4}-\d{2}-\d{2}$/`, query length `1..4096`, sends the exact body from Step 1, and maps only finite non-negative metrics (`ctr` in `0..1`, `position >= 0`) with exactly three string keys and a known device.

```ts
async querySearchAnalytics(request: SearchAnalyticsRequest): Promise<SearchAnalyticsRow[]> {
  if (!isIsoDate(request.startDate) || !isIsoDate(request.endDate) || request.startDate > request.endDate) {
    throw invalidResponseError()
  }
  const query = request.query.normalize('NFC').trim()
  if (!query || query.length > 4096) throw invalidResponseError()
  const endpoint = `${WEBMASTERS_API_ROOT}/sites/${encodeURIComponent(this.property)}/searchAnalytics/query`
  return this.executeRequest(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      startDate: request.startDate,
      endDate: request.endDate,
      type: 'web',
      dataState: 'final',
      dimensions: ['query', 'page', 'device'],
      aggregationType: 'auto',
      rowLimit: 25_000,
      dimensionFilterGroups: [{
        groupType: 'and',
        filters: [
          { dimension: 'country', operator: 'equals', expression: 'VNM' },
          { dimension: 'query', operator: 'contains', expression: query },
        ],
      }],
    }),
  }, async (response) => mapSearchAnalytics(await readBoundedJson(response)))
}
```

- [ ] **Step 5: Run adapter, worker and admin compatibility suites**

Run:

```bash
npm run test:vitest -- src/lib/seo-discovery/__tests__/gsc-client.test.ts src/lib/seo-discovery/__tests__/worker.test.ts src/lib/seo-discovery/__tests__/admin-api.test.ts
npm run typecheck
```

Expected: all PASS; worker/admin mock interfaces unchanged.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/lib/seo-discovery/gsc-client.ts src/lib/seo-discovery/google-gsc-client.ts src/lib/seo-discovery/__tests__/gsc-client.test.ts
git diff --cached --check
git commit -m "feat(seo): query Search Console B30 metrics"
```

### Task 2: Pure scorecard and exact-rank success gate

**Files:**
- Create: `src/lib/seo-local/scorecard.ts`
- Create: `src/lib/seo-local/__tests__/scorecard.test.ts`

**Interfaces:**
- Consumes: `LOCAL_B30_TARGETS`, `SearchAnalyticsRow`.
- Produces: `buildKeywordMeasurement()`, `validateRankObservation()`, `evaluateB30Success()`.

- [ ] **Step 1: Write RED aggregation and anti-false-positive tests**

```ts
it('does not treat GSC average position 1 as exact top-one proof', () => {
  const measurement = buildKeywordMeasurement(target, [{
    query: target.query,
    page: `https://mushroomie.io.vn${target.ownerHref}`,
    device: 'MOBILE', clicks: 1, impressions: 10, ctr: 0.1, position: 1,
  }], [])
  expect(measurement.gsc.averagePosition).toBe(1)
  expect(measurement.organicTopOne).toBe(false)
  expect(measurement.rankEvidenceStatus).toBe('missing')
})

it('requires correct owner and three consecutive weekly mobile observations', () => {
  const observations = ['2026-08-03', '2026-08-10', '2026-08-17'].map((measuredAt) => ({
    query: target.query,
    ownerUrl: `https://mushroomie.io.vn${target.ownerHref}`,
    organicPosition: 1,
    localPackPosition: null,
    location: target.area,
    country: 'VN', language: 'vi', device: 'mobile',
    measuredAt,
    source: 'rank-tracker',
  } as const))
  expect(buildKeywordMeasurement(target, [], observations).organicTopOne).toBe(true)
})

it.each([
  ['wrong owner', { ownerUrl: 'https://mushroomie.io.vn/' }],
  ['wrong device', { device: 'desktop' }],
  ['wrong language', { language: 'en' }],
  ['wrong country', { country: 'US' }],
  ['gap too short', { measuredAt: '2026-08-12' }],
  ['position 2', { organicPosition: 2 }],
])('rejects %s as completion proof', (_name, patch) => {
  expect(evaluateB30Success(makeThirtyTargetsWithPatchedEvidence(patch)).complete).toBe(false)
})
```

- [ ] **Step 2: Run test and verify RED**

Run: `npm run test:vitest -- src/lib/seo-local/__tests__/scorecard.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement bounded domain types and normalization**

```ts
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
  gsc: { clicks: number; impressions: number; ctr: number; averagePosition: number | null }
  observedPages: readonly string[]
  ownerConflict: boolean
  rankEvidenceStatus: 'missing' | 'insufficient' | 'invalid' | 'verified'
  organicTopOne: boolean
  localPackPosition: number | null
}

export function normalizeSearchQuery(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('vi')
}
```

`buildKeywordMeasurement()` must discard API rows whose normalized query is not exact, aggregate CTR as `sum(clicks)/sum(impressions)`, compute weighted average position by impressions, list unique observed pages and flag any page with impressions that is not the declared owner. `validateRankObservation()` accepts only canonical HTTPS Mushroomie owner URLs, ISO dates and finite integer positions `>=1` or null.

`organicTopOne` is true only for the latest three valid observations sorted by date when all are position 1, owner/profile equal, target location equal, and each gap is 6–8 days. `evaluateB30Success()` returns `{ complete: true }` only when exactly 30 distinct target IDs are present and every measurement has `organicTopOne=true` and `ownerConflict=false`.

- [ ] **Step 4: Run focused domain tests**

Run: `npm run test:vitest -- src/lib/seo-local/__tests__/scorecard.test.ts`

Expected: all PASS, including malformed/duplicate/Unicode/date-gap/property cases.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/lib/seo-local/scorecard.ts src/lib/seo-local/__tests__/scorecard.test.ts
git diff --cached --check
git commit -m "feat(seo): evaluate B30 rank evidence honestly"
```

### Task 3: Safe CSV codec and scorecard CLI

**Files:**
- Create: `src/lib/seo-local/csv.ts`
- Create: `scripts/seo-local-b30-scorecard.ts`
- Create: `tests/seo-local-b30-scorecard.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: GSC full client, Task 1 registry, Task 2 scorecard functions.
- Produces: `runB30Scorecard(options)`, CLI JSON/CSV output and stable nonzero error semantics.

- [ ] **Step 1: Write RED CLI tests**

```ts
test('queries all 30 targets with concurrency at most two and returns all rows', async () => {
  let active = 0
  let maxActive = 0
  const client = {
    querySearchAnalytics: async ({ query }: { query: string }) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await Promise.resolve()
      active -= 1
      return makeRows(query)
    },
  }
  const result = await runB30Scorecard({
    startDate: '2026-07-12', endDate: '2026-08-09', client, rankObservations: [],
  })
  assert.equal(result.measurements.length, 30)
  assert.ok(maxActive <= 2)
})

test('dry stdout mode performs no filesystem writes', async () => {
  await runB30Scorecard({ client, startDate, endDate, rankObservations: [], fileSystem: failingFs })
  assert.equal(failingFs.calls, 0)
})

test('partial GSC failures make the CLI fail nonzero without leaking raw errors', async () => {
  const result = await runB30Scorecard({ client: oneFailureClient, startDate, endDate, rankObservations: [] })
  assert.equal(result.complete, false)
  assert.deepEqual(result.errors, [{ targetId: 7, code: 'GSC_REQUEST_FAILED' }])
})
```

Add parser tests rejecting unknown/duplicate flags, invalid dates, output inside `public`, rank CSV over 256 KiB, more than 1.000 rows, extra/missing columns, formulas beginning `= + - @`, duplicate query/week/profile and wrong owner URLs.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx tsx --test tests/seo-local-b30-scorecard.test.ts`

Expected: FAIL because CLI/CSV modules do not exist.

- [ ] **Step 3: Implement the bounded CSV codec**

```ts
export const RANK_OBSERVATION_COLUMNS = [
  'query', 'owner_url', 'organic_position', 'local_pack_position',
  'location', 'country', 'language', 'device', 'measured_at', 'source',
] as const

export function escapeCsvCell(value: string | number | null): string {
  const raw = value === null ? '' : String(value)
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}
```

Implement a finite-state CSV parser supporting quoted commas/newlines/doubled quotes; reject NUL/control characters, row/byte limits and header mismatch. Do not add a CSV dependency.

- [ ] **Step 4: Implement the injected runner and CLI**

```ts
export interface RunB30ScorecardOptions {
  startDate: string
  endDate: string
  client: Pick<GoogleSearchConsoleAnalyticsClient, 'querySearchAnalytics'>
  rankObservations: readonly RankObservation[]
  outputDir?: string
  concurrency?: 1 | 2
  now?: Date
}

export async function runB30Scorecard(options: RunB30ScorecardOptions): Promise<B30ScorecardResult> {
  const analytics = await mapWithConcurrency(LOCAL_B30_TARGETS, options.concurrency ?? 2, async (target) => {
    try {
      return { target, rows: await options.client.querySearchAnalytics({
        startDate: options.startDate, endDate: options.endDate, query: target.query,
      }) }
    } catch {
      return { target, rows: [], error: { targetId: target.id, code: 'GSC_REQUEST_FAILED' as const } }
    }
  })
  // Build exactly 30 measurements; never omit a zero-impression or failed target.
  // Write only when outputDir is explicit, using temp file + rename on the same filesystem.
  // Return complete=false whenever errors.length > 0.
}
```

Supported CLI flags are exactly:

```text
--start-date YYYY-MM-DD
--end-date YYYY-MM-DD
--rank-input ABSOLUTE_OR_CWD_RELATIVE_CSV
--output-dir ABSOLUTE_OR_CWD_RELATIVE_DIRECTORY
--concurrency 1|2
```

Default date range ends three days before `now` and starts 27 days earlier. Rank input is optional. `--output-dir` writes `b30-scorecard.json` and `b30-scorecard.csv`; without it, print one bounded JSON summary. Set `process.exitCode=1` after printing when any target fails or rank CSV is invalid. Do not catch and stringify raw Google errors.

Add package script:

```json
"seo:local:b30:scorecard": "tsx scripts/seo-local-b30-scorecard.ts"
```

- [ ] **Step 5: Run CLI tests and a no-network dry fixture**

Run:

```bash
npx tsx --test tests/seo-local-b30-scorecard.test.ts
npm run typecheck
```

Expected: all PASS; fixtures make exactly 30 injected calls, no real GSC/network/filesystem write.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/lib/seo-local/csv.ts scripts/seo-local-b30-scorecard.ts tests/seo-local-b30-scorecard.test.ts package.json
git diff --cached --check
git commit -m "feat(seo): generate bounded B30 scorecards"
```

### Task 4: Measurement operations contract

**Files:**
- Create: `docs/seo-local-b30/measurement-contract.md`
- Create: `docs/seo-local-b30/rank-observation.example.csv`

**Interfaces:**
- Consumes: Task 1–3 CLI/schema.
- Produces: a repeatable weekly procedure; no fabricated rank values.

- [ ] **Step 1: Write the exact example CSV**

```csv
query,owner_url,organic_position,local_pack_position,location,country,language,device,measured_at,source
vòng tay handmade Đồng Nai,https://mushroomie.io.vn/vong-tay-handmade-dong-nai,,,Đồng Nai,VN,vi,mobile,2026-08-17,rank-tracker
```

Blank positions mean “not measured”, not position zero. The file is a schema example only and must be labeled as such.

- [ ] **Step 2: Document the weekly command and interpretation**

The document must include:

```powershell
npm run seo:local:b30:scorecard -- --start-date 2026-07-21 --end-date 2026-08-17 --rank-input .\private-rank-input.csv --output-dir .\artifacts\seo-local-b30\2026-08-17
```

State explicitly:

```text
GSC averagePosition = aggregated diagnostic metric, never exact rank proof.
organicTopOne = true only after three valid weekly rank observations.
Local Pack position is reported separately.
Unknown/zero-impression queries remain in the 30-row output.
The API can return top rows rather than every row; absence means “no returned evidence”, not proof of zero searches.
```

Link official primary sources:

- `https://developers.google.com/webmaster-tools/v1/searchanalytics/query`
- `https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics`
- `https://developers.google.com/webmaster-tools/limits`

- [ ] **Step 3: Add documentation contract tests**

In `tests/seo-local-b30-scorecard.test.ts`, read both docs and assert the example header exactly matches `RANK_OBSERVATION_COLUMNS`, the command contains no credential path, and the contract contains the phrases `never exact rank proof`, `three valid weekly`, and `Local Pack position is reported separately`.

- [ ] **Step 4: Run focused tests and commit**

```bash
npx tsx --test tests/seo-local-b30-scorecard.test.ts
git add docs/seo-local-b30/measurement-contract.md docs/seo-local-b30/rank-observation.example.csv tests/seo-local-b30-scorecard.test.ts
git diff --cached --check
git commit -m "docs(seo): define B30 measurement contract"
```

### Task 5: Full measurement verification

**Files:**
- No source changes unless a verified defect is found.

**Interfaces:**
- Consumes: Task 1–4.
- Produces: reviewed scorecard tooling; not a rank-success claim.

- [ ] **Step 1: Run focused and complete suites**

```bash
npm run test:vitest -- src/lib/seo-discovery/__tests__/gsc-client.test.ts src/lib/seo-local/__tests__/scorecard.test.ts
npx tsx --test tests/seo-local-b30-scorecard.test.ts
npm test
npm run typecheck
npx prisma generate
npx eslint src/lib/seo-discovery/gsc-client.ts src/lib/seo-discovery/google-gsc-client.ts src/lib/seo-local/scorecard.ts src/lib/seo-local/csv.ts scripts/seo-local-b30-scorecard.ts
npm audit --omit=dev
```

Expected: all pass, audit 0, scoped lint clean.

- [ ] **Step 2: Build offline and scan secrets**

Use only a process-local unreachable DB URL for build. Run `git diff --check`, scan staged diff for private-key/auth/token patterns, and confirm no output artifact, rank input, `.env` or credential file is staged.

- [ ] **Step 3: Run one authorized read-only GSC scorecard**

Only after credential access is explicitly authorized, run the CLI without `--rank-input` and with an output directory outside `public`. Verify 30/30 rows and compare aggregate totals against the Search Console UI for the same finalized date range. This call is read-only. Do not print or commit credentials.

- [ ] **Step 4: Freeze release candidate**

Expected git history: four measurement commits; clean worktree; no deploy/push without separate authorization. Exact ranking remains `unverified` until rank observations exist.

# Mushroomie SEO Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assign the existing 30-keyword plan to one canonical owner URL per keyword, remove measurable on-site cannibalization signals, and prepare evidence-led briefs for the ten highest-priority thin articles.

**Architecture:** Keep `mushroomie_30_tu_khoa_seo.csv` as the source of truth. A pure TypeScript module owns the nine canonical destinations and analyzes post targeting; a repeatable audit script fetches public production data and writes JSON/Markdown artifacts. The public article template renders one contextual owner link so supporting articles reinforce the correct commercial page. Database metadata cleanup is handled by a dry-run-first script with backup, revision, transaction, and rollback logging.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 5, Node test runner, parse5.

## Global Constraints

- Do not create 30 landing pages for 30 keywords.
- Each primary keyword has exactly one canonical owner URL.
- Preserve published posts; do not delete content or change existing public slugs.
- Do not invent customer experience, reviews, prices, lead times, product materials, or store photos.
- Production writes require a fresh database backup, per-post revisions, a transaction, and a rollback artifact.
- Keep the existing PM2/Nginx deployment flow; do not introduce Docker.
- Run typecheck, all tests, production build, PM2 checks, route checks, sitemap checks, and CSS/JS MIME checks.

---

### Task 1: Keyword ownership and audit engine

**Files:**
- Create: `src/lib/seo-phase-4.ts`
- Create: `tests/seo-phase-4.test.ts`
- Create: `scripts/audit-seo-phase-4.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: rows parsed from `mushroomie_30_tu_khoa_seo.csv`, public post records, and reachable owner URLs.
- Produces: `resolveKeywordOwner(index)`, `getSupportingPostOwner(post)`, `buildSeoPhase4Audit(input)`, JSON report, and Markdown report.

- [ ] **Step 1: Write failing unit tests**

Cover all 30 CSV rows, nine unique owners, exact duplicate focus keywords, malformed post slugs, missing owners, and priority ordering for thin content.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/seo-phase-4.test.ts`

Expected: FAIL because `src/lib/seo-phase-4.ts` does not exist.

- [ ] **Step 3: Implement the pure ownership and audit functions**

Use this owner allocation:

```ts
1..15  -> /san-pham?category=vong-tay
16,18,19,20 -> /san-pham
17 -> /
21..23 -> /san-pham?category=moc-khoa
24..25 -> /san-pham?category=charm
26..27 -> /san-pham?category=vong-co
28 -> /tin-tuc/qua-tang-handmade
29 -> /tin-tuc/vong-tay-best-friend-handmade
30 -> /tin-tuc/qua-handmade-tang-nguoi-yeu
```

- [ ] **Step 4: Implement the read-only production audit**

Fetch the fixed Mushroomie post API and sitemap, parse the CSV, then write:

```text
docs/seo-phase-4/keyword-target-audit.json
docs/seo-phase-4/keyword-target-audit.md
docs/seo-phase-4/cluster-plan.json
docs/seo-phase-4/cluster-plan.md
docs/seo-phase-4/briefs/*.md
```

- [ ] **Step 5: Run tests and generate artifacts**

Run:

```bash
node --import tsx --test tests/seo-phase-4.test.ts
npm run seo:audit:phase-4
```

Expected: 30 keyword rows, nine owner URLs, zero missing owner routes, and ten content briefs.

---

### Task 2: Reinforce canonical owners from supporting articles

**Files:**
- Create: `src/components/blog/PostKeywordOwnerLink.tsx`
- Modify: `src/app/(user)/tin-tuc/[slug]/page.tsx`
- Modify: `tests/seo-phase-4.test.ts`

**Interfaces:**
- Consumes: `getSupportingPostOwner({ slug, focusKeyword })`.
- Produces: a contextual server-rendered link from each supporting article to its canonical commercial or editorial owner.

- [ ] **Step 1: Add a failing integration assertion**

Require the post detail route to render `PostKeywordOwnerLink` with the post slug and focus keyword.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/seo-phase-4.test.ts`

- [ ] **Step 3: Implement the owner-link component**

Render a compact, accessible section with a descriptive varied anchor. Return `null` when the article is itself the owner.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
node --import tsx --test tests/seo-phase-4.test.ts
npm test
```

---

### Task 3: Clean conflicting post SEO metadata safely

**Files:**
- Create: `scripts/apply-seo-phase-4.ts`
- Modify: `package.json`
- Modify: `tests/seo-phase-4.test.ts`

**Interfaces:**
- Consumes: a fixed reviewed metadata plan for the broad commercial-keyword articles.
- Produces: dry-run output by default, backup-gated transactional apply, `PostRevision` rows, and `backups/logs/seo-phase-4-*.json`.

- [ ] **Step 1: Add failing safety tests**

Require dry-run default, Linux-only apply, `backup-production.sh`, gzip verification, transaction usage, revision creation, optimistic `id + updated_at` guards, and rollback logging.

- [ ] **Step 2: Implement the reviewed metadata plan**

Reposition supporting posts to informational long-tail intent while preserving titles, slugs, content, images, and publication status. Mark the malformed duplicate post canonical/noindex instead of deleting it.

- [ ] **Step 3: Run local tests**

Run:

```bash
node --import tsx --test tests/seo-phase-4.test.ts
npm run typecheck
```

- [ ] **Step 4: Deploy code before any database write**

Push and deploy the owner-link and script code, then verify production routes.

- [ ] **Step 5: Run production dry-run**

Run: `npm run seo:phase-4`

Expected: only the reviewed metadata rows, no missing posts, and `safeToApply: true`.

- [ ] **Step 6: Apply with backup and verify**

Run: `npm run seo:phase-4:apply`, immediately redeploy, then repeat the audit.

Expected: no duplicate exact focus-keyword groups, malformed duplicate excluded from sitemap, and all owner routes still HTTP 200.

---

### Task 4: Verification and delivery

**Files:**
- Modify generated files under `docs/seo-phase-4/`.

- [ ] **Step 1: Run complete verification**

```bash
npm ci --legacy-peer-deps
npm exec prisma generate
npm run typecheck
npm test
npm run seo:audit:on-page -- --strict
npm run build
```

- [ ] **Step 2: Verify production**

Check `/`, `/san-pham`, four category owners, three editorial owners, `/tin-tuc`, `/api/health`, sitemap ownership, PM2 logs, and one CSS/JS MIME pair.

- [ ] **Step 3: Commit and push**

Commit only Phase 4 files. Preserve unrelated local changes in `docs/google-business-profile-phase-3-checklist.md`.

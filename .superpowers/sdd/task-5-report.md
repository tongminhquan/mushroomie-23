# Task 5 report: B30 public-bundle and source-contract hardening

Date: 2026-08-12

Status: **COMPLETE**

## Scope

- Changed only `tests/seo-discovery-performance-boundaries.test.ts` and `tests/priority-local-keywords.test.ts` in commit `da9a6a8`.
- Replaced this local report in full; it was not included in the Task 5 commit.
- No production source, plan, specification, ledger, dependency, database, network, deployment, push, or homepage-card expansion was performed.

## Characterization evidence

Before editing, the required boundary command was run exactly:

```text
npx tsx --test tests/seo-discovery-performance-boundaries.test.ts
```

Result: **PASS — 5/5 tests**. This is honest characterization evidence: Tasks 1–4 already satisfied the intended production boundary. No tracked production module was altered to manufacture a RED state.

After the test-only hardening, the same command passed **7/7 tests**.

## Boundary hardening

- Locked the canonical B30 data entries to `src/lib/local-seo-b30.ts` and `src/lib/local-seo-link-graph.ts`.
- Walks every reachable runtime import from those entries and rejects the six forbidden dependency roots from the brief: Google auth, GSC client, discovery worker, discovery admin API, Prisma, and admin components.
- Checks both raw import specifiers and resolved/visited local paths, so relative imports cannot bypass the alias-oriented denylist.
- Asserts both canonical B30 entries omit the `use client` directive and remain server/data-only.
- Kept the existing recursive all-public App Router entry discovery behavior unchanged.

## Scanner sensitivity proof

An isolated in-memory TypeScript fixture contains both:

```text
import { prisma } from '@/lib/prisma'
const worker = import('@/lib/seo-discovery/worker')
```

The real parser extracts both static and dynamic runtime edges, and the real B30 boundary assertion is required to throw with both forbidden specifiers in the diagnostic. This proves the gate detects prohibited edges without mutating production code.

## Featured-four contract

- `PRIORITY_LOCAL_KEYWORD_OWNERS` remains exactly **4** featured commercial UI owners.
- Every featured keyword must exist in the canonical **30-target** B30 registry and its canonical `ownerHref` must equal the featured `href`.
- The existing uniqueness, published-route, schema, canonical, and contextual-label assertions remain in place.
- The homepage was not expanded to 30 cards.

## Final verification

| Check | Result |
| --- | --- |
| Initial boundary characterization | PASS — **5/5** |
| Hardened boundary suite | PASS — **7/7** |
| Exact 8-file focused suite from the brief | PASS — **45/45** |
| `npm run typecheck` | PASS — `tsc --noEmit` exited 0 |
| Pre-stage scope check | PASS — exactly **2** authorized test files |
| `git diff --check` | PASS |
| `git diff --cached --check` | PASS |
| Staged scope check | PASS — exactly **2** authorized test files |
| Staged secret-signature scan | PASS — **0** matches |
| Commit | `da9a6a8` — `test(seo): guard B30 public bundle boundaries` |

Diff count committed: **2 files changed, 85 insertions, 2 deletions**.

## Concerns

No code concern remains in the authorized scope. Browser/build/production verification was intentionally omitted because this is a test-only characterization task with no UI or production mutation, and the brief explicitly forbids network, deployment, and database work.

Artifact note: although `.gitignore` contains `.superpowers/`, this report path is already tracked at the base commit, so Git reports it as one intentional unstaged modification. It was replaced as requested but deliberately excluded from the exact two-test-file commit.

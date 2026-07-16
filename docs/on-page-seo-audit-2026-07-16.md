# Mushroomie on-page SEO audit - 2026-07-16

## Scope

- Production data scanned read-only: 65 published posts and 21 active products.
- Site origin: `https://mushroomie.io.vn`.
- Checks: rendered title and meta description, duplicate metadata, canonical, robots, H1 count, heading jumps, image alt copy, product/catalog links, featured images, and product slugs.
- The audit does not write to the database and does not invent ratings or reviews.

## Results

| Stage | Errors | Warnings | Duplicate title groups | Duplicate meta groups |
|---|---:|---:|---:|---:|
| Production baseline | 2 | 216 | 1 | 1 |
| After Phase 2 render changes | 2 | 0 | 0 | 0 |

The remaining two errors are the known legacy product slugs:

| Product ID | Current slug | Planned canonical slug |
|---:|---|---|
| 4 | `Vòng-tay-quả-táo` | `vong-tay-qua-tao` |
| 5 | `vòng-vỏ-sò` | `vong-vo-so` |

The production dry-run reports `safeToApply: true`, no collisions, and no non-redirectable changes. The database migration has not been applied by this audit.

## Implemented controls

- Product and post metadata are composed as final absolute values, so the root title template cannot duplicate `Mushroomie`.
- Product titles use real SKU values to distinguish products with the same name.
- Product descriptions only mention customization when `is_customizable` is true.
- Metadata image dimensions come from the actual image file instead of fixed guesses.
- Generated repetitive image alt copy is normalized into natural Vietnamese at render time.
- Every public post renders two context-ranked product links plus the catalog link.
- Content H1, heading jumps, missing rendered image alt, canonical mismatch, noindex, duplicate title, and duplicate meta checks are all clear in the final audit.
- Product structured data keeps `offers.price` and `availability`; `aggregateRating` is emitted only from approved real reviews.

## Artifacts

- Baseline details: `docs/on-page-seo-audit-2026-07-16.json`
- Final modeled-render details: `docs/on-page-seo-audit-2026-07-16-final.json`
- Repeat locally or on production: `npm run seo:audit:on-page`
- CI-style error gate: `npm run seo:audit:on-page -- --strict`

## External limitations

Search Console URL Inspection, Google Business Profile, Maps rank grids, and DataForSEO SERP data require authenticated external accounts. No ranking or indexing result is fabricated in this report.

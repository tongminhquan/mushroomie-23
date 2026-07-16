#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { parseCsv } from '../src/lib/bulk-import'
import {
  PHASE4_PRIORITY_POST_SLUGS,
  buildSeoPhase4Audit,
  getSupportingPostOwner,
  resolveKeywordOwner,
  type SeoPhase4KeywordRow,
  type SeoPhase4PostRecord,
} from '../src/lib/seo-phase-4'

const SITE_URL = 'https://mushroomie.io.vn'
const projectRoot = process.cwd()
const outputRoot = path.join(projectRoot, 'docs', 'seo-phase-4')
const briefsRoot = path.join(outputRoot, 'briefs')
const csvPath = path.join(projectRoot, 'mushroomie_30_tu_khoa_seo.csv')

interface PublicPost {
  id: number
  slug: string
  title: string
  content?: string | null
  focus_keyword?: string | null
  word_count?: number | null
}

const briefFocusBySlug: Record<string, string> = {
  'xu-huong-phu-kien-handmade-2024': 'xu hướng phụ kiện handmade cho giới trẻ',
  'cach-lam-vong-tay-handmade-don-gian': 'cách làm vòng tay handmade đơn giản',
  'phu-kien-handmade': 'cách chọn phụ kiện handmade',
  'shop-phu-kien-handmade': 'cách chọn shop phụ kiện handmade uy tín',
  'vong-tay-hat-cuom': 'cách chọn vòng tay hạt cườm',
  'moc-khoa-handmade': 'cách chọn móc khóa handmade',
  'vong-tay-handmade-nu': 'cách chọn vòng tay handmade nữ',
  'vong-tay-charm': 'cách phối vòng tay charm',
  'vong-tay-best-friend-handmade': 'quà sinh nhật cho bạn thân',
  'qua-handmade-tang-nguoi-yeu': 'quà handmade cho người yêu',
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

function countWords(html: string | null | undefined): number {
  const text = String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|quot|#39);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.split(' ').length : 0
}

async function fetchPosts(): Promise<SeoPhase4PostRecord[]> {
  const response = await fetch(`${SITE_URL}/api/posts?status=published&limit=100`)
  if (!response.ok) throw new Error(`Post API returned ${response.status}`)
  const payload = await response.json() as { posts?: PublicPost[] }
  return (payload.posts || []).map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    focusKeyword: post.focus_keyword || null,
    wordCount: post.word_count || countWords(post.content),
  }))
}

async function reachableOwnerUrls(keywordRows: SeoPhase4KeywordRow[]): Promise<string[]> {
  const hrefs = [...new Set(keywordRows.map((row) => resolveKeywordOwner(row.index).href))]
  const checks = await Promise.all(hrefs.map(async (href) => {
    try {
      const response = await fetch(new URL(href, SITE_URL), { redirect: 'follow' })
      return response.ok ? href : null
    } catch {
      return null
    }
  }))
  return checks.filter((href): href is string => Boolean(href))
}

function markdownTable(rows: string[][]): string {
  const escapeCell = (value: string) => value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
  return rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`).join('\n')
}

function renderAuditMarkdown(audit: ReturnType<typeof buildSeoPhase4Audit>): string {
  const rows = [
    ['#', 'Keyword', 'Canonical owner', 'Owner status', 'Current target status'],
    ['---', '---', '---', '---', '---'],
    ...audit.keywords.map((row) => [
      String(row.index),
      row.keyword,
      row.owner.href,
      row.ownerReachable ? '200/reachable' : 'missing',
      row.status,
    ]),
  ]

  return `# Mushroomie SEO Phase 4 - Keyword Target Audit

Generated: ${audit.generatedAt}

## Summary

- Keywords: ${audit.summary.keywordCount}
- Canonical owner URLs: ${audit.summary.ownerCount}
- Missing owners: ${audit.summary.missingOwnerCount}
- Duplicate focus-keyword groups: ${audit.summary.duplicateFocusKeywordCount}
- Malformed post slugs: ${audit.summary.malformedPostSlugCount}
- Priority content briefs: ${audit.summary.priorityPostCount}

## Keyword Ownership

${markdownTable(rows)}

## Duplicate Focus Keywords

${audit.duplicateFocusKeywords.length
    ? audit.duplicateFocusKeywords.map((group) => (
      `- **${group.keyword}**: ${group.posts.map((post) => `${post.id} (${post.slug})`).join(', ')}`
    )).join('\n')
    : '- None detected.'}

## Malformed Post Slugs

${audit.malformedPostSlugs.length
    ? audit.malformedPostSlugs.map((post) => `- ${post.id}: \`${post.slug}\``).join('\n')
    : '- None detected.'}
`
}

function renderClusterMarkdown(
  keywordRows: SeoPhase4KeywordRow[],
  posts: SeoPhase4PostRecord[],
): string {
  const owners = [...new Set(keywordRows.map((row) => resolveKeywordOwner(row.index).href))]
  return `# Mushroomie SEO Phase 4 - Cluster Plan

This plan keeps one canonical owner per search intent. Supporting articles link to the owner and use informational long-tail focus keywords.

${owners.map((href) => {
    const keywords = keywordRows
      .filter((row) => resolveKeywordOwner(row.index).href === href)
      .map((row) => row.keyword)
    const supporters = posts
      .filter((post) => getSupportingPostOwner({
        slug: post.slug,
        focusKeyword: post.focusKeyword,
      })?.href === href)
      .map((post) => `/tin-tuc/${post.slug}`)

    return `## ${href}

**Owned keywords:** ${keywords.join(', ')}

**Current supporting articles:** ${supporters.length ? supporters.join(', ') : 'No direct supporter detected.'}
`
  }).join('\n')}`.trimEnd() + '\n'
}

function renderBrief(post: SeoPhase4PostRecord): string {
  const focusKeyword = briefFocusBySlug[post.slug] || post.focusKeyword || post.title
  const owner = getSupportingPostOwner({ slug: post.slug, focusKeyword })
  const ownerHref = owner?.href || `/tin-tuc/${post.slug}`
  const productHref = focusKeyword.includes('móc khóa')
    ? '/san-pham?category=moc-khoa'
    : focusKeyword.includes('charm')
      ? '/san-pham?category=charm'
      : focusKeyword.includes('vòng cổ') || focusKeyword.includes('dây chuyền')
        ? '/san-pham?category=vong-co'
        : '/san-pham?category=vong-tay'

  return `# Content Brief: ${post.title}

## Current State

- Post ID: ${post.id}
- URL: /tin-tuc/${post.slug}
- Current word count: ${post.wordCount}
- Priority focus keyword: ${focusKeyword}
- Canonical cluster owner: ${ownerHref}
- Recommended target length: 1,200-1,600 useful words

## Search Intent

Answer the practical selection, styling, care, or gifting question behind **${focusKeyword}**. Keep this article informational; do not compete with the canonical product/category owner.

## Required First-Party Evidence

- Add real Mushroomie product photos that directly illustrate the advice.
- Add verified material, size, customization, care, and lead-time details from the actual catalog or production team.
- Add one short first-party observation from making, packing, or advising customers; do not invent customer quotes or sales claims.
- Confirm all prices, availability, promotions, delivery promises, and store details before publishing.

## Recommended Outline

1. Quick answer: who this option suits and when to choose it.
2. Selection criteria: material, color, size, charm, comfort, and intended occasion.
3. Three to five real Mushroomie examples with image alt text tied to the section.
4. Common mistakes and how to avoid them.
5. Care, storage, and gifting guidance.
6. Frequently asked questions based on real customer questions.

## Internal Links

- Canonical owner: ${ownerHref}
- Relevant products: ${productHref}
- Full catalog: /san-pham
- Gift guide: /tin-tuc/qua-tang-handmade
- Brand story/home: /

## Editorial Guardrails

- Use one H1 only and descriptive H2/H3 headings.
- Keep the exact primary keyword natural; avoid repetitive exact-match stuffing.
- Use original 16:9 cover and relevant square in-content images with descriptive alt text.
- Do not publish generic claims, invented experience, fabricated reviews, or unverified product specifications.
- Re-run the on-page SEO audit after the evidence and images are added.
`
}

async function main() {
  const keywordRows = parseKeywordRows()
  if (keywordRows.length !== 30) {
    throw new Error(`Expected 30 keyword rows, received ${keywordRows.length}`)
  }

  const [posts, reachableOwners] = await Promise.all([
    fetchPosts(),
    reachableOwnerUrls(keywordRows),
  ])
  const audit = buildSeoPhase4Audit({
    keywordRows,
    posts,
    reachableOwnerUrls: reachableOwners,
  })
  const clusterPlan = audit.ownerUrls.map((href) => ({
    owner: href,
    keywords: keywordRows
      .filter((row) => resolveKeywordOwner(row.index).href === href)
      .map((row) => row.keyword),
    supportingPosts: posts
      .filter((post) => getSupportingPostOwner({
        slug: post.slug,
        focusKeyword: post.focusKeyword,
      })?.href === href)
      .map((post) => ({ id: post.id, slug: post.slug, title: post.title })),
  }))

  fs.mkdirSync(briefsRoot, { recursive: true })
  fs.writeFileSync(
    path.join(outputRoot, 'keyword-target-audit.json'),
    `${JSON.stringify(audit, null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(outputRoot, 'keyword-target-audit.md'),
    renderAuditMarkdown(audit),
    'utf8',
  )
  fs.writeFileSync(
    path.join(outputRoot, 'cluster-plan.json'),
    `${JSON.stringify(clusterPlan, null, 2)}\n`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(outputRoot, 'cluster-plan.md'),
    renderClusterMarkdown(keywordRows, posts),
    'utf8',
  )

  for (const slug of PHASE4_PRIORITY_POST_SLUGS) {
    const post = posts.find((candidate) => candidate.slug === slug)
    if (!post) continue
    fs.writeFileSync(path.join(briefsRoot, `${slug}.md`), renderBrief(post), 'utf8')
  }

  console.log(JSON.stringify({
    summary: audit.summary,
    outputRoot,
    briefsWritten: audit.priorityPosts.length,
    missingPrioritySlugs: PHASE4_PRIORITY_POST_SLUGS
      .filter((slug) => !posts.some((post) => post.slug === slug)),
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

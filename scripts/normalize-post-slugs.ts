#!/usr/bin/env ts-node

// Normalize dirty post slugs that were stored as full URLs, e.g.
//   "https://mushroomie.io.vn/vong-tay-handmade-nu/"  ->  "vong-tay-handmade-nu"
// Such slugs can never match /tin-tuc/[slug] (308/404) and are dropped from the
// sitemap by its isValidSlug filter. Dry-run by default; pass --apply to write.
// Apply mode runs scripts/backup-production.sh first (same as normalize-post-image-urls.ts).
//
// Usage (from the project root, with production DATABASE_URL in the environment):
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/normalize-post-slugs.ts
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/normalize-post-slugs.ts --apply

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const applyChanges = process.argv.includes('--apply')
const projectRoot = process.cwd()
const backupScript = path.join(projectRoot, 'scripts', 'backup-production.sh')

// Same predicate as isValidSlug in src/app/sitemap.ts.
function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && !/[\s/?#]/.test(slug) && !slug.includes('://')
}

// Mirrors generateSlug in src/lib/utils.ts. Inlined because scripts run via plain
// ts-node, which does not resolve the "@/" path alias used inside src/lib.
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Pull the last meaningful path segment out of a URL (or URL-ish string):
// strip scheme+domain, query, hash and surrounding slashes.
function extractSlugCandidate(raw: string): string {
  let value = raw.trim()

  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname
    } catch {
      // Malformed URL — fall through and treat it as a plain path below.
    }
  }

  value = value.split(/[?#]/)[0]
  const segments = value.split('/').map((s) => s.trim()).filter(Boolean)
  if (segments.length > 0) value = segments[segments.length - 1]

  try {
    value = decodeURIComponent(value)
  } catch {
    // Keep the raw segment if it contains stray "%" sequences.
  }

  return value
}

async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, slug: true, title: true, status: true },
    orderBy: { id: 'asc' },
  })

  const dirty = posts.filter((p) => !isValidSlug(p.slug))
  // Slugs already in use by posts we are NOT touching; slug is @unique in schema.prisma.
  const taken = new Set(posts.filter((p) => isValidSlug(p.slug)).map((p) => p.slug))

  const changes: Array<{ id: number; status: string; from: string; to: string }> = []

  for (const post of dirty) {
    let base = generateSlug(extractSlugCandidate(post.slug))
    if (!base) base = generateSlug(post.title)
    if (!base) base = `bai-viet-${post.id}`

    let next = base
    for (let n = 2; taken.has(next); n++) next = `${base}-${n}`
    taken.add(next)

    changes.push({ id: post.id, status: post.status, from: post.slug, to: next })
  }

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    postsScanned: posts.length,
    dirtySlugs: dirty.length,
    changes,
  }, null, 2))

  if (!applyChanges || changes.length === 0) return

  runBackup()

  await prisma.$transaction(
    changes.map(({ id, to }) => prisma.post.update({ where: { id }, data: { slug: to } })),
  )

  console.log(`Updated ${changes.length} post slug(s).`)
  for (const { id, status, to } of changes) {
    console.log(`  [Post ${id}] (${status}) -> /tin-tuc/${to}`)
  }
}

function runBackup() {
  if (process.platform === 'win32') {
    throw new Error('Apply mode must run on the Linux production server so the production backup can be created first.')
  }
  if (!fs.existsSync(backupScript)) {
    throw new Error(`Backup script not found: ${backupScript}`)
  }

  execFileSync('bash', [backupScript], {
    cwd: projectRoot,
    stdio: 'inherit',
  })
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

#!/usr/bin/env tsx

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PHASE4_METADATA_CHANGES } from '../src/lib/seo-phase-4'

const applyChanges = process.argv.includes('--apply')
const projectRoot = process.cwd()
const backupScript = path.join(projectRoot, 'scripts', 'backup-production.sh')
const backupDbDirectory = path.join(projectRoot, 'backups', 'db')
const rollbackLogDirectory = path.join(projectRoot, 'backups', 'logs')

if (applyChanges && process.platform === 'win32') {
  throw new Error('Apply mode is only allowed on the Linux production server.')
}

const prisma = new PrismaClient()

function listDatabaseBackups(): Set<string> {
  if (!fs.existsSync(backupDbDirectory)) return new Set()
  return new Set(
    fs.readdirSync(backupDbDirectory).filter((fileName) => fileName.endsWith('.sql.gz')),
  )
}

function runBackup(): string {
  if (!fs.existsSync(backupScript)) {
    throw new Error(`Backup script not found: ${backupScript}`)
  }

  const backupsBefore = listDatabaseBackups()
  execFileSync('bash', [backupScript], { cwd: projectRoot, stdio: 'inherit' })

  const newBackup = [...listDatabaseBackups()].find((fileName) => !backupsBefore.has(fileName))
  if (!newBackup) {
    throw new Error('Backup completed without creating a new database dump; no metadata was changed.')
  }

  const databaseBackup = path.join(backupDbDirectory, newBackup)
  if (fs.statSync(databaseBackup).size === 0) {
    throw new Error(`Database backup is empty; no metadata was changed: ${databaseBackup}`)
  }
  execFileSync('gzip', ['-t', databaseBackup], { stdio: 'inherit' })
  return databaseBackup
}

async function loadPlan() {
  const expectedIds = PHASE4_METADATA_CHANGES.map((change) => change.id)
  const posts = await prisma.post.findMany({
    where: { id: { in: expectedIds } },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      excerpt: true,
      seo_title: true,
      meta_description: true,
      focus_keyword: true,
      canonical_url: true,
      robots_index: true,
      status: true,
      author_id: true,
      updated_at: true,
    },
    orderBy: { id: 'asc' },
  })
  const postById = new Map(posts.map((post) => [post.id, post]))

  const missing = PHASE4_METADATA_CHANGES
    .filter((change) => !postById.has(change.id))
    .map((change) => ({ id: change.id, expectedSlug: change.slug }))
  const slugMismatches = PHASE4_METADATA_CHANGES
    .flatMap((change) => {
      const post = postById.get(change.id)
      if (!post || post.slug === change.slug) return []
      return [{ id: change.id, expectedSlug: change.slug, actualSlug: post.slug }]
    })
  const changes = PHASE4_METADATA_CHANGES.flatMap((change) => {
    const post = postById.get(change.id)
    if (!post || post.slug !== change.slug) return []

    const data = Object.fromEntries(
      Object.entries(change.data).filter(([field, value]) => (
        post[field as keyof typeof post] !== value
      )),
    ) as typeof change.data
    if (Object.keys(data).length === 0) return []

    return [{ definition: change, post, data }]
  })

  return {
    posts,
    missing,
    slugMismatches,
    changes,
    safeToApply: missing.length === 0 && slugMismatches.length === 0,
  }
}

async function main() {
  let plan = await loadPlan()

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    postsExpected: PHASE4_METADATA_CHANGES.length,
    postsFound: plan.posts.length,
    postsToUpdate: plan.changes.length,
    safeToApply: plan.safeToApply,
    missing: plan.missing,
    slugMismatches: plan.slugMismatches,
    changes: plan.changes.map(({ definition, post, data }) => ({
      id: post.id,
      slug: post.slug,
      reason: definition.reason,
      before: {
        title: post.title,
        focus_keyword: post.focus_keyword,
        canonical_url: post.canonical_url,
        robots_index: post.robots_index,
      },
      after: data,
    })),
  }, null, 2))

  if (!applyChanges) return
  if (!plan.safeToApply) {
    throw new Error('Apply blocked: the reviewed post IDs and slugs do not match production.')
  }
  if (plan.changes.length === 0) return

  const databaseBackup = runBackup()
  plan = await loadPlan()
  if (!plan.safeToApply) {
    throw new Error('Apply blocked: the metadata plan became unsafe after the production backup.')
  }
  if (plan.changes.length === 0) {
    console.log('No Phase 4 metadata changes remain after the production backup.')
    return
  }

  fs.mkdirSync(rollbackLogDirectory, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const rollbackLog = path.join(rollbackLogDirectory, `seo-phase-4-${timestamp}.json`)
  const rollbackArtifact = {
    createdAt: new Date().toISOString(),
    status: 'prepared',
    databaseBackup,
    guidance: 'Restore the database backup or apply each before value by post id in one reviewed transaction.',
    changes: plan.changes.map(({ post, data }) => ({
      id: post.id,
      slug: post.slug,
      updated_at: post.updated_at.toISOString(),
      before: {
        title: post.title,
        focus_keyword: post.focus_keyword,
        canonical_url: post.canonical_url,
        robots_index: post.robots_index,
      },
      after: data,
    })),
  }
  fs.writeFileSync(rollbackLog, `${JSON.stringify(rollbackArtifact, null, 2)}\n`, 'utf8')

  await prisma.$transaction(async (transaction) => {
    for (const { post, data } of plan.changes) {
      await transaction.postRevision.create({
        data: {
          post_id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          seo_title: post.seo_title,
          meta_description: post.meta_description,
          status: post.status,
          author_id: post.author_id,
        },
      })

      const result = await transaction.post.updateMany({
        where: {
          id: post.id,
          slug: post.slug,
          updated_at: post.updated_at,
        },
        data,
      })
      if (result.count !== 1) {
        throw new Error(`Post ${post.id} changed after backup; the transaction was rolled back.`)
      }
    }
  }, { maxWait: 10_000, timeout: 120_000 })

  fs.writeFileSync(
    rollbackLog,
    `${JSON.stringify({ ...rollbackArtifact, status: 'applied' }, null, 2)}\n`,
    'utf8',
  )
  console.log(`Updated ${plan.changes.length} post(s). Rollback log: ${rollbackLog}`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

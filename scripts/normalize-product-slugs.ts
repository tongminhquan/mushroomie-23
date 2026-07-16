#!/usr/bin/env tsx

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { analyzeProductSlugNormalization } from '../src/lib/product-slug'

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
  execFileSync('bash', [backupScript], {
    cwd: projectRoot,
    stdio: 'inherit',
  })

  const newBackup = [...listDatabaseBackups()].find((fileName) => !backupsBefore.has(fileName))
  if (!newBackup) {
    throw new Error('Backup script completed without creating a new database dump; no slugs were changed.')
  }

  const databaseBackup = path.join(backupDbDirectory, newBackup)
  if (fs.statSync(databaseBackup).size === 0) {
    throw new Error(`Database backup is empty; no slugs were changed: ${databaseBackup}`)
  }
  execFileSync('gzip', ['-t', databaseBackup], { stdio: 'inherit' })

  return databaseBackup
}

async function main() {
  let products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { id: 'asc' },
  })
  let analysis = analyzeProductSlugNormalization(products)

  console.log(JSON.stringify({
    mode: applyChanges ? 'apply' : 'dry-run',
    productsScanned: products.length,
    productsToUpdate: analysis.changes.length,
    safeToApply: analysis.safeToApply,
    collisions: analysis.collisions,
    nonRedirectable: analysis.nonRedirectable,
    changes: analysis.changes.map((change) => ({
      id: change.id,
      old: change.from,
      new: change.to,
    })),
  }, null, 2))

  if (!applyChanges) return
  if (!analysis.safeToApply) {
    throw new Error(
      'Apply blocked: resolve slug collisions and non-redirectable aliases shown in the dry-run first.',
    )
  }
  if (analysis.changes.length === 0) return

  const databaseBackup = runBackup()
  products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { id: 'asc' },
  })
  analysis = analyzeProductSlugNormalization(products)
  if (!analysis.safeToApply) {
    throw new Error('Apply blocked: the slug plan became unsafe after the production backup.')
  }
  if (analysis.changes.length === 0) {
    console.log('No product slugs remain to update after the production backup.')
    return
  }

  console.log(`Apply plan refreshed after backup: ${analysis.changes.length} product slug(s).`)
  fs.mkdirSync(rollbackLogDirectory, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const rollbackLog = path.join(
    rollbackLogDirectory,
    `product-slug-normalization-${timestamp}.json`,
  )
  const rollbackArtifact = {
    createdAt: new Date().toISOString(),
    status: 'prepared',
    databaseBackup,
    guidance: 'To roll back, restore the database backup or apply each old slug by product id in one reviewed transaction.',
    changes: analysis.changes,
  }
  fs.writeFileSync(rollbackLog, `${JSON.stringify(rollbackArtifact, null, 2)}\n`, 'utf8')

  await prisma.$transaction(async (transaction) => {
    for (const change of analysis.changes) {
      const result = await transaction.product.updateMany({
        where: { id: change.id, slug: change.from },
        data: { slug: change.to },
      })
      if (result.count !== 1) {
        throw new Error(
          `Product ${change.id} changed after the backup; the slug transaction was rolled back.`,
        )
      }
    }
  }, { maxWait: 10_000, timeout: 120_000 })

  fs.writeFileSync(
    rollbackLog,
    `${JSON.stringify({ ...rollbackArtifact, status: 'applied' }, null, 2)}\n`,
    'utf8',
  )
  console.log(`Updated ${analysis.changes.length} product slug(s). Rollback log: ${rollbackLog}`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

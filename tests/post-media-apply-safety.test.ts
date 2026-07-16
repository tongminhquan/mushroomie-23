import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL('../scripts/generate-post-media.ts', import.meta.url),
  'utf8',
)

test('post media apply mode requires a fresh valid database backup before writes', () => {
  assert.match(source, /listDatabaseBackups/)
  assert.match(source, /stat\(databaseBackup\)/)
  assert.match(source, /backupStats\.size === 0/)
  assert.match(source, /execFileAsync\('gzip', \['-t', databaseBackup\]/)

  const backupGate = source.indexOf('if (applyMode) await prepareApplyMode()')
  const uploadsWrite = source.indexOf('await fs.mkdir(uploadsRoot')
  const databaseQuery = source.indexOf('await prisma.post.findMany')

  assert.ok(backupGate >= 0)
  assert.ok(backupGate < uploadsWrite)
  assert.ok(backupGate < databaseQuery)
})

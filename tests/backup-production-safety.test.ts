import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const backupScriptUrl = new URL('../scripts/backup-production.sh', import.meta.url)

test('production backup never deletes retained backups and fails closed without a database dump', async () => {
  const source = await readFile(backupScriptUrl, 'utf8')

  assert.doesNotMatch(source, /find\b[^\n]*-(?:delete|exec\s+rm)\b/)
  assert.doesNotMatch(source, /\brm\s+(?:-[^\s]+\s+)*["']?\$BACKUP_DIR/)
  assert.doesNotMatch(source, /Skipping DB backup/i)
  assert.match(source, /SEO_DISCOVERY_BACKUP_DATABASE_URL_REQUIRED/)
})

test('production backup parses the database URL structurally and validates both artifacts', async () => {
  const source = await readFile(backupScriptUrl, 'utf8')

  assert.match(source, /new URL\(process\.env\.DATABASE_URL\)/)
  assert.doesNotMatch(source, /sed\s+-E\s+['"]s\/mysql:/)
  assert.match(source, /mysqldump\b[^\n]*--single-transaction/)
  assert.match(source, /gzip\s+-t/)
  assert.match(source, /tar\s+-tzf/)
  assert.match(source, /umask\s+077/)
})

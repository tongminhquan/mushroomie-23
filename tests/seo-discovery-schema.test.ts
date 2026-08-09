import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync('prisma/schema.prisma', 'utf8')
const migration = readFileSync(
  'prisma/migrations/20260809090000_add_seo_discovery_jobs/migration.sql',
  'utf8',
)

const requiredFields = [
  'url',
  'source_type',
  'source_id',
  'content_updated_at',
  'status',
  'eligibility_status',
  'http_status',
  'declared_canonical',
  'robots_indexable',
  'gsc_verdict',
  'coverage_state',
  'page_fetch_state',
  'google_canonical',
  'last_crawl_at',
  'last_inspected_at',
  'next_attempt_at',
  'attempt_count',
  'last_error_code',
  'last_error_message',
  'lease_token',
  'lease_expires_at',
] as const

type IndexContract = {
  type: 'INDEX' | 'UNIQUE INDEX'
  name: string
  columns: readonly string[]
}

const requiredIndexes = [
  {
    type: 'UNIQUE INDEX',
    name: 'seo_discovery_jobs_url_key',
    columns: ['url'],
  },
  {
    type: 'INDEX',
    name: 'seo_discovery_jobs_status_next_attempt_at_idx',
    columns: ['status', 'next_attempt_at'],
  },
  {
    type: 'INDEX',
    name: 'seo_discovery_jobs_source_type_source_id_idx',
    columns: ['source_type', 'source_id'],
  },
  {
    type: 'INDEX',
    name: 'seo_discovery_jobs_lease_expires_at_idx',
    columns: ['lease_expires_at'],
  },
] as const satisfies readonly IndexContract[]

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractPrismaModel(schemaSource: string, modelName: string) {
  const modelPattern = new RegExp(
    `^model ${escapeRegExp(modelName)}\\s*\\{\\r?\\n([\\s\\S]*?)^\\}`,
    'm',
  )
  const match = schemaSource.match(modelPattern)

  assert.ok(match, `${modelName} model must exist`)
  return match[1]
}

function extractCreateTableBody(migrationSource: string, tableName: string) {
  const tablePattern = new RegExp(
    `^CREATE TABLE \`${escapeRegExp(tableName)}\`\\s*\\(\\r?\\n([\\s\\S]*?)^\\)\\s*DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    'm',
  )
  const match = migrationSource.match(tablePattern)

  assert.ok(match, `${tableName} CREATE TABLE statement must exist`)
  return match[1]
}

function assertRequiredModelFields(modelBody: string) {
  for (const field of requiredFields) {
    assert.match(
      modelBody,
      new RegExp(`^\\s+${escapeRegExp(field)}\\s+\\S+`, 'm'),
      `SeoDiscoveryJob must define field ${field}`,
    )
  }
}

function assertRequiredTableColumns(tableBody: string) {
  for (const column of requiredFields) {
    assert.match(
      tableBody,
      new RegExp(`^\\s+\`${escapeRegExp(column)}\`\\s+\\S+`, 'm'),
      `seo_discovery_jobs must define column ${column}`,
    )
  }
}

function parseIndexes(tableBody: string) {
  const indexPattern = /^\s*(UNIQUE INDEX|INDEX)\s+`([^`]+)`\s*\(([^)\r\n]+)\)\s*,?\s*$/gm
  const indexes: Array<{
    type: IndexContract['type']
    name: string
    columns: string[]
  }> = []

  for (const match of tableBody.matchAll(indexPattern)) {
    const columns = match[3].split(',').map((rawColumn) => {
      const columnMatch = rawColumn.trim().match(/^`([^`]+)`$/)
      assert.ok(columnMatch, `Index ${match[2]} must use plain quoted column names`)
      return columnMatch[1]
    })

    indexes.push({
      type: match[1] as IndexContract['type'],
      name: match[2],
      columns,
    })
  }

  return indexes
}

function assertIndex(tableBody: string, expected: IndexContract) {
  const matchingIndexes = parseIndexes(tableBody).filter(
    (index) => index.name === expected.name,
  )

  assert.equal(
    matchingIndexes.length,
    1,
    `Expected exactly one index named ${expected.name}`,
  )
  assert.equal(
    matchingIndexes[0].type,
    expected.type,
    `Index ${expected.name} must have type ${expected.type}`,
  )
  assert.deepEqual(
    matchingIndexes[0].columns,
    [...expected.columns],
    `Index ${expected.name} must use exactly (${expected.columns.join(', ')})`,
  )
}

function assertSeoDiscoveryJobContract(
  schemaSource: string,
  migrationSource: string,
) {
  const modelBody = extractPrismaModel(schemaSource, 'SeoDiscoveryJob')
  const tableBody = extractCreateTableBody(migrationSource, 'seo_discovery_jobs')

  assertRequiredModelFields(modelBody)
  assertRequiredTableColumns(tableBody)
  for (const expectedIndex of requiredIndexes) {
    assertIndex(tableBody, expectedIndex)
  }
}

function replaceOnce(
  source: string,
  searchValue: string | RegExp,
  replacement: string,
) {
  const mutated = source.replace(searchValue, replacement)
  assert.notEqual(mutated, source, 'Mutation setup must change its fixture')
  return mutated
}

function formatIndexDefinition(index: IndexContract) {
  return `${index.type} \`${index.name}\`(${index.columns
    .map((column) => `\`${column}\``)
    .join(', ')})`
}

test('SeoDiscoveryJob stores durable scheduling and inspection evidence', () => {
  assertSeoDiscoveryJobContract(schema, migration)
})

test('rejects required evidence fields that exist outside SeoDiscoveryJob', () => {
  const schemaWithoutLeaseToken = replaceOnce(
    schema,
    /^\s+lease_token\s+String\?\s+@db\.VarChar\(64\)\r?\n/m,
    '',
  )
  const fieldOutsideModel = `${schemaWithoutLeaseToken}\nmodel SeoDiscoveryDecoy {\n  id          Int     @id\n  lease_token String? @db.VarChar(64)\n}\n`

  assert.throws(
    () => assertSeoDiscoveryJobContract(fieldOutsideModel, migration),
    /SeoDiscoveryJob must define field lease_token/,
  )
})

test('rejects required evidence columns outside seo_discovery_jobs', () => {
  const migrationWithoutLeaseToken = replaceOnce(
    migration,
    /^\s+`lease_token`\s+VARCHAR\(64\)\s+NULL,\r?\n/m,
    '',
  )
  const columnOutsideTable = `${migrationWithoutLeaseToken}\n\nCREATE TABLE \`seo_discovery_decoy\` (\n  \`lease_token\` VARCHAR(64) NULL\n) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`

  assert.throws(
    () => assertSeoDiscoveryJobContract(schema, columnOutsideTable),
    /seo_discovery_jobs must define column lease_token/,
  )
})

test('rejects same-name indexes with an incorrect ordered column list', () => {
  const wrongColumnsByIndexName = new Map<string, readonly string[]>([
    ['seo_discovery_jobs_url_key', ['source_type']],
    [
      'seo_discovery_jobs_status_next_attempt_at_idx',
      ['next_attempt_at', 'status'],
    ],
    [
      'seo_discovery_jobs_source_type_source_id_idx',
      ['source_id', 'source_type'],
    ],
    ['seo_discovery_jobs_lease_expires_at_idx', ['lease_token']],
  ])

  for (const expectedIndex of requiredIndexes) {
    const wrongColumns = wrongColumnsByIndexName.get(expectedIndex.name)
    assert.ok(wrongColumns, `Missing mutation fixture for ${expectedIndex.name}`)

    const wrongIndex = { ...expectedIndex, columns: wrongColumns }
    const migrationWithWrongColumns = replaceOnce(
      migration,
      formatIndexDefinition(expectedIndex),
      formatIndexDefinition(wrongIndex),
    )

    assert.throws(
      () => assertSeoDiscoveryJobContract(schema, migrationWithWrongColumns),
      new RegExp(escapeRegExp(expectedIndex.name)),
    )
  }
})

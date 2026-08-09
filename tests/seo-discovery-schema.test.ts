import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync('prisma/schema.prisma', 'utf8')
const migration = readFileSync(
  'prisma/migrations/20260809090000_add_seo_discovery_jobs/migration.sql',
  'utf8',
)

test('SeoDiscoveryJob stores durable scheduling and inspection evidence', () => {
  for (const field of [
    'url', 'source_type', 'source_id', 'content_updated_at', 'status',
    'eligibility_status', 'http_status', 'declared_canonical', 'robots_indexable',
    'gsc_verdict', 'coverage_state', 'page_fetch_state', 'google_canonical',
    'last_crawl_at', 'last_inspected_at', 'next_attempt_at', 'attempt_count',
    'last_error_code', 'last_error_message', 'lease_token', 'lease_expires_at',
  ]) assert.match(schema, new RegExp(`\\b${field}\\b`))

  assert.match(migration, /CREATE TABLE `seo_discovery_jobs`/)
  assert.match(migration, /UNIQUE INDEX `seo_discovery_jobs_url_key`/)
  assert.match(migration, /INDEX `seo_discovery_jobs_status_next_attempt_at_idx`/)
})

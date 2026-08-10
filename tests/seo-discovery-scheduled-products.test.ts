import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

function count(source: string, fragment: string): number {
  return source.split(fragment).length - 1
}

test('scheduled publishing conditionally transitions selected ids and emits saved rows once', () => {
  const source = read('src/lib/scheduled-publisher.ts')

  assert.match(source, /post\.findMany\(/)
  assert.match(source, /select:\s*\{\s*id:\s*true\s*\}/)
  assert.match(source, /post\.update\(/)
  assert.match(source, /where:\s*\{\s*id[^}]*status:\s*['"]scheduled['"]/)
  assert.match(
    source,
    /select:\s*\{\s*id:\s*true,\s*slug:\s*true,\s*updated_at:\s*true\s*\}/,
  )
  assert.match(source, /P2025/)
  assert.match(source, /recordAndRevalidatePublication\(\{/)
  assert.match(source, /sourceId:\s*(?:saved|publishedPost)\.id/)
  assert.match(source, /contentUpdatedAt:\s*(?:saved|publishedPost)\.updated_at/)
  assert.match(source, /reason:\s*['"]scheduled['"]/)
  assert.doesNotMatch(source, /post\.updateMany\(/)
})

test('cron delegates to publishDuePosts and returns only transitioned saved ids', () => {
  const source = read('src/app/api/cron/publish-scheduled-posts/route.ts')

  assert.match(source, /import \{ publishDuePosts \} from ['"]@\/lib\/scheduled-publisher['"]/)
  assert.equal(count(source, 'publishDuePosts()'), 1)
  assert.match(source, /publishedCount:\s*publishedPosts\.length/)
  assert.match(source, /postIds:\s*publishedPosts\.map\(\(post\) => post\.id\)/)
  assert.match(source, /timingSafeStringEqual\(token, secret\)/)
  assert.doesNotMatch(source, /@\/lib\/prisma|prisma\.post/)
})

test('product routes use saved active rows without duplicate cache invalidation', () => {
  const createRoute = read('src/app/api/products/route.ts')
  const updateRoute = read('src/app/api/products/[id]/route.ts')
  const publication = read('src/lib/seo-discovery/publication.ts')

  assert.match(publication, /shouldRecordProductPublication/)
  assert.match(publication, /saved\.status !== ['"]active['"]/)
  assert.doesNotMatch(publication, /updated_at[^\n]*(?:some|!==|===)/)

  assert.match(createRoute, /if \(product\.status === ['"]active['"]\)/)
  assert.equal(count(createRoute, 'recordAndRevalidatePublication('), 1)
  assert.match(createRoute, /sourceId:\s*product\.id/)
  assert.match(createRoute, /contentUpdatedAt:\s*product\.updated_at/)
  assert.match(createRoute, /reason:\s*['"]created['"]/)

  assert.match(updateRoute, /shouldRecordProductPublication\(existing, product\)/)
  assert.equal(count(updateRoute, 'recordAndRevalidatePublication('), 1)
  assert.match(updateRoute, /sourceId:\s*product\.id/)
  assert.match(updateRoute, /contentUpdatedAt:\s*product\.updated_at/)
  assert.match(updateRoute, /previousUrl/)
  assert.match(updateRoute, /existing\.status === ['"]active['"]/)
})

test('sitemap sync is fixed-reader, conditional, non-destructive reconciliation', () => {
  const source = read('src/lib/seo-discovery/sitemap-sync.ts')

  assert.match(source, /readFixedSitemap/)
  assert.match(source, /seoDiscoveryJob\.createMany\(/)
  assert.match(source, /skipDuplicates:\s*true/)
  assert.match(source, /content_updated_at:\s*\{\s*lt:/)
  assert.match(source, /REMOVED_FROM_SITEMAP/)
  assert.match(source, /source_type:\s*['"]sitemap_sync['"]/)
  assert.doesNotMatch(source, /(?:post|product)\.(?:update|delete)/)
  assert.doesNotMatch(source, /seoDiscoveryJob\.delete/)
})

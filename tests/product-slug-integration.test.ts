import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('product write APIs normalize slugs on the server and reject empty normalized values', () => {
  for (const path of ['src/app/api/products/route.ts', 'src/app/api/products/[id]/route.ts']) {
    const source = read(path)
    assert.match(source, /normalizeProductSlugInput/)
    assert.match(source, /Invalid product slug/)
    assert.match(source, /status:\s*400/)
  }

  const updateRoute = read('src/app/api/products/[id]/route.ts')
  assert.match(updateRoute, /if \(body\.slug !== undefined\)/)
  assert.doesNotMatch(updateRoute, /body\.slug !== undefined \|\| body\.name !== undefined/)
  assert.match(updateRoute, /P2002/)
  assert.match(updateRoute, /status:\s*409/)
})

test('admin product forms normalize displayed and submitted slug values', () => {
  for (const path of [
    'src/app/admin/san-pham/them/page.tsx',
    'src/app/admin/san-pham/[id]/page.tsx',
  ]) {
    const source = read(path)
    assert.match(source, /import \{ generateSlug \} from '@\/lib\/utils'/)
    assert.match(source, /slug:\s*generateSlug\(form\.slug \|\| form\.name\)/)
    assert.match(source, /\/san-pham\/\$\{form\.slug\}/)
  }

  assert.doesNotMatch(
    read('src/app/admin/san-pham/[id]/page.tsx'),
    /function generateSlug\(/,
  )
})

test('product detail resolves exact slugs before canonical fallback and permanently redirects aliases', () => {
  const source = read('src/app/(user)/san-pham/[slug]/page.tsx')

  assert.match(source, /getProductSlugLookupCandidates/)
  assert.match(source, /for \(const candidate of candidates\)/)
  assert.match(
    source,
    /permanentRedirect\(`\/san-pham\/\$\{encodeURIComponent\(productRaw\.slug\)\}`\)/,
  )
  assert.match(source, /canonical:\s*toAbsoluteUrl\(`\/san-pham\/\$\{product\.slug\}`\)/)
  assert.doesNotMatch(source, /node:fs|backups[\\/]logs|product-slug-normalization-/)
})

test('normalization script is dry-run by default and gates transactional writes behind backup', () => {
  const source = read('scripts/normalize-product-slugs.ts')
  const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

  assert.match(source, /process\.argv\.includes\('--apply'\)/)
  assert.match(source, /process\.platform === 'win32'/)
  assert.match(source, /backup-production\.sh/)
  assert.match(source, /execFileSync\('bash'/)
  assert.match(source, /statSync\(databaseBackup\)\.size/)
  assert.match(source, /execFileSync\('gzip', \['-t', databaseBackup\]/)
  assert.match(source, /prisma\.\$transaction/)
  assert.match(source, /updateMany/)
  assert.match(source, /slug:\s*change\.from/)
  assert.match(source, /analyzeProductSlugNormalization/)
  assert.match(source, /safeToApply/)
  assert.match(source, /collisions/)
  assert.match(source, /nonRedirectable/)
  assert.equal(packageJson.scripts['products:normalize-slugs'], 'tsx scripts/normalize-product-slugs.ts')
  assert.equal(
    packageJson.scripts['products:normalize-slugs:apply'],
    'tsx scripts/normalize-product-slugs.ts --apply',
  )
})

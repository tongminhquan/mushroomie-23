import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootUrl = new URL('../', import.meta.url)
const sourceRoot = fileURLToPath(new URL('src/', rootUrl))

async function collectSourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath)
    }

    return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : []
  }))

  return nested.flat()
}

test('the standalone Remotion project is excluded from the website typecheck', async () => {
  const tsconfig = JSON.parse(
    await readFile(new URL('tsconfig.json', rootUrl), 'utf8'),
  ) as { exclude?: string[] }

  assert.ok(
    tsconfig.exclude?.includes('video/mushroomie-website-intro'),
    'The website build must not typecheck the independently installed Remotion project.',
  )
})

test('Search Console authentication stays outside client and public layout bundles', async () => {
  const adapterPath = path.join(
    sourceRoot,
    'lib',
    'seo-discovery',
    'google-gsc-client.ts',
  )
  const adapter = await readFile(adapterPath, 'utf8')
  assert.match(
    adapter,
    /^import ['"]server-only['"];?$/m,
    'The Search Console adapter must be marked server-only.',
  )

  const forbiddenImport = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"][^'"]*(?:google-gsc-client|google-auth-library)['"]/m
  const sourceFiles = await collectSourceFiles(sourceRoot)

  for (const filePath of sourceFiles) {
    const relativePath = path.relative(sourceRoot, filePath).replaceAll(path.sep, '/')
    const contents = await readFile(filePath, 'utf8')
    const isClientModule = contents.slice(0, 500).match(/['"]use client['"]/) !== null
    const isPublicLayout = relativePath === 'app/layout.tsx'
      || (
        relativePath.startsWith('app/(user)/')
        && relativePath.endsWith('/layout.tsx')
      )

    if (isClientModule || isPublicLayout) {
      assert.doesNotMatch(
        contents,
        forbiddenImport,
        `${relativePath} must not import the server-only Search Console adapter or google-auth-library.`,
      )
    }
  }
})

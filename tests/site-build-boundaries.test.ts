import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const rootUrl = new URL('../', import.meta.url)

test('the standalone Remotion project is excluded from the website typecheck', async () => {
  const tsconfig = JSON.parse(
    await readFile(new URL('tsconfig.json', rootUrl), 'utf8'),
  ) as { exclude?: string[] }

  assert.ok(
    tsconfig.exclude?.includes('video/mushroomie-website-intro'),
    'The website build must not typecheck the independently installed Remotion project.',
  )
})

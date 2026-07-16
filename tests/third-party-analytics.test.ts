import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const publicLayoutSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'layout.tsx'),
  'utf8',
)

test('public layout delegates Clarity to GTM instead of loading the tag twice', () => {
  assert.match(publicLayoutSource, /<GtmInit\s*\/>/)
  assert.doesNotMatch(publicLayoutSource, /ClarityInit/)
})

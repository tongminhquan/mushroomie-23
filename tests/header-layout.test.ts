import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const ROOT = path.resolve(__dirname, '..')
const HEADER = fs.readFileSync(path.join(ROOT, 'src/components/layout/Header.tsx'), 'utf8')

test('desktop header rows do not overlap while the page starts scrolling', () => {
  assert.doesNotMatch(
    HEADER,
    /className="[^"]*\bsticky\b[^"]*\btop-0\b[^"]*"[\s\S]*?<div className="brand-container flex h-\[74px\]/,
  )
})

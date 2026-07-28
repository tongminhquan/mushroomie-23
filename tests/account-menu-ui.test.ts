import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const accountPage = readFileSync('src/app/(user)/tai-khoan/page.tsx', 'utf8')

test('account menu preserves compact mobile labels and 44px tap targets', () => {
  assert.match(accountPage, /min-h-11/)
  assert.match(accountPage, /whitespace-nowrap/)
  assert.match(accountPage, /shrink-0/)
})

test('account identity truncates only the text content, not its icons', () => {
  assert.match(accountPage, /<span className="truncate" title=\{user\.name\}>\{user\.name\}<\/span>/)
  assert.match(accountPage, /<span className="truncate" title=\{user\.email\}>\{user\.email\}<\/span>/)
})

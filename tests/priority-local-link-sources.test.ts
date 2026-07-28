import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { resolve } from 'node:path'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

test('trang chu dung owner map chung cho bon card local uu tien', () => {
  const source = readSource('src/components/home/landing/HomeLocalAreas.tsx')

  assert.match(source, /getPriorityLocalHomeCards/)
  assert.doesNotMatch(source, /href:\s*['"]\/vong-tay-custom-dong-nai['"]/)
})

test('trang lien he dung owner map chung thay vi danh sach owner viet tay', () => {
  const source = readSource('src/app/(user)/lien-he/page.tsx')

  assert.match(source, /getPriorityLocalLinks\('contact'\)/)
})

test('footer dung owner map chung cho nhom lien ket local', () => {
  const source = readSource('src/components/layout/Footer.tsx')

  assert.match(source, /getPriorityLocalLinks\('footer'\)/)
  assert.match(source, /priorityLocalLinks\.map/)
})

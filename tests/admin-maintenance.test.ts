import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

function read(path: string): string {
  return readFileSync(path, 'utf8')
}

function findConsoleLogs(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return findConsoleLogs(path)
    if (!/\.(ts|tsx)$/.test(entry.name)) return []
    return read(path).includes('console.log(') ? [path] : []
  })
}

test('CategoryPanel reports category creation errors to the admin', () => {
  const source = read('src/components/admin/CategoryPanel.tsx')
  assert.match(source, /console\.error\('Không thể thêm danh mục:', error\)/)
  assert.match(source, /setFeedbackMessage\('Không thể thêm danh mục mới\. Vui lòng thử lại\.'/)
  assert.match(source, /role="alert"/)
})

test('media library images have descriptive alt text', () => {
  const source = read('src/app/admin/thu-vien/MediaLibrary.tsx')
  assert.match(source, /alt=\{`Ảnh trong thư viện: \$\{image\.filename\}`\}/)
  assert.match(source, /alt=\{`Xem trước ảnh: \$\{selectedImage\.filename\}`\}/)
})

test('application source contains no console.log diagnostics', () => {
  assert.deepEqual(findConsoleLogs('src'), [])
})

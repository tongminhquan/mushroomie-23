import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

describe('sitewide dark-mode contract', () => {
  it('boots theme before hydration without reading server cookies', () => {
    const layout = read('src/app/layout.tsx')
    expect(layout).toContain("import ThemeBootstrapScript")
    expect(layout).toContain('<ThemeBootstrapScript />')
    expect(layout).toContain('data-theme="light"')
    expect(layout).not.toContain("from 'next/headers'")
    expect(layout).not.toContain('cookies()')
  })

  it('uses Next metadata and a beforeInteractive bootstrap script', () => {
    const layout = read('src/app/layout.tsx')
    const bootstrap = read('src/components/theme/ThemeBootstrapScript.tsx')
    expect(layout).toContain('export const viewport')
    expect(layout).toContain('themeColor')
    expect(bootstrap).toContain("from 'next/script'")
    expect(bootstrap).toContain('strategy="beforeInteractive"')
    expect(bootstrap).toContain('buildThemeBootstrapScript')
  })
})

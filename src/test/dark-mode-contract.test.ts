import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')
const publicThemeFiles = [
  'src/components/cart/CartDrawer.tsx',
  'src/components/layout/PolicyLayout.tsx',
  'src/components/local/LocalLandingPage.tsx',
  'src/components/product/ProductCard.tsx',
  'src/components/product/AddToCartButton.tsx',
  'src/app/(user)/tai-khoan/page.tsx',
  'src/app/(user)/gio-hang/page.tsx',
  'src/app/(user)/thanh-toan/page.tsx',
  'src/app/(user)/san-pham/[slug]/page.tsx',
  'src/app/(user)/tin-tuc/[slug]/page.tsx',
  'src/components/minigame/MiniGameHub.tsx',
  'src/components/minigame/GamePageClient.tsx',
  'src/components/minigame/GameReadyOverlay.tsx',
  'src/components/minigame/TetrisGame.tsx',
  'src/components/minigame/BlockBlastGame.tsx',
  'src/app/(user)/tai-khoan/dang-nhap/page.tsx',
  'src/app/(user)/tai-khoan/dang-ky/page.tsx',
  'src/app/(user)/tai-khoan/quen-mat-khau/page.tsx',
  'src/app/(user)/tai-khoan/dat-lai-mat-khau/page.tsx',
  'src/app/(user)/san-pham/page.tsx',
  'src/app/(user)/tin-tuc/page.tsx',
  'src/app/(user)/gioi-thieu/page.tsx',
  'src/app/(user)/lien-he/page.tsx',
  'src/app/(user)/danh-gia/page.tsx',
  'src/app/(user)/tai-khoan/don-hang/page.tsx',
  'src/app/(user)/tai-khoan/don-hang/[code]/page.tsx',
  'src/app/(user)/tai-khoan/voucher/page.tsx',
  'src/app/(user)/voucher/page.tsx',
  'src/app/(user)/thanh-toan/xac-nhan/page.tsx',
  'src/components/account/AvatarUpload.tsx',
  'src/components/account/EditProfileForm.tsx',
  'src/components/account/ReviewOrderModal.tsx',
  'src/components/layout/ProfileCompletionGuard.tsx',
  'src/components/layout/FloatingWidgets.tsx',
  'src/components/product/CatalogSeoContent.tsx',
  'src/components/product/TokenReviewForm.tsx',
]

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

  it('defines semantic light and dark tokens with scoped transition behavior', () => {
    const css = read('src/app/globals.css')
    expect(css).toContain('--color-theme-page: var(--surface-page)')
    expect(css).toContain(':root,')
    expect(css).toContain('html[data-theme="light"]')
    expect(css).toContain('html[data-theme="dark"]')
    expect(css).toContain('--surface-page: #171313')
    expect(css).toContain('.theme-transition')
    expect(css).toContain('transition-property: all')
    expect(css).not.toContain('.theme-transition *')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })

  it('places both theme controls in public navigation', () => {
    const header = read('src/components/layout/Header.tsx')
    expect(header).toContain('<ThemeToggle variant="icon"')
    expect(header).toContain('<ThemeToggle variant="segmented"')
  })

  it('themes the admin shell and exposes a persistent theme control', () => {
    const layout = read('src/app/admin/layout.tsx')
    const sidebar = read('src/components/layout/AdminSidebar.tsx')
    const adminUi = read('src/components/admin/AdminUI.tsx')

    expect(layout).toContain('admin-theme-scope')
    expect(layout).toContain('bg-theme-page')
    expect(sidebar).toContain('<ThemeToggle variant="segmented"')
    expect(sidebar).toContain('bg-theme-elevated')
    expect(adminUi).toContain('bg-theme-card')
  })

  it.each(publicThemeFiles)('%s declares a reviewed semantic theme surface', (file) => {
    expect(read(file)).toMatch(/bg-theme-(page|section|card|elevated|subtle|input)/)
  })

  it('uses the declared semantic border utility name', () => {
    const reviewedFiles = [
      ...publicThemeFiles,
      'src/components/layout/Header.tsx',
      'src/components/layout/MobileBottomNav.tsx',
      'src/components/theme/ThemeToggle.tsx',
    ]

    reviewedFiles.forEach((file) => {
      expect(read(file)).not.toMatch(/\bborder-theme\b(?!-border)/)
    })
  })
})

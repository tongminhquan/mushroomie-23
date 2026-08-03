import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')
const readHexToken = (css: string, token: string) => {
  const value = css.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1]
  if (!value) throw new Error(`Missing hex token: ${token}`)
  return value
}
const relativeLuminance = (hex: string) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)

  if (!channels || channels.length !== 3) throw new Error(`Invalid color: ${hex}`)
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
const contrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}
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
    const theme = read('src/lib/theme.ts')
    expect(css).toContain('--color-theme-page: var(--surface-page)')
    expect(css).toContain(':root,')
    expect(css).toContain('html[data-theme="light"]')
    expect(css).toContain('html[data-theme="dark"]')
    const darkTheme = css.slice(
      css.indexOf('html[data-theme="dark"]'),
      css.indexOf('/* Keep light-mode game text readable'),
    )
    for (const token of [
      '--surface-page: #000000',
      '--surface-section: #050505',
      '--surface-card: #0a0a0a',
      '--surface-elevated: #111111',
      '--surface-muted: #171717',
      '--surface-input: #0a0a0a',
      '--text-primary-theme: #fafafa',
      '--text-secondary-theme: #d4d4d4',
      '--text-muted-theme: #a3a3a3',
    ]) {
      expect(darkTheme).toContain(token)
    }
    expect(darkTheme).not.toContain('#171313')
    expect(theme).toContain("dark: '#000000'")
    expect(css).toContain('.theme-transition')
    expect(css).toContain('transition-property: color, background-color, border-color, opacity, transform, box-shadow')
    expect(css).not.toContain('transition-property: all')
    expect(css).not.toContain('.theme-transition *')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })

  it('separates static brand ink from theme-aware foregrounds', () => {
    const css = read('src/app/globals.css')
    const darkTheme = css.slice(
      css.indexOf('html[data-theme="dark"]'),
      css.indexOf('/* Keep light-mode game text readable'),
    )
    const coreValues = read('src/components/home/landing/HomeCoreValues.tsx')

    expect(css).toContain('--color-text: #2b2b2b')
    expect(css).toContain('--color-brand-ink: #2b2b2b')
    expect(css).toContain('--color-brand-ink-muted: #4a4542')
    expect(css).not.toContain('html[data-theme="dark"] [class~="text-text"]')
    expect(coreValues).toContain("headingColor: 'text-brand-ink'")
    expect(coreValues).toContain("bodyColor: 'text-brand-ink-muted'")
    expect(coreValues).toContain("headingColor: 'text-theme-primary'")
    expect(darkTheme).toContain('--color-neutral-600: #b8b8b8')
    expect(darkTheme).toContain('--color-neutral-800: #e5e5e5')
  })

  it('keeps static pastel ink and dark theme accents above WCAG AA', () => {
    const css = read('src/app/globals.css')
    const darkTheme = css.slice(
      css.indexOf('html[data-theme="dark"]'),
      css.indexOf('/* Keep light-mode game text readable'),
    )
    const pastelBackgrounds = [
      readHexToken(css, '--color-yellow'),
      readHexToken(css, '--color-pink'),
    ]
    const pastelForegrounds = [
      readHexToken(css, '--color-brand-ink'),
      readHexToken(css, '--color-brand-ink-muted'),
    ]

    pastelForegrounds.forEach((foreground) => {
      pastelBackgrounds.forEach((background) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5)
      })
    })

    const darkAccent = readHexToken(darkTheme, '--primary-content')
    for (const background of [
      readHexToken(darkTheme, '--surface-page'),
      readHexToken(darkTheme, '--surface-card'),
      readHexToken(darkTheme, '--color-primary-light'),
    ]) {
      expect(contrastRatio(darkAccent, background)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('does not let the dark form baseline override component error and focus states', () => {
    const css = read('src/app/globals.css')
    const formBaseline = css.slice(
      css.indexOf('html[data-theme="dark"] :where(input, textarea, select)'),
      css.indexOf('html[data-theme="dark"] .prose'),
    )

    expect(formBaseline).toContain('color-scheme: dark')
    expect(formBaseline).not.toContain('background-color:')
    expect(formBaseline).not.toContain('border-color:')
    expect(formBaseline).not.toContain('color: var(--text-primary-theme)')
  })

  it('keeps the site footer on an explicit black surface in both themes', () => {
    const footer = read('src/components/layout/Footer.tsx')

    expect(footer).toContain('bg-black')
    expect(footer).not.toContain('bg-text')
    expect(footer).toContain('text-white')
  })

  it('keeps all semantic dark text tiers above WCAG AA on page and card surfaces', () => {
    const css = read('src/app/globals.css')
    const darkTheme = css.slice(
      css.indexOf('html[data-theme="dark"]'),
      css.indexOf('/* Keep light-mode game text readable'),
    )
    const backgrounds = [
      readHexToken(darkTheme, '--surface-page'),
      readHexToken(darkTheme, '--surface-card'),
    ]
    const foregrounds = [
      readHexToken(darkTheme, '--text-primary-theme'),
      readHexToken(darkTheme, '--text-secondary-theme'),
      readHexToken(darkTheme, '--text-muted-theme'),
    ]

    foregrounds.forEach((foreground) => {
      backgrounds.forEach((background) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5)
      })
    })
  })

  it('uses semantic heading text on the public voucher landing page', () => {
    const page = read('src/app/(user)/voucher/page.tsx')

    expect(page).not.toContain('text-text')
    expect(page).toContain('text-theme-primary')
    expect(page).toContain('text-theme-secondary')
  })

  it('does not pin admin quick-action labels to a light-theme text color', () => {
    const adminPage = read('src/app/admin/page.tsx')

    expect(adminPage).not.toContain('text-[#2b2b2b]')
    expect(adminPage).toContain('text-theme-primary')
  })

  it('uses semantic text tiers throughout the WordPress import workspace', () => {
    const wordpressPage = read('src/app/admin/wordpress/WordPressAutoPosterClient.tsx')

    for (const legacyUtility of [
      'text-[#1d2327]',
      'text-[#50575e]',
      'text-[#646970]',
      'text-[#8c8f94]',
      'bg-[#fffaf7]',
      'bg-[#f6f7f7]',
    ]) {
      expect(wordpressPage).not.toContain(legacyUtility)
    }
    expect(wordpressPage).toContain('text-theme-primary')
    expect(wordpressPage).toContain('text-theme-secondary')
    expect(wordpressPage).toContain('text-theme-muted')
    expect(wordpressPage).toContain('bg-[var(--wordpress-automation-hero)]')
  })

  it('covers every legacy admin neutral text tier in the dark compatibility layer', () => {
    const css = read('src/app/globals.css')
    const adminCompatibility = css.slice(
      css.indexOf('html[data-theme="dark"] .admin-theme-scope'),
      css.indexOf('/* Only apply transitions'),
    )

    for (const utility of [
      'text-neutral-400',
      'text-neutral-500',
      'text-neutral-600',
      'text-neutral-700',
      'text-neutral-800',
      'text-neutral-900',
    ]) {
      expect(adminCompatibility).toContain(`[class~="${utility}"]`)
    }
  })

  it('places both theme controls in public navigation', () => {
    const header = read('src/components/layout/Header.tsx')
    expect(header).toContain('<ThemeToggle variant="icon"')
    expect(header).toContain('<ThemeToggle variant="segmented"')
  })

  it('keeps both mini-game routes readable when a cached game bundle still emits legacy white text classes', () => {
    const css = read('src/app/globals.css')
    const tetrisPage = read('src/app/(user)/mini-game/tetris/page.tsx')
    const blockBlastPage = read('src/app/(user)/mini-game/block-blast/page.tsx')

    expect(tetrisPage).toContain('mini-game-theme-scope')
    expect(blockBlastPage).toContain('mini-game-theme-scope')
    expect(css).toContain('html[data-theme="light"] .mini-game-theme-scope')
    expect(css).toContain('[class~="text-white"]')
    expect(css).toContain('[class*="text-white/"]')
    expect(css).toContain('[class*="bg-[#e41d1d]"]')
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

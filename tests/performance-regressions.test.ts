import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { resolve } from 'node:path'
import { formatDate } from '../src/lib/utils'

const utilsSource = readFileSync(resolve(process.cwd(), 'src', 'lib', 'utils.ts'), 'utf8')
const homeCustomCtaSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'home', 'landing', 'HomeCustomCTA.tsx'),
  'utf8',
)
const homeBannerImageSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'home', 'landing', 'HomeBannerImage.tsx'),
  'utf8',
)
const productCardSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'product', 'ProductCard.tsx'),
  'utf8',
)
const productCardActionsPath = resolve(
  process.cwd(),
  'src',
  'components',
  'product',
  'ProductCardActions.tsx',
)
const productCardActionsSource = existsSync(productCardActionsPath)
  ? readFileSync(productCardActionsPath, 'utf8')
  : ''
const productCardLinkPath = resolve(
  process.cwd(),
  'src',
  'components',
  'product',
  'ProductCardLink.tsx',
)
const productCardLinkSource = existsSync(productCardLinkPath)
  ? readFileSync(productCardLinkPath, 'utf8')
  : ''
const categoryIconSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'ui', 'CategoryIcon.tsx'),
  'utf8',
)
const rootLayoutSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', 'layout.tsx'),
  'utf8',
)
const nextConfigSource = readFileSync(resolve(process.cwd(), 'next.config.ts'), 'utf8')
const headerSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'layout', 'Header.tsx'),
  'utf8',
)
const compactHeaderSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'layout', 'CompactHeader.tsx'),
  'utf8',
)
const mobileBottomNavSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'layout', 'MobileBottomNav.tsx'),
  'utf8',
)
const footerSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'layout', 'Footer.tsx'),
  'utf8',
)
const bannerVariantScript = readFileSync(
  resolve(process.cwd(), 'scripts', 'generate-banner-variants.mjs'),
  'utf8',
)
const aboutPageSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'gioi-thieu', 'page.tsx'),
  'utf8',
)
const newsPageSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'tin-tuc', 'page.tsx'),
  'utf8',
)
const miniGameHeroPath = resolve(
  process.cwd(),
  'src',
  'components',
  'minigame',
  'MiniGameHero.tsx',
)
const miniGameHeroSource = existsSync(miniGameHeroPath)
  ? readFileSync(miniGameHeroPath, 'utf8')
  : ''
const miniGameHubSource = readFileSync(
  resolve(process.cwd(), 'src', 'components', 'minigame', 'MiniGameHub.tsx'),
  'utf8',
)
const miniGamePageSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'mini-game', 'page.tsx'),
  'utf8',
)

test('shared browser utilities do not pull date-fns into public client bundles', () => {
  assert.doesNotMatch(utilsSource, /from ['"]date-fns/)
})

test('shared image and formatting utilities do not pull tailwind-merge into public client bundles', () => {
  assert.doesNotMatch(utilsSource, /from ['"]tailwind-merge/)
})

test('native date formatting preserves the public Vietnamese date format', () => {
  assert.equal(formatDate(new Date(2026, 6, 14, 8, 5)), '14/07/2026 08:05')
})

test('static homepage CTA stays a Server Component', () => {
  assert.doesNotMatch(homeCustomCtaSource, /['"]use client['"]/)
})

test('homepage hero does not inject image preloads while its route is prefetched', () => {
  assert.doesNotMatch(homeBannerImageSource, /<link\s+rel=["']preload["']/)
  assert.match(homeBannerImageSource, /loading=\{priority \? ['"]eager['"] : ['"]lazy['"]\}/)
  assert.match(homeBannerImageSource, /fetchPriority=\{priority \? ['"]high['"] : ['"]low['"]\}/)
})

test('interactive product cards do not pull tailwind-merge through presentational wrappers', () => {
  assert.doesNotMatch(productCardSource, /BrandBadge/)
  assert.doesNotMatch(productCardSource, /PriceText/)
})

test('product cards server render presentation and isolate browser actions', () => {
  assert.doesNotMatch(productCardSource, /^['"]use client['"]/)
  assert.doesNotMatch(productCardSource, /next-auth\/react|@\/store\/cart|@\/store\/voucher/)
  assert.match(productCardActionsSource, /^['"]use client['"]/)
  assert.match(productCardLinkSource, /^['"]use client['"]/)
})

test('homepage category icons do not pull tailwind-merge into the initial client bundle', () => {
  assert.doesNotMatch(categoryIconSource, /@\/lib\/cn/)
})

test('fixed-size category icons use compact density srcsets', () => {
  assert.match(categoryIconSource, /width=\{classes\.pixels\}/)
  assert.match(categoryIconSource, /height=\{classes\.pixels\}/)
  assert.doesNotMatch(categoryIconSource, /sizes=\{`\$\{classes\.pixels\}px`\}/)
})

test('large global CSS stays external and cacheable', () => {
  assert.doesNotMatch(nextConfigSource, /inlineCss\s*:\s*true/)
})

test('local fonts do not compete with the LCP image as high-priority preloads', () => {
  assert.equal(rootLayoutSource.match(/preload\s*:\s*false/g)?.length, 2)
})

test('local fonts avoid a late mobile font swap that can replace the LCP candidate', () => {
  assert.equal(rootLayoutSource.match(/display\s*:\s*['"]optional['"]/g)?.length, 2)
})

test('global navigation does not eagerly prefetch unrelated RSC routes', () => {
  const initialHeaderSource = headerSource.split('{menu.mounted &&')[0]
  const globalNavigationSources = [
    ['header', initialHeaderSource],
    ['compact header', compactHeaderSource],
    ['mobile bottom navigation', mobileBottomNavSource],
    ['footer', footerSource],
  ] as const

  for (const [label, source] of globalNavigationSources) {
    const links = source.match(/<Link\b[\s\S]*?>/g) ?? []
    assert.ok(links.length > 0, `${label} không có Link để kiểm tra`)
    assert.ok(
      links.every((link) => /prefetch=\{false\}/.test(link)),
      `${label} có Link vẫn prefetch tự động`,
    )
  }
})

test('raw LCP banner variants use the same production quality budget as Next images', () => {
  assert.match(bannerVariantScript, /\.webp\(\{\s*quality:\s*75,\s*effort:\s*5\s*\}\)/)
})

test('server-rendered story and news pages use the shared reveal runtime', () => {
  for (const [label, source] of [
    ['story page', aboutPageSource],
    ['news page', newsPageSource],
  ] as const) {
    assert.doesNotMatch(source, /AnimateOnScroll|StaggerChildren/, `${label} still hydrates legacy motion`)
    assert.match(source, /data-reveal/, `${label} does not opt into the shared reveal runtime`)
  }
})

test('mini-game hero server renders before the interactive hub', () => {
  assert.doesNotMatch(miniGameHeroSource, /^['"]use client['"]/)
  assert.match(miniGameHeroSource, /Chọn game, ghi điểm và nhận voucher/)
  assert.doesNotMatch(miniGameHubSource, /<h1|Chọn game, ghi điểm và nhận voucher/)
  assert.ok(
    miniGamePageSource.indexOf('<MiniGameHero') < miniGamePageSource.indexOf('<MiniGameHub'),
    'mini-game page must render its stable hero before the client hub',
  )
})

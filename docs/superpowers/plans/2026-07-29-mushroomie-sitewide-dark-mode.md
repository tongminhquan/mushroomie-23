# Mushroomie Sitewide Dark Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent light/dark appearance to all Mushroomie user and admin surfaces, defaulting to light and remembering the selection in a rolling 400-day cookie.

**Architecture:** A static inline bootstrap script reads and refreshes `mushroomie_theme` before paint, then sets `data-theme` and `color-scheme` on `<html>` without making the Root Layout dynamic. Tailwind v4 semantic variables provide the theme foundation, while a small client-leaf toggle updates the DOM, cookie, browser theme color, and other mounted toggles through a custom event.

**Tech Stack:** Next.js 16.2.11 App Router, React 19.2.4, TypeScript 5, Tailwind CSS v4, Vitest 4, Testing Library, Lucide React, Recharts, PM2 standalone.

## Global Constraints

- Theme default is exactly `light`; do not use `prefers-color-scheme` to pick the initial theme.
- Cookie name is exactly `mushroomie_theme`; accepted values are exactly `light` and `dark`.
- Cookie lifetime is `Max-Age=34560000` seconds, refreshed whenever a valid preference is read and whenever the user changes theme.
- Cookie attributes are `Path=/; SameSite=Lax`; add `Secure` on HTTPS; do not use `HttpOnly`.
- `<html data-theme="light|dark">` is the single theme state source.
- Do not call Next.js `cookies()` from Root Layout because that would make the shared layout request-dynamic.
- Do not add `next-themes`, Zustand theme state, React theme context, or another package.
- Use the user-approved `transition-all`, scoped to `.theme-transition` elements for 150 ms; never apply it with a universal selector.
- Under `prefers-reduced-motion: reduce`, theme transitions must become effectively immediate.
- Preserve routes, navigation labels, logo, fonts, analytics identifiers, form field names, auth, orders, checkout, payment, webhook, voucher, upload, database, and mini-game logic.
- Keep product images unfiltered and product card media ratio at 3:4.
- User visual dials: `DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 3`, `VISUAL_DENSITY: 4`.
- Admin visual dials: `DESIGN_VARIANCE: 3`, `MOTION_INTENSITY: 2`, `VISUAL_DENSITY: 7`.
- Body text must meet WCAG AA 4.5:1; functional icons and large text must meet 3:1.
- All tests, `npm run typecheck`, and `npm run build` must pass before deployment.

## Baseline

- Branch: `codex/sitewide-dark-mode`, tracking `origin/main`.
- Baseline after `npm ci`: 35 Vitest files pass, 262 tests pass.
- Baseline typecheck: pass.
- Existing unrelated working tree content must remain uncommitted:
  - `deployment_guide.md`
  - `.codex-report-keywords/`
  - `google-ads-setup-mushroomie.docx`
  - `google-ads-setup-mushroomie.txt`
  - `tmp/`
  - `~$ogle-ads-setup-mushroomie.docx`
- `npm ci` currently reports 20 high-severity dependency advisories. Do not run `npm audit fix --force` as part of this feature.

## File Structure

### New files

- `src/lib/theme.ts`: theme type, cookie parser/serializer, constants, and bootstrap script generator.
- `src/lib/__tests__/theme.test.ts`: pure theme contract tests.
- `src/components/theme/ThemeBootstrapScript.tsx`: static `<meta>` and inline pre-paint script.
- `src/components/theme/ThemeToggle.tsx`: shared icon and segmented theme controls.
- `src/components/theme/__tests__/ThemeToggle.test.tsx`: interaction, persistence, and synchronization tests.
- `src/test/dark-mode-contract.test.ts`: static coverage contract for root integration, token blocks, required placements, and reviewed high-risk surfaces.

### Primary modified files

- `src/app/layout.tsx`: mount bootstrap script and root theme-transition hook.
- `src/app/globals.css`: semantic tokens, light/dark values, compatibility utilities, scoped transition, native controls, prose, scrollbar, and focus treatment.
- `src/components/layout/Header.tsx`: desktop icon toggle and mobile segmented control.
- `src/components/layout/Footer.tsx`: semantic dark surfaces and text.
- `src/components/layout/MobileBottomNav.tsx`: dark surface and border.
- `src/components/layout/AdminSidebar.tsx`: admin toggle and dark sidebar.
- `src/app/admin/layout.tsx`: dark admin page background.
- `src/components/admin/AdminUI.tsx`: shared dark admin primitives.

### High-risk public surfaces

- `src/components/cart/CartDrawer.tsx`
- `src/components/product/ProductCard.tsx`
- `src/components/product/AddToCartButton.tsx`
- `src/components/local/LocalLandingPage.tsx`
- `src/components/layout/PolicyLayout.tsx`
- `src/app/(user)/tai-khoan/page.tsx`
- `src/app/(user)/tai-khoan/don-hang/page.tsx`
- `src/app/(user)/tai-khoan/don-hang/[code]/page.tsx`
- `src/app/(user)/tai-khoan/voucher/page.tsx`
- `src/app/(user)/tai-khoan/dang-nhap/page.tsx`
- `src/app/(user)/tai-khoan/dang-ky/page.tsx`
- `src/app/(user)/gio-hang/page.tsx`
- `src/app/(user)/thanh-toan/page.tsx`
- `src/app/(user)/thanh-toan/xac-nhan/page.tsx`
- `src/app/(user)/san-pham/page.tsx`
- `src/app/(user)/san-pham/[slug]/page.tsx`
- `src/app/(user)/tin-tuc/[slug]/page.tsx`
- `src/app/(user)/gioi-thieu/page.tsx`
- `src/app/(user)/lien-he/page.tsx`

### High-risk admin surfaces

- `src/app/admin/wordpress/WordPressAutoPosterClient.tsx`
- `src/app/admin/bai-viet/page.tsx`
- `src/app/admin/bai-viet/them/page.tsx`
- `src/app/admin/bai-viet/[id]/page.tsx`
- `src/app/admin/bai-viet/dang-hang-loat/page.tsx`
- `src/app/admin/banner/page.tsx`
- `src/app/admin/don-hang/page.tsx`
- `src/app/admin/don-hang/[id]/page.tsx`
- `src/app/admin/san-pham/page.tsx`
- `src/app/admin/san-pham/them/page.tsx`
- `src/app/admin/san-pham/[id]/page.tsx`
- `src/app/admin/voucher-history/page.tsx`
- `src/app/admin/thanh-toan/page.tsx`
- `src/app/admin/thanh-toan/webhook-logs/page.tsx`
- `src/app/admin/cai-dat/page.tsx`
- `src/app/admin/tai-khoan/page.tsx`
- `src/app/admin/nhat-ky/page.tsx`
- `src/app/admin/thu-vien/MediaLibrary.tsx`
- `src/components/admin/RichTextEditor.tsx`
- `src/components/admin/MediaPicker.tsx`
- `src/components/admin/ImageEditorModal.tsx`
- `src/components/admin/SeoAnalyzer.tsx`
- `src/components/admin/ManageCategoriesModal.tsx`
- `src/components/admin/ManageStatusesModal.tsx`
- `src/components/admin/CategoryPanel.tsx`
- `src/components/admin/ShippingFeeSettings.tsx`
- `src/components/admin/GiftWrapSettings.tsx`
- `src/components/admin/dashboard/OrdersStatusChart.tsx`
- `src/components/admin/dashboard/OtherCharts.tsx`

---

### Task 1: Theme contract and rolling cookie

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/lib/__tests__/theme.test.ts`

**Interfaces:**
- Produces: `Theme`, `THEME_COOKIE_NAME`, `THEME_COOKIE_MAX_AGE`, `THEME_CHANGE_EVENT`, `THEME_META_COLORS`, `isTheme`, `readThemeCookie`, `serializeThemeCookie`, `buildThemeBootstrapScript`.
- Consumes: no feature-local interfaces.

- [ ] **Step 1: Read the framework guidance before coding**

Read:

```text
node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md
node_modules/next/dist/docs/01-app/03-api-reference/02-components/script.md
node_modules/next/dist/docs/01-app/01-getting-started/11-css.md
```

Confirm the plan keeps Root Layout static and uses a pre-hydration inline script compatible with the current CSP, whose `script-src` already allows `'unsafe-inline'`.

- [ ] **Step 2: Write the failing theme contract tests**

Create `src/lib/__tests__/theme.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  THEME_COOKIE_MAX_AGE,
  buildThemeBootstrapScript,
  isTheme,
  readThemeCookie,
  serializeThemeCookie,
} from '@/lib/theme'

describe('theme contract', () => {
  it('accepts only supported themes', () => {
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
    expect(isTheme('system')).toBe(false)
    expect(isTheme('')).toBe(false)
    expect(isTheme(null)).toBe(false)
  })

  it('defaults malformed or missing cookies to light', () => {
    expect(readThemeCookie('')).toBe('light')
    expect(readThemeCookie('session=abc')).toBe('light')
    expect(readThemeCookie('mushroomie_theme=system')).toBe('light')
    expect(readThemeCookie('a=1; mushroomie_theme=dark; b=2')).toBe('dark')
    expect(readThemeCookie('mushroomie_theme=light')).toBe('light')
  })

  it('serializes a rolling 400-day cookie', () => {
    expect(THEME_COOKIE_MAX_AGE).toBe(34_560_000)
    expect(serializeThemeCookie('dark', false)).toBe(
      'mushroomie_theme=dark; Max-Age=34560000; Path=/; SameSite=Lax',
    )
    expect(serializeThemeCookie('light', true)).toBe(
      'mushroomie_theme=light; Max-Age=34560000; Path=/; SameSite=Lax; Secure',
    )
  })

  it('generates a bootstrap script with a light fallback and rolling refresh', () => {
    const script = buildThemeBootstrapScript()
    expect(script).toContain('mushroomie_theme')
    expect(script).toContain('34560000')
    expect(script).toContain(\"theme='light'\")
    expect(script).toContain('dataset.theme')
    expect(script).toContain('colorScheme')
  })
})
```

- [ ] **Step 3: Run the focused test and confirm RED**

Run:

```bash
npx vitest run src/lib/__tests__/theme.test.ts
```

Expected: FAIL because `@/lib/theme` does not exist.

- [ ] **Step 4: Implement the minimal pure contract**

Create `src/lib/theme.ts`:

```ts
export type Theme = 'light' | 'dark'

export const THEME_COOKIE_NAME = 'mushroomie_theme'
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 400
export const THEME_CHANGE_EVENT = 'mushroomie:theme-change'
export const THEME_META_COLORS: Record<Theme, string> = {
  light: '#fff7f2',
  dark: '#171313',
}

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function readThemeCookie(cookieHeader: string): Theme {
  const prefix = `${THEME_COOKIE_NAME}=`
  const value = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)

  return isTheme(value) ? value : 'light'
}

export function serializeThemeCookie(theme: Theme, secure: boolean): string {
  return [
    `${THEME_COOKIE_NAME}=${theme}`,
    `Max-Age=${THEME_COOKIE_MAX_AGE}`,
    'Path=/',
    'SameSite=Lax',
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

export function buildThemeBootstrapScript(): string {
  return `(function(){try{var name='${THEME_COOKIE_NAME}=',theme='light',parts=document.cookie.split(';');for(var i=0;i<parts.length;i++){var part=parts[i].trim();if(part.indexOf(name)===0){var value=part.slice(name.length);if(value==='light'||value==='dark'){theme=value;}break;}}var root=document.documentElement;root.dataset.theme=theme;root.style.colorScheme=theme;var meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute('content',theme==='dark'?'${THEME_META_COLORS.dark}':'${THEME_META_COLORS.light}');}document.cookie=name+theme+'; Max-Age=${THEME_COOKIE_MAX_AGE}; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');}catch(error){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';}})();`
}
```

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```bash
npx vitest run src/lib/__tests__/theme.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 6: Commit the contract**

```bash
git add src/lib/theme.ts src/lib/__tests__/theme.test.ts
git commit -m "feat: add persistent theme contract"
```

---

### Task 2: Pre-paint bootstrap integration

**Files:**
- Create: `src/components/theme/ThemeBootstrapScript.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/test/dark-mode-contract.test.ts`

**Interfaces:**
- Consumes: `buildThemeBootstrapScript()` and `THEME_META_COLORS` from Task 1.
- Produces: `ThemeBootstrapScript` mounted once in Root Layout.

- [ ] **Step 1: Write the failing root integration contract**

Create `src/test/dark-mode-contract.test.ts`:

```ts
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

describe('sitewide dark-mode contract', () => {
  it('boots theme before page content without reading server cookies', () => {
    const layout = read('src/app/layout.tsx')
    expect(layout).toContain("import ThemeBootstrapScript")
    expect(layout).toContain('<ThemeBootstrapScript />')
    expect(layout).toContain('data-theme="light"')
    expect(layout).not.toContain("from 'next/headers'")
    expect(layout).not.toContain('cookies()')
  })

  it('exposes a browser theme-color meta element', () => {
    const bootstrap = read('src/components/theme/ThemeBootstrapScript.tsx')
    expect(bootstrap).toContain('name="theme-color"')
    expect(bootstrap).toContain('buildThemeBootstrapScript')
  })
})
```

- [ ] **Step 2: Run the contract and confirm RED**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL because the bootstrap component and layout integration are missing.

- [ ] **Step 3: Add the bootstrap component**

Create `src/components/theme/ThemeBootstrapScript.tsx`:

```tsx
import { THEME_META_COLORS, buildThemeBootstrapScript } from '@/lib/theme'

export default function ThemeBootstrapScript() {
  return (
    <>
      <meta name="theme-color" content={THEME_META_COLORS.light} />
      <script dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript() }} />
    </>
  )
}
```

- [ ] **Step 4: Mount it in Root Layout**

Update `src/app/layout.tsx`:

```tsx
import ThemeBootstrapScript from '@/components/theme/ThemeBootstrapScript'
```

Change the root markup to:

```tsx
<html
  lang="vi"
  data-theme="light"
  suppressHydrationWarning
  className={`${montserrat.variable} ${paytoneOne.variable}`}
>
  <head>
    <ThemeBootstrapScript />
  </head>
  <body suppressHydrationWarning className="theme-transition min-h-screen bg-secondary font-body">
    <a href="#main-content" className="skip-link">Đi đến nội dung chính</a>
    {children}
  </body>
</html>
```

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
npx vitest run src/lib/__tests__/theme.test.ts src/test/dark-mode-contract.test.ts
npm run typecheck
```

Expected: all focused tests pass and typecheck exits 0.

- [ ] **Step 6: Commit bootstrap integration**

```bash
git add src/components/theme/ThemeBootstrapScript.tsx src/app/layout.tsx src/test/dark-mode-contract.test.ts
git commit -m "feat: bootstrap theme before first paint"
```

---

### Task 3: Shared theme control

**Files:**
- Create: `src/components/theme/ThemeToggle.tsx`
- Create: `src/components/theme/__tests__/ThemeToggle.test.tsx`

**Interfaces:**
- Consumes: `Theme`, cookie constants, `THEME_CHANGE_EVENT`, and `THEME_META_COLORS` from Task 1.
- Produces: `<ThemeToggle variant="icon" />` and `<ThemeToggle variant="segmented" />`.

- [ ] **Step 1: Write failing interaction tests**

Create `src/components/theme/__tests__/ThemeToggle.test.tsx`:

```tsx
// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ThemeToggle from '@/components/theme/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light'
    document.documentElement.style.colorScheme = 'light'
    document.cookie = 'mushroomie_theme=light; Path=/'
  })

  it('switches the icon control to dark and persists the rolling cookie', () => {
    render(<ThemeToggle variant="icon" />)
    fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(document.cookie).toContain('mushroomie_theme=dark')
    expect(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })).toBeInTheDocument()
  })

  it('supports explicit segmented selection', () => {
    render(<ThemeToggle variant="segmented" />)
    fireEvent.click(screen.getByRole('button', { name: 'Dùng giao diện tối' }))

    expect(screen.getByRole('button', { name: 'Dùng giao diện tối' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dùng giao diện sáng' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('synchronizes multiple mounted controls', () => {
    render(
      <>
        <ThemeToggle variant="icon" />
        <ThemeToggle variant="segmented" />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }))
    expect(screen.getByRole('button', { name: 'Dùng giao diện tối' })).toHaveAttribute('aria-pressed', 'true')
  })
})
```

- [ ] **Step 2: Run the component test and confirm RED**

Run:

```bash
npx vitest run src/components/theme/__tests__/ThemeToggle.test.tsx
```

Expected: FAIL because `ThemeToggle` does not exist.

- [ ] **Step 3: Implement the shared client leaf**

Create `src/components/theme/ThemeToggle.tsx`:

```tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  THEME_CHANGE_EVENT,
  THEME_META_COLORS,
  type Theme,
  isTheme,
  serializeThemeCookie,
} from '@/lib/theme'
import { cn } from '@/lib/cn'

function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme
  return isTheme(value) ? value : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  document.cookie = serializeThemeCookie(theme, window.location.protocol === 'https:')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_META_COLORS[theme])
  window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: theme }))
}

export default function ThemeToggle({
  variant = 'icon',
  className,
}: {
  variant?: 'icon' | 'segmented'
  className?: string
}) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(currentTheme())
    const sync = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail
      if (isTheme(nextTheme)) setTheme(nextTheme)
    }
    window.addEventListener(THEME_CHANGE_EVENT, sync)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync)
  }, [])

  const selectTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  if (variant === 'segmented') {
    return (
      <div className={cn('theme-transition flex items-center justify-between gap-3', className)}>
        <span className="text-sm font-bold text-theme-secondary">Giao diện</span>
        <div className="grid grid-cols-2 rounded-xl border border-theme bg-theme-subtle p-1">
          <button
            type="button"
            aria-label="Dùng giao diện sáng"
            aria-pressed={theme === 'light'}
            onClick={() => selectTheme('light')}
            className="theme-transition min-h-10 rounded-lg px-3 text-xs font-bold aria-pressed:bg-theme-card aria-pressed:text-primary"
          >
            Sáng
          </button>
          <button
            type="button"
            aria-label="Dùng giao diện tối"
            aria-pressed={theme === 'dark'}
            onClick={() => selectTheme('dark')}
            className="theme-transition min-h-10 rounded-lg px-3 text-xs font-bold aria-pressed:bg-theme-card aria-pressed:text-primary"
          >
            Tối
          </button>
        </div>
      </div>
    )
  }

  const dark = theme === 'dark'
  return (
    <button
      type="button"
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
      onClick={() => selectTheme(dark ? 'light' : 'dark')}
      className={cn(
        'theme-transition grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-theme bg-theme-card text-theme-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
        className,
      )}
    >
      {dark ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
    </button>
  )
}
```

- [ ] **Step 4: Run component tests and confirm GREEN**

Run:

```bash
npx vitest run src/components/theme/__tests__/ThemeToggle.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit the control**

```bash
git add src/components/theme/ThemeToggle.tsx src/components/theme/__tests__/ThemeToggle.test.tsx
git commit -m "feat: add shared theme controls"
```

---

### Task 4: Semantic CSS tokens and scoped transition

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/test/dark-mode-contract.test.ts`

**Interfaces:**
- Consumes: `data-theme` set by Tasks 1-3.
- Produces: Tailwind utilities `bg-theme-page`, `bg-theme-section`, `bg-theme-card`, `bg-theme-elevated`, `bg-theme-subtle`, `bg-theme-input`, `text-theme-primary`, `text-theme-secondary`, `text-theme-muted`, `border-theme`, `border-theme-strong`, and `.theme-transition`.

- [ ] **Step 1: Extend the failing CSS contract**

Add this test to `src/test/dark-mode-contract.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the contract and confirm RED**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL because semantic tokens do not exist.

- [ ] **Step 3: Add Tailwind aliases inside `@theme`**

Add to the existing `@theme` block in `src/app/globals.css`:

```css
  --color-theme-page: var(--surface-page);
  --color-theme-section: var(--surface-section);
  --color-theme-card: var(--surface-card);
  --color-theme-elevated: var(--surface-elevated);
  --color-theme-subtle: var(--surface-muted);
  --color-theme-input: var(--surface-input);
  --color-theme-primary: var(--text-primary-theme);
  --color-theme-secondary: var(--text-secondary-theme);
  --color-theme-muted: var(--text-muted-theme);
  --color-theme-border: var(--border-default-theme);
  --color-theme-border-strong: var(--border-strong-theme);
```

- [ ] **Step 4: Define exact light and dark values**

Replace the current minimal `:root` block with:

```css
:root,
html[data-theme="light"] {
  --mushroomie-static-revision: "20260729-dark-mode";
  --surface-page: #fff7f2;
  --surface-section: #fffaf6;
  --surface-card: #ffffff;
  --surface-elevated: #fffdfa;
  --surface-muted: #f7f2ee;
  --surface-input: #ffffff;
  --text-primary-theme: #2b2b2b;
  --text-secondary-theme: #5f5955;
  --text-muted-theme: #746d68;
  --border-default-theme: #e9dfd8;
  --border-strong-theme: #d3c7bf;
  --primary-control: #d71919;
  --primary-control-hover: #b91515;
  --primary-content: #c91414;
  --primary-foreground: #fff7f2;
  --shadow-card-theme: 0 8px 24px rgb(91 48 35 / 0.07);
  --shadow-overlay-theme: 0 22px 55px rgb(91 48 35 / 0.14);
  --theme-color: #fff7f2;
}

html[data-theme="dark"] {
  --surface-page: #171313;
  --surface-section: #1d1817;
  --surface-card: #251e1c;
  --surface-elevated: #2d2421;
  --surface-muted: #352b27;
  --surface-input: #201a18;
  --text-primary-theme: #f7eeea;
  --text-secondary-theme: #d6c7c0;
  --text-muted-theme: #ad9e97;
  --border-default-theme: #4a3a34;
  --border-strong-theme: #645048;
  --primary-control: #c91414;
  --primary-control-hover: #e02424;
  --primary-content: #ff7b7b;
  --primary-foreground: #fff7f2;
  --shadow-card-theme: 0 10px 28px rgb(0 0 0 / 0.26);
  --shadow-overlay-theme: 0 24px 62px rgb(0 0 0 / 0.42);
  --theme-color: #171313;
  --color-admin-bg: #171313;
  --color-warm-border: #4a3a34;
}
```

- [ ] **Step 5: Add scoped transition, native control, and compatibility rules**

Add to `src/app/globals.css`:

```css
.theme-transition {
  transition-property: all;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

html[data-theme="dark"] {
  background: var(--surface-page);
}

html[data-theme="dark"] body {
  background-color: var(--surface-page);
  color: var(--text-primary-theme);
}

html[data-theme="dark"] input,
html[data-theme="dark"] textarea,
html[data-theme="dark"] select {
  color-scheme: dark;
  background-color: var(--surface-input);
  color: var(--text-primary-theme);
  border-color: var(--border-default-theme);
}

html[data-theme="dark"] input::placeholder,
html[data-theme="dark"] textarea::placeholder {
  color: var(--text-muted-theme);
}

html[data-theme="dark"] .prose {
  --tw-prose-body: var(--text-secondary-theme);
  --tw-prose-headings: var(--text-primary-theme);
  --tw-prose-links: var(--primary-content);
  --tw-prose-bold: var(--text-primary-theme);
  --tw-prose-counters: var(--text-muted-theme);
  --tw-prose-bullets: var(--primary-content);
  --tw-prose-hr: var(--border-default-theme);
  --tw-prose-quotes: var(--text-primary-theme);
  --tw-prose-quote-borders: var(--primary-content);
  --tw-prose-captions: var(--text-muted-theme);
  --tw-prose-code: var(--text-primary-theme);
  --tw-prose-th-borders: var(--border-strong-theme);
  --tw-prose-td-borders: var(--border-default-theme);
}

@media (prefers-reduced-motion: reduce) {
  .theme-transition {
    transition-duration: 1ms;
  }
}
```

Update existing global body, shadow, paper, scrollbar, selection, and skip-link rules to consume the semantic variables instead of fixed light colors.

- [ ] **Step 6: Run focused tests and typecheck**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
npm run typecheck
```

Expected: contract and typecheck pass.

- [ ] **Step 7: Commit token foundation**

```bash
git add src/app/globals.css src/test/dark-mode-contract.test.ts
git commit -m "feat: add semantic light and dark tokens"
```

---

### Task 5: Public navigation and shared shell

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Footer.tsx`
- Modify: `src/components/layout/MobileBottomNav.tsx`
- Modify: `src/components/layout/__tests__/navigation.test.tsx`
- Modify: `src/test/dark-mode-contract.test.ts`

**Interfaces:**
- Consumes: `ThemeToggle` from Task 3 and semantic utilities from Task 4.
- Produces: visible desktop and mobile theme controls plus theme-aware public shell.

- [ ] **Step 1: Add failing placement assertions**

Add to `src/test/dark-mode-contract.test.ts`:

```ts
it('places theme controls in public and admin navigation', () => {
  const header = read('src/components/layout/Header.tsx')
  const sidebar = read('src/components/layout/AdminSidebar.tsx')
  expect(header).toContain('<ThemeToggle variant="icon"')
  expect(header).toContain('<ThemeToggle variant="segmented"')
  expect(sidebar).toContain('<ThemeToggle')
})
```

- [ ] **Step 2: Run the placement test and confirm RED**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL because controls are not mounted.

- [ ] **Step 3: Add public controls**

In `src/components/layout/Header.tsx`, import:

```tsx
import ThemeToggle from '@/components/theme/ThemeToggle'
```

Insert the desktop control immediately before the desktop account group:

```tsx
<ThemeToggle variant="icon" className="hidden md:grid" />
```

Insert this row inside the mobile menu after the primary links and before account links:

```tsx
<div className="my-3 border-t border-theme" />
<ThemeToggle variant="segmented" className="rounded-xl bg-theme-subtle p-3" />
<div className="my-3 border-t border-theme" />
```

- [ ] **Step 4: Convert the public shell to semantic surfaces**

Apply these exact class substitutions in `Header.tsx`, `Footer.tsx`, and `MobileBottomNav.tsx`:

```text
bg-secondary                 -> bg-theme-page
bg-white                     -> bg-theme-card
bg-white/70 or bg-white/80   -> bg-theme-card/90
bg-neutral-100               -> bg-theme-subtle
border-neutral-200           -> border-theme
border-warm-border           -> border-theme
text-text                    -> text-theme-primary
text-neutral-700             -> text-theme-secondary
text-neutral-500             -> text-theme-muted
shadow-strong                -> shadow-[var(--shadow-overlay-theme)]
```

Add `theme-transition` to header surfaces, dropdown panels, mobile drawer, footer root, and bottom navigation root. Preserve red CTA classes and active navigation behavior.

- [ ] **Step 5: Update navigation tests**

In `src/components/layout/__tests__/navigation.test.tsx`, add:

```tsx
import ThemeToggle from '@/components/theme/ThemeToggle'
```

Add:

```tsx
it('exposes an accessible theme control', () => {
  document.documentElement.dataset.theme = 'light'
  render(<ThemeToggle variant="icon" />)
  expect(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' })).toHaveClass('h-11', 'w-11')
})
```

- [ ] **Step 6: Run shell tests**

Run:

```bash
npx vitest run src/components/theme/__tests__/ThemeToggle.test.tsx src/components/layout/__tests__/navigation.test.tsx src/test/dark-mode-contract.test.ts
```

Expected: all tests pass.

- [ ] **Step 7: Commit public shell**

```bash
git add src/components/layout/Header.tsx src/components/layout/Footer.tsx src/components/layout/MobileBottomNav.tsx src/components/layout/__tests__/navigation.test.tsx src/test/dark-mode-contract.test.ts
git commit -m "feat: add theme controls to public navigation"
```

---

### Task 6: Public commerce, account, content, and policy surfaces

**Files:**
- Modify all files listed under “High-risk public surfaces”.
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/EmptyState.tsx`
- Modify: `src/components/ui/BrandBadge.tsx`
- Modify: `src/components/ui/__tests__/primitives.test.tsx`
- Modify: `src/test/dark-mode-contract.test.ts`

**Interfaces:**
- Consumes: semantic theme utilities from Task 4.
- Produces: theme-aware shared user primitives and reviewed public routes.

- [ ] **Step 1: Add failing high-risk coverage assertions**

Add to `src/test/dark-mode-contract.test.ts`:

```ts
const publicThemeFiles = [
  'src/components/cart/CartDrawer.tsx',
  'src/components/product/ProductCard.tsx',
  'src/components/product/AddToCartButton.tsx',
  'src/components/local/LocalLandingPage.tsx',
  'src/components/layout/PolicyLayout.tsx',
  'src/app/(user)/tai-khoan/page.tsx',
  'src/app/(user)/gio-hang/page.tsx',
  'src/app/(user)/thanh-toan/page.tsx',
  'src/app/(user)/san-pham/[slug]/page.tsx',
  'src/app/(user)/tin-tuc/[slug]/page.tsx',
]

it.each(publicThemeFiles)('%s declares a reviewed theme surface', (file) => {
  expect(read(file)).toMatch(/bg-theme-(page|section|card|elevated|muted|input)/)
})
```

- [ ] **Step 2: Run coverage contract and confirm RED**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL for public files still using only light utilities.

- [ ] **Step 3: Convert shared primitives**

Update shared primitives to use these exact base classes:

```tsx
// Button outline
'theme-transition border border-primary bg-theme-card text-primary hover:bg-primary hover:text-[var(--primary-foreground)]'

// Empty state root
'theme-transition border border-theme bg-theme-card text-theme-primary'

// Neutral badge
'theme-transition border border-theme bg-theme-subtle text-theme-secondary'
```

Keep the existing variant API and sizes unchanged. Extend `src/components/ui/__tests__/primitives.test.tsx` so the outline button expects `bg-theme-card` and neutral surfaces expect semantic classes.

- [ ] **Step 4: Convert commerce and account surfaces**

Across `CartDrawer.tsx`, `ProductCard.tsx`, `AddToCartButton.tsx`, account routes, cart, and checkout routes:

```text
Page wrapper                -> bg-theme-page text-theme-primary
Section tint                -> bg-theme-section
Card, drawer, dialog        -> bg-theme-card border-theme
Raised summary              -> bg-theme-elevated border-theme
Input or textarea           -> bg-theme-input border-theme text-theme-primary
Primary text                -> text-theme-primary
Supporting text             -> text-theme-secondary
Metadata                    -> text-theme-muted
```

Add `theme-transition` to card, drawer, modal, summary, form surface, and CTA container classes. Do not change prices, cart actions, checkout fields, route behavior, API calls, analytics events, or product-image classes.

- [ ] **Step 5: Convert content, local, contact, and legal surfaces**

Apply the same semantic mapping to `LocalLandingPage.tsx`, `PolicyLayout.tsx`, intro, contact, product listing/detail, news article, and policy routes. Keep prose structure and SEO markup unchanged. Preserve:

```tsx
className="prose max-w-none"
```

because Task 4 supplies theme-aware typography variables globally.

- [ ] **Step 6: Run public component and contract tests**

Run:

```bash
npx vitest run src/components/ui/__tests__/primitives.test.tsx src/components/cart/__tests__/CartDrawer.test.tsx src/components/product/__tests__/ProductCard.test.tsx src/components/product/__tests__/AddToCartButton.test.tsx src/test/dark-mode-contract.test.ts
npm run typecheck
```

Expected: all selected tests and typecheck pass.

- [ ] **Step 7: Commit public surfaces**

```bash
git add src/components/ui src/components/cart/CartDrawer.tsx src/components/product src/components/local/LocalLandingPage.tsx src/components/layout/PolicyLayout.tsx "src/app/(user)" src/test/dark-mode-contract.test.ts
git commit -m "feat: theme public commerce and account surfaces"
```

---

### Task 7: Admin shell and shared primitives

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/components/layout/AdminSidebar.tsx`
- Modify: `src/components/admin/AdminUI.tsx`
- Modify: `src/test/dark-mode-contract.test.ts`

**Interfaces:**
- Consumes: `ThemeToggle` and semantic utilities.
- Produces: theme-aware admin root, sidebar, cards, page headers, badges, and empty states.

- [ ] **Step 1: Extend the admin contract**

Add:

```ts
it('uses semantic admin root and primitives', () => {
  expect(read('src/app/admin/layout.tsx')).toContain('bg-theme-page')
  expect(read('src/components/layout/AdminSidebar.tsx')).toContain('bg-theme-section')
  expect(read('src/components/admin/AdminUI.tsx')).toContain('bg-theme-card')
  expect(read('src/components/admin/AdminUI.tsx')).toContain('text-theme-primary')
})
```

- [ ] **Step 2: Run contract and confirm RED**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL for the admin shell.

- [ ] **Step 3: Convert the admin root**

Change `src/app/admin/layout.tsx` root classes to:

```tsx
<div className="theme-transition flex h-[100dvh] overflow-hidden bg-theme-page text-theme-primary">
```

Change the main panel to:

```tsx
className="theme-transition flex-1 overflow-auto bg-theme-page pt-16 md:pt-0"
```

Remove the fixed light radial background from the admin main panel.

- [ ] **Step 4: Convert sidebar and add control**

Remove the `sidebarSurface` light gradient constant. Use:

```tsx
'theme-transition bg-theme-section'
```

on the sidebar root. Convert sidebar borders, icon wells, tooltips, footer, collapsed controls, and informational block to semantic surfaces. Keep active items red with light foreground.

Import and place:

```tsx
import ThemeToggle from '@/components/theme/ThemeToggle'
```

Inside the sidebar footer, before “Xem website”:

```tsx
<ThemeToggle
  variant={isCollapsed ? 'icon' : 'segmented'}
  className={isCollapsed ? 'mx-auto' : 'mb-2 rounded-[18px] bg-theme-subtle p-2'}
/>
```

- [ ] **Step 5: Convert shared admin primitives**

Use these exact semantic bases:

```tsx
// AdminPageHeader title and description
'text-theme-primary'
'text-theme-muted'

// AdminCard
'theme-transition rounded-[16px] border-[1.5px] border-theme bg-theme-card shadow-[var(--shadow-card-theme)]'

// AdminEmptyState icon and copy
'bg-theme-subtle text-theme-primary shadow-[inset_0_0_0_1.5px_var(--border-default-theme)]'
'text-theme-secondary'
'text-theme-muted'
```

Give each `AdminStatusBadge` tone an explicit dark-compatible class using `data-theme` semantic colors or Tailwind dark-safe color pairs; do not remove tone semantics or labels.

- [ ] **Step 6: Run focused contract and typecheck**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Commit admin foundation**

```bash
git add src/app/admin/layout.tsx src/components/layout/AdminSidebar.tsx src/components/admin/AdminUI.tsx src/test/dark-mode-contract.test.ts
git commit -m "feat: theme admin shell and primitives"
```

---

### Task 8: Admin pages, forms, dialogs, editor, and charts

**Files:**
- Modify all files listed under “High-risk admin surfaces”.
- Modify: `src/test/dark-mode-contract.test.ts`

**Interfaces:**
- Consumes: admin primitives and semantic utilities from Task 7.
- Produces: reviewed admin data, editing, media, settings, and visualization surfaces.

- [ ] **Step 1: Add failing admin coverage assertions**

Add:

```ts
const adminThemeFiles = [
  'src/app/admin/wordpress/WordPressAutoPosterClient.tsx',
  'src/app/admin/bai-viet/[id]/page.tsx',
  'src/app/admin/bai-viet/them/page.tsx',
  'src/app/admin/banner/page.tsx',
  'src/components/admin/RichTextEditor.tsx',
  'src/app/admin/don-hang/page.tsx',
  'src/app/admin/san-pham/[id]/page.tsx',
  'src/app/admin/cai-dat/page.tsx',
  'src/app/admin/thu-vien/MediaLibrary.tsx',
]

it.each(adminThemeFiles)('%s declares a reviewed admin theme surface', (file) => {
  expect(read(file)).toMatch(/bg-theme-(page|section|card|elevated|muted|input)/)
})
```

- [ ] **Step 2: Run coverage contract and confirm RED**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL for admin files still using fixed light surfaces.

- [ ] **Step 3: Convert admin tables and forms**

Across the listed admin route files, use:

```text
Table wrapper               -> bg-theme-card border-theme
Table head                  -> bg-theme-subtle text-theme-muted border-theme
Table row                   -> border-theme hover:bg-theme-subtle
Primary cell text           -> text-theme-primary
Secondary cell text         -> text-theme-secondary
Input/select/textarea       -> bg-theme-input border-theme text-theme-primary
Toolbar/filter              -> bg-theme-section border-theme
Dialog/modal                -> bg-theme-elevated border-theme shadow-[var(--shadow-overlay-theme)]
```

Add `theme-transition` to table wrappers, form panels, editor panels, dialogs, upload zones, and settings cards. Preserve pagination, form names, API endpoints, mutations, permissions, delete confirmation, and validation.

- [ ] **Step 4: Convert rich text editor and media tooling**

In `RichTextEditor.tsx`, `MediaPicker.tsx`, `ImageEditorModal.tsx`, and `MediaLibrary.tsx`:

- Theme the toolbar, canvas surround, popovers, upload zone, selection state, captions, and modal chrome.
- Keep the editable document area `bg-theme-card text-theme-primary`.
- Preserve sanitizer behavior and uploaded image rendering.
- Do not apply filters to media thumbnails or crop previews.

Use these classes for editor chrome:

```tsx
'theme-transition border border-theme bg-theme-section text-theme-secondary'
'theme-transition bg-theme-card text-theme-primary'
'theme-transition bg-theme-elevated shadow-[var(--shadow-overlay-theme)]'
```

- [ ] **Step 5: Make Recharts theme-aware**

In `OrdersStatusChart.tsx` and `OtherCharts.tsx`, replace fixed light chart chrome with CSS custom properties:

```tsx
<CartesianGrid stroke="var(--border-default-theme)" />
```

Use:

```tsx
tick={{ fontSize: 12, fill: 'var(--text-secondary-theme)', fontWeight: 500 }}
```

Use:

```tsx
cursor={{ fill: 'var(--surface-muted)' }}
contentStyle={{
  color: 'var(--text-primary-theme)',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-default-theme)',
  borderRadius: '8px',
  boxShadow: 'var(--shadow-card-theme)',
}}
```

Keep data series colors unchanged unless contrast testing shows a series is unreadable.

- [ ] **Step 6: Run admin contract, tests, and typecheck**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts src/app/api/__tests__/content-admin.test.ts src/app/api/__tests__/commerce-settings.test.ts
npm run typecheck
```

Expected: pass.

- [ ] **Step 7: Commit admin surfaces**

```bash
git add src/app/admin src/components/admin src/test/dark-mode-contract.test.ts
git commit -m "feat: theme admin workflows and charts"
```

---

### Task 9: Complete source audit and eliminate remaining dark-mode gaps

**Files:**
- Modify: `src/test/dark-mode-contract.test.ts`
- Modify: any `src/app/(user)`, `src/app/admin`, or shared component file identified by the audit command.

**Interfaces:**
- Consumes: all theme primitives and migrations from Tasks 1-8.
- Produces: complete reviewed coverage without unhandled light-only panels.

- [ ] **Step 1: Run the deterministic source audit**

Run:

```powershell
rg -n --glob 'src/**/*.{ts,tsx,css}' 'bg-white|bg-\[#fff|border-\[#f|text-neutral-(800|900)|style=\{\{ background' src
```

Classify every match as one of:

1. Replace with a semantic theme utility.
2. Preserve because it is a deliberate inverse surface, image canvas, QR background, game board, email template, or third-party integration.
3. Add an adjacent `theme-reviewed:` comment explaining the preserved exception.

- [ ] **Step 2: Add a failing exception contract**

Add to `src/test/dark-mode-contract.test.ts`:

```ts
it('documents deliberately preserved light-only exceptions', () => {
  const preservedFiles = [
    'src/components/minigame/TetrisGame.tsx',
    'src/components/minigame/BlockBlastGame.tsx',
    'src/lib/payment/email/templates.ts',
  ]
  for (const file of preservedFiles) {
    expect(read(file)).toContain('theme-reviewed:')
  }
})
```

- [ ] **Step 3: Run contract and confirm RED**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL until each deliberate exception is documented.

- [ ] **Step 4: Fix every unhandled match**

Use semantic utilities for application UI. For deliberate exceptions, add precise comments:

```ts
// theme-reviewed: game board colors are intentionally fixed to preserve gameplay contrast.
```

```ts
// theme-reviewed: transactional email HTML requires explicit colors independent of website theme.
```

```tsx
{/* theme-reviewed: product and QR media use a neutral light canvas to preserve scannability and color accuracy. */}
```

Do not add blanket ignore patterns or disable the test.

- [ ] **Step 5: Run full automated verification**

Run:

```bash
npm test
npm run typecheck
```

Expected: Vitest and legacy tests pass; typecheck exits 0.

- [ ] **Step 6: Commit coverage cleanup**

```bash
git add src tests
git commit -m "fix: close remaining dark mode coverage gaps"
```

---

### Task 10: Build and visual browser verification

**Files:**
- Modify only files with defects found during visual verification.

**Interfaces:**
- Consumes: completed theme implementation.
- Produces: verified desktop/mobile user and admin behavior.

- [ ] **Step 1: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js webpack production build exits 0 without type or build errors.

- [ ] **Step 2: Start a local production server**

Run:

```powershell
$env:PORT=3101
npm run start
```

Expected: server listens on `http://127.0.0.1:3101`.

- [ ] **Step 3: Verify cookie and no-flash behavior**

Using Playwright or the in-app browser:

1. Clear `mushroomie_theme`.
2. Load `/`; confirm `data-theme="light"`.
3. Switch to dark; confirm cookie value `dark`.
4. Reload; confirm first painted state is dark with no light flash.
5. Navigate to `/admin`; confirm the same dark selection.
6. Switch to light in admin; return to `/`; confirm light.
7. Confirm cookie includes `Max-Age=34560000`, `Path=/`, and `SameSite=Lax`.

- [ ] **Step 4: Capture and inspect required viewports**

Inspect both themes at:

```text
Desktop: 1440 x 1000
Laptop: 1366 x 768
Mobile: 390 x 844
Mobile: 360 x 800
```

Routes:

```text
/
/san-pham
/san-pham/<existing-product-slug>
/tin-tuc
/tin-tuc/<existing-post-slug>
/tai-khoan
/gio-hang
/thanh-toan
/mini-game
/admin
/admin/don-hang
/admin/san-pham/them
/admin/bai-viet/them
```

For authenticated routes, use the existing local development account or production-safe browser session. Do not create or mutate real orders, payments, vouchers, users, or products for visual QA.

- [ ] **Step 5: Verify accessibility and layout**

Confirm:

- No horizontal scroll.
- No dark text on dark background.
- No light text on light background.
- Inputs, selects, dialogs, editor, tooltips, toasts, tables, and chart labels remain readable.
- Theme controls are at least 44 x 44 px and keyboard-operable.
- Product images are unfiltered and product cards remain 3:4.
- Reduced-motion mode changes theme nearly instantly.
- Browser console has no hydration warning or runtime error.

- [ ] **Step 6: Fix visual defects using semantic tokens**

For every defect, adjust the narrowest semantic token or component class. Do not introduce route-specific one-off dark palettes when an existing semantic token can express the same hierarchy.

- [ ] **Step 7: Re-run the full quality gate**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 8: Commit verified UI**

```bash
git add src
git commit -m "fix: polish sitewide dark mode contrast"
```

If Step 6 required no changes, do not create an empty commit.

---

### Task 11: Final review, GitHub publication, and production deployment

**Files:**
- Verify all feature files and both superpowers documents.
- Do not add unrelated dirty files.

**Interfaces:**
- Consumes: verified branch from Tasks 1-10.
- Produces: pushed GitHub branch/main state and deployed PM2 standalone application.

- [ ] **Step 1: Review exact change scope**

Run:

```bash
git status --short
git diff origin/main...HEAD --stat
git diff origin/main...HEAD -- src docs/superpowers
```

Expected: only dark-mode code, tests, spec, and plan are included. Unrelated user files remain unstaged.

- [ ] **Step 2: Run final automated checks**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all pass.

- [ ] **Step 3: Push the feature branch**

Run:

```bash
git push -u origin codex/sitewide-dark-mode
```

Expected: push succeeds.

- [ ] **Step 4: Integrate into main without overwriting concurrent work**

Fetch current main and inspect divergence:

```bash
git fetch origin main
git log --oneline --left-right --cherry-pick origin/main...HEAD
```

If main advanced, rebase the feature commits onto current `origin/main`, resolve only dark-mode files, and rerun the final automated checks. Push the reviewed result to `main` using a normal fast-forward push; never force-push main.

- [ ] **Step 5: Deploy through the established standalone workflow**

Connect:

```bash
ssh -i C:\Users\Admin\.ssh\mushroomie_deploy codex@103.77.242.153
```

On the server:

```bash
cd /var/www/mushroomie
git pull origin main
bash deploy.sh
```

Expected: build succeeds and PM2 process `mushroomie_pm2` restarts successfully.

- [ ] **Step 6: Verify PM2 and production routes**

Run:

```bash
pm2 status mushroomie_pm2
pm2 logs mushroomie_pm2 --lines 150 --nostream
curl -I https://mushroomie.io.vn
curl -I https://mushroomie.io.vn/san-pham
curl -I https://mushroomie.io.vn/tin-tuc
curl -I https://mushroomie.io.vn/mini-game
curl -I https://mushroomie.io.vn/admin
curl -I https://mushroomie.io.vn/thanh-toan
```

Expected: PM2 is online; public routes return successful status; protected routes may redirect to login but must not return 500.

- [ ] **Step 7: Verify production static MIME**

Extract one CSS and one JavaScript URL from production HTML, then run:

```bash
curl -I https://mushroomie.io.vn/_next/static/<resolved-css-path>
curl -I https://mushroomie.io.vn/_next/static/<resolved-js-path>
```

Expected:

```text
CSS: HTTP 200 and Content-Type text/css
JS: HTTP 200 and Content-Type application/javascript or text/javascript
```

- [ ] **Step 8: Verify production theme behavior**

In the production browser:

1. Clear the theme cookie and confirm light default.
2. Change to dark from the user header.
3. Reload and confirm dark persists without flash.
4. Open admin and confirm dark persists.
5. Change back to light from admin and confirm user pages follow.
6. Check desktop 1440 px and mobile 390 px.

- [ ] **Step 9: Report completion**

Report:

- Final commit hash.
- GitHub push status.
- Test, typecheck, and build results.
- PM2 status.
- Route and MIME results.
- Theme persistence and no-flash results.
- Any residual visual exceptions with exact file paths.

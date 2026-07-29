# Compact Header, Pure Black Dark Theme, and Order Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a compact navigation bar after the full header scrolls away, replace the warm dark palette with a neutral pure-black palette, and make the permanent-order deletion dialog readable and consistent in both themes.

**Architecture:** Keep the existing full header and mobile drawer behavior intact. A small `CompactHeader` presentation component receives the existing search, account, cart, and menu actions, while `Header` owns visibility through an `IntersectionObserver` sentinel. Theme and dialog fixes use the existing semantic CSS token system so light and dark modes stay synchronized without changing destructive-order behavior.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Node test runner, Vitest.

## Global Constraints

- Do not change order deletion authorization, API calls, confirmation rules, or data behavior.
- Do not make any inner row of the full header sticky.
- Animate only `transform` and `opacity`; respect `prefers-reduced-motion`.
- Preserve all current desktop and mobile navigation destinations.
- Keep the default light theme unchanged.
- Do not touch unrelated dirty files in the worktree.

---

### Task 1: Enforce a neutral pure-black dark palette

**Files:**
- Modify: `src/test/dark-mode-contract.test.ts`
- Modify: `src/app/globals.css`

**Step 1: Write the failing contract test**

Add assertions that the dark-theme token block contains:

```css
--surface-page: #000000;
--surface-section: #050505;
--surface-card: #0a0a0a;
--surface-elevated: #111111;
--surface-muted: #171717;
--surface-input: #0a0a0a;
--text-primary-theme: #fafafa;
--text-secondary-theme: #d4d4d4;
--text-muted-theme: #a3a3a3;
```

Also assert that the old warm page value `#171313` is absent from the dark-theme block.

**Step 2: Run the focused test and confirm failure**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: FAIL because the current dark tokens still use warm brown values.

**Step 3: Implement the neutral token palette**

Update only `html[data-theme="dark"]` in `src/app/globals.css`. Use pure black for page-level surfaces, near-black neutral steps for cards/elevated controls, gray borders, and neutral white/gray text. Keep brand red tokens unchanged.

**Step 4: Run the focused test and confirm pass**

Run:

```bash
npx vitest run src/test/dark-mode-contract.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/test/dark-mode-contract.test.ts src/app/globals.css
git commit -m "fix: use neutral black dark theme"
```

---

### Task 2: Make the permanent-delete dialog theme-safe

**Files:**
- Modify: `tests/order-delete.test.ts`
- Modify: `src/components/admin/DeleteOrderButton.tsx`

**Step 1: Write the failing static UI test**

Add a test asserting that the dialog uses semantic classes:

```tsx
bg-theme-card
text-theme-primary
text-theme-secondary
border-theme-border
bg-theme-input
```

Assert that the dialog root no longer uses hardcoded `bg-white`.

**Step 2: Run the focused test and confirm failure**

Run:

```bash
npx tsx --test tests/order-delete.test.ts
```

Expected: FAIL because the current dialog uses hardcoded white and neutral classes.

**Step 3: Replace hardcoded dialog colors**

Update the dialog container, title, order code, warning copy, label, close button, confirmation input, and cancel action to semantic theme classes. Keep the red warning icon and destructive primary button. Do not alter state, request, confirmation, or permission logic.

**Step 4: Run the focused test and confirm pass**

Run:

```bash
npx tsx --test tests/order-delete.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add tests/order-delete.test.ts src/components/admin/DeleteOrderButton.tsx
git commit -m "fix: synchronize order delete dialog themes"
```

---

### Task 3: Add the compact header shown after scrolling

**Files:**
- Modify: `tests/header-layout.test.ts`
- Create: `src/components/layout/CompactHeader.tsx`
- Modify: `src/components/layout/Header.tsx`

**Step 1: Write the failing compact-header contract**

Assert that:

- `Header` imports and renders `CompactHeader`.
- A bottom sentinel is observed with `IntersectionObserver`.
- The full desktop header rows remain non-sticky.
- `CompactHeader` includes the logo, menu, search form, account link, theme toggle, and cart button.
- The hidden state disables interaction and the visible state uses only translate/opacity transitions.

**Step 2: Run the focused test and confirm failure**

Run:

```bash
npx tsx --test tests/header-layout.test.ts
```

Expected: FAIL because `CompactHeader` does not exist yet.

**Step 3: Create the compact presentation component**

Create `CompactHeader.tsx` with:

- Solid `bg-theme-page`, `border-theme-border`, and a stable 64px bar.
- Mobile menu button connected to the existing drawer action.
- Brand logo.
- Desktop category/menu links and compact product search.
- Mobile expandable product search panel.
- Account link, theme toggle, and cart button with the current item count and bump feedback.
- `aria-hidden` and `inert` while hidden.
- Reduced-motion-safe transform/opacity transitions.

**Step 4: Integrate visibility in `Header`**

Add:

```tsx
const compactSentinelRef = useRef<HTMLSpanElement>(null)
const [compactVisible, setCompactVisible] = useState(false)
```

Observe the sentinel at the bottom of the full header and show the compact bar only after the sentinel has moved above the viewport. Render the compact bar outside the full `<header>` while reusing existing search, menu, account, and cart state/actions.

**Step 5: Run the focused test and confirm pass**

Run:

```bash
npx tsx --test tests/header-layout.test.ts
```

Expected: PASS.

**Step 6: Commit**

```bash
git add tests/header-layout.test.ts src/components/layout/CompactHeader.tsx src/components/layout/Header.tsx
git commit -m "feat: add compact navigation on scroll"
```

---

### Task 4: Full verification and production deployment

**Files:**
- Verify all changed files.

**Step 1: Run the full automated checks**

```bash
npm run typecheck
npm test
npm run build
```

Expected: all commands pass without ignored errors.

**Step 2: Run browser regression checks**

Check light and dark themes at:

- Desktop: 1440px and 1366px.
- Compact desktop width: 1199px.
- Mobile: 390px and 360px.

Verify:

- Full header is visible at page top.
- Compact header appears only after scrolling past the full header.
- Logo, menu, search, account, theme toggle, and cart work.
- No row overlap, horizontal scroll, clipped labels, or hidden focus states.
- Dark page backgrounds are neutral black, not brown.
- The delete-order dialog is readable in both themes and remains centered in the viewport.

**Step 3: Review the final diff**

```bash
git status --short
git diff --check
git diff origin/main...HEAD
```

Confirm unrelated dirty files are not staged.

**Step 4: Push GitHub**

```bash
git push origin HEAD:main
```

**Step 5: Deploy production**

On `/var/www/mushroomie`:

```bash
git pull origin main
bash deploy.sh
pm2 status
pm2 logs mushroomie_pm2 --lines 150 --nostream
```

**Step 6: Verify production**

Check the primary routes, CSS/JS MIME types, desktop/mobile screenshots, theme persistence, compact header behavior, and the admin order dialog. Do not report completion if PM2, build assets, or any affected route fails.

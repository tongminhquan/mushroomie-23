# Mushroomie Design System

## Product Character

Mushroomie is a youth-focused handmade accessories shop. The interface should feel crafted, playful, personal, and emotionally warm while remaining fast and dependable for commerce.

- Design direction: targeted evolution of the existing brand, not a generic redesign.
- Design variance: 7/10 for public storytelling, 4/10 for admin and checkout.
- Motion intensity: 4/10.
- Visual density: 5/10 on public pages, 7/10 in admin tables and tools.
- Product photography and real handmade details are the primary visual signal.

## Brand Tokens

| Role | Value | Usage |
| --- | --- | --- |
| Primary red | `#e41d1d` | Brand marks, primary actions, active navigation |
| Primary dark | `#ba1717` | Hover and pressed states |
| Cream | `#fff7f2` | Main warm background |
| Soft pink | `#ffd6d6` | Secondary accents and gentle highlights |
| Butter yellow | `#ffe7a3` | Small rewards, badges, celebratory details |
| Kraft | `#b9794b` | Handmade material accents; use `#8a5635` for small text |
| Soft black | `#2b2b2b` | Primary text |
| Muted text | `#746d68` | Secondary text at accessible contrast |
| White | `#ffffff` | Cards, fields, and high-contrast text |

Avoid large single-color red surfaces. Use red as a strong accent supported by cream, white, pink, yellow, kraft, and soft black.

Fixed pink/yellow brand surfaces always use the static `brand-ink` pair (`#2b2b2b` / `#4a4542`). Theme surfaces use `theme-primary`, `theme-secondary`, `theme-accent`, and `theme-kraft`; do not remap static pastel ink when dark mode is active.

## Typography

- Display and section headings: Paytone One.
- Body, controls, labels, and data: Montserrat.
- Use one `h1` per page and preserve semantic heading order.
- Do not use negative letter spacing. Keep uppercase labels short and readable.
- Reserve display-scale type for page heroes. Compact tools and cards use compact headings.

## Layout

- Public pages: mobile-first, clear editorial rhythm, real imagery, and restrained decorative details.
- Product grids: stable tracks and equal card heights. Product images remain `3:4`.
- News grids: article covers remain `16:9`.
- Checkout and account flows: calm, linear, and low-distraction.
- Admin: dense, scan-friendly, predictable navigation, and restrained decoration.
- Use `100dvh` for full-height mobile surfaces and respect safe-area insets for fixed navigation.

## Components

- Minimum mobile tap target: `44px`; dense desktop admin controls may use `40px` when spacing prevents accidental activation.
- Buttons communicate commands. Icon-only controls require an accessible name and visible focus state.
- Use Lucide icons from the existing dependency instead of hand-drawn SVG controls.
- Public cards may use `18px` to `24px` radii when consistent with the brand. Operational admin cards should stay tighter.
- Pills are reserved for statuses, filters, badges, and compact commands.
- Drawers and dialogs close with Escape, lock background scrolling, expose expanded state, and use proper labels.
- Hover-only menus must also work with keyboard focus.
- Empty, loading, error, disabled, and success states must be explicit and must not shift the surrounding layout.

## Motion

- Animate only `transform` and `opacity` for decorative transitions.
- Keep interaction feedback between 150ms and 250ms.
- Avoid `transition: all` and layout-moving animation.
- Respect `prefers-reduced-motion` with stable non-animated states.

## Accessibility

- Text and controls target WCAG AA contrast.
- Never use opacity below 60% for meaningful small text on dark surfaces.
- Every interactive control has a keyboard focus indicator.
- Navigation exposes `aria-current`; toggle controls expose `aria-expanded` and `aria-controls`.
- Pages use one main landmark. Nested features use `section`, `article`, or `div` landmarks.
- Images require useful alt text or empty alt text when decorative; broken images use a branded fallback.

## Performance

- Keep server components by default. Isolate browser-dependent interactions in small client components.
- Prioritize only true LCP imagery. Lazy-load media below the fold and provide accurate `sizes`.
- Do not import admin, editor, checkout, or mini-game bundles into the homepage.
- Analytics load outside admin and after critical rendering when possible.

## Anti-Patterns

- Generic AI landing-page composition, excessive floating cards, or decorative gradient blobs.
- Oversized headings inside compact cards, sidebars, or admin panels.
- Rounded text containers where a familiar icon conveys the action more clearly.
- Full-screen monochrome red, beige-only, purple-heavy, or dark-blue-heavy palettes.
- Broken image icons, tiny mobile controls, hover-only navigation, or infinite loading states.

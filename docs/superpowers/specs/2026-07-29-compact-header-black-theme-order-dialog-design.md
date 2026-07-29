# Compact Header, Pure Black Dark Theme, and Order Dialog Design

## Goal

Improve three related interface problems without changing commerce, authentication, or order deletion behavior:

1. Keep a compact navigation bar visible after the full storefront header scrolls away.
2. Remove the brown cast from dark mode and use a pure black page foundation.
3. Make the permanent order deletion dialog readable and visually consistent in both themes.

## Scope

### Compact storefront header

- Preserve the existing full header at the top of the page.
- Add an observation sentinel to detect when the full header has left the viewport.
- Show one fixed compact bar only after that threshold.
- Include the Mushroomie logo, menu access, product search, account access, theme toggle, and cart.
- Reuse the existing menu, search, account, and cart behavior rather than introducing parallel state.
- Use a 64px desktop height and a compact mobile height compatible with safe-area insets.
- Animate only opacity and transform.
- Disable nonessential movement when reduced motion is requested.
- Prevent the compact bar from changing document flow or causing layout shift.

### Pure black dark theme

- Set the dark page foundation and browser theme color to `#000000`.
- Use neutral near-black surfaces for hierarchy:
  - section: `#050505`
  - card/input: `#0a0a0a`
  - elevated: `#111111`
  - muted/hover: `#171717`
- Replace warm brown dark borders with neutral gray-black borders.
- Preserve Mushroomie red as the only dominant accent.
- Keep light-theme tokens unchanged.
- Apply the shared tokens to both public and admin surfaces.

### Permanent order deletion dialog

- Keep the existing super-admin authorization, deletion policy, confirmation text, API request, portal, loading state, and error behavior unchanged.
- Replace hardcoded light colors with semantic theme tokens.
- Use a theme card background, primary/secondary theme text, theme border, and theme input surface.
- Keep the warning icon and destructive action red.
- Ensure the confirmation input has visible text, caret, border, and focus ring in both themes.
- Keep the dialog centered, constrained to the viewport, and free of nested-card styling.

## Accessibility and interaction

- Compact controls retain descriptive accessible names and at least 44px targets.
- The compact header remains keyboard navigable.
- The dialog keeps `role="dialog"` and `aria-modal="true"`.
- Text and controls must meet readable contrast in light and dark themes.
- No duplicate visible IDs or simultaneously focusable duplicate controls are allowed.

## Implementation boundaries

- No order deletion API or database changes.
- No checkout, payment, voucher, authentication, or cart pricing changes.
- No new runtime dependency.
- No broad component refactor outside the header, theme tokens, and deletion dialog.

## Verification

### Automated

- Add a failing compact-header contract test before production changes.
- Add a failing dark-token test requiring a pure black page foundation and neutral surfaces.
- Add a failing deletion-dialog theme test that rejects hardcoded `bg-white` and neutral text/input colors.
- Run targeted tests through the red-green cycle.
- Run the complete test suite, typecheck, and production build.

### Browser

- Check 1366px and 1199px desktop widths.
- Check 390px and 360px mobile widths.
- Verify the full header at page top and compact header after scrolling.
- Verify menu, search, account, theme toggle, and cart access.
- Verify no horizontal overflow or header overlap.
- Verify the deletion dialog in light and dark themes.

### Production

- Push the verified commit to `main`.
- Deploy with `deploy.sh`.
- Verify PM2, health/database status, primary routes, and static CSS/JS MIME types.


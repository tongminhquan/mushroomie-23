# Mushroomie 43-Second TikTok 9:16 Video Design

**Date:** 2026-08-08
**Status:** Approved design, pending written-spec review
**Source composition:** `MushroomieWebsiteIntro`
**New composition:** `MushroomieWebsiteIntroVertical`

## Objective

Create a native vertical adaptation of the approved Mushroomie website introduction for TikTok. The new delivery keeps all nine scenes, the complete 43-second editorial timeline, the current Vietnamese narration, music, sound effects, captions, brand identity, exact slogan, and domain. It must be composed for a `1080×1920` canvas instead of cropping or letterboxing the existing `1920×1080` video.

The existing horizontal composition and its rendered artifacts remain unchanged and independently usable.

## Approved Direction

Build dedicated vertical scene components. Reuse the existing editorial data and media, but do not reuse horizontal layout geometry that assumes a wide canvas.

Rejected alternatives:

- Smart-cropping the horizontal composition, because wide scenes would lose content and product cards would become unreadable.
- Placing a reduced horizontal video inside a decorative vertical frame, because the website, products, and captions would be too small and the result would not feel native to TikTok.

## Immutable Content and Timing

- Canvas: `1080×1920`, aspect ratio `9:16`.
- Frame rate: `30 fps`.
- Duration: exactly `1290` frames / `43.0` editorial seconds.
- Encoded duration acceptance: `42.8–43.2` seconds, allowing normal container/audio padding.
- Keep the existing nine scene boundaries:
  - Hook: frames `0–119`.
  - Website: frames `120–263`.
  - Products: frames `264–413`.
  - Custom: frames `414–590`.
  - Handmade: frames `591–764`.
  - Features: frames `765–941`.
  - Shopping Flow: frames `942–1088`.
  - Slogan: frames `1089–1205`.
  - CTA: frames `1206–1289`.
- Reuse the current caption JSON windows and emphasis phrases without changing copy.
- Reuse all nine generated narration files.
- Preserve `vi-VN-NamMinhNeural`, narration text, rate, pitch, and volume.
- Do not time-stretch narration, remove internal pauses, overlap narration clips, or regenerate speech with different settings.
- Preserve the exact slogan `Làm bằng tay, trao bằng tim`.
- Preserve the exact domain `mushroomie.io.vn`.
- Preserve the current music bed and scene sound effects.

## Composition Architecture

Register two independent compositions in `Root.tsx`:

- `MushroomieWebsiteIntro`: the existing `1920×1080` composition.
- `MushroomieWebsiteIntroVertical`: the new `1080×1920` composition.

Add a vertical config alongside the existing horizontal config. Both configs share `fps: 30` and `durationInFrames: 1290`, but their width and height remain explicit and independently tested.

Create `MushroomieIntroVertical.tsx` as the vertical sequencing root. It consumes the existing canonical `SCENES` registry and renders the same nine non-overlapping `Sequence` windows. It reuses `AudioBed` because audio timing and total duration are unchanged.

Create dedicated vertical presentation units:

```text
src/
├── MushroomieIntroVertical.tsx
└── vertical/
    ├── VerticalSceneShell.tsx
    ├── VerticalCaptionTrack.tsx
    ├── VerticalProgressLine.tsx
    ├── vertical-theme.ts
    └── scenes/
        ├── VerticalHookScene.tsx
        ├── VerticalWebsiteScene.tsx
        ├── VerticalProductsScene.tsx
        ├── VerticalCustomScene.tsx
        ├── VerticalHandmadeScene.tsx
        ├── VerticalFeaturesScene.tsx
        ├── VerticalShoppingFlowScene.tsx
        └── VerticalEndCardScene.tsx
```

The vertical components may reuse media paths, typography tokens, colors, motion helpers, `BrowserFrame`, `MobileFrame`, and bounded product-card primitives where their interfaces remain appropriate. They must not modify the existing horizontal scene geometry.

## TikTok Safe-Area Contract

Use a conservative overlay-safe layout for TikTok:

- Canvas bounds: `x 0–1080`, `y 0–1920`.
- Main content left edge: `72px` or greater.
- Main content right edge: `900px` or less.
- Main content top edge: `150px` or greater, except the thin progress indicator.
- Main visual content bottom edge: `1390px` or less.
- Caption corridor: approximately `y 1430–1610px`.
- Reserve at least `150px` on the right for TikTok interaction controls.
- Reserve at least `300px` at the bottom for TikTok description, navigation, and device UI.
- No essential title, product label, slogan, domain, CTA, or caption may enter the right or bottom overlay zones.

The vertical caption container uses a maximum width of approximately `800px`, is biased slightly left of canvas center, uses `44–48px` type, and supports no more than three visible lines. It retains the existing highlighted-emphasis behavior. The container has a translucent dark background, rounded corners, sufficient padding, and explicit height/overflow protection.

The progress indicator is placed near the upper safe boundary and uses the shared vertical duration config.

## Scene Designs

### 1. Hook — 0.0–4.0s

- Center a large brand logo in the upper-middle content region.
- Stack `Một món phụ kiện` and `Một câu chuyện riêng` vertically.
- Use approximately `80–104px` heading sizes, fitted to the content width.
- Keep orbiting bead/charm decoration outside the caption corridor and TikTok right rail.
- Preserve the existing title completion milestones and scene duration.

### 2. Website — 4.0–8.8s

- Put the headline and category chips above the website visual.
- Display the desktop home screenshot inside a large browser frame beneath the headline.
- Fit the entire meaningful website region; do not use a destructive center crop.
- Ensure the browser frame ends above the caption corridor.
- Preserve the existing local duration and settled zoom state.

### 3. Products — 8.8–13.8s

- Put `Tìm món phụ kiện hợp gu` at the top.
- Present one large primary product card in the center.
- Place two smaller supporting product cards below it in a balanced staggered arrangement.
- Keep every product image at exactly `3:4`.
- Keep each card name and category legible and unobscured by another card.
- End all cards above the caption corridor.

### 4. Custom — 13.8–19.7s

- Put the process label and main title in the upper region.
- Place `Màu sắc`, `Hạt`, and `Charm` chips directly below the title.
- Show one large `Vòng tay Custom` card in the middle-lower content region.
- Maintain three separate, non-overlapping zones for title/chips, product card, and caption.
- Preserve the custom-title completion milestone at local frame `140`.

### 5. Handmade — 19.7–25.5s

- Convert the three wide cards into a vertical process timeline.
- Each step becomes a compact horizontal card with image and label.
- Connect steps with a vertical progress line.
- Use the existing three product images and step labels.
- Preserve the path-completion milestone at local frame `122`.

### 6. Features — 25.5–31.4s

- Put the headline at the top.
- Arrange four feature tiles in a `2×2` grid.
- Retain each screenshot, icon, title, and subtitle.
- Fit the full grid above the caption corridor.
- Preserve final-tile completion at local frame `56`.

### 7. Shopping Flow — 31.4–36.3s

- Make the real `390×844` mobile production screenshot the primary visual.
- Place the phone in the center-right portion of the main safe area without entering the TikTok rail.
- Stack `Xem sản phẩm`, `Thêm vào giỏ`, and `Đặt hàng` as a short vertical rail on the left.
- Keep step labels, device, and caption geometrically separate.
- Preserve mobile completion at local frame `124`.

### 8. Slogan — 36.3–40.2s

- Center the logo in the upper-middle region.
- Split the slogan into two vertical lines:
  - `Làm bằng tay,`
  - `trao bằng tim`
- Use the brand red for the second line.
- Preserve Vietnamese diacritics and punctuation exactly.
- Preserve second-phrase completion at local frame `85`.

### 9. CTA — 40.2–43.0s

- Center the logo, domain, and `Khám phá ngay` button inside the main safe area.
- Keep the domain large enough for phone viewing.
- Keep both domain and button above the caption and TikTok bottom overlay zones.
- Preserve CTA settle completion at local frame `70`.

## Motion Rules

- Drive all motion with Remotion frame state.
- Animate only opacity and transforms; do not animate layout dimensions or positional CSS properties that cause reflow.
- Keep every final visual state reachable before its scene ends.
- Keep scene windows non-overlapping and continuously populated.
- Respect reduced-motion semantics where existing helpers support them.
- Do not add a heavy animation dependency.

## Audio and Caption Flow

The vertical composition reuses the canonical `SCENES`, `NARRATION`, caption JSON, and existing media files. `AudioBed` is mounted exactly once in the vertical composition. Captions are burned into the output using a vertical-specific layout while their timing and highlighted phrases remain shared.

The final mix targets approximately `-16 LUFS` integrated loudness and true peak at or below `-1 dBFS`. The objective join checks remain the same as the horizontal edit: `4.0`, `8.8`, `13.8`, `19.7`, `25.5`, `31.4`, `36.3`, and `40.2` seconds.

## Testing Strategy

Add regression tests that verify:

- Both composition IDs are registered.
- Horizontal config remains `1920×1080`, `30fps`, `1290` frames.
- Vertical config is `1080×1920`, `30fps`, `1290` frames.
- The vertical root uses the same nine canonical scene windows.
- `AudioBed` is mounted once and narration is not duplicated.
- The vertical caption corridor, maximum width, line-height, and bottom/right safe areas remain explicit.
- Essential scene content stays within the declared main-content bounds.
- Product imagery retains `3:4`.
- Shopping Flow references the existing `390×844` production mobile screenshot.
- The exact slogan and domain are present.
- Vertical final-state milestones remain within their local scene durations.
- Existing horizontal visual and timeline contracts remain green.

## Render and Visual Verification

Render a vertical review set containing:

- Ten representative keyframes aligned to the approved 43-second timeline.
- Sixteen boundary frames immediately before and at all eight scene cuts.
- A vertical keyframe contact sheet.
- A vertical boundary contact sheet.
- Encoded-MP4 checks for Products, Custom, Shopping Flow/mobile, Slogan, and CTA.

Inspect all frames at original detail. Reject any result with an empty frame, clipped caption, product-card collision, text/image overlap, broken image, incorrect mobile capture, missing final state, TikTok safe-zone violation, or malformed Vietnamese glyph.

Render and finalize:

- Master: `mushroomie-website-intro-43s-9x16-tiktok-master.mp4`.
- Delivery: `mushroomie-website-intro-43s-9x16-tiktok-v1.mp4`.
- Contact sheet: `final-contact-sheet-43s-9x16-tiktok.jpg`.
- Verification report: `verification-43s-9x16-tiktok.json`.

Verify the delivery is H.264, `yuv420p`, `1080×1920`, `30fps`, AAC stereo, within `42.8–43.2` seconds, fully decodable, near `-16 LUFS`, and at or below `-1 dBFS` true peak.

## Non-Destructive Guarantees

- Do not overwrite, rename, delete, or re-encode the existing 16:9 delivery.
- Record SHA-256 for the current horizontal v4 and current 43-second 16:9 v1 deliveries before and after vertical rendering.
- Do not change the production Mushroomie website, database, auth, checkout, payment, uploads, PM2, or Nginx.
- Do not add project dependencies unless a later implementation blocker is separately approved.
- Generated vertical media remains unstaged and uncommitted.
- Source commits include only the exact vertical composition, tests, scripts, and configuration files required by the implementation plan.

## Acceptance Criteria

The design is complete when:

1. The horizontal and vertical compositions coexist without shared-layout regressions.
2. The vertical delivery retains all nine scenes and the complete approved 43-second narration.
3. All essential content remains inside TikTok-safe bounds.
4. Products, Custom, Shopping Flow/mobile, Slogan, CTA, and captions are legible and non-overlapping.
5. All automated tests, typecheck, composition listing, still renders, final render, metadata verification, decode, loudness, and visual checks pass.
6. The existing horizontal artifacts remain byte-identical.

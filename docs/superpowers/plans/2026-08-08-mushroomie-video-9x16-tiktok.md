# Mushroomie 43-Second TikTok 9:16 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native `1080×1920` TikTok composition that preserves the approved nine-scene, 43-second Mushroomie story and audio while leaving the current `1920×1080` composition and artifacts unchanged.

**Architecture:** Keep `SCENES`, captions, narration, assets, motion helpers, and `AudioBed` as shared editorial sources. Add vertical-only theme, shell, caption, progress, and scene components, then register a second Remotion composition. Extend the existing render scripts through parameterized entry points so horizontal and vertical deliveries use one encoding and metadata pipeline without overwriting each other.

**Tech Stack:** Remotion 4.0.506, React 19, TypeScript 5.9, Vitest 4, FFmpeg/FFprobe, PowerShell on Windows.

## Global Constraints

- New composition ID: `MushroomieWebsiteIntroVertical`.
- New canvas: exactly `1080×1920`, `9:16`, `30 fps`.
- Duration: exactly `1290` frames / `43.0` editorial seconds; encoded duration must be `42.8–43.2` seconds.
- Keep all nine current `SCENES` boundaries and caption windows unchanged.
- Keep all current Vietnamese narration files, text, `vi-VN-NamMinhNeural`, rate, pitch, and volume unchanged.
- Do not time-stretch narration, remove internal speech pauses, overlap narration clips, or regenerate voice with different settings.
- Keep the exact slogan `Làm bằng tay, trao bằng tim` and domain `mushroomie.io.vn`.
- Keep the current music bed and scene sound effects; mount `AudioBed` exactly once in the vertical composition.
- Main vertical content must stay within `x 72–900`, `y 150–1390` except for the progress indicator.
- Burned-in captions must stay in approximately `y 1430–1610`, use at most three visible lines, and avoid the reserved right rail and bottom overlay.
- Reserve at least `150px` at the right and `300px` at the bottom for TikTok UI.
- Product images must preserve `3:4`; Shopping Flow must use the existing real `390×844` mobile capture.
- Animate only opacity and transforms; all final states must settle within their scene durations.
- Do not add dependencies.
- Do not modify the production website, database, auth, payment, checkout, upload pipeline, PM2, or Nginx.
- Do not overwrite, delete, rename, or re-encode either existing horizontal delivery.
- Use TDD for every source change and commit only exact task files.

## File Structure and Responsibilities

- `src/config.ts`: horizontal and vertical composition IDs/configs.
- `src/vertical/vertical-theme.ts`: TikTok main-content, caption, right-rail, and bottom-overlay geometry.
- `src/vertical/VerticalSceneShell.tsx`: clips every vertical scene to the approved main-content rectangle.
- `src/vertical/VerticalCaptionTrack.tsx`: reuses caption data and emphasis with vertical typography and placement.
- `src/vertical/VerticalProgressLine.tsx`: global progress driven by the vertical config.
- `src/vertical/scenes/*.tsx`: vertical-only visual layouts; no horizontal geometry changes.
- `src/MushroomieIntroVertical.tsx`: canonical nine-sequence vertical composition and one shared audio bed.
- `src/Root.tsx`: registers horizontal and vertical compositions.
- `scripts/render-keyframes.mjs`: shared parameterized still/contact-sheet implementation.
- `scripts/render-vertical-keyframes.mjs`: vertical review entry point.
- `scripts/finalize-render.mjs`: shared delivery finalization entry point and unchanged horizontal defaults.
- `scripts/finalize-vertical-render.mjs`: vertical filenames/contact-sheet entry point.
- `scripts/verify-render.mjs`: dimension-parameterized metadata validation and verification.
- `scripts/verify-vertical-render.mjs`: vertical verification entry point.
- `src/tests/vertical-contract.test.ts`: vertical geometry, copy, timeline, and integration contracts.
- Existing render/config tests: horizontal regression protection plus vertical tooling contracts.

---

### Task 1: Add Vertical Configuration and Safe-Area Primitives

**Files:**
- Modify: `video/mushroomie-website-intro/src/config.ts`
- Modify: `video/mushroomie-website-intro/src/tests/config.test.ts`
- Create: `video/mushroomie-website-intro/src/tests/vertical-contract.test.ts`
- Create: `video/mushroomie-website-intro/src/vertical/vertical-theme.ts`
- Create: `video/mushroomie-website-intro/src/vertical/VerticalSceneShell.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/VerticalCaptionTrack.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/VerticalProgressLine.tsx`

**Interfaces:**
- Consumes: Existing `SCENES`, `activeCaptionAt()`, `splitEmphasis()`, `THEME`, and Remotion frame state.
- Produces: `VERTICAL_COMPOSITION_ID`, `VERTICAL_VIDEO_CONFIG`, `VERTICAL_THEME`, `VERTICAL_MAIN_WIDTH`, `VerticalSceneShell`, `VerticalCaptionTrack`, and `VerticalProgressLine`.

- [ ] **Step 1: Write failing vertical config and safe-area tests**

Extend `config.test.ts`:

```ts
import {
  COMPOSITION_ID,
  VERTICAL_COMPOSITION_ID,
  VERTICAL_VIDEO_CONFIG,
  VIDEO_CONFIG,
} from '../config';

it('locks the approved TikTok composition', () => {
  expect(VERTICAL_COMPOSITION_ID).toBe('MushroomieWebsiteIntroVertical');
  expect(VERTICAL_VIDEO_CONFIG).toEqual({
    width: 1080,
    height: 1920,
    fps: 30,
    durationInFrames: 1290,
  });
});
```

Create `vertical-contract.test.ts`:

```ts
import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';

const source = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('vertical TikTok presentation contracts', () => {
  it('locks conservative TikTok safe areas', () => {
    const theme = source('../vertical/vertical-theme.ts');
    expect(theme).toContain('left: 72');
    expect(theme).toContain('right: 180');
    expect(theme).toContain('top: 150');
    expect(theme).toContain('bottom: 530');
    expect(theme).toContain('bottom: 310');
    expect(theme).toContain('maxWidth: 800');
    expect(theme).toContain('maxHeight: 180');
    expect(theme).toContain('fontSize: 46');
    expect(theme).toContain('lineHeight: 1.12');
  });

  it('uses vertical config for progress and captions', () => {
    const progress = source('../vertical/VerticalProgressLine.tsx');
    const captions = source('../vertical/VerticalCaptionTrack.tsx');
    expect(progress).toContain('VERTICAL_VIDEO_CONFIG.durationInFrames - 1');
    expect(captions).toContain('VERTICAL_VIDEO_CONFIG.fps');
    expect(captions).toContain('maxWidth: VERTICAL_THEME.caption.maxWidth');
    expect(captions).toContain('paddingRight: VERTICAL_THEME.safe.right');
    expect(captions).toContain('WebkitLineClamp: 3');
  });
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm test -- src/tests/config.test.ts src/tests/vertical-contract.test.ts
```

Expected: FAIL because vertical config and presentation files do not exist.

- [ ] **Step 3: Add the vertical composition contract**

Append to `src/config.ts`:

```ts
export const VERTICAL_COMPOSITION_ID = 'MushroomieWebsiteIntroVertical';

export const VERTICAL_VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 1290,
} as const;
```

Create `src/vertical/vertical-theme.ts`:

```ts
export const VERTICAL_THEME = {
  safe: {
    left: 72,
    right: 180,
    top: 150,
    bottom: 530,
  },
  caption: {
    bottom: 310,
    maxWidth: 800,
    maxHeight: 180,
    fontSize: 46,
    lineHeight: 1.12,
  },
  progress: {
    top: 112,
    height: 6,
  },
} as const;

export const VERTICAL_MAIN_WIDTH =
  1080 - VERTICAL_THEME.safe.left - VERTICAL_THEME.safe.right;

export const VERTICAL_MAIN_HEIGHT =
  1920 - VERTICAL_THEME.safe.top - VERTICAL_THEME.safe.bottom;
```

- [ ] **Step 4: Add the vertical scene shell**

Create `src/vertical/VerticalSceneShell.tsx`:

```tsx
import type {ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {sceneOpacity} from '../lib/motion';
import {VERTICAL_THEME} from './vertical-theme';

export const VerticalSceneShell = ({
  accent,
  children,
  durationInFrames,
}: {
  accent: string;
  children: ReactNode;
  durationInFrames: number;
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        boxSizing: 'border-box',
        opacity: sceneOpacity(frame, durationInFrames),
        padding: `${VERTICAL_THEME.safe.top}px ${VERTICAL_THEME.safe.right}px ${VERTICAL_THEME.safe.bottom}px ${VERTICAL_THEME.safe.left}px`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 46% 42%, ${accent}38 0%, transparent 66%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 5: Add vertical caption and progress overlays**

Create `src/vertical/VerticalCaptionTrack.tsx`:

```tsx
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SCENES} from '../content/scenes';
import {THEME} from '../content/theme';
import {VERTICAL_VIDEO_CONFIG} from '../config';
import {activeCaptionAt, splitEmphasis} from '../lib/captions';
import {VERTICAL_THEME} from './vertical-theme';

export const VerticalCaptionTrack = () => {
  const frame = useCurrentFrame();
  const milliseconds = (frame / VERTICAL_VIDEO_CONFIG.fps) * 1000;
  const caption = activeCaptionAt(milliseconds);
  const scene = SCENES.find(({from, to}) => frame >= from && frame <= to);

  if (!caption) return null;

  const startFrame = Math.floor(
    (caption.startMs / 1000) * VERTICAL_VIDEO_CONFIG.fps,
  );
  const endFrame = Math.floor(
    (caption.endMs / 1000) * VERTICAL_VIDEO_CONFIG.fps,
  );
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 5, endFrame - 5, endFrame],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const fragments = splitEmphasis(caption.text, scene?.emphasis ?? []);

  return (
    <AbsoluteFill
      style={{
        boxSizing: 'border-box',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        paddingLeft: VERTICAL_THEME.safe.left,
        paddingRight: VERTICAL_THEME.safe.right,
        paddingBottom: VERTICAL_THEME.caption.bottom,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: VERTICAL_THEME.caption.maxWidth,
          maxHeight: VERTICAL_THEME.caption.maxHeight,
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 3,
          overflow: 'hidden',
          padding: '10px 18px',
          borderRadius: 22,
          backgroundColor: 'rgba(7, 16, 20, 0.82)',
          color: THEME.colors.cream,
          fontFamily: THEME.fonts.body,
          fontSize: VERTICAL_THEME.caption.fontSize,
          fontWeight: 700,
          lineHeight: VERTICAL_THEME.caption.lineHeight,
          textAlign: 'left',
          textShadow: '0 4px 12px rgba(0,0,0,0.5)',
          opacity,
        }}
      >
        {fragments.map((fragment, index) => (
          <span
            key={`${fragment.text}-${index}`}
            style={{
              color: fragment.highlighted
                ? THEME.colors.brand
                : THEME.colors.cream,
            }}
          >
            {fragment.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
```

Create `src/vertical/VerticalProgressLine.tsx`:

```tsx
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {VERTICAL_VIDEO_CONFIG} from '../config';
import {THEME} from '../content/theme';
import {VERTICAL_THEME} from './vertical-theme';

export const VerticalProgressLine = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [0, VERTICAL_VIDEO_CONFIG.durationInFrames - 1],
    [0, 1],
    {extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: VERTICAL_THEME.progress.top,
          left: VERTICAL_THEME.safe.left,
          right: VERTICAL_THEME.safe.right,
          height: VERTICAL_THEME.progress.height,
          background: `linear-gradient(90deg, ${THEME.colors.brand}, ${THEME.colors.pink}, ${THEME.colors.yellow})`,
          transform: `scaleX(${progress})`,
          transformOrigin: 'left center',
        }}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 6: Run focused tests, full tests, and typecheck**

Run:

```powershell
npm test -- src/tests/config.test.ts src/tests/vertical-contract.test.ts
npm test
npm run typecheck
```

Expected: focused tests PASS; the existing horizontal suite remains green; TypeScript reports no errors.

- [ ] **Step 7: Commit vertical primitives**

```powershell
git add -- video/mushroomie-website-intro/src/config.ts video/mushroomie-website-intro/src/tests/config.test.ts video/mushroomie-website-intro/src/tests/vertical-contract.test.ts video/mushroomie-website-intro/src/vertical/vertical-theme.ts video/mushroomie-website-intro/src/vertical/VerticalSceneShell.tsx video/mushroomie-website-intro/src/vertical/VerticalCaptionTrack.tsx video/mushroomie-website-intro/src/vertical/VerticalProgressLine.tsx
git diff --cached --check
git commit -m "feat(video): add TikTok vertical composition primitives"
```

---

### Task 2: Build Vertical Hook, Website, and Products Scenes

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/vertical-contract.test.ts`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalHookScene.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalWebsiteScene.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalProductsScene.tsx`

**Interfaces:**
- Consumes: `VerticalSceneShell`, `THEME`, `ASSETS`, `ProductCard`, `BrowserFrame`, `enter()`, and local Remotion frames.
- Produces: Three vertical scene components with local durations `120`, `144`, and `150`.

- [ ] **Step 1: Add failing source contracts for the first three scenes**

Append to `vertical-contract.test.ts`:

```ts
it('keeps Hook, Website, and Products inside vertical safe geometry', () => {
  const hook = source('../vertical/scenes/VerticalHookScene.tsx');
  const website = source('../vertical/scenes/VerticalWebsiteScene.tsx');
  const products = source('../vertical/scenes/VerticalProductsScene.tsx');

  expect(hook).toContain('Một món phụ kiện');
  expect(hook).toContain('Một câu chuyện riêng');
  expect(hook).toContain('durationInFrames={120}');
  expect(website).toContain('Không gian handmade của riêng bạn');
  expect(website).toContain('durationInFrames={144}');
  expect(website).toContain('height: 720');
  expect(products).toContain('Tìm món phụ kiện hợp gu');
  expect(products).toContain('durationInFrames={150}');
  expect(products).toContain('width: 390');
  expect(products).toContain('width: 300');
});
```

- [ ] **Step 2: Run the vertical contract and verify RED**

Run:

```powershell
npm test -- src/tests/vertical-contract.test.ts
```

Expected: FAIL because the three vertical scene modules do not exist.

- [ ] **Step 3: Create the vertical Hook scene**

Create `src/vertical/scenes/VerticalHookScene.tsx`:

```tsx
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {seededUnit} from '../../lib/seed';
import {VerticalSceneShell} from '../VerticalSceneShell';

export const VerticalHookScene = () => {
  const frame = useCurrentFrame();
  const logoScale = interpolate(frame, [0, 14], [0.62, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  });
  const firstOpacity = enter(frame, 26, 12);
  const secondOpacity = enter(frame, 62, 12);
  const firstY = interpolate(frame, [26, 40], [24, 0], {extrapolateRight: 'clamp'});
  const secondY = interpolate(frame, [62, 76], [24, 0], {extrapolateRight: 'clamp'});

  return (
    <VerticalSceneShell durationInFrames={120} accent="#e41d1d">
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        {Array.from({length: 6}, (_, index) => {
          const size = 18 + seededUnit(index) * 26;
          const radius = 150 + seededUnit(index + 10) * 230;
          const angle = seededUnit(index + 20) * Math.PI * 2 + frame * ((seededUnit(index + 30) - 0.5) * 0.018);
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: index % 2 === 0 ? THEME.colors.brand : THEME.colors.yellow,
                opacity: 0.55,
                transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) scale(${enter(frame, -8 + index * 4, 20)})`,
              }}
            />
          );
        })}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center'}}>
          <Img src={staticFile(ASSETS.brand.logo)} style={{width: 190, height: 190, marginBottom: 44, transform: `scale(${logoScale})`}} />
          <div style={{fontFamily: THEME.fonts.heading, fontSize: 82, lineHeight: 1.08, color: THEME.colors.cream, opacity: firstOpacity, transform: `translateY(${firstY}px)`}}>
            Một món phụ kiện
          </div>
          <div style={{fontFamily: THEME.fonts.heading, fontSize: 104, lineHeight: 1.02, color: THEME.colors.brand, opacity: secondOpacity, transform: `translateY(${secondY}px)`}}>
            Một câu chuyện riêng
          </div>
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 4: Create the vertical Website scene**

Create `src/vertical/scenes/VerticalWebsiteScene.tsx`:

```tsx
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {BrowserFrame} from '../../components/BrowserFrame';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

export const VerticalWebsiteScene = () => {
  const frame = useCurrentFrame();
  const titleOpacity = enter(frame, -10, 18);
  const browserOpacity = enter(frame, -8, 20);
  const zoom = interpolate(frame, [0, 144], [0.96, 1], {extrapolateRight: 'clamp'});
  const chips = ['Vòng tay', 'Charm', 'Móc khóa', 'Phụ kiện'];

  return (
    <VerticalSceneShell durationInFrames={144} accent="#ffd6d6">
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 72, lineHeight: 1.08, color: THEME.colors.cream, textAlign: 'center', margin: '0 0 28px', opacity: titleOpacity}}>
          Không gian handmade của riêng bạn
        </h1>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginBottom: 34}}>
          {chips.map((chip, index) => (
            <div key={chip} style={{padding: '12px 20px', borderRadius: 100, backgroundColor: THEME.colors.brand, color: THEME.colors.cream, fontFamily: THEME.fonts.body, fontSize: 28, fontWeight: 700, opacity: enter(frame, 4 + index * 8, 12)}}>
              {chip}
            </div>
          ))}
        </div>
        <div style={{width: '100%', height: 720, overflow: 'hidden', borderRadius: 28, opacity: browserOpacity, transform: `scale(${zoom})`}}>
          <BrowserFrame src={ASSETS.screenshots.homeDesktop} style={{width: '100%'}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 5: Create the vertical Products scene**

Create `src/vertical/scenes/VerticalProductsScene.tsx`:

```tsx
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ProductCard} from '../../components/ProductCard';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const products = [
  {image: ASSETS.products.braceletGreen, name: 'Vòng tay xanh', category: 'Vòng tay'},
  {image: ASSETS.products.braceletPink, name: 'Vòng tay hồng', category: 'Vòng tay'},
  {image: ASSETS.products.keychainsPastel, name: 'Móc khóa pastel', category: 'Móc khóa'},
] as const;

export const VerticalProductsScene = () => {
  const frame = useCurrentFrame();
  const cardMotion = (delay: number) => ({
    opacity: enter(frame, delay, 20),
    transform: `translateY(${interpolate(frame, [delay, delay + 20], [28, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2))})}px)`,
  });

  return (
    <VerticalSceneShell durationInFrames={150} accent="#ffe7a3">
      <AbsoluteFill>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 72, color: THEME.colors.cream, textAlign: 'center', margin: 0, opacity: enter(frame, -12, 18)}}>
          Tìm món phụ kiện hợp gu
        </h1>
        <div style={{position: 'absolute', top: 120, left: 219, ...cardMotion(-8)}}>
          <ProductCard {...products[0]} style={{width: 390, height: 600}} />
        </div>
        <div style={{position: 'absolute', top: 730, left: 8, ...cardMotion(4)}}>
          <ProductCard {...products[1]} style={{width: 300, height: 480}} />
        </div>
        <div style={{position: 'absolute', top: 730, right: 8, ...cardMotion(16)}}>
          <ProductCard {...products[2]} style={{width: 300, height: 480}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 6: Run focused, full, and type tests**

```powershell
npm test -- src/tests/vertical-contract.test.ts src/tests/visual-contract.test.ts
npm test
npm run typecheck
```

Expected: vertical and existing horizontal contracts PASS; all TypeScript files compile.

- [ ] **Step 7: Commit the first vertical scene group**

```powershell
git add -- video/mushroomie-website-intro/src/tests/vertical-contract.test.ts video/mushroomie-website-intro/src/vertical/scenes/VerticalHookScene.tsx video/mushroomie-website-intro/src/vertical/scenes/VerticalWebsiteScene.tsx video/mushroomie-website-intro/src/vertical/scenes/VerticalProductsScene.tsx
git diff --cached --check
git commit -m "feat(video): compose vertical opening scenes"
```

---

### Task 3: Build Vertical Custom, Handmade, and Features Scenes

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/vertical-contract.test.ts`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalCustomScene.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalHandmadeScene.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalFeaturesScene.tsx`

**Interfaces:**
- Consumes: Vertical primitives and shared assets/motion.
- Produces: Vertical scene components with local durations `177`, `174`, and `177`, preserving settle milestones `140`, `122`, and `56`.

- [ ] **Step 1: Add failing contracts for middle scenes**

Append:

```ts
it('uses vertical timelines for Custom, Handmade, and Features', () => {
  const custom = source('../vertical/scenes/VerticalCustomScene.tsx');
  const handmade = source('../vertical/scenes/VerticalHandmadeScene.tsx');
  const features = source('../vertical/scenes/VerticalFeaturesScene.tsx');
  expect(custom).toContain('durationInFrames={177}');
  expect(custom).toContain('[124, 140]');
  expect(custom).toContain('Màu sắc');
  expect(custom).toContain('Vòng tay Custom');
  expect(handmade).toContain('durationInFrames={174}');
  expect(handmade).toContain('enter(frame, 0, 122)');
  expect(handmade).toContain("flexDirection: 'column'");
  expect(features).toContain('durationInFrames={177}');
  expect(features).toContain("gridTemplateColumns: 'repeat(2, 1fr)'");
  expect(features).toContain('delay: 38');
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
npm test -- src/tests/vertical-contract.test.ts
```

Expected: FAIL on the three missing scene files.

- [ ] **Step 3: Implement Custom with separated title, chips, and card zones**

Create `VerticalCustomScene.tsx` using these exact geometry and timing declarations:

```tsx
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {ProductCard} from '../../components/ProductCard';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

export const VerticalCustomScene = () => {
  const frame = useCurrentFrame();
  const titleY = interpolate(frame, [124, 140], [20, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
  const chips = [{name: 'Màu sắc', at: -6}, {name: 'Hạt', at: 36}, {name: 'Charm', at: 78}] as const;
  return (
    <VerticalSceneShell durationInFrames={177} accent="#e41d1d">
      <AbsoluteFill style={{alignItems: 'center'}}>
        <div style={{fontFamily: THEME.fonts.body, fontSize: 24, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: THEME.colors.yellow, opacity: enter(frame, -10, 18)}}>
          Minh họa quy trình cá nhân hóa
        </div>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 76, lineHeight: 1.06, textAlign: 'center', color: THEME.colors.cream, margin: '36px 0 28px', opacity: enter(frame, 124, 16), transform: `translateY(${titleY}px)`}}>
          Dấu ấn của riêng bạn
        </h1>
        <div style={{display: 'flex', gap: 16, marginBottom: 34}}>
          {chips.map((chip) => <div key={chip.name} style={{padding: '14px 24px', borderRadius: 100, backgroundColor: THEME.colors.brand, color: THEME.colors.cream, fontFamily: THEME.fonts.body, fontSize: 30, fontWeight: 800, opacity: enter(frame, chip.at, 14)}}>{chip.name}</div>)}
        </div>
        <div style={{opacity: enter(frame, 84, 20), transform: `scale(${interpolate(frame, [84, 104], [0.94, 1], {extrapolateRight: 'clamp'})})`}}>
          <ProductCard image={ASSETS.products.braceletBlue} name="Vòng tay Custom" category="Cá nhân hóa" style={{width: 480, height: 760}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 4: Implement Handmade as a vertical process timeline**

Create `VerticalHandmadeScene.tsx`:

```tsx
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const steps = [
  {title: 'Chọn vật liệu', image: ASSETS.products.braceletGreen, delay: -8},
  {title: 'Phối chi tiết', image: ASSETS.products.keychainsBlue, delay: 28},
  {title: 'Hoàn thiện & đóng gói', image: ASSETS.products.necklaceFlowers, delay: 64},
] as const;

export const VerticalHandmadeScene = () => {
  const frame = useCurrentFrame();
  const pathProgress = enter(frame, 0, 122);

  return (
    <VerticalSceneShell durationInFrames={174} accent="#b9794b">
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 72, color: THEME.colors.cream, margin: '0 0 30px'}}>
          Chăm chút từng bước
        </h1>
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', gap: 28, width: '100%'}}>
          <div style={{position: 'absolute', left: 46, top: 145, bottom: 145, width: 6, borderRadius: 6, backgroundColor: THEME.colors.backgroundRaised}}>
            <div style={{width: '100%', height: '100%', borderRadius: 6, backgroundColor: THEME.colors.yellow, transform: `scaleY(${pathProgress})`, transformOrigin: 'top center'}} />
          </div>
          {steps.map((step, index) => {
            const opacity = enter(frame, step.delay, 20);
            const y = interpolate(frame, [step.delay, step.delay + 20], [36, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.2))});
            return (
              <div key={step.title} style={{position: 'relative', height: 300, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 30, padding: '30px 32px 30px 82px', borderRadius: 28, border: `2px solid ${index === 2 ? THEME.colors.yellow : THEME.colors.kraft}`, backgroundColor: THEME.colors.backgroundRaised, opacity, transform: `translateY(${y}px)`}}>
                <div style={{position: 'absolute', left: 27, width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: THEME.colors.brand, color: THEME.colors.cream, fontFamily: THEME.fonts.heading, fontSize: 24}}>{index + 1}</div>
                <Img src={staticFile(step.image)} style={{width: 220, height: 220, borderRadius: 20, objectFit: 'cover', flexShrink: 0}} />
                <div style={{fontFamily: THEME.fonts.heading, fontSize: 42, lineHeight: 1.12, color: THEME.colors.yellow}}>{step.title}</div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 5: Implement Features as a bounded 2×2 grid**

Create `VerticalFeaturesScene.tsx`:

```tsx
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BrowserFrame} from '../../components/BrowserFrame';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const features = [
  {title: 'Câu chuyện thương hiệu', subtitle: 'Khám phá hành trình', icon: '📖', screenshot: ASSETS.screenshots.homeDesktop, delay: -4},
  {title: 'Bài viết mới', subtitle: 'Góc chia sẻ', icon: '📰', screenshot: ASSETS.screenshots.newsDesktop, delay: 10},
  {title: 'Voucher dành riêng', subtitle: 'Ưu đãi hấp dẫn', icon: '🎫', screenshot: ASSETS.screenshots.productsDesktop, delay: 24},
  {title: 'Mini game thú vị', subtitle: 'Chơi và nhận quà', icon: '🎮', screenshot: ASSETS.screenshots.miniGameDesktop, delay: 38},
] as const;

export const VerticalFeaturesScene = () => {
  const frame = useCurrentFrame();
  return (
    <VerticalSceneShell durationInFrames={177} accent="#ffd6d6">
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 70, color: THEME.colors.cream, margin: '0 0 34px', opacity: enter(frame, -10, 16)}}>
          Nhiều tính năng hấp dẫn
        </h1>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, width: '100%'}}>
          {features.map((feature) => (
            <div key={feature.title} style={{height: 500, boxSizing: 'border-box', padding: 20, borderRadius: 28, backgroundColor: 'rgba(12,21,25,.88)', opacity: enter(frame, feature.delay, 18), transform: `scale(${interpolate(frame, [feature.delay, feature.delay + 18], [0.94, 1], {extrapolateRight: 'clamp'})})`}}>
              <div style={{fontSize: 54}}>{feature.icon}</div>
              <div style={{fontFamily: THEME.fonts.heading, fontSize: 29, lineHeight: 1.1, color: THEME.colors.cream, margin: '12px 0 6px'}}>{feature.title}</div>
              <div style={{fontFamily: THEME.fonts.body, fontSize: 22, color: THEME.colors.cream, opacity: 0.72, marginBottom: 16}}>{feature.subtitle}</div>
              <div style={{height: 280, overflow: 'hidden', borderRadius: 18}}>
                <BrowserFrame src={feature.screenshot} style={{width: 520}} />
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 6: Verify and commit middle scenes**

```powershell
npm test -- src/tests/vertical-contract.test.ts src/tests/visual-contract.test.ts
npm test
npm run typecheck
git add -- video/mushroomie-website-intro/src/tests/vertical-contract.test.ts video/mushroomie-website-intro/src/vertical/scenes/VerticalCustomScene.tsx video/mushroomie-website-intro/src/vertical/scenes/VerticalHandmadeScene.tsx video/mushroomie-website-intro/src/vertical/scenes/VerticalFeaturesScene.tsx
git diff --cached --check
git commit -m "feat(video): compose vertical product story scenes"
```

Expected: all suites PASS; TypeScript is clean; one scoped commit.

---

### Task 4: Build Final Vertical Scenes and Register the Composition

**Files:**
- Modify: `video/mushroomie-website-intro/src/Root.tsx`
- Modify: `video/mushroomie-website-intro/src/tests/vertical-contract.test.ts`
- Create: `video/mushroomie-website-intro/src/MushroomieIntroVertical.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalShoppingFlowScene.tsx`
- Create: `video/mushroomie-website-intro/src/vertical/scenes/VerticalEndCardScene.tsx`

**Interfaces:**
- Consumes: All vertical scenes from Tasks 2–4 plus shared `SCENES`, `AudioBed`, and background.
- Produces: Renderable `MushroomieWebsiteIntroVertical` composition registered beside the unchanged horizontal composition.

- [ ] **Step 1: Add failing integration, copy, and final-state contracts**

Append:

```ts
it('registers one independent vertical composition and one audio bed', () => {
  const root = source('../Root.tsx');
  const vertical = source('../MushroomieIntroVertical.tsx');
  expect(root).toContain('id={VERTICAL_COMPOSITION_ID}');
  expect(root).toContain('width={VERTICAL_VIDEO_CONFIG.width}');
  expect(vertical.match(/<Sequence /g)).toHaveLength(9);
  expect(vertical.match(/<AudioBed \/>/g)).toHaveLength(1);
  expect(vertical).toContain('<VerticalCaptionTrack />');
  expect(vertical).toContain('<VerticalProgressLine />');
});

it('keeps Shopping Flow, slogan, and CTA inside vertical contracts', () => {
  const shopping = source('../vertical/scenes/VerticalShoppingFlowScene.tsx');
  const end = source('../vertical/scenes/VerticalEndCardScene.tsx');
  expect(shopping).toContain('durationInFrames={147}');
  expect(shopping).toContain('ASSETS.screenshots.homeMobile');
  expect(shopping).toContain('width: 440');
  expect(shopping).toContain('[104, 124]');
  expect(end).toContain('durationInFrames={117}');
  expect(end).toContain('durationInFrames={84}');
  expect(end).toContain('Làm bằng tay,');
  expect(end).toContain('trao bằng tim');
  expect(end).toContain('mushroomie.io.vn');
  expect(end).toContain('enter(frame, 10, 60)');
});
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
npm test -- src/tests/config.test.ts src/tests/vertical-contract.test.ts
```

Expected: FAIL because final vertical scenes/root and Root registration do not exist.

- [ ] **Step 3: Build the vertical Shopping Flow scene**

Create `VerticalShoppingFlowScene.tsx`:

```tsx
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {MobileFrame} from '../../components/MobileFrame';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

const steps = [
  {label: 'Xem sản phẩm', icon: '📱'},
  {label: 'Thêm vào giỏ', icon: '🛒'},
  {label: 'Đặt hàng', icon: '📦'},
] as const;

export const VerticalShoppingFlowScene = () => {
  const frame = useCurrentFrame();
  const mobileOpacity = enter(frame, 104, 20);
  const mobileY = interpolate(frame, [104, 124], [38, 0], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.2)),
  });

  return (
    <VerticalSceneShell durationInFrames={147} accent="#ffe7a3">
      <AbsoluteFill>
        <h1 style={{fontFamily: THEME.fonts.heading, fontSize: 70, color: THEME.colors.cream, textAlign: 'center', margin: 0}}>
          Mua sắm dễ dàng
        </h1>
        <div style={{position: 'absolute', top: 280, left: 0, width: 300, display: 'flex', flexDirection: 'column', gap: 24}}>
          {steps.map((step, index) => {
            const delay = index * 18 - 8;
            const y = interpolate(frame, [delay, delay + 16], [24, 0], {extrapolateRight: 'clamp'});
            return (
              <div key={step.label} style={{width: 300, height: 190, boxSizing: 'border-box', padding: 22, display: 'flex', alignItems: 'center', gap: 18, borderRadius: 26, border: `2px solid ${index === 0 ? THEME.colors.brand : 'transparent'}`, backgroundColor: THEME.colors.backgroundRaised, opacity: enter(frame, delay, 16), transform: `translateY(${y}px)`}}>
                <div style={{fontSize: 54}}>{step.icon}</div>
                <div style={{fontFamily: THEME.fonts.heading, fontSize: 30, lineHeight: 1.1, color: THEME.colors.cream}}>{step.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{position: 'absolute', top: 150, right: 0, width: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: mobileOpacity, transform: `translateY(${mobileY}px)`}}>
          <div style={{fontFamily: THEME.fonts.body, fontSize: 25, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: THEME.colors.yellow}}>
            Mọi thiết bị
          </div>
          <MobileFrame src={ASSETS.screenshots.homeMobile} style={{width: 440}} />
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 4: Build the vertical slogan and CTA scene**

Create `VerticalEndCardScene.tsx`:

```tsx
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {THEME} from '../../content/theme';
import {ASSETS} from '../../lib/assets';
import {enter} from '../../lib/motion';
import {VerticalSceneShell} from '../VerticalSceneShell';

export const VerticalEndCardScene = ({mode}: {mode: 'slogan' | 'cta'}) => {
  const frame = useCurrentFrame();

  if (mode === 'slogan') {
    const logoScale = interpolate(frame, [0, 20], [0.88, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.5))});
    const text1Opacity = enter(frame, 40, 15);
    const text2Opacity = enter(frame, 70, 15);
    return (
      <VerticalSceneShell durationInFrames={117} accent="#ffe7a3">
        <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 54, textAlign: 'center'}}>
          <Img src={staticFile(ASSETS.brand.logo)} style={{width: 220, height: 220, transform: `scale(${logoScale})`}} />
          <div style={{fontFamily: THEME.fonts.heading, fontSize: 82, lineHeight: 1.08, color: THEME.colors.cream}}>
            <div style={{opacity: text1Opacity}}>Làm bằng tay,</div>
            <div style={{marginTop: 18, color: THEME.colors.brand, opacity: text2Opacity}}>trao bằng tim</div>
          </div>
        </AbsoluteFill>
      </VerticalSceneShell>
    );
  }

  const settleProgress = enter(frame, 10, 60);
  const logoScale = interpolate(settleProgress, [0, 1], [1.18, 1]);
  const logoY = interpolate(settleProgress, [0, 1], [-36, -70]);
  const domainOpacity = enter(frame, 10, 16);
  const buttonOpacity = enter(frame, 20, 16);

  return (
    <VerticalSceneShell durationInFrames={84} accent="#e41d1d">
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
        <Img src={staticFile(ASSETS.brand.logo)} style={{width: 190, height: 190, transform: `translateY(${logoY}px) scale(${logoScale})`}} />
        <div style={{fontFamily: THEME.fonts.heading, fontSize: 56, lineHeight: 1.1, color: THEME.colors.cream, margin: '10px 0 54px', opacity: domainOpacity}}>
          mushroomie.io.vn
        </div>
        <div style={{padding: '24px 58px', borderRadius: 100, backgroundColor: THEME.colors.brand, color: THEME.colors.cream, fontFamily: THEME.fonts.heading, fontSize: 48, boxShadow: `0 20px 40px ${THEME.colors.brand}66`, opacity: buttonOpacity}}>
          Khám phá ngay
        </div>
      </AbsoluteFill>
    </VerticalSceneShell>
  );
};
```

- [ ] **Step 5: Create the vertical sequencing root**

Create `src/MushroomieIntroVertical.tsx`:

```tsx
import {AbsoluteFill, Sequence} from 'remotion';
import {AudioBed} from './components/AudioBed';
import {AmbientBackground} from './components/AmbientBackground';
import {SCENES, sceneDuration} from './content/scenes';
import {VerticalCaptionTrack} from './vertical/VerticalCaptionTrack';
import {VerticalProgressLine} from './vertical/VerticalProgressLine';
import {VerticalCustomScene} from './vertical/scenes/VerticalCustomScene';
import {VerticalEndCardScene} from './vertical/scenes/VerticalEndCardScene';
import {VerticalFeaturesScene} from './vertical/scenes/VerticalFeaturesScene';
import {VerticalHandmadeScene} from './vertical/scenes/VerticalHandmadeScene';
import {VerticalHookScene} from './vertical/scenes/VerticalHookScene';
import {VerticalProductsScene} from './vertical/scenes/VerticalProductsScene';
import {VerticalShoppingFlowScene} from './vertical/scenes/VerticalShoppingFlowScene';
import {VerticalWebsiteScene} from './vertical/scenes/VerticalWebsiteScene';

export const MushroomieIntroVertical = () => (
  <AbsoluteFill style={{backgroundColor: '#071014'}}>
    <AmbientBackground />
    <Sequence from={SCENES[0].from} durationInFrames={sceneDuration(SCENES[0])} name="Vertical Hook"><VerticalHookScene /></Sequence>
    <Sequence from={SCENES[1].from} durationInFrames={sceneDuration(SCENES[1])} name="Vertical Website"><VerticalWebsiteScene /></Sequence>
    <Sequence from={SCENES[2].from} durationInFrames={sceneDuration(SCENES[2])} name="Vertical Products"><VerticalProductsScene /></Sequence>
    <Sequence from={SCENES[3].from} durationInFrames={sceneDuration(SCENES[3])} name="Vertical Custom"><VerticalCustomScene /></Sequence>
    <Sequence from={SCENES[4].from} durationInFrames={sceneDuration(SCENES[4])} name="Vertical Handmade"><VerticalHandmadeScene /></Sequence>
    <Sequence from={SCENES[5].from} durationInFrames={sceneDuration(SCENES[5])} name="Vertical Features"><VerticalFeaturesScene /></Sequence>
    <Sequence from={SCENES[6].from} durationInFrames={sceneDuration(SCENES[6])} name="Vertical Shopping Flow"><VerticalShoppingFlowScene /></Sequence>
    <Sequence from={SCENES[7].from} durationInFrames={sceneDuration(SCENES[7])} name="Vertical Slogan"><VerticalEndCardScene mode="slogan" /></Sequence>
    <Sequence from={SCENES[8].from} durationInFrames={sceneDuration(SCENES[8])} name="Vertical CTA"><VerticalEndCardScene mode="cta" /></Sequence>
    <VerticalProgressLine />
    <VerticalCaptionTrack />
    <AudioBed />
  </AbsoluteFill>
);
```

- [ ] **Step 6: Register the new composition without changing horizontal props**

Update `Root.tsx` to import the vertical config/component and return both `Composition` elements in a fragment. The second element is:

```tsx
<Composition
  id={VERTICAL_COMPOSITION_ID}
  component={MushroomieIntroVertical}
  durationInFrames={VERTICAL_VIDEO_CONFIG.durationInFrames}
  fps={VERTICAL_VIDEO_CONFIG.fps}
  width={VERTICAL_VIDEO_CONFIG.width}
  height={VERTICAL_VIDEO_CONFIG.height}
/>
```

Keep the existing horizontal element byte-for-byte equivalent in values and component.

- [ ] **Step 7: Verify both compositions and commit integration**

```powershell
npm test -- src/tests/config.test.ts src/tests/vertical-contract.test.ts src/tests/visual-contract.test.ts
npm test
npm run typecheck
npm run compositions
```

Expected composition output includes:

```text
MushroomieWebsiteIntro          30  1920x1080  1290 (43.00 sec)
MushroomieWebsiteIntroVertical  30  1080x1920  1290 (43.00 sec)
```

Commit:

```powershell
git add -- video/mushroomie-website-intro/src/Root.tsx video/mushroomie-website-intro/src/MushroomieIntroVertical.tsx video/mushroomie-website-intro/src/tests/vertical-contract.test.ts video/mushroomie-website-intro/src/vertical/scenes/VerticalShoppingFlowScene.tsx video/mushroomie-website-intro/src/vertical/scenes/VerticalEndCardScene.tsx
git diff --cached --check
git commit -m "feat(video): register TikTok vertical composition"
```

---

### Task 5: Add Non-Destructive Vertical Review and Delivery Tooling

**Files:**
- Modify: `video/mushroomie-website-intro/package.json`
- Modify: `video/mushroomie-website-intro/scripts/render-keyframes.mjs`
- Modify: `video/mushroomie-website-intro/scripts/finalize-render.mjs`
- Modify: `video/mushroomie-website-intro/scripts/verify-render.mjs`
- Modify: `video/mushroomie-website-intro/src/tests/finalize-render.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/render-command.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/render-verification.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/review-script.test.ts`
- Create: `video/mushroomie-website-intro/scripts/render-vertical-keyframes.mjs`
- Create: `video/mushroomie-website-intro/scripts/finalize-vertical-render.mjs`
- Create: `video/mushroomie-website-intro/scripts/verify-vertical-render.mjs`

**Interfaces:**
- Consumes: Both registered compositions and existing FFmpeg discovery.
- Produces: Parameterized keyframe/finalization/verification functions plus vertical package scripts and unique artifact names.

- [ ] **Step 1: Write failing vertical tooling tests**

Add assertions:

```ts
// review-script.test.ts
it('uses independent vertical still-review names', async () => {
  const vertical = await import('../../scripts/render-vertical-keyframes.mjs');
  expect(vertical.VERTICAL_COMPOSITION_ID).toBe('MushroomieWebsiteIntroVertical');
  expect(vertical.VERTICAL_KEYFRAMES_DIRECTORY).toBe('vertical-keyframes');
  expect(vertical.VERTICAL_CONTACT_SHEET_FILENAME).toBe('vertical-keyframes-contact-sheet.jpg');
});

// finalize-render.test.ts
it('uses independent vertical delivery names', async () => {
  const verticalFinal = await import('../../scripts/finalize-vertical-render.mjs');
  expect(verticalFinal.VERTICAL_MASTER_FILENAME).toBe('mushroomie-website-intro-43s-9x16-tiktok-master.mp4');
  expect(verticalFinal.VERTICAL_FINAL_FILENAME).toBe('mushroomie-website-intro-43s-9x16-tiktok-v1.mp4');
  expect(verticalFinal.VERTICAL_CONTACT_SHEET_FILENAME).toBe('final-contact-sheet-43s-9x16-tiktok.jpg');
});

// render-verification.test.ts
it('validates the approved vertical dimensions independently', async () => {
  const {validateMetadata} = await import('../../scripts/verify-render.mjs');
  const validVertical = {
    duration: 43,
    width: 1080,
    height: 1920,
    fps: 30,
    videoCodec: 'h264',
    pixFmt: 'yuv420p',
    audioCodec: 'aac',
    channels: 2,
    fileSizeBytes: 5_000_000,
  };
  expect(validateMetadata(validVertical, {width: 1080, height: 1920})).toEqual([]);
  expect(validateMetadata({...validVertical, width: 1920, height: 1080}, {width: 1080, height: 1920})).toEqual(
    expect.arrayContaining(['Width must be 1080', 'Height must be 1920']),
  );
});

// render-command.test.ts
it('renders the vertical master to a unique path', () => {
  expect(packageJson.scripts['render:vertical-master']).toContain('MushroomieWebsiteIntroVertical');
  expect(packageJson.scripts['render:vertical-master']).toContain('mushroomie-website-intro-43s-9x16-tiktok-master.mp4');
});
```

- [ ] **Step 2: Run tooling tests and verify RED**

```powershell
npm test -- src/tests/review-script.test.ts src/tests/finalize-render.test.ts src/tests/render-verification.test.ts src/tests/render-command.test.ts
```

Expected: FAIL because vertical entry points and package scripts do not exist and `validateMetadata` is not dimension-parameterized.

- [ ] **Step 3: Parameterize keyframe rendering and add the vertical entry point**

Delete the now-obsolete `keyframesDirectory` constant, then replace the hard-coded still invocation and render loop in `render-keyframes.mjs` with:

```js
const stillInvocation = (frame, outputPath, {compositionId, scale}) => ({
  command: process.execPath,
  args: [
    remotionCli,
    'still',
    'src/index.ts',
    compositionId,
    outputPath,
    `--frame=${frame}`,
    `--scale=${scale}`,
    '--overwrite',
  ],
});

export const renderKeyframeSet = async ({
  compositionId,
  directoryName,
  contactSheetFilename,
  scale,
}) => {
  const outputDirectory = path.join(artifactDirectory, directoryName);
  await mkdir(outputDirectory, {recursive: true});
  const paths = [];

  for (const frame of KEY_FRAMES) {
    const outputPath = path.join(
      outputDirectory,
      `frame-${String(frame).padStart(4, '0')}.png`,
    );
    const invocation = stillInvocation(frame, outputPath, {compositionId, scale});
    run(invocation.command, invocation.args, `Render ${compositionId} still ${frame}`);
    paths.push(outputPath);
  }

  const fullFfmpeg = await findFullFfmpeg();
  const labelFont = process.env.MUSHROOMIE_LABEL_FONT ?? 'C:\\Windows\\Fonts\\arial.ttf';
  await access(labelFont);
  const contactSheet = path.join(artifactDirectory, contactSheetFilename);
  const invocation = buildFullFfmpegInvocation(
    contactSheetArgs(paths, contactSheet, labelFont),
    fullFfmpeg,
  );
  run(invocation.command, invocation.args, `Generate ${compositionId} contact sheet`);
  return {paths, contactSheet};
};

export const renderKeyframes = () =>
  renderKeyframeSet({
    compositionId: 'MushroomieWebsiteIntro',
    directoryName: 'keyframes',
    contactSheetFilename: 'keyframes-contact-sheet.jpg',
    scale: 0.5,
  });
```

Create `render-vertical-keyframes.mjs`:

```js
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderKeyframeSet} from './render-keyframes.mjs';

export const VERTICAL_COMPOSITION_ID = 'MushroomieWebsiteIntroVertical';
export const VERTICAL_KEYFRAMES_DIRECTORY = 'vertical-keyframes';
export const VERTICAL_CONTACT_SHEET_FILENAME = 'vertical-keyframes-contact-sheet.jpg';

export const renderVerticalKeyframes = () =>
  renderKeyframeSet({
    compositionId: VERTICAL_COMPOSITION_ID,
    directoryName: VERTICAL_KEYFRAMES_DIRECTORY,
    contactSheetFilename: VERTICAL_CONTACT_SHEET_FILENAME,
    scale: 0.35,
  });

if (path.resolve(process.argv[1] ?? '').toLocaleLowerCase() === fileURLToPath(import.meta.url).toLocaleLowerCase()) {
  await renderVerticalKeyframes();
}
```

- [ ] **Step 4: Parameterize finalization and add vertical filenames**

Delete the now-obsolete `masterPath`, `finalPath`, and `finalContactSheetPath` constants, then replace the contact-sheet builder and `finalizeRender()` body in `finalize-render.mjs` with:

```js
export const HORIZONTAL_CONTACT_SHEET_FILTER =
  'fps=1/10,scale=480:-1:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014';

export const buildFinalContactSheetArgs = (
  inputPath,
  outputPath,
  filter = HORIZONTAL_CONTACT_SHEET_FILTER,
) => [
  '-y',
  '-i',
  inputPath,
  '-vf',
  filter,
  '-frames:v',
  '1',
  '-q:v',
  '2',
  outputPath,
];

export const finalizeDelivery = async ({
  masterFilename,
  finalFilename,
  contactSheetFilename,
  contactSheetFilter,
}) => {
  await mkdir(artifactDirectory, {recursive: true});
  const resolvedMaster = path.join(artifactDirectory, masterFilename);
  const resolvedFinal = path.join(artifactDirectory, finalFilename);
  const resolvedContactSheet = path.join(
    artifactDirectory,
    contactSheetFilename,
  );
  await access(resolvedMaster);
  const ffmpeg = await findFullFfmpeg();
  run(
    ffmpeg,
    buildFinalEncodeArgs(resolvedMaster, resolvedFinal),
    `Encode ${finalFilename}`,
  );
  run(
    ffmpeg,
    buildFinalContactSheetArgs(
      resolvedFinal,
      resolvedContactSheet,
      contactSheetFilter,
    ),
    `Create ${contactSheetFilename}`,
  );
  return {finalPath: resolvedFinal, contactSheetPath: resolvedContactSheet};
};

export const finalizeRender = () =>
  finalizeDelivery({
    masterFilename: MASTER_FILENAME,
    finalFilename: FINAL_FILENAME,
    contactSheetFilename: FINAL_CONTACT_SHEET_FILENAME,
    contactSheetFilter: HORIZONTAL_CONTACT_SHEET_FILTER,
  });
```

Create `finalize-vertical-render.mjs`:

```js
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {finalizeDelivery} from './finalize-render.mjs';

export const VERTICAL_MASTER_FILENAME = 'mushroomie-website-intro-43s-9x16-tiktok-master.mp4';
export const VERTICAL_FINAL_FILENAME = 'mushroomie-website-intro-43s-9x16-tiktok-v1.mp4';
export const VERTICAL_CONTACT_SHEET_FILENAME = 'final-contact-sheet-43s-9x16-tiktok.jpg';

export const finalizeVerticalRender = () => finalizeDelivery({
  masterFilename: VERTICAL_MASTER_FILENAME,
  finalFilename: VERTICAL_FINAL_FILENAME,
  contactSheetFilename: VERTICAL_CONTACT_SHEET_FILENAME,
  contactSheetFilter: 'fps=1/10,scale=-1:480:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014',
});

if (path.resolve(process.argv[1] ?? '').toLocaleLowerCase() === fileURLToPath(import.meta.url).toLocaleLowerCase()) {
  await finalizeVerticalRender();
}
```

- [ ] **Step 5: Parameterize verification and add the vertical verifier**

Change the validator signature:

```js
export function validateMetadata(meta, expected = {width: 1920, height: 1080}) {
  const errors = [];
  if (meta.duration < 42.8 || meta.duration > 43.2) errors.push('Duration must be between 42.8 and 43.2 seconds');
  if (meta.width !== expected.width) errors.push(`Width must be ${expected.width}`);
  if (meta.height !== expected.height) errors.push(`Height must be ${expected.height}`);
  if (Math.abs(meta.fps - 30) > 0.01) errors.push('FPS must be 30');
  if (meta.videoCodec !== 'h264') errors.push('Video codec must be h264');
  if (!meta.pixFmt || !meta.pixFmt.includes('yuv420p')) errors.push('Pixel format must contain yuv420p');
  if (meta.audioCodec !== 'aac') errors.push('Audio codec must be aac');
  if (meta.channels !== 2) errors.push('Channels must be 2');
  if (meta.fileSizeBytes <= 1000000) errors.push('File size must be > 1MB');
  return errors;
}
```

Replace the current main-only ffprobe block with this exported function. Change the child-process import to `import {execFileSync} from 'node:child_process';`. Invoke the already-installed local Remotion CLI through `process.execPath`, avoiding `npx.cmd` portability and quoting problems:

```js
export const verifyRender = ({filename, reportFilename, width, height}) => {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const videoRoot = path.resolve(scriptDirectory, '..');
  const artifactsDir = path.resolve(videoRoot, '../../artifacts/mushroomie-brand-video');
  const remotionCli = path.join(
    videoRoot,
    'node_modules',
    '@remotion',
    'cli',
    'remotion-cli.js',
  );
  const mp4Path = path.join(artifactsDir, filename);
  if (!fs.existsSync(mp4Path)) {
    throw new Error(`File not found: ${mp4Path}`);
  }

  const output = execFileSync(
    process.execPath,
    [remotionCli, 'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4Path],
    {cwd: videoRoot, encoding: 'utf8'},
  );
  const data = JSON.parse(output);
  const videoStream = data.streams.find((stream) => stream.codec_type === 'video');
  const audioStream = data.streams.find((stream) => stream.codec_type === 'audio');
  const [numerator, denominator] = (videoStream?.r_frame_rate ?? '0/1')
    .split('/')
    .map(Number);
  const meta = {
    duration: Number(data.format.duration),
    width: videoStream?.width,
    height: videoStream?.height,
    fps: numerator / denominator,
    videoCodec: videoStream?.codec_name,
    pixFmt: videoStream?.pix_fmt,
    audioCodec: audioStream?.codec_name,
    channels: audioStream?.channels,
    fileSizeBytes: Number(data.format.size),
  };
  const errors = validateMetadata(meta, {width, height});
  const verificationData = {meta, errors, valid: errors.length === 0};
  fs.writeFileSync(
    path.join(artifactsDir, reportFilename),
    JSON.stringify(verificationData, null, 2),
  );
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }
  return verificationData;
};

if (isMain) {
  const result = verifyRender({
    filename: 'mushroomie-website-intro-43s-16x9-v1.mp4',
    reportFilename: 'verification-43s.json',
    width: 1920,
    height: 1080,
  });
  console.log(result.valid ? 'Validation passed!' : 'Validation failed!');
}
```

Create `verify-vertical-render.mjs`:

```js
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyRender} from './verify-render.mjs';

export const verifyVerticalRender = () => verifyRender({
  filename: 'mushroomie-website-intro-43s-9x16-tiktok-v1.mp4',
  reportFilename: 'verification-43s-9x16-tiktok.json',
  width: 1080,
  height: 1920,
});

if (path.resolve(process.argv[1] ?? '').toLocaleLowerCase() === fileURLToPath(import.meta.url).toLocaleLowerCase()) {
  await verifyVerticalRender();
}
```

- [ ] **Step 6: Add non-destructive package scripts**

Add only these scripts:

```json
"review:vertical-stills": "node scripts/render-vertical-keyframes.mjs",
"render:vertical-master": "remotion render src/index.ts MushroomieWebsiteIntroVertical ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-43s-9x16-tiktok-master.mp4 --codec=h264 --pixel-format=yuv420p --audio-codec=aac --crf=18 --concurrency=2 --timeout=60000 --overwrite",
"render:vertical-final": "node scripts/finalize-vertical-render.mjs",
"verify:vertical": "node scripts/verify-vertical-render.mjs"
```

Do not modify the existing horizontal script values.

- [ ] **Step 7: Verify tooling and commit**

```powershell
npm test -- src/tests/review-script.test.ts src/tests/finalize-render.test.ts src/tests/render-verification.test.ts src/tests/render-command.test.ts
npm test
npm run typecheck
npm run compositions
git add -- video/mushroomie-website-intro/package.json video/mushroomie-website-intro/scripts/render-keyframes.mjs video/mushroomie-website-intro/scripts/render-vertical-keyframes.mjs video/mushroomie-website-intro/scripts/finalize-render.mjs video/mushroomie-website-intro/scripts/finalize-vertical-render.mjs video/mushroomie-website-intro/scripts/verify-render.mjs video/mushroomie-website-intro/scripts/verify-vertical-render.mjs video/mushroomie-website-intro/src/tests/review-script.test.ts video/mushroomie-website-intro/src/tests/finalize-render.test.ts video/mushroomie-website-intro/src/tests/render-verification.test.ts video/mushroomie-website-intro/src/tests/render-command.test.ts
git diff --cached --check
git commit -m "chore(video): add TikTok vertical delivery tooling"
```

Expected: all tests and typecheck pass; both compositions list; no horizontal path changes.

---

### Task 6: Render, Decode, and Visually Approve the TikTok Delivery

**Files:**
- Generate, do not commit: `artifacts/mushroomie-brand-video/vertical-keyframes/*.png`
- Generate, do not commit: `artifacts/mushroomie-brand-video/vertical-keyframes-contact-sheet.jpg`
- Generate, do not commit: `artifacts/mushroomie-brand-video/vertical-boundary-*.png`
- Generate, do not commit: `artifacts/mushroomie-brand-video/mushroomie-website-intro-43s-9x16-tiktok-master.mp4`
- Generate, do not commit: `artifacts/mushroomie-brand-video/mushroomie-website-intro-43s-9x16-tiktok-v1.mp4`
- Generate, do not commit: `artifacts/mushroomie-brand-video/final-contact-sheet-43s-9x16-tiktok.jpg`
- Generate, do not commit: `artifacts/mushroomie-brand-video/verification-43s-9x16-tiktok.json`

**Interfaces:**
- Consumes: Completed vertical composition/tooling and existing local assets/audio.
- Produces: Verified TikTok MP4 and review evidence; no source commit.

- [ ] **Step 1: Record protected horizontal hashes and run preflight**

```powershell
$protected = @(
  'artifacts\mushroomie-brand-video\mushroomie-website-intro-60s-16x9-v4.mp4',
  'artifacts\mushroomie-brand-video\mushroomie-website-intro-43s-16x9-v1.mp4'
)
$before = @{}
foreach ($file in $protected) {
  $before[$file] = (Get-FileHash -Algorithm SHA256 -LiteralPath $file).Hash
}
$before | ConvertTo-Json
```

Then from `video/mushroomie-website-intro`:

```powershell
npm run assets:preflight
npm test
npm run typecheck
npm run compositions
```

Expected: 30 assets pass; all tests/typecheck pass; both 43-second compositions list with correct dimensions.

- [ ] **Step 2: Render ten representative vertical stills**

```powershell
npm run review:vertical-stills
```

Inspect frames `90, 210, 354, 559, 720, 855, 1072, 1190, 1260, 1276` at original detail. Reject any frame with clipped copy, overlap, malformed Vietnamese, content outside `x 72–900`, content below `y 1390`, caption outside `y 1430–1610`, or an empty final state.

- [ ] **Step 3: Render all vertical cut boundaries**

```powershell
$cuts = @(120,264,414,591,765,942,1089,1206)
foreach ($cut in $cuts) {
  $beforeFrame = $cut - 1
  foreach ($frame in @($beforeFrame, $cut)) {
    npx remotion still src/index.ts MushroomieWebsiteIntroVertical "../../artifacts/mushroomie-brand-video/vertical-boundary-$frame.png" --frame=$frame --overwrite
    if ($LASTEXITCODE -ne 0) { throw "Vertical boundary render failed at frame $frame" }
  }
}
```

Inspect all 16 frames. Confirm both sides of every cut are populated and all incoming final states remain reachable.

- [ ] **Step 4: Render, finalize, and verify**

```powershell
npm run render:vertical-master
npm run render:vertical-final
npm run verify:vertical
```

Expected: `verification-43s-9x16-tiktok.json` contains `"valid": true` and an empty error array.

- [ ] **Step 5: Resolve FFmpeg, fully decode, and measure audio**

Resolve the same full FFmpeg binary used by the finalization scripts:

```powershell
$ffmpeg = $env:FFMPEG_PATH
if ([string]::IsNullOrWhiteSpace($ffmpeg)) {
  $wingetRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe'
  if (Test-Path -LiteralPath $wingetRoot) {
    $ffmpeg = Get-ChildItem -LiteralPath $wingetRoot -Directory -Filter 'ffmpeg-*' |
      Sort-Object Name -Descending |
      ForEach-Object { Join-Path $_.FullName 'bin\ffmpeg.exe' } |
      Where-Object { Test-Path -LiteralPath $_ } |
      Select-Object -First 1
  }
}
if ([string]::IsNullOrWhiteSpace($ffmpeg)) {
  $ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($null -ne $ffmpegCommand) { $ffmpeg = $ffmpegCommand.Source }
}
if ([string]::IsNullOrWhiteSpace($ffmpeg)) { throw 'Full FFmpeg not found' }
$ffmpeg = (Resolve-Path -LiteralPath $ffmpeg -ErrorAction Stop).Path
```

Then run:

```powershell
$final = (Resolve-Path -LiteralPath '..\..\artifacts\mushroomie-brand-video\mushroomie-website-intro-43s-9x16-tiktok-v1.mp4').Path
$decode = & $ffmpeg -v error -i $final -map 0:v:0 -map 0:a:0 -f null NUL 2>&1
if ($LASTEXITCODE -ne 0) { $decode; throw 'Vertical full media decode failed' }
$analysis = & $ffmpeg -hide_banner -nostats -i $final -filter_complex 'ebur128=peak=true' -f null NUL 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Vertical loudness analysis failed' }
$analysis | Select-Object -Last 18
```

Expected: zero decode errors; integrated loudness near `-16 LUFS`; true peak at or below `-1 dBFS`.

- [ ] **Step 6: Inspect encoded frames for the five critical scenes**

```powershell
$checks = @{
  'vertical-check-products.png' = 11.8
  'vertical-check-custom.png' = 17.8
  'vertical-check-mobile.png' = 35.7
  'vertical-check-slogan.png' = 39.4
  'vertical-check-cta.png' = 42.2
}
foreach ($entry in $checks.GetEnumerator()) {
  & $ffmpeg -v error -y -ss $entry.Value -i $final -frames:v 1 "..\..\artifacts\mushroomie-brand-video\$($entry.Key)"
  if ($LASTEXITCODE -ne 0) { throw "Frame extraction failed: $($entry.Key)" }
}
```

Expected:

- Products: title, hero card, two supporting cards, labels, and caption are clear; all images remain `3:4`.
- Custom: label/title/chips/card/caption occupy separate zones.
- Mobile: real `390×844` production page, step rail, phone, and caption do not overlap.
- Slogan: exact two-line copy and punctuation are present.
- CTA: logo, full domain, button, and caption remain outside TikTok overlays.

- [ ] **Step 7: Prove audio parity and protected hashes**

Because the vertical composition mounts the same `AudioBed` once and preserves every canonical scene boundary, compare the fully decoded stereo PCM stream against the already-approved horizontal delivery. This checks the complete narration, all eight joins, music, effects, and the final spoken domain in one deterministic assertion:

```powershell
$horizontal = (Resolve-Path -LiteralPath '..\..\artifacts\mushroomie-brand-video\mushroomie-website-intro-43s-16x9-v1.mp4').Path
$horizontalAudioHash = (& $ffmpeg -v error -i $horizontal -map 0:a:0 -ac 2 -ar 48000 -c:a pcm_s16le -f md5 -).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Horizontal audio hash failed' }
$verticalAudioHash = (& $ffmpeg -v error -i $final -map 0:a:0 -ac 2 -ar 48000 -c:a pcm_s16le -f md5 -).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Vertical audio hash failed' }
if ($horizontalAudioHash -ne $verticalAudioHash) {
  throw "Vertical audio differs from approved 43-second narration: $verticalAudioHash vs $horizontalAudioHash"
}
$horizontalAudioHash
```

Expected: the decoded PCM MD5 values are identical. Combined with the existing narration-window and spoken-end unit tests, this proves there is no new overlap, clipped terminal sample, missing line, or added dead-air interval in the vertical adaptation.

Then from repository root:

```powershell
foreach ($file in $protected) {
  $after = (Get-FileHash -Algorithm SHA256 -LiteralPath $file).Hash
  if ($after -ne $before[$file]) { throw "Protected horizontal artifact changed: $file" }
}
git diff --cached --name-only
git status --short
```

Expected: both protected hashes match; staged file list is empty; vertical media remains untracked/unstaged; pre-existing unrelated user changes remain untouched. No Git commit is created for Task 6.

---

## Final Whole-Branch Gate

After Tasks 1–6 pass their task-scoped reviews:

1. Review the cumulative source range from the pre-Task-1 base through the Task-5 head.
2. Verify every requirement in `docs/superpowers/specs/2026-08-08-mushroomie-video-9x16-tiktok-design.md` has code/test/render evidence.
3. Re-run `npm test`, `npm run typecheck`, and `npm run compositions` from the video project.
4. Confirm both horizontal and vertical render commands/paths are non-destructive.
5. Confirm the final TikTok MP4 and verification report exist and match the accepted metadata.
6. Do not merge or push unless the user explicitly authorizes that integration step.

# Mushroomie Website Introduction Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build and render a polished 60-second Vietnamese 16:9 Remotion video that introduces the Mushroomie website in the approved Dark Brand Explainer style.

**Architecture:** Create an isolated Remotion project under "video/mushroomie-website-intro" so the production Next.js dependency graph stays unchanged. Keep the 1,800-frame timeline, narration, captions, asset manifest, and theme as typed data; compose nine non-overlapping windows with ordinary Sequence components so transition overlap cannot alter the approved duration. Prepare fonts, screenshots, product images, narration, music, and sound effects as local assets before rendering, then validate the MP4 with FFprobe and contact sheets.

**Tech Stack:** Node.js 24, npm 11, TypeScript 5, React 19, Remotion 4.0.506, Vitest 4, @remotion/media, @remotion/fonts, @remotion/captions, Microsoft Edge headless capture, Edge TTS in a project-local Python virtual environment, and FFmpeg/FFprobe 9.

## Global Constraints

- Composition: exactly 1920×1080, 30 fps, and 1,800 frames before encoding.
- Accepted encoded duration: 58–62 seconds.
- Final slogan: exactly “Làm bằng tay, trao bằng tim”.
- Final domain: exactly "mushroomie.io.vn".
- Typography: Paytone One headings; Montserrat body/captions; Vietnamese glyphs must render correctly.
- Palette: #e41d1d, #fff7f2, #ffd6d6, #ffe7a3, #b9794b, and #2b2b2b over a #071014–#0c1519 base.
- Motion: only Remotion frames, interpolate(), Easing, and deterministic values; no CSS transition, CSS keyframes, or Tailwind animation.
- Product media: real public Mushroomie images in fixed 3:4 frames.
- Captions: maximum two lines inside a 96 px safe margin, synchronized within approximately 250 ms.
- Privacy: public routes only; no personal, admin, order, payment QR, analytics, secret, or authenticated data.
- Rendering: all final-render assets are local; no render-time network requests.
- Isolation: do not modify root package.json/package-lock.json, Next.js runtime, database, Prisma, auth, payment, vouchers, uploads, deployment, or production configuration.
- Git: preserve all unrelated dirty changes and stage only video-owned paths.
- Generated media: do not commit .venv, generated voice, screenshots, music/SFX WAVs, stills, contact sheets, master renders, or final MP4 unless the user later requests it.

---

## Owned file structure

~~~text
video/mushroomie-website-intro/
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
├── public/
│   ├── audio/{music,sfx,voice}/
│   ├── brand/logo.webp
│   ├── fonts/*.woff2
│   ├── products/*.webp
│   └── screenshots/*.png
├── scripts/
│   ├── prepare-local-assets.mjs
│   ├── download-fonts.ts
│   ├── capture-public-pages.mjs
│   ├── preflight-assets.mjs
│   ├── generate-voiceover.ts
│   ├── generate-audio.mjs
│   ├── render-keyframes.mjs
│   └── verify-render.mjs
└── src/
    ├── index.ts
    ├── Root.tsx
    ├── MushroomieIntro.tsx
    ├── config.ts
    ├── content/{captions.json,narration.ts,scenes.ts,theme.ts}
    ├── lib/{assets.ts,captions.ts,motion.ts,seed.ts}
    ├── components/{AmbientBackground,AudioBed,BrowserFrame,CaptionTrack,FeatureTile,ProductCard,ProgressLine,SceneShell}.tsx
    ├── scenes/{HookScene,WebsiteScene,ProductsScene,CustomScene,HandmadeScene,FeaturesScene,ShoppingFlowScene,EndCardScene}.tsx
    └── tests/*.test.ts
~~~

Generated review and delivery files belong under "artifacts/mushroomie-brand-video/" and remain outside source commits.

---

### Task 1: Scaffold a runnable isolated Remotion composition

**Files:**
- Create: "video/mushroomie-website-intro/package.json"
- Create: "video/mushroomie-website-intro/package-lock.json"
- Create: "video/mushroomie-website-intro/tsconfig.json"
- Create: "video/mushroomie-website-intro/vitest.config.ts"
- Create: "video/mushroomie-website-intro/.gitignore"
- Create: "video/mushroomie-website-intro/src/config.ts"
- Create: "video/mushroomie-website-intro/src/index.ts"
- Create: "video/mushroomie-website-intro/src/Root.tsx"
- Create: "video/mushroomie-website-intro/src/MushroomieIntro.tsx"
- Test: "video/mushroomie-website-intro/src/tests/config.test.ts"

**Interfaces:**
- Consumes: approved format constants.
- Produces: COMPOSITION_ID, VIDEO_CONFIG, MushroomieIntro, and CLI composition "MushroomieWebsiteIntro".

- [ ] **Step 1: Scaffold and install the blank project**

~~~powershell
npx.cmd create-video@4.0.506 --yes --blank --no-tailwind video/mushroomie-website-intro
Set-Location video/mushroomie-website-intro
npm.cmd install
~~~

Expected: nested package-lock.json exists; root package files are unchanged.

- [ ] **Step 2: Pin package scripts and dependencies**

Use this package contract:

~~~json
{
  "name": "mushroomie-website-intro-video",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "studio": "remotion studio src/index.ts --no-open",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "compositions": "remotion compositions src/index.ts",
    "assets:local": "node scripts/prepare-local-assets.mjs",
    "assets:fonts": "tsx scripts/download-fonts.ts",
    "assets:capture": "node scripts/capture-public-pages.mjs",
    "assets:preflight": "node scripts/preflight-assets.mjs",
    "voice:generate": "tsx scripts/generate-voiceover.ts",
    "audio:generate": "node scripts/generate-audio.mjs",
    "review:stills": "node scripts/render-keyframes.mjs",
    "render:master": "remotion render src/index.ts MushroomieWebsiteIntro ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-master.mp4 --codec=h264 --pixel-format=yuv420p --audio-codec=aac --crf=18 --overwrite",
    "verify": "node scripts/verify-render.mjs"
  },
  "dependencies": {
    "@remotion/captions": "4.0.506",
    "@remotion/cli": "4.0.506",
    "@remotion/fonts": "4.0.506",
    "@remotion/media": "4.0.506",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "remotion": "4.0.506"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tsx": "^4.20.6",
    "typescript": "^5.9.3",
    "vitest": "^4.0.18"
  }
}
~~~

Use strict ES2022/Bundler TypeScript with jsx "react-jsx", noEmit, resolveJsonModule, esModuleInterop, skipLibCheck, allowJs true, checkJs false, and Vitest globals so typed tests can import the source-of-truth .mjs job/manifest modules.

- [ ] **Step 3: Write the failing composition-contract test**

~~~ts
import {describe, expect, it} from 'vitest';
import {COMPOSITION_ID, VIDEO_CONFIG} from '../config';

describe('video contract', () => {
  it('locks the approved Full HD composition', () => {
    expect(COMPOSITION_ID).toBe('MushroomieWebsiteIntro');
    expect(VIDEO_CONFIG).toEqual({width: 1920, height: 1080, fps: 30, durationInFrames: 1800});
  });
});
~~~

Run "npm.cmd test -- --run src/tests/config.test.ts". Expected: FAIL because config.ts does not yet export the contract.

- [ ] **Step 4: Implement the fixed contract and first valid frame-driven composition**

~~~ts
export const COMPOSITION_ID = 'MushroomieWebsiteIntro';
export const VIDEO_CONFIG = {width: 1920, height: 1080, fps: 30, durationInFrames: 1800} as const;
~~~

Root.tsx registers MushroomieIntro using all four VIDEO_CONFIG fields. index.ts calls registerRoot(RemotionRoot). MushroomieIntro initially renders a #071014 AbsoluteFill with a 96 px “Mushroomie” heading whose opacity and individual scale property interpolate over frames 0–24 with Easing.bezier(0.16, 1, 0.3, 1), clamped on both sides.

- [ ] **Step 5: Verify and commit**

~~~powershell
npm.cmd install
npm.cmd test -- --run src/tests/config.test.ts
npm.cmd run typecheck
npm.cmd run compositions
git add -- video/mushroomie-website-intro
git commit -m "feat: scaffold Mushroomie Remotion video"
~~~

Expected: composition listing reports 1920×1080, 30 fps, 1,800 frames. Ignore .venv, node_modules, .remotion, out, generated voice, generated screenshots, generated WAVs, and artifacts.

---

### Task 2: Lock timeline, narration, captions, theme, and local asset identifiers

**Files:**
- Create: "src/content/scenes.ts", "src/content/narration.ts", "src/content/captions.json", "src/content/theme.ts"
- Create: "src/lib/assets.ts"
- Test: "src/tests/content.test.ts"

**Interfaces:**
- Consumes: VIDEO_CONFIG.fps and the approved storyboard.
- Produces: SceneId, SCENES, sceneDuration(), NARRATION, Caption[] JSON, THEME, and ASSETS.

- [ ] **Step 1: Write failing continuity/copy tests**

Tests assert:
1. SCENES starts at 0, every next from equals previous to + 1, and the last to is 1799.
2. Narration and captions each have nine records aligned to all nine scene windows.
3. Caption windows are exactly 0–5000, 5000–11000, 11000–18000, 18000–27000, 27000–36000, 36000–44000, 44000–52000, 52000–57000, and 57000–60000 ms.
4. Narration record 8 contains “làm bằng tay, trao bằng tim”; record 9 contains “mushroomie.io.vn”.
5. Every ASSETS leaf is a relative local path with no http, localhost, 127.0.0.1, public/uploads, or leading slash.

Run the test and expect missing-module failures.

- [ ] **Step 2: Implement the exact scene windows**

~~~ts
export type SceneId = 'hook' | 'website' | 'products' | 'custom' | 'handmade' | 'features' | 'shopping-flow' | 'slogan' | 'cta';

export const SCENES = [
  {id: 'hook', from: 0, to: 149, accent: '#e41d1d', emphasis: ['Một món phụ kiện', 'Một câu chuyện riêng']},
  {id: 'website', from: 150, to: 329, accent: '#ffd6d6', emphasis: ['Handmade', 'Cá nhân hóa']},
  {id: 'products', from: 330, to: 539, accent: '#ffe7a3', emphasis: ['Thiết kế có sẵn', 'Sản phẩm custom']},
  {id: 'custom', from: 540, to: 809, accent: '#e41d1d', emphasis: ['Màu sắc · Hạt · Charm', 'Dấu ấn riêng']},
  {id: 'handmade', from: 810, to: 1079, accent: '#b9794b', emphasis: ['Làm thủ công', 'Chăm chút từng chi tiết']},
  {id: 'features', from: 1080, to: 1319, accent: '#ffd6d6', emphasis: ['Câu chuyện · Bài viết · Voucher · Mini game']},
  {id: 'shopping-flow', from: 1320, to: 1559, accent: '#ffe7a3', emphasis: ['Xem sản phẩm → Giỏ hàng → Đặt hàng']},
  {id: 'slogan', from: 1560, to: 1709, accent: '#ffe7a3', emphasis: ['Làm bằng tay', 'Trao bằng tim']},
  {id: 'cta', from: 1710, to: 1799, accent: '#e41d1d', emphasis: ['Khám phá ngay', 'mushroomie.io.vn']}
] as const;

export const sceneDuration = (scene: {from: number; to: number}) => scene.to - scene.from + 1;
~~~

- [ ] **Step 3: Implement exact narration text and rate**

Use one typed record per scene with audio paths "audio/voice/scene-01.mp3" through "scene-09.mp3". Lock this exact source-of-truth data; do not paraphrase the slogan or domain:

~~~ts
export const NARRATION = [
  {scene: 'hook', text: 'Một món phụ kiện nhỏ có thể kể câu chuyện rất riêng của bạn.', rate: '-5%', audio: 'audio/voice/scene-01.mp3'},
  {scene: 'website', text: 'Mushroomie là không gian dành cho vòng tay, charm, móc khóa và phụ kiện handmade cá nhân hóa.', rate: '+18%', audio: 'audio/voice/scene-02.mp3'},
  {scene: 'products', text: 'Từ những thiết kế có sẵn đến sản phẩm custom, bạn dễ dàng khám phá phong cách phù hợp ngay trên website.', rate: '+18%', audio: 'audio/voice/scene-03.mp3'},
  {scene: 'custom', text: 'Chọn màu sắc, hạt và charm bạn yêu thích. Mushroomie biến từng ý tưởng thành món phụ kiện mang dấu ấn riêng.', rate: '+8%', audio: 'audio/voice/scene-04.mp3'},
  {scene: 'handmade', text: 'Mỗi sản phẩm được làm thủ công, chăm chút từ khâu chọn vật liệu, phối chi tiết đến hoàn thiện và đóng gói.', rate: '+3%', audio: 'audio/voice/scene-05.mp3'},
  {scene: 'features', text: 'Không chỉ mua sắm, bạn còn có thể khám phá câu chuyện thương hiệu, bài viết, voucher và mini game thú vị.', rate: '+15%', audio: 'audio/voice/scene-06.mp3'},
  {scene: 'shopping-flow', text: 'Giao diện rõ ràng giúp bạn xem sản phẩm, thêm vào giỏ và đặt hàng nhanh chóng trên mọi thiết bị.', rate: '+8%', audio: 'audio/voice/scene-07.mp3'},
  {scene: 'slogan', text: 'Mushroomie — làm bằng tay, trao bằng tim.', rate: '-8%', audio: 'audio/voice/scene-08.mp3'},
  {scene: 'cta', text: 'Khám phá ngay tại mushroomie.io.vn.', rate: '-5%', audio: 'audio/voice/scene-09.mp3'},
] as const;
~~~

- [ ] **Step 4: Implement Caption JSON, theme, and ASSETS**

Each Caption JSON record has text equal to its narration, exact scene startMs/endMs, timestampMs null, confidence null.

THEME contains the approved palette, font family names, safe {x: 96, y: 96}, and radii {card: 28, small: 18}.

ASSETS uses these exact destinations:
- brand/logo.webp
- products/bracelet-green.webp
- products/bracelet-pink.webp
- products/bracelet-blue.webp
- products/keychains-pastel.webp
- products/keychains-blue.webp
- products/necklace-flowers.webp
- screenshots/home-desktop.png
- screenshots/home-mobile.png
- screenshots/products-desktop.png
- screenshots/news-desktop.png
- screenshots/mini-game-desktop.png
- audio/music/brand-bed.wav
- audio/sfx/whoosh.wav
- audio/sfx/pop.wav
- audio/sfx/shimmer.wav

- [ ] **Step 5: Verify and commit**

~~~powershell
npm.cmd test -- --run src/tests/content.test.ts
npm.cmd run typecheck
git add -- video/mushroomie-website-intro/src/content video/mushroomie-website-intro/src/lib/assets.ts video/mushroomie-website-intro/src/tests/content.test.ts
git commit -m "feat: define Mushroomie video timeline and content"
~~~

---

### Task 3: Prepare safe local product, font, and website assets

**Files:**
- Create: "scripts/prepare-local-assets.mjs"
- Create: "scripts/download-fonts.ts"
- Create: "scripts/capture-public-pages.mjs"
- Create: "scripts/preflight-assets.mjs"
- Test: "src/tests/assets.test.ts"

**Interfaces:**
- Consumes: root public assets, public Mushroomie routes, narration/emphasis text, and ASSETS.
- Produces: all local visual/font inputs and a blocking preflight.

- [ ] **Step 1: Write failing asset tests**

Test ASSETS recursively for local-only paths. Test copy manifest source/destination count equals seven and destinations equal the logo plus six product paths. Test capture manifest contains only "/", "/san-pham", "/tin-tuc", and "/mini-game"; homepage has both desktop and mobile outputs.

- [ ] **Step 2: Implement exact safe copies**

Copy these source/destination pairs after asserting each source is a file over 1 KB:

~~~text
public/logo.webp -> public/brand/logo.webp
public/uploads/19fee695-b91d-4de0-8a3b-3f443e60541f.webp -> public/products/bracelet-green.webp
public/uploads/2b0c9abe-3e1a-4329-a34b-76af47050de2.webp -> public/products/bracelet-pink.webp
public/uploads/92213f15-af99-4648-a20e-4e2c69e26f33.webp -> public/products/bracelet-blue.webp
public/uploads/4f66f767-3726-4be6-b48f-6001ecef1861.webp -> public/products/keychains-pastel.webp
public/uploads/a0b3e750-1035-4148-82d0-277445fca00c.webp -> public/products/keychains-blue.webp
public/uploads/d6984728-d738-4ff7-8a98-8a3f50b1446d.webp -> public/products/necklace-flowers.webp
~~~

The script exports `COPY_MANIFEST`, resolves repo root from its own location, creates only known destination directories, and never deletes source or destination trees. It executes copy work only when run as the entry point, so tests can import the manifest without filesystem side effects.

- [ ] **Step 3: Download five local WOFF2 subsets**

download-fonts.ts derives a text subset from narration plus all visible headings, requests official Google Fonts CSS for Paytone One 400 and Montserrat 400/600/700/800 with a modern browser user-agent, parses each returned font-face URL, verifies HTTP 200 and file size over 1 KB, and writes:
- fonts/paytone-one-400.woff2
- fonts/montserrat-400.woff2
- fonts/montserrat-600.woff2
- fonts/montserrat-700.woff2
- fonts/montserrat-800.woff2

The final composition loads these files locally using @remotion/fonts; it never references Google during render.

- [ ] **Step 4: Capture public pages with headless Edge**

capture-public-pages.mjs exports `CAPTURE_MANIFEST`, defaults origin to "https://mushroomie.io.vn", and accepts MUSHROOMIE_CAPTURE_ORIGIN for the spec-approved local fallback. It finds Edge from EDGE_PATH, Program Files (x86), then Program Files. Before capture it fetches the URL and requires an OK response. It performs browser capture only when run as the entry point, so tests can import the manifest without network or browser side effects.

Use exact captures:
- "/" at 1440×900 -> home-desktop.png
- "/" at 390×844 -> home-mobile.png
- "/san-pham" at 1440×900 -> products-desktop.png
- "/tin-tuc" at 1440×900 -> news-desktop.png
- "/mini-game" at 1440×900 -> mini-game-desktop.png

Invoke Edge with headless=new, disable-gpu, hide-scrollbars, force-device-scale-factor=1, virtual-time-budget=5000, exact window-size, and absolute screenshot output.

- [ ] **Step 5: Implement preflight**

preflight-assets.mjs checks every required brand, product, font, screenshot, voice, music, and SFX file. Reject missing files, files below 1 KB, and any manifest value beginning with http, "/", public/, uploads/, or containing localhost/127.0.0.1. Print a sorted verified list and exit 0 only when complete.

- [ ] **Step 6: Prepare, inspect, verify, and commit**

~~~powershell
npm.cmd run assets:local
npm.cmd run assets:fonts
npm.cmd run assets:capture
npm.cmd test -- --run src/tests/assets.test.ts
npm.cmd run typecheck
~~~

Inspect every screenshot for private/admin/order/payment data before use. Commit scripts/tests plus approved logo/fonts/products; leave generated screenshots uncommitted.

~~~powershell
git add -- video/mushroomie-website-intro/scripts/prepare-local-assets.mjs video/mushroomie-website-intro/scripts/download-fonts.ts video/mushroomie-website-intro/scripts/capture-public-pages.mjs video/mushroomie-website-intro/scripts/preflight-assets.mjs video/mushroomie-website-intro/src/tests/assets.test.ts video/mushroomie-website-intro/public/brand video/mushroomie-website-intro/public/fonts video/mushroomie-website-intro/public/products
git commit -m "feat: prepare safe Mushroomie video assets"
~~~

---

### Task 4: Generate and validate Vietnamese scene voice-over

**Files:**
- Create: "scripts/generate-voiceover.ts"
- Test: "src/tests/voiceover.test.ts"

**Interfaces:**
- Consumes: NARRATION, SCENES, project-local edge-tts.
- Produces: nine female Vietnamese MP3 clips matching the nine scene windows.

- [ ] **Step 1: Write failing voice contract tests**

Assert nine unique local scene-NN.mp3 paths, explicit signed-percent rates, matching scene IDs, and each scene duration at least three seconds.

- [ ] **Step 2: Create local TTS environment and verify the exact voice**

~~~powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install edge-tts==7.2.5
.\.venv\Scripts\edge-tts.exe --list-voices | Select-String "vi-VN-HoaiMyNeural"
~~~

Expected: vi-VN-HoaiMyNeural is present. Stop rather than silently switching language/gender when absent.

- [ ] **Step 3: Implement deterministic per-scene synthesis**

generate-voiceover.ts:
1. resolves .venv/Scripts/edge-tts.exe on Windows;
2. invokes voice vi-VN-HoaiMyNeural with each record's exact rate, pitch +0Hz, volume +0%, text, and absolute output;
3. probes each clip with "npx.cmd remotion ffprobe -v error -show_entries format=duration -of json";
4. fails when a clip exceeds its scene duration minus 0.35 seconds;
5. prints scene ID, actual/allowed seconds, rate, and output.

- [ ] **Step 4: Generate, listen, verify, and commit generator source**

~~~powershell
npm.cmd test -- --run src/tests/voiceover.test.ts
npm.cmd run voice:generate
npx.cmd remotion ffprobe -v error -show_entries format=duration -of json public/audio/voice/scene-01.mp3
npx.cmd remotion ffprobe -v error -show_entries format=duration -of json public/audio/voice/scene-06.mp3
npx.cmd remotion ffprobe -v error -show_entries format=duration -of json public/audio/voice/scene-09.mp3
git add -- video/mushroomie-website-intro/scripts/generate-voiceover.ts video/mushroomie-website-intro/src/tests/voiceover.test.ts
git commit -m "feat: add Vietnamese video voice pipeline"
~~~

Listen to scenes 1, 6, and 9. Required: consistent young female Vietnamese voice, correct slogan/domain, no clipped syllables. Generated MP3 files remain ignored.

---

### Task 5: Generate original music and restrained sound effects

**Files:**
- Create: "scripts/generate-audio.mjs"
- Test: "src/tests/audio.test.ts"

**Interfaces:**
- Consumes: Remotion-bundled FFmpeg.
- Produces: 60-second 48 kHz stereo music and three 48 kHz stereo effects.

- [ ] **Step 1: Write failing job-definition tests**

Export AUDIO_OUTPUTS and buildAudioJobs(). Assert keys are music/whoosh/pop/shimmer, four jobs exist, music arguments contain d=60 and 48000, and all outputs are local WAV paths.

- [ ] **Step 2: Implement four exact FFmpeg synthesis jobs**

Use spawnSync with "npx.cmd remotion ffmpeg" on Windows:
- brand-bed.wav: 60 s, 48 kHz stereo, quiet A-minor/F/C/G pad, 108 BPM pulse, low-pass, room echo, 1.5 s fade-in/out.
- whoosh.wav: 0.45 s pink noise, high-pass, triangular volume envelope.
- pop.wav: 0.16 s 620 Hz + 920 Hz tones with exponential decay.
- shimmer.wav: 1.2 s 880/1320/1760 Hz tones with echo/fade.
All outputs are PCM 16-bit WAV; each job overwrites only its known file and throws on non-zero status.

- [ ] **Step 3: Generate, probe, listen, and commit source**

~~~powershell
npm.cmd test -- --run src/tests/audio.test.ts
npm.cmd run audio:generate
npx.cmd remotion ffprobe -v error -show_entries stream=sample_rate,channels:format=duration -of json public/audio/music/brand-bed.wav
npx.cmd remotion ffprobe -v error -show_entries stream=sample_rate,channels:format=duration -of json public/audio/sfx/whoosh.wav
git add -- video/mushroomie-website-intro/scripts/generate-audio.mjs video/mushroomie-website-intro/src/tests/audio.test.ts
git commit -m "feat: synthesize original Mushroomie video audio"
~~~

Required listening result: music supports narration without vocals; SFX are soft, short, and unclipped. Generated WAVs remain ignored.

---

### Task 6: Build shared motion, captions, visuals, and audio layers

**Files:**
- Create: "src/lib/captions.ts", "src/lib/motion.ts", "src/lib/seed.ts"
- Create: all eight "src/components/*.tsx" files from the owned structure
- Modify: "src/MushroomieIntro.tsx"
- Test: "src/tests/presentation.test.ts"

**Interfaces:**
- Consumes: THEME, SCENES, Caption JSON, ASSETS, VIDEO_CONFIG, local fonts/audio.
- Produces: deterministic reusable presentation components.

- [ ] **Step 1: Write failing helper tests**

Test activeCaptionAt(5500) contains Mushroomie; activeCaptionAt(60500) is null. Test splitEmphasis preserves the original string and marks “trao bằng tim”. Test sceneOpacity(0,180)=0, sceneOpacity(30,180)=1, sceneOpacity(179,180)<1. Test seededUnit(42) is stable.

- [ ] **Step 2: Implement pure helpers**

sceneOpacity fades in for 18 frames, holds, fades out over the final 14 frames using clamped Bézier interpolation. seededUnit is an integer hash returning [0,1]. activeCaptionAt returns one Caption or null. splitEmphasis returns ordered {text, highlighted} fragments without losing punctuation/spacing.

- [ ] **Step 3: Load local fonts before rendering**

At module scope, await five @remotion/fonts loadFont() calls using staticFile() for Paytone One 400 and Montserrat 400/600/700/800.

- [ ] **Step 4: Implement exact visual primitives**

- AmbientBackground: #071014 base, two low-opacity blurred glows, 28 deterministic bead circles, sparse pixel-mushroom motif; transform/opacity only.
- ProgressLine: 5 px high, top safe area, frame 0–1799 mapped to 0–100%, red→pink→yellow gradient.
- SceneShell: 96 px safe area, scene-local opacity, accent glow, optional 38/62 landscape grid.
- BrowserFrame: 28 px rounded dark frame, three neutral dots, screenshot via Remotion `Img` and `staticFile()` with object-fit cover.
- ProductCard: 330×520 cream card, fixed 3:4 image box, name/category.
- FeatureTile: translucent dark tile, optional safe screenshot, icon, title, subtitle.

- [ ] **Step 5: Implement exact caption/audio layers**

CaptionTrack converts global frame to milliseconds, selects Caption, derives current-scene emphasis, renders centered lower-third Montserrat 38–46 px, max two lines.

AudioBed plays music at 0.12 with 45-frame fade-in and 60-frame fade-out; nine voice clips at 1.0 in scene-aligned Sequences; whoosh/pop/shimmer only on approved major beats. Audio is loaded only via staticFile and @remotion/media Audio.

- [ ] **Step 6: Verify a shared-layer still and commit**

~~~powershell
npm.cmd test -- --run src/tests/presentation.test.ts
npm.cmd run typecheck
npx.cmd remotion still src/index.ts MushroomieWebsiteIntro ../../artifacts/mushroomie-brand-video/shared-layer-check.png --frame=60 --scale=0.5 --overwrite
git add -- video/mushroomie-website-intro/src/lib video/mushroomie-website-intro/src/components video/mushroomie-website-intro/src/tests/presentation.test.ts video/mushroomie-website-intro/src/MushroomieIntro.tsx
git commit -m "feat: add Mushroomie video presentation system"
~~~

Required still: dark brand background, visible progress, safe headline/caption, no clipping.

---

### Task 7: Implement hook, website, product, and customization scenes

**Files:**
- Create: "src/scenes/HookScene.tsx", "WebsiteScene.tsx", "ProductsScene.tsx", "CustomScene.tsx"
- Test: "src/tests/scene-registry.test.ts"
- Modify: "src/MushroomieIntro.tsx"

**Interfaces:**
- Consumes: shared components, ASSETS, THEME, scene-local frames.
- Produces: first four approved scene components and exact registry durations.

- [ ] **Step 1: Write failing registry tests**

Registry must map hook/website/products/custom to React components with durations 150/180/210/270.

- [ ] **Step 2: Implement four exact scenes**

- Hook: centered logo at local frame 6; six restrained bead/charm orbits; “Một món phụ kiện” at 26 and “Một câu chuyện riêng” at 62; max 96 px heading.
- Website: 38/62 grid; left “Không gian handmade của riêng bạn” plus category chips; right home desktop BrowserFrame with 0.96→1 shallow zoom.
- Products: three 330×520 cards for green bracelet, pink bracelet, pastel keychains; nine-frame stagger; headings “Tìm món phụ kiện hợp gu”, labels Vòng tay/Charm/Móc khóa.
- Custom: central card; chips Màu sắc/Hạt/Charm activate at 30/72/114; blue bracelet reveal at 150; “Dấu ấn của riêng bạn” at 188; label “Minh họa quy trình cá nhân hóa”.

- [ ] **Step 3: Sequence, review, verify, commit**

Register each in exact SCENES windows. Render half-scale stills at global frames 60, 240, 420, 690. Required: one focal point, no caption collision, no stretched image, conceptual custom label visible.

~~~powershell
npm.cmd test -- --run src/tests/scene-registry.test.ts
npm.cmd run typecheck
git add -- video/mushroomie-website-intro/src/scenes video/mushroomie-website-intro/src/tests/scene-registry.test.ts video/mushroomie-website-intro/src/MushroomieIntro.tsx
git commit -m "feat: build Mushroomie intro and product scenes"
~~~

---

### Task 8: Complete handmade, feature, shopping, slogan, and CTA scenes

**Files:**
- Create: "src/scenes/HandmadeScene.tsx", "FeaturesScene.tsx", "ShoppingFlowScene.tsx", "EndCardScene.tsx"
- Modify: "src/MushroomieIntro.tsx", "src/tests/scene-registry.test.ts"

**Interfaces:**
- Consumes: remaining SCENES and shared system.
- Produces: all nine timeline windows with global background/progress/captions/audio.

- [ ] **Step 1: Extend failing registry tests**

Require handmade/features/shopping-flow/slogan/cta durations 270/240/240/150/90.

- [ ] **Step 2: Implement remaining exact layouts**

- Handmade: three 360×440 cards “Chọn vật liệu”, “Phối chi tiết”, “Hoàn thiện & đóng gói”; green bracelet, blue keychains, flower necklace; bead path progresses frames 38–160; kraft/yellow accents.
- Features: 2×2 tiles “Câu chuyện thương hiệu”, “Bài viết mới”, “Voucher dành riêng”, “Mini game thú vị”; news and mini-game screenshots only in matching tiles; entries at 18/42/66/90.
- ShoppingFlow: horizontal “Xem sản phẩm” → “Thêm vào giỏ” → “Đặt hàng”; product screenshot only in first card, safe neutral vector UI elsewhere, no QR; mobile homepage appears at frame 104 with “Desktop & mobile”.
- EndCard mode slogan: particles gather around logo; “Làm bằng tay” then “Trao bằng tim”.
- EndCard mode CTA: logo, domain, red “Khám phá ngay”; motion settles by local frame 70.

- [ ] **Step 3: Assemble exact global order**

MushroomieIntro renders AmbientBackground, nine non-overlapping Sequence elements, ProgressLine, CaptionTrack, AudioBed. Do not use TransitionSeries because overlap changes the fixed duration.

- [ ] **Step 4: Verify and commit**

~~~powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run compositions
git add -- video/mushroomie-website-intro/src/scenes video/mushroomie-website-intro/src/MushroomieIntro.tsx video/mushroomie-website-intro/src/tests/scene-registry.test.ts
git commit -m "feat: complete Mushroomie website video scenes"
~~~

Expected: all tests pass; composition stays 1,800 frames.

---

### Task 9: Add repeatable key-frame review and preflight

**Files:**
- Create: "scripts/render-keyframes.mjs"
- Modify: "scripts/preflight-assets.mjs"
- Test: "src/tests/review-script.test.ts"

**Interfaces:**
- Consumes: registered composition and all prepared assets.
- Produces: ten stills and "artifacts/mushroomie-brand-video/keyframes-contact-sheet.jpg".

- [ ] **Step 1: Write failing frame-list tests**

Export KEY_FRAMES and assert exact value [0,150,330,540,810,1080,1320,1560,1710,1770], strictly increasing and within 0–1799.

- [ ] **Step 2: Implement review renderer**

For each key frame, run "npx.cmd remotion still src/index.ts MushroomieWebsiteIntro" at scale 0.5 with overwrite into artifacts/keyframes. Use "npx.cmd remotion ffmpeg" to tile the ten PNGs into a labeled 5×2 JPEG.

- [ ] **Step 3: Run hard visual gate**

~~~powershell
npm.cmd run assets:preflight
npm.cmd run review:stills
~~~

The contact sheet must have no blank/dark-only scene, broken image, clipped text, caption collision, stretched product, private/payment data, incorrect slogan/domain, or moving final CTA after frame 1770.

- [ ] **Step 4: Verify and commit tooling**

~~~powershell
npm.cmd test
npm.cmd run typecheck
git add -- video/mushroomie-website-intro/scripts/render-keyframes.mjs video/mushroomie-website-intro/scripts/preflight-assets.mjs video/mushroomie-website-intro/src/tests/review-script.test.ts
git commit -m "test: add Mushroomie video visual preflight"
~~~

---

### Task 10: Render, normalize, and verify the final MP4

**Files:**
- Create: "scripts/verify-render.mjs"
- Test: "src/tests/render-verification.test.ts"
- Create artifact: "artifacts/mushroomie-brand-video/mushroomie-website-intro-master.mp4"
- Create artifact: "artifacts/mushroomie-brand-video/mushroomie-website-intro-60s-16x9.mp4"
- Create artifact: "artifacts/mushroomie-brand-video/final-contact-sheet.jpg"
- Create artifact: "artifacts/mushroomie-brand-video/verification.json"

**Interfaces:**
- Consumes: verified composition/assets/audio.
- Produces: final user-facing MP4 and machine-readable evidence.

- [ ] **Step 1: Write failing metadata validator tests**

validateMetadata() accepts only duration 58–62, 1920×1080, 30 fps, h264, yuv420p-compatible, AAC, stereo. One test passes a valid object and expects []; another passes eight invalid fields and expects eight errors.

- [ ] **Step 2: Implement FFprobe verification**

Run "npx.cmd remotion ffprobe -v error -show_streams -show_format -of json" on final MP4, normalize rational fps, add file-size check >1 MB, write verification.json, and exit non-zero when any acceptance condition fails.

- [ ] **Step 3: Run complete pre-render gate**

~~~powershell
npm.cmd run assets:preflight
npm.cmd test
npm.cmd run typecheck
npm.cmd run compositions
npm.cmd run review:stills
~~~

All commands must succeed.

- [ ] **Step 4: Render H.264 master and normalize audio**

~~~powershell
npm.cmd run render:master
npx.cmd remotion ffmpeg -y -i ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-master.mp4 -c:v copy -af loudnorm=I=-15:TP=-1:LRA=11 -c:a aac -b:a 192k ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-60s-16x9.mp4
~~~

Video stream is copied; audio is normalized near -15 LUFS and -1 dBTP.

- [ ] **Step 5: Verify final output and contact sheet**

~~~powershell
npm.cmd run verify
npx.cmd remotion ffmpeg -hide_banner -i ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-60s-16x9.mp4 -af loudnorm=I=-15:TP=-1:LRA=11:print_format=json -f null NUL
~~~

Create final-contact-sheet.jpg from approximately 2, 8, 14, 22, 31, 40, 48, 54, and 59 seconds. Inspect first/middle/final playback for continuity, caption sync, voice clarity, exact slogan/domain.

- [ ] **Step 6: Commit verifier and report artifact**

~~~powershell
git add -- video/mushroomie-website-intro/scripts/verify-render.mjs video/mushroomie-website-intro/src/tests/render-verification.test.ts
git commit -m "test: verify Mushroomie video render contract"
~~~

Do not commit generated media. Report absolute MP4 path, duration, codec, resolution, fps, audio codec/channels, loudness, tests/typecheck, commit hashes, branch/detached status, and limitations.

---

## Plan self-review

- Spec coverage: Tasks 2–10 cover all approved visual windows, narration, captions, audio, privacy, asset, render, and verification requirements.
- Timeline: SCENES is continuous 0–1799; ordinary Sequence components prevent transition overlap.
- Interfaces: later tasks consume only VIDEO_CONFIG, SCENES, NARRATION, THEME, and ASSETS defined in Tasks 1–2.
- Isolation: every dependency and source file stays under the nested video project.
- Privacy: capture is public-only and screenshots require review before use.
- Licensing: music/SFX are generated; fonts come from official Google Fonts; no unverified music download.
- Verification: unit tests, typecheck, composition listing, still contact sheets, FFprobe metadata, and loudness analysis are explicit gates.

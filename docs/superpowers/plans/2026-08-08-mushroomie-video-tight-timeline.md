# Mushroomie 43-Second Tight Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retime the approved nine-scene Mushroomie introduction from 60 seconds to exactly 43 seconds without losing narration, captions, animation states, or the previously fixed layout clearances.

**Architecture:** Keep `SCENES`, `VIDEO_CONFIG`, and `captions.json` as the canonical editorial timeline, then make every timing consumer derive from those values. Validate narration against the last non-silent sample instead of the physical MP3 duration so Remotion can clip confirmed trailing silence safely. Preserve all existing scene components and only retime their local duration/slow zoom endpoints.

**Tech Stack:** Remotion 4.0.506, React 19, TypeScript 5.9, Vitest 4, Edge TTS, FFmpeg/FFprobe, PowerShell on Windows.

## Global Constraints

- Final canvas remains 1920×1080, 16:9, 30 fps.
- Composition duration is exactly 1,290 frames / 43.0 seconds; encoded duration must remain within 42.8–43.2 seconds.
- Keep all nine scenes, all approved Vietnamese narration, `vi-VN-NamMinhNeural`, the exact slogan “Làm bằng tay, trao bằng tim”, and `mushroomie.io.vn`.
- Do not time-stretch narration, remove internal speech pauses, change voice settings, or overlap two narration clips.
- Only confirmed trailing silence may be clipped by a scene `Sequence`.
- Preserve the 3:4 product-image contract, caption corridor, custom-scene label clearance, and current 390×844 production mobile capture.
- Do not overwrite or delete the existing 60-second MP4.
- Do not modify the production website, database, auth, payment, checkout, upload pipeline, PM2, or Nginx.
- Do not add dependencies.
- Use TDD for every code change and commit only the exact video/spec files for each task.

## File Structure and Responsibilities

- `video/mushroomie-website-intro/src/config.ts`: canonical composition dimensions, fps, and 1,290-frame duration.
- `video/mushroomie-website-intro/src/content/scenes.ts`: contiguous scene boundaries and per-scene duration source.
- `video/mushroomie-website-intro/src/content/captions.json`: caption windows aligned one-to-one with scenes.
- `video/mushroomie-website-intro/src/components/ProgressLine.tsx`: global progress derived from `VIDEO_CONFIG`.
- `video/mushroomie-website-intro/scripts/generate-voiceover.ts`: Edge TTS generation, duration probing, trailing-silence detection, and spoken-end validation.
- `video/mushroomie-website-intro/src/scenes/*.tsx`: scene-local duration metadata and the website zoom endpoint.
- `video/mushroomie-website-intro/scripts/render-keyframes.mjs`: representative stills for the new timeline.
- `video/mushroomie-website-intro/scripts/finalize-render.mjs`: 43-second delivery filename, normalization, and final contact sheet.
- `video/mushroomie-website-intro/scripts/verify-render.mjs`: 43-second metadata acceptance and verification report.
- `video/mushroomie-website-intro/package.json`: 43-second master-render output path.
- `video/mushroomie-website-intro/src/tests/*.test.ts`: regression contracts for timeline, captions, voice safety, visuals, and delivery.

---

### Task 1: Make the 43-Second Timeline Canonical

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/config.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/scene-registry.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/content.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/presentation.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/visual-contract.test.ts`
- Modify: `video/mushroomie-website-intro/src/config.ts`
- Modify: `video/mushroomie-website-intro/src/content/scenes.ts`
- Modify: `video/mushroomie-website-intro/src/content/captions.json`
- Modify: `video/mushroomie-website-intro/src/components/ProgressLine.tsx`

**Interfaces:**
- Consumes: Existing `VIDEO_CONFIG`, `SCENES`, `sceneDuration()`, `CAPTIONS`, and `activeCaptionAt()` interfaces.
- Produces: `VIDEO_CONFIG.durationInFrames === 1290`; contiguous `SCENES` from frame 0 through 1289; caption windows from 0 through 43000 ms; `ProgressLine` driven by the shared config.

- [ ] **Step 1: Write failing timeline tests**

Update `config.test.ts` so the expected object is:

```ts
expect(VIDEO_CONFIG).toEqual({
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 1290,
});
```

Replace the duration contract in `scene-registry.test.ts` with:

```ts
const expectedDurations: Record<string, number> = {
  hook: 120,
  website: 144,
  products: 150,
  custom: 177,
  handmade: 174,
  features: 177,
  'shopping-flow': 147,
  slogan: 117,
  cta: 84,
};

expect(SCENES).toHaveLength(9);
expect(SCENES[0].from).toBe(0);
for (let index = 1; index < SCENES.length; index++) {
  expect(SCENES[index].from).toBe(SCENES[index - 1].to + 1);
}
expect(SCENES.at(-1)?.to).toBe(1289);
expect(SCENES.reduce((sum, scene) => sum + sceneDuration(scene), 0)).toBe(1290);
```

Update `content.test.ts` to expect frame 1289 and these caption windows:

```ts
expect(captions.map(({startMs, endMs}) => [startMs, endMs])).toEqual([
  [0, 4000],
  [4000, 8800],
  [8800, 13800],
  [13800, 19700],
  [19700, 25500],
  [25500, 31400],
  [31400, 36300],
  [36300, 40200],
  [40200, 43000],
]);
```

Update the caption selection test in `presentation.test.ts`:

```ts
expect(activeCaptionAt(42000)?.text).toContain('mushroomie.io.vn');
expect(activeCaptionAt(43000)).toBeNull();
```

Add a source contract to `visual-contract.test.ts` inside the existing presentation suite:

```ts
const progress = source('../components/ProgressLine.tsx');
expect(progress).toContain("import { VIDEO_CONFIG } from '../config';");
expect(progress).not.toContain('durationInFrames: 1800');
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
npm test -- src/tests/config.test.ts src/tests/scene-registry.test.ts src/tests/content.test.ts src/tests/presentation.test.ts src/tests/visual-contract.test.ts
```

Expected: FAIL because config is still 1,800 frames, the registry still ends at 1,799, captions still end at 60,000 ms, and `ProgressLine` still owns a local 1,800-frame literal.

- [ ] **Step 3: Implement the canonical timeline**

Set `VIDEO_CONFIG.durationInFrames` in `src/config.ts`:

```ts
export const VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 1290,
} as const;
```

Replace the scene boundaries in `src/content/scenes.ts` while preserving every `id`, `accent`, and `emphasis` value:

```ts
const boundaries = {
  hook: {from: 0, to: 119},
  website: {from: 120, to: 263},
  products: {from: 264, to: 413},
  custom: {from: 414, to: 590},
  handmade: {from: 591, to: 764},
  features: {from: 765, to: 941},
  'shopping-flow': {from: 942, to: 1088},
  slogan: {from: 1089, to: 1205},
  cta: {from: 1206, to: 1289},
} as const;
```

Apply those `from`/`to` values to the existing nine `SCENES` entries. Do not introduce `boundaries` as a second runtime registry; the block above is the exact value map to copy into the existing entries.

Change only `startMs` and `endMs` in `captions.json` to the nine windows from Step 1. Keep every caption `text`, `timestampMs`, and `confidence` unchanged.

Replace the local progress config in `ProgressLine.tsx`:

```tsx
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {THEME} from '../content/theme';
import {VIDEO_CONFIG} from '../config';

export const ProgressLine: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [0, VIDEO_CONFIG.durationInFrames - 1],
    [0, 1],
    {extrapolateRight: 'clamp'},
  );

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: THEME.safe.y,
          left: 0,
          height: 5,
          width: '100%',
          background: `linear-gradient(90deg, ${THEME.colors.brand}, ${THEME.colors.pink}, ${THEME.colors.yellow})`,
          transform: `scaleX(${progress})`,
          transformOrigin: 'left center',
        }}
      />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the Step 2 command again.

Expected: all selected suites PASS; the registry reports nine continuous scenes totaling 1,290 frames.

- [ ] **Step 5: Commit the canonical timeline**

```powershell
git add -- video/mushroomie-website-intro/src/config.ts video/mushroomie-website-intro/src/content/scenes.ts video/mushroomie-website-intro/src/content/captions.json video/mushroomie-website-intro/src/components/ProgressLine.tsx video/mushroomie-website-intro/src/tests/config.test.ts video/mushroomie-website-intro/src/tests/scene-registry.test.ts video/mushroomie-website-intro/src/tests/content.test.ts video/mushroomie-website-intro/src/tests/presentation.test.ts video/mushroomie-website-intro/src/tests/visual-contract.test.ts
git diff --cached --check
git commit -m "fix(video): retime composition to 43 seconds"
```

Expected: one scoped commit with no unrelated project files.

---

### Task 2: Validate the Last Spoken Sample Instead of MP3 Tail Duration

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/voiceover.test.ts`
- Modify: `video/mushroomie-website-intro/scripts/generate-voiceover.ts`

**Interfaces:**
- Consumes: `buildVoiceJobs()`, `buildEdgeTtsArgs()`, the Remotion CLI binary already used for FFprobe, and each job's `allowedSeconds`.
- Produces: `buildSilenceDetectInvocation(filePath)`, `parseSpokenEndSeconds(output, totalSeconds)`, and generation-time validation based on the final non-silent sample.

- [ ] **Step 1: Write failing spoken-end tests**

Extend the import in `voiceover.test.ts`:

```ts
import {
  buildEdgeTtsArgs,
  buildFfprobeInvocation,
  buildSilenceDetectInvocation,
  parseSpokenEndSeconds,
  EDGE_VOICE,
  buildVoiceJobs,
} from '../../scripts/generate-voiceover';
```

Add these tests:

```ts
it('invokes silence detection through the Remotion FFmpeg binary', () => {
  const invocation = buildSilenceDetectInvocation('scene-01.mp3');
  expect(invocation.command).toBe(process.execPath);
  expect(invocation.args[0]).toMatch(/remotion-cli\.js$/);
  expect(invocation.args).toContain('ffmpeg');
  expect(invocation.args).toContain('silencedetect=noise=-40dB:d=0.15');
  expect(invocation.args).toContain('scene-01.mp3');
});

it('uses the start of EOF silence as the last spoken sample', () => {
  const output = [
    'silence_start: 1.7605',
    'silence_end: 2.022417 | silence_duration: 0.261917',
    'silence_start: 4.323042',
    'silence_end: 4.968 | silence_duration: 0.644958',
  ].join('\n');

  expect(parseSpokenEndSeconds(output, 4.968)).toBeCloseTo(4.323042, 6);
});

it('uses the physical duration when the file has no trailing silence', () => {
  expect(parseSpokenEndSeconds('silence_end: 2.0', 4.968)).toBe(4.968);
});

it('keeps a 0.35-second spoken-audio safety margin in every scene', () => {
  expect(
    buildVoiceJobs().map(({allowedSeconds}) =>
      Math.round(allowedSeconds * 100) / 100,
    ),
  ).toEqual([3.65, 4.45, 4.65, 5.55, 5.45, 5.55, 4.55, 3.55, 2.45]);
});
```

Replace the obsolete minimum-three-second test with an explicit positive-duration check:

```ts
it('gives every narration a positive spoken-audio window', () => {
  for (const job of buildVoiceJobs()) {
    expect(job.allowedSeconds).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: Run the voice test and verify RED**

Run:

```powershell
npm test -- src/tests/voiceover.test.ts
```

Expected: FAIL because `buildSilenceDetectInvocation` and `parseSpokenEndSeconds` do not exist and old jobs still derive from the pre-change scene lengths until Task 1 is present.

- [ ] **Step 3: Add deterministic silence-detection helpers**

In `generate-voiceover.ts`, define one shared Remotion CLI path:

```ts
const remotionCli = path.resolve(
  videoRoot,
  'node_modules',
  '@remotion',
  'cli',
  'remotion-cli.js',
);
```

Use `remotionCli` in `buildFfprobeInvocation()` and add:

```ts
export const buildSilenceDetectInvocation = (filePath: string) => ({
  command: process.execPath,
  args: [
    remotionCli,
    'ffmpeg',
    '-hide_banner',
    '-nostats',
    '-i',
    filePath,
    '-af',
    'silencedetect=noise=-40dB:d=0.15',
    '-f',
    'null',
    '-',
  ],
});

export const parseSpokenEndSeconds = (
  output: string,
  totalSeconds: number,
) => {
  const starts = Array.from(
    output.matchAll(/silence_start:\s*([0-9.]+)/g),
    (match) => Number(match[1]),
  );
  const ends = Array.from(
    output.matchAll(/silence_end:\s*([0-9.]+)/g),
    (match) => Number(match[1]),
  );
  const trailingStart = starts.at(-1);
  const trailingEnd = ends.at(-1);

  if (
    trailingStart === undefined ||
    trailingEnd === undefined ||
    Math.abs(trailingEnd - totalSeconds) > 0.1
  ) {
    return totalSeconds;
  }

  return trailingStart;
};
```

Refactor process execution without changing callers:

```ts
const runCapture = (
  command: string,
  args: string[],
  label: string,
  options: {cwd?: string} = {},
) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? videoRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    throw new Error(`${label} failed to start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed: ${result.stderr || result.stdout}`);
  }

  return result;
};

const run = (
  command: string,
  args: string[],
  label: string,
  options: {cwd?: string} = {},
) => runCapture(command, args, label, options).stdout;
```

Add the probe:

```ts
const probeSpokenEnd = (filePath: string, totalSeconds: number) => {
  const invocation = buildSilenceDetectInvocation(filePath);
  const result = runCapture(
    invocation.command,
    invocation.args,
    `Silence detect ${path.basename(filePath)}`,
  );
  return parseSpokenEndSeconds(
    `${result.stdout}\n${result.stderr}`,
    totalSeconds,
  );
};
```

In `generateVoiceover()`, replace physical-duration validation with:

```ts
const actualSeconds = probeDuration(job.output);
const spokenEndSeconds = probeSpokenEnd(job.output, actualSeconds);
if (spokenEndSeconds > job.allowedSeconds) {
  throw new Error(
    `${job.scene} spoken audio ends at ${spokenEndSeconds.toFixed(3)}s; ` +
      `allowed ${job.allowedSeconds.toFixed(3)}s at ${job.rate}`,
  );
}

console.log(
  `${job.scene}: speech ${spokenEndSeconds.toFixed(3)}s / ` +
    `${job.allowedSeconds.toFixed(3)}s; media ${actualSeconds.toFixed(3)}s ` +
    `at ${job.rate} -> ${job.output}`,
);
```

- [ ] **Step 4: Run tests and regenerate all voice files**

Run:

```powershell
npm test -- src/tests/voiceover.test.ts
npm run voice:generate
```

Expected: tests PASS; all nine generation log lines report `speech < allowed`, including CTA; no narration text, voice, rate, pitch, or volume changes.

- [ ] **Step 5: Commit spoken-end validation**

```powershell
git add -- video/mushroomie-website-intro/scripts/generate-voiceover.ts video/mushroomie-website-intro/src/tests/voiceover.test.ts
git diff --cached --check
git commit -m "fix(video): validate narration by spoken endpoint"
```

Expected: one scoped commit; generated MP3 files remain ignored and unstaged.

---

### Task 3: Retime Scene-Local Motion Without Losing Final States

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/visual-contract.test.ts`
- Modify: `video/mushroomie-website-intro/src/scenes/HookScene.tsx`
- Modify: `video/mushroomie-website-intro/src/scenes/WebsiteScene.tsx`
- Modify: `video/mushroomie-website-intro/src/scenes/ProductsScene.tsx`
- Modify: `video/mushroomie-website-intro/src/scenes/CustomScene.tsx`
- Modify: `video/mushroomie-website-intro/src/scenes/HandmadeScene.tsx`
- Modify: `video/mushroomie-website-intro/src/scenes/FeaturesScene.tsx`
- Modify: `video/mushroomie-website-intro/src/scenes/ShoppingFlowScene.tsx`
- Modify: `video/mushroomie-website-intro/src/scenes/EndCardScene.tsx`

**Interfaces:**
- Consumes: Local scene frames provided by the already-retimed `Sequence` boundaries.
- Produces: Updated `SceneShell` duration metadata; website zoom settled within 144 frames; unchanged final-state milestones for all other scene animations.

- [ ] **Step 1: Write failing scene-duration contracts**

Add a test in `visual-contract.test.ts`:

```ts
it('keeps every local scene animation inside the 43-second registry', () => {
  const hook = source('../scenes/HookScene.tsx');
  const website = source('../scenes/WebsiteScene.tsx');
  const products = source('../scenes/ProductsScene.tsx');
  const custom = source('../scenes/CustomScene.tsx');
  const handmade = source('../scenes/HandmadeScene.tsx');
  const features = source('../scenes/FeaturesScene.tsx');
  const shopping = source('../scenes/ShoppingFlowScene.tsx');
  const endCard = source('../scenes/EndCardScene.tsx');

  expect(hook).toContain('durationInFrames={120}');
  expect(website).toContain('durationInFrames={144}');
  expect(website).toContain('[0, 144]');
  expect(products).toContain('durationInFrames={150}');
  expect(custom).toContain('durationInFrames={177}');
  expect(handmade).toContain('durationInFrames={174}');
  expect(features).toContain('durationInFrames={177}');
  expect(shopping).toContain('durationInFrames={147}');
  expect(endCard).toContain('durationInFrames={117}');
  expect(endCard).toContain('durationInFrames={84}');
});
```

- [ ] **Step 2: Run the visual contract and verify RED**

Run:

```powershell
npm test -- src/tests/visual-contract.test.ts
```

Expected: FAIL because scene components still contain the 60-second registry durations and website zoom still settles at local frame 180.

- [ ] **Step 3: Apply the exact local durations**

Make these replacements only:

```text
HookScene:         150 -> 120
WebsiteScene:      180 -> 144; zoom input [0, 180] -> [0, 144]
ProductsScene:     210 -> 150
CustomScene:       270 -> 177
HandmadeScene:     270 -> 174
FeaturesScene:     240 -> 177
ShoppingFlowScene: 240 -> 147
EndCard slogan:    150 -> 117
EndCard CTA:        90 -> 84
```

Do not alter these final-state milestones:

```text
Hook second title complete: local frame 76
Custom title complete: local frame 140
Handmade path complete: local frame 122
Features final tile complete: local frame 56
Shopping mobile complete: local frame 124
Slogan second phrase complete: local frame 85
CTA settle complete: local frame 70
```

- [ ] **Step 4: Run visual and full unit tests**

Run:

```powershell
npm test -- src/tests/visual-contract.test.ts
npm test
npm run typecheck
```

Expected: 47 or more tests PASS, no TypeScript errors, and all previous overlap/caption/mobile contracts remain green.

- [ ] **Step 5: Commit scene-local retiming**

```powershell
git add -- video/mushroomie-website-intro/src/scenes/HookScene.tsx video/mushroomie-website-intro/src/scenes/WebsiteScene.tsx video/mushroomie-website-intro/src/scenes/ProductsScene.tsx video/mushroomie-website-intro/src/scenes/CustomScene.tsx video/mushroomie-website-intro/src/scenes/HandmadeScene.tsx video/mushroomie-website-intro/src/scenes/FeaturesScene.tsx video/mushroomie-website-intro/src/scenes/ShoppingFlowScene.tsx video/mushroomie-website-intro/src/scenes/EndCardScene.tsx video/mushroomie-website-intro/src/tests/visual-contract.test.ts
git diff --cached --check
git commit -m "fix(video): settle motion within shorter scenes"
```

Expected: one scoped commit with no generated stills or unrelated files.

---

### Task 4: Update Review, Finalization, and Verification Tooling

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/review-script.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/finalize-render.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/render-verification.test.ts`
- Modify: `video/mushroomie-website-intro/src/tests/render-command.test.ts`
- Modify: `video/mushroomie-website-intro/scripts/render-keyframes.mjs`
- Modify: `video/mushroomie-website-intro/scripts/finalize-render.mjs`
- Modify: `video/mushroomie-website-intro/scripts/verify-render.mjs`
- Modify: `video/mushroomie-website-intro/package.json`

**Interfaces:**
- Consumes: 1,290-frame composition from Tasks 1–3.
- Produces: representative new keyframes, a non-destructive 43-second master/final delivery, a five-frame 43-second contact sheet, and metadata validation for 42.8–43.2 seconds.

- [ ] **Step 1: Write failing delivery-tool tests**

Update the expected review frames:

```ts
expect(KEY_FRAMES).toEqual([
  90,
  210,
  354,
  559,
  720,
  855,
  1072,
  1190,
  1260,
  1276,
]);
expect(KEY_FRAMES.every((frame: number) => frame >= 0 && frame <= 1289)).toBe(true);
```

Update `finalize-render.test.ts` to import and verify filenames:

```ts
const {
  buildFinalContactSheetArgs,
  FINAL_CONTACT_SHEET_FILENAME,
  FINAL_FILENAME,
  MASTER_FILENAME,
} = await import('../../scripts/finalize-render.mjs');

expect(MASTER_FILENAME).toBe('mushroomie-website-intro-43s-master.mp4');
expect(FINAL_FILENAME).toBe('mushroomie-website-intro-43s-16x9-v1.mp4');
expect(FINAL_CONTACT_SHEET_FILENAME).toBe('final-contact-sheet-43s.jpg');
expect(
  buildFinalContactSheetArgs('final.mp4', 'final-contact-sheet-43s.jpg'),
).toContain(
  'fps=1/10,scale=480:-1:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014',
);
```

Update valid metadata fixtures in `render-verification.test.ts` to `duration: 43.0`. Add:

```ts
it('rejects a delivery outside the 42.8 to 43.2 second window', async () => {
  const {validateMetadata} = await import('../../scripts/verify-render.mjs');
  const errors = validateMetadata({
    duration: 43.5,
    width: 1920,
    height: 1080,
    fps: 30,
    videoCodec: 'h264',
    pixFmt: 'yuv420p',
    audioCodec: 'aac',
    channels: 2,
    fileSizeBytes: 5_000_000,
  });
  expect(errors).toContain('Duration must be between 42.8 and 43.2 seconds');
});
```

Extend `render-command.test.ts`:

```ts
expect(command).toContain('mushroomie-website-intro-43s-master.mp4');
expect(command).not.toContain('mushroomie-website-intro-master.mp4');
```

- [ ] **Step 2: Run delivery-tool tests and verify RED**

Run:

```powershell
npm test -- src/tests/review-script.test.ts src/tests/finalize-render.test.ts src/tests/render-verification.test.ts src/tests/render-command.test.ts
```

Expected: FAIL on old keyframes, old filenames, 58–62 second validation, 12-second contact-sheet spacing, and old master path.

- [ ] **Step 3: Update tooling implementation**

Set in `render-keyframes.mjs`:

```js
export const KEY_FRAMES = [90, 210, 354, 559, 720, 855, 1072, 1190, 1260, 1276];
```

Export and use these constants in `finalize-render.mjs`:

```js
export const MASTER_FILENAME = 'mushroomie-website-intro-43s-master.mp4';
export const FINAL_FILENAME = 'mushroomie-website-intro-43s-16x9-v1.mp4';
export const FINAL_CONTACT_SHEET_FILENAME = 'final-contact-sheet-43s.jpg';

const masterPath = path.join(artifactDirectory, MASTER_FILENAME);
const finalPath = path.join(artifactDirectory, FINAL_FILENAME);
const finalContactSheetPath = path.join(
  artifactDirectory,
  FINAL_CONTACT_SHEET_FILENAME,
);
```

Change the final contact-sheet filter to:

```js
'fps=1/10,scale=480:-1:flags=lanczos,tile=5x1:padding=8:margin=8:color=0x071014'
```

In `verify-render.mjs`, change duration validation and delivery/report paths:

```js
if (meta.duration < 42.8 || meta.duration > 43.2) {
  errors.push('Duration must be between 42.8 and 43.2 seconds');
}

const mp4Path = path.join(
  artifactsDir,
  'mushroomie-website-intro-43s-16x9-v1.mp4',
);
```

Write the report to `verification-43s.json` instead of `verification.json`.

Update `package.json` without changing codec, CRF, concurrency, or timeout:

```json
"render:master": "remotion render src/index.ts MushroomieWebsiteIntro ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-43s-master.mp4 --codec=h264 --pixel-format=yuv420p --audio-codec=aac --crf=18 --concurrency=2 --timeout=60000 --overwrite"
```

- [ ] **Step 4: Run delivery-tool and full tests**

Run:

```powershell
npm test -- src/tests/review-script.test.ts src/tests/finalize-render.test.ts src/tests/render-verification.test.ts src/tests/render-command.test.ts
npm test
npm run typecheck
npm run compositions
```

Expected: all tests PASS; TypeScript passes; Remotion lists `MushroomieWebsiteIntro` as 1,290 frames / 43 seconds.

- [ ] **Step 5: Commit delivery tooling**

```powershell
git add -- video/mushroomie-website-intro/scripts/render-keyframes.mjs video/mushroomie-website-intro/scripts/finalize-render.mjs video/mushroomie-website-intro/scripts/verify-render.mjs video/mushroomie-website-intro/package.json video/mushroomie-website-intro/src/tests/review-script.test.ts video/mushroomie-website-intro/src/tests/finalize-render.test.ts video/mushroomie-website-intro/src/tests/render-verification.test.ts video/mushroomie-website-intro/src/tests/render-command.test.ts
git diff --cached --check
git commit -m "chore(video): target 43-second delivery"
```

Expected: one scoped commit; the old 60-second artifact remains untouched.

---

### Task 5: Render, Decode, Listen, and Visually Approve the 43-Second Delivery

**Files:**
- Generate, do not commit: `artifacts/mushroomie-brand-video/keyframes/*.png`
- Generate, do not commit: `artifacts/mushroomie-brand-video/keyframes-contact-sheet.jpg`
- Generate, do not commit: `artifacts/mushroomie-brand-video/mushroomie-website-intro-43s-master.mp4`
- Generate, do not commit: `artifacts/mushroomie-brand-video/mushroomie-website-intro-43s-16x9-v1.mp4`
- Generate, do not commit: `artifacts/mushroomie-brand-video/final-contact-sheet-43s.jpg`
- Generate, do not commit: `artifacts/mushroomie-brand-video/verification-43s.json`

**Interfaces:**
- Consumes: all code and tooling from Tasks 1–4 plus existing local assets and current voice settings.
- Produces: verified 43-second MP4 and visual/audio evidence; no Git-tracked artifact.

- [ ] **Step 1: Record the old delivery hash and run preflight**

Run from the repository root:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath 'artifacts\mushroomie-brand-video\mushroomie-website-intro-60s-16x9-v4.mp4'
```

Record the hash in the task log. Then run from the video project:

```powershell
npm run assets:preflight
npm test
npm run typecheck
npm run compositions
```

Expected: asset preflight passes, all tests pass, TypeScript passes, and the composition reports 1,290 frames.

- [ ] **Step 2: Render representative stills and transition boundaries**

Run:

```powershell
npm run review:stills
```

Then render the frames immediately around each cut:

```powershell
$cuts = @(120,264,414,591,765,942,1089,1206)
foreach ($cut in $cuts) {
  foreach ($frame in @($cut - 1, $cut)) {
    npx remotion still src/index.ts MushroomieWebsiteIntro "../../artifacts/mushroomie-brand-video/boundary-$frame.png" --frame=$frame --overwrite
    if ($LASTEXITCODE -ne 0) { throw "Boundary render failed at frame $frame" }
  }
}
```

Expected: 10 representative stills plus 16 boundary stills render. Inspect them and confirm there is no empty frame, clipped caption, layout overlap, missing final state, broken image, or Vietnamese glyph error.

- [ ] **Step 3: Render and finalize the delivery**

Run:

```powershell
npm run render:master
npm run render:final
npm run verify
```

Expected: master and final render succeed; `verification-43s.json` contains `"valid": true`; the final MP4 is created at the approved 43-second filename.

- [ ] **Step 4: Fully decode and measure the final media**

Resolve the installed FFmpeg path and run:

```powershell
$ffmpeg = 'C:\Users\Admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0-full_build\bin\ffmpeg.exe'
$final = (Resolve-Path -LiteralPath '..\..\artifacts\mushroomie-brand-video\mushroomie-website-intro-43s-16x9-v1.mp4').Path
$decode = & $ffmpeg -v error -i $final -map 0:v:0 -map 0:a:0 -f null NUL 2>&1
if ($LASTEXITCODE -ne 0) { $decode; throw 'Full media decode failed' }
```

Measure loudness:

```powershell
$analysis = & $ffmpeg -hide_banner -nostats -i $final -filter_complex 'ebur128=peak=true' -f null NUL 2>&1
if ($LASTEXITCODE -ne 0) { throw 'Loudness analysis failed' }
$analysis | Select-Object -Last 18
```

Expected: full decode has zero errors; integrated loudness is near -16 LUFS; true peak is at or below -1 dBFS after final normalization.

- [ ] **Step 5: Extract and inspect frames from the encoded MP4**

Extract Products, Custom, and Shopping flow/mobile frames:

```powershell
& $ffmpeg -v error -y -ss 11.8 -i $final -frames:v 1 '..\..\artifacts\mushroomie-brand-video\final-check-products-43s.png'
& $ffmpeg -v error -y -ss 17.8 -i $final -frames:v 1 '..\..\artifacts\mushroomie-brand-video\final-check-custom-43s.png'
& $ffmpeg -v error -y -ss 35.7 -i $final -frames:v 1 '..\..\artifacts\mushroomie-brand-video\final-check-mobile-43s.png'
```

Expected: Products cards clear both title and captions; custom label clears the product card; mobile screenshot shows the correct 390×844 production UI and clears captions.

- [ ] **Step 6: Listen to all nine joins and confirm no spoken content is clipped**

Review these transition times in the final MP4:

```text
00:04.0, 00:08.8, 00:13.8, 00:19.7,
00:25.5, 00:31.4, 00:36.3, 00:40.2
```

Expected: no missing terminal consonant or syllable, no cut slogan/domain, no overlapping narration, and no dead-air interval longer than approximately 1.0 second.

- [ ] **Step 7: Verify the old 60-second delivery is unchanged and keep artifacts unstaged**

Run:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath '..\..\artifacts\mushroomie-brand-video\mushroomie-website-intro-60s-16x9-v4.mp4'
git status --short
```

Expected: the old hash matches Step 1; generated artifacts remain ignored/untracked and are not staged; only pre-existing unrelated user changes remain in the worktree.

No Git commit is created for Task 5 because render artifacts are intentionally excluded from source control.

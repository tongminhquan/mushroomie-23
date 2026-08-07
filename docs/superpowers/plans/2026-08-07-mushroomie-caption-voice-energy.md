# Mushroomie Caption Corridor and Energetic Voice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the website mockup from entering the lower-third caption lane and regenerate all Vietnamese narration with a more energetic NamMinh delivery.

**Architecture:** Add explicit, testable layout constants for the website viewport and apply them only in `WebsiteScene`, leaving the global caption position stable. Extend narration records with per-scene volume, generate Edge TTS clips from the tuned prosody values, then render and verify the full delivery file.

**Tech Stack:** TypeScript 5, React 19, Remotion 4.0.506, Vitest 4, Edge TTS, FFmpeg/FFprobe 9.

## Global Constraints

- Composition remains exactly 1920×1080, 30 fps, and 1,800 frames.
- Voice remains `vi-VN-NamMinhNeural`.
- Exact slogan remains “Làm bằng tay, trao bằng tim”.
- Caption typography remains 38px and at most two lines.
- Product cards remain 3:4.
- Generated audio and MP4 artifacts remain ignored by Git.
- No production website, database, auth, payment, upload, or deployment files may change.

---

### Task 1: Reserve the Caption Corridor in the Website Scene

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/visual-contract.test.ts`
- Modify: `video/mushroomie-website-intro/src/content/theme.ts`
- Modify: `video/mushroomie-website-intro/src/scenes/WebsiteScene.tsx`

**Interfaces:**
- Produces: `THEME.caption.bottom`, `THEME.caption.maxHeight`, and `THEME.caption.clearance` numeric constants.
- Consumes: the existing `BrowserFrame` overflow clipping behavior.

- [ ] **Step 1: Write the failing visual contract test**

```ts
it('keeps the website mockup above the caption corridor', () => {
  const theme = source('../content/theme.ts');
  const website = source('../scenes/WebsiteScene.tsx');

  expect(theme).toContain('caption: {bottom: 108, maxHeight: 128, clearance: 28}');
  expect(website).toContain('height: 650');
  expect(website).toContain("overflow: 'hidden'");
  expect(website).toContain('THEME.caption');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/tests/visual-contract.test.ts`

Expected: FAIL because the caption constants and bounded 650px browser viewport do not exist.

- [ ] **Step 3: Implement the minimal bounded viewport**

Add the caption geometry to `THEME`, replace the website scene's implicit image height with a 650px clipped browser viewport, and position the mockup so its bottom remains above `108 + 128 + 28` pixels from the frame bottom. Keep the existing width and animation scale so the artwork remains visually large.

- [ ] **Step 4: Render diagnostic stills**

Run:

```powershell
npx remotion still src/index.ts MushroomieWebsiteIntro ../../artifacts/mushroomie-brand-video/qa-frame-270.png --frame=270 --overwrite
npx remotion still src/index.ts MushroomieWebsiteIntro ../../artifacts/mushroomie-brand-video/qa-frame-300.png --frame=300 --overwrite
npx remotion still src/index.ts MushroomieWebsiteIntro ../../artifacts/mushroomie-brand-video/qa-frame-325.png --frame=325 --overwrite
```

Expected: the mockup ends above the caption plate at all three frames, with no text or image collision.

- [ ] **Step 5: Run the focused test and commit**

Run: `npm test -- src/tests/visual-contract.test.ts`

Expected: PASS.

Commit: `fix(video): keep website mockup above captions`

### Task 2: Regenerate the Energetic Vietnamese Voice Track

**Files:**
- Modify: `video/mushroomie-website-intro/src/tests/voiceover.test.ts`
- Modify: `video/mushroomie-website-intro/src/content/narration.ts`
- Modify: `video/mushroomie-website-intro/scripts/generate-voiceover.ts`

**Interfaces:**
- Produces: `NarrationRecord.volume` with the template type `` `${'+' | '-'}${number}%` ``.
- Consumes: `buildVoiceJobs()` and `buildEdgeTtsArgs()`.

- [ ] **Step 1: Write failing energetic-delivery tests**

```ts
it('uses an explicit energetic volume for every scene', () => {
  for (const record of NARRATION) {
    expect(record.volume).toMatch(/^\+\d+%$/);
  }
  expect(buildEdgeTtsArgs(buildVoiceJobs()[0])).toContain('--volume=+8%');
});

it('keeps the hook brisk and the slogan warm', () => {
  expect(NARRATION[0].rate).toBe('+18%');
  expect(NARRATION[0].pitch).toBe('+12Hz');
  expect(NARRATION[7].rate).toBe('+12%');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/tests/voiceover.test.ts`

Expected: FAIL because `volume` is absent and the old prosody profile is still active.

- [ ] **Step 3: Implement the per-scene prosody profile**

Add `volume` to each narration record, pass `--volume=${job.volume}` to Edge TTS, and tune the nine scenes around these targets: hook `+18%/+12Hz`, website `+32%/+16Hz`, products `+32%/+14Hz`, custom `+28%/+18Hz`, handmade `+24%/+12Hz`, features `+32%/+16Hz`, shopping `+28%/+14Hz`, slogan `+12%/+8Hz`, CTA at the fastest rate that still speaks the complete domain. Use punctuation to emphasize benefits and keep the approved message unchanged.

- [ ] **Step 4: Generate and probe all nine voice clips**

Run: `npm run voice:generate`

Expected: nine successful duration lines, each shorter than its allowed scene window.

- [ ] **Step 5: Run the focused test and commit**

Run: `npm test -- src/tests/voiceover.test.ts`

Expected: PASS.

Commit: `feat(video): energize Vietnamese narration delivery`

### Task 3: Render and Verify the Revised Delivery

**Files:**
- Regenerate ignored assets: `video/mushroomie-website-intro/public/audio/voice/scene-01.mp3` through `scene-09.mp3`
- Regenerate ignored artifacts: `artifacts/mushroomie-brand-video/*`
- Modify: `docs/superpowers/plans/2026-08-07-mushroomie-caption-voice-energy.md`

**Interfaces:**
- Consumes: the fixed scene markup and regenerated voice clips.
- Produces: `mushroomie-website-intro-60s-16x9.mp4` and an updated `verification.json`.

- [ ] **Step 1: Run source verification**

Run: `npm test`, `npm run typecheck`, `npm run assets:preflight`, and `npm run compositions`.

Expected: 13 test files and all tests PASS; typecheck exits 0; all local assets verify; composition reports 1920×1080, 30 fps, 1,800 frames.

- [ ] **Step 2: Render review stills and contact sheet**

Run: `npm run review:stills` plus the three diagnostic frame commands from Task 1.

Expected: no overlap, no broken Vietnamese glyphs, no broken images, and no two-line caption clipping.

- [ ] **Step 3: Render master and final MP4**

Run: `npm run render:master` followed by `npm run render:final`.

Expected: both commands exit 0 and the final MP4 is produced.

- [ ] **Step 4: Verify the full output**

Run: `npm run verify` and `ffmpeg -v error -i ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-60s-16x9.mp4 -f null -`.

Expected: `valid: true`, H.264/yuv420p/AAC stereo, 1920×1080, about 60.1 seconds, and no decode errors.

- [ ] **Step 5: Measure loudness**

Run: `ffmpeg -hide_banner -i ../../artifacts/mushroomie-brand-video/mushroomie-website-intro-60s-16x9.mp4 -filter_complex "ebur128=peak=true" -f null -`.

Expected: integrated loudness near -16 LUFS and true peak no higher than -1 dBFS.

- [ ] **Step 6: Commit the verification record**

Update this plan with the actual command results and commit only scoped video documentation/source files.

Commit: `docs(video): record caption and voice QA`

## Self-Review

- Spec coverage: layout corridor, energetic NamMinh delivery, exact slogan, full render, and output verification are each mapped to a task.
- Placeholder scan: no placeholder markers or unspecified implementation steps remain.
- Type consistency: `NarrationRecord.volume`, `THEME.caption`, and all referenced commands match the current project structure.

## Execution Record (2026-08-07)

- Added a shared caption geometry contract: bottom 108px, maximum plate height 128px, and 28px clearance.
- Bounded the website mockup to a 650px clipped viewport. Frames 270, 300, and 325 visually confirm that the mockup ends above the caption plate while remaining large and readable.
- Kept `vi-VN-NamMinhNeural` and regenerated all nine clips with per-scene rate, pitch, volume, and promotional punctuation. Every clip passed the existing scene-duration safety margin; the tightest CTA is 2.352s in a 2.650s allowance.
- Preserved the exact spoken and visible slogan “Làm bằng tay, trao bằng tim”.
- Source verification passed: 13 test files, 46 tests, TypeScript typecheck, all 30 local assets, and the 1920×1080/30fps/1,800-frame composition contract.
- The master rendered all 1,800 frames in 194.3 seconds and produced a 10.1MB file.
- Windows kept the previous delivery MP4 open in another process, so the finalizer did not overwrite it. The revised delivery was written non-destructively as `mushroomie-website-intro-60s-16x9-v2.mp4`.
- Final v2 verification: 60.10s, 1920×1080, 30fps, exactly 1,800 decoded video frames, H.264/yuv420p, AAC stereo, 8,223,598 bytes, and a clean full audio/video decode.
- EBU R128 measurement: -16.1 LUFS integrated loudness, 6.2 LU loudness range, and -2.2 dBFS true peak.
- SHA-256: `BFA8ADD5395AFD7C6111396410F0A23C12FC2ED4FE90CCB85B4AFD735AED5BC0`.

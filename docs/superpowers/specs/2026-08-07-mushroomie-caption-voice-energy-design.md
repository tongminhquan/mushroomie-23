# Mushroomie Caption Corridor and Energetic Voice Design

**Date:** 2026-08-07

**Status:** Approved in conversation

## Goal

Remove the overlap between the website mockup and the lower-third caption near 00:10, while making all nine Vietnamese narration clips sound more energetic without changing the approved NamMinh voice or the 60-second timeline.

## Approved Direction

Keep `vi-VN-NamMinhNeural`. Improve delivery by tuning rate, pitch, volume, and punctuation per scene. Preserve the approved words, brand meaning, exact slogan “Làm bằng tay, trao bằng tim”, and the spoken domain.

For the website scene, keep the mockup visually large but display it inside a bounded viewport. Crop excess page height and move the viewport upward so its painted bounds end above the shared caption corridor. Do not shrink every scene and do not move captions unpredictably between scenes.

## Layout Contract

- The global caption remains bottom-aligned with `paddingBottom: 108`.
- The website mockup must end above the caption lane at representative frames around 9–11 seconds.
- The website screenshot remains large and readable; excess vertical content is cropped inside the browser frame.
- The fix is local to `WebsiteScene`/`BrowserFrame` behavior and must not regress feature tiles or product-card proportions.
- Captions remain at most two lines, with the current 38px type size and dark backing plate.

## Voice Contract

- Voice remains `vi-VN-NamMinhNeural`.
- All nine records carry explicit rate, pitch, and volume values.
- Promotional scenes use a faster, brighter delivery than the previous version, but every generated clip must remain within its scene duration minus the existing 0.35-second safety margin.
- Punctuation supplies intentional emphasis instead of relying only on gain.
- The slogan stays warm and confident rather than rushed.
- The CTA remains fully audible, including “mushroomie.io.vn”.
- Final output remains normalized near -16 LUFS with true peak no higher than -1 dBFS.

## Testing and Verification

- Add a failing visual contract test for a bounded website viewport and explicit caption clearance.
- Add failing voice-over contract tests for per-scene volume and the new energetic delivery profile.
- Generate all nine voice files and probe every duration.
- Render stills around frames 270, 300, and 325, plus the existing 10-frame contact sheet.
- Render the full 1,800-frame master and final delivery MP4.
- Run unit tests, TypeScript typecheck, asset preflight, composition inspection, full audio/video decode, metadata verification, and EBU R128 loudness measurement.

## Skill and Dependency Decision

Use the installed official Remotion skills for markup, captions, multimedia, voice-over, and rendering. The searched third-party TTS skills require external Venice or ElevenLabs credentials and do not improve this Edge TTS workflow without new secrets, so no additional runtime dependency is introduced.

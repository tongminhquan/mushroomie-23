# Mushroomie Website Introduction Video — Design Specification

**Date:** 2026-08-05

**Status:** Approved by the user on 2026-08-05; ready for implementation

**Format:** 60-second, 16:9, Vietnamese brand explainer

**Approved direction:** Dark Brand Explainer

**Brand line:** “Làm bằng tay, trao bằng tim”

## 1. Objective

Create a polished one-minute video that introduces the overall Mushroomie website and communicates three ideas clearly:

1. Mushroomie sells handmade accessories such as bracelets, charms, keychains, necklaces, gift boxes, and small personalized accessories.
2. Personalization and careful handmade production are the brand's main differentiators.
3. The website provides a complete journey: discovery, product browsing, customization context, cart and checkout, plus supporting content such as the brand story, news, vouchers, and mini games.

The video should feel like a designer-made product explainer rather than a slideshow. It will borrow the visual language of the supplied reference video—dark atmospheric background, glowing interface cards, large kinetic headlines, progress indicator, and highlighted captions—while applying Mushroomie's colors, typography, imagery, and emotional tone.

The primary delivery file is:

`artifacts/mushroomie-brand-video/mushroomie-website-intro-60s-16x9.mp4`

## 2. Audience and use cases

The primary audience is Vietnamese Gen Z and young customers interested in expressive, personalized accessories and handmade gifts.

The finished video should work for:

- a YouTube or Facebook landscape post;
- website or presentation playback;
- paid-ad adaptation after the main version is approved;
- later cropping into shorter vertical or square derivatives, although those derivatives are outside this task.

## 3. Approved constraints

- Canvas: 1920×1080.
- Aspect ratio: 16:9.
- Frame rate: 30 fps.
- Target duration: 60 seconds; acceptable encoded duration is 58–62 seconds.
- Language: Vietnamese.
- Audio: Vietnamese voice-over, animated text, background music, and restrained sound effects.
- Voice direction: young female voice, warm, clear, natural, and not overly promotional.
- Heading typeface: Paytone One.
- Body and caption typeface: Montserrat.
- Main brand color: `#e41d1d`.
- Supporting colors: `#fff7f2`, `#ffd6d6`, `#ffe7a3`, `#b9794b`, and `#2b2b2b`.
- Slogan: “Làm bằng tay, trao bằng tim”.
- Product photography and real website imagery remain the visual focus; decorative particles, mushrooms, charms, and stickers only support the content.
- The video must not change the production website, database, upload pipeline, payment flow, or root Next.js dependency graph.

## 4. Reference-video analysis

The supplied reference file is 55.47 seconds long, 576×1024, 30 fps, H.264 video with AAC stereo audio. A sixteen-frame contact sheet is stored locally at:

`artifacts/video-reference-analysis/reference-contact-sheet.jpg`

Its reusable visual patterns are:

- near-black blue background with subtle colored glow and small particles;
- thin progress bar along the top edge;
- rounded interface cards with faint borders and colored outer glow;
- centered application or website screenshots inside mock-device frames;
- large bold title with one or two gradient-highlighted words;
- persistent lower-third captions with colored emphasis;
- feature groups presented as two- or three-column cards;
- one message per scene and a strong final domain CTA.

The Mushroomie video will adapt these patterns rather than reproduce the reference composition literally. The supplied reference is vertical; the new composition is landscape. Landscape adaptation will use a two-zone grid—visual content in the dominant center/right region and concise heading/context in the left region—while allowing selected hero scenes to use a centered full-width layout.

## 5. Creative direction: Dark Brand Explainer

The base surface is a dark blue-black field, approximately `#071014`, with slow-moving red, pink, yellow, and cyan glows. The dark background gives colorful product images strong contrast. Warm cream cards prevent the handmade brand from feeling like generic software marketing.

The intended balance is:

- 80% of the reference video's modern explainer language;
- 20% Mushroomie's tactile handmade personality.

The handmade layer is expressed through bead-like particles, charm silhouettes, kraft accents, irregular sticker shapes, and warm product photography. It must not become a scrapbook collage or obscure the website UI.

## 6. Visual system

### 6.1 Background

- Base: `#071014` to `#0c1519` radial gradient.
- One large red/pink glow follows the active content area at low opacity.
- A smaller yellow glow appears during handmade and slogan scenes.
- Particle count stays low. Particles move slowly and never cross captions at high contrast.
- All background animation uses transform and opacity driven by Remotion frames.

### 6.2 Cards

- Corner radius: 24–32 px.
- Border: white at 8–14% opacity, with scene-specific red, pink, yellow, or cyan edge light.
- Shadow: wide and soft; no hard neon outline.
- Dark UI cards use translucent black-blue surfaces.
- Product cards may use cream surfaces to preserve accurate image color and the existing 3:4 product-image ratio.
- Cards enter with a short spring or eased slide and leave before the next scene becomes visually dense.

### 6.3 Typography

- Paytone One headings: 68–96 px depending on line count.
- Montserrat support text: 28–36 px.
- Captions: 38–46 px, semibold or bold, maximum two lines.
- Vietnamese diacritics must render correctly in both fonts.
- Captions use white for the base text and brand colors for emphasized phrases.
- Headlines should not exceed seven words on screen at one time unless split into two deliberate beats.

### 6.4 Website imagery

- Use current Mushroomie screenshots and real product/media assets whenever available.
- Capture desktop website imagery at a viewport suited to 1440 px layout, then place it in a 16:9 browser frame.
- Capture a 390 px mobile viewport for the responsive scene.
- Do not show localhost, `127.0.0.1`, `/public/uploads`, broken images, test data, admin-only data, personal information, order details, payment QR codes, or secrets.
- Product imagery must retain its intended 3:4 framing.
- If a production screenshot contains dynamic personal or transactional content, replace it with a safe public route or a purpose-built static mock card based on public UI.

### 6.5 Progress and captions

- A 4–6 px progress line sits within the top safe area and advances continuously across 1,800 frames.
- Its gradient runs from red through pink and yellow; cyan may appear only as a small reference-video accent.
- Captions sit in the lower third, not at the absolute bottom edge.
- Caption emphasis is phrase-based, not karaoke highlighting of every spoken word.
- Captions and CTA remain inside a 96 px title-safe margin.

## 7. Storyboard and narration

The narration below is the approved content baseline. Small timing edits are allowed during voice synthesis, but the meaning and slogan must not change without user approval.

| Time | Frames | Visual design | Voice-over | On-screen emphasis |
|---|---:|---|---|---|
| 0:00–0:05 | 0–149 | Dark particle field. A red glow reveals the Mushroomie logo. Beads and small charm shapes form a loose orbit. The title resolves in two beats. | “Một món phụ kiện nhỏ có thể kể câu chuyện rất riêng của bạn.” | “Một món phụ kiện” → “Một câu chuyện riêng” |
| 0:05–0:11 | 150–329 | Desktop homepage screenshot appears inside a floating browser card. A short camera push focuses on the hero, with three small category chips nearby. | “Mushroomie là không gian dành cho vòng tay, charm, móc khóa và phụ kiện handmade cá nhân hóa.” | “Handmade” and “Cá nhân hóa” |
| 0:11–0:18 | 330–539 | Three cream product cards enter with a stagger: bracelet, charm, and keychain. Each image stays 3:4. Price and CTA details remain visually secondary. | “Từ những thiết kế có sẵn đến sản phẩm custom, bạn dễ dàng khám phá phong cách phù hợp ngay trên website.” | “Thiết kế có sẵn” and “Sản phẩm custom” |
| 0:18–0:27 | 540–809 | A central customization card displays three conceptual choices—color, beads, and charm—followed by a finished-product reveal. The card represents the customization idea and must not falsely suggest a site feature that does not exist. | “Chọn màu sắc, hạt và charm bạn yêu thích. Mushroomie biến từng ý tưởng thành món phụ kiện mang dấu ấn riêng.” | “Màu sắc · Hạt · Charm” and “Dấu ấn riêng” |
| 0:27–0:36 | 810–1079 | Three-step handmade sequence: material selection, detail composition, and finishing/packaging. Real images are connected by a moving bead path. | “Mỗi sản phẩm được làm thủ công, chăm chút từ khâu chọn vật liệu, phối chi tiết đến hoàn thiện và đóng gói.” | “Làm thủ công” and “Chăm chút từng chi tiết” |
| 0:36–0:44 | 1080–1319 | Four dark feature tiles appear as a compact dashboard: brand story, news, vouchers, and mini game. The tiles animate one at a time with small icons and safe public screenshots where useful. | “Không chỉ mua sắm, bạn còn có thể khám phá câu chuyện thương hiệu, bài viết, voucher và mini game thú vị.” | “Câu chuyện · Bài viết · Voucher · Mini game” |
| 0:44–0:52 | 1320–1559 | A horizontal journey connects product detail, cart, and checkout. A mobile mockup joins the desktop frame to show responsive access. Do not reveal payment QR or real order data. | “Giao diện rõ ràng giúp bạn xem sản phẩm, thêm vào giỏ và đặt hàng nhanh chóng trên mọi thiết bị.” | “Xem sản phẩm → Giỏ hàng → Đặt hàng” |
| 0:52–0:57 | 1560–1709 | Previous cards collapse into bead particles that assemble around the logo. A warm yellow glow replaces the cool background accent. | “Mushroomie — làm bằng tay, trao bằng tim.” | “Làm bằng tay” → “Trao bằng tim” |
| 0:57–1:00 | 1710–1799 | Final end card: logo, `mushroomie.io.vn`, and a large CTA button. Motion settles during the final second for readability. | “Khám phá ngay tại mushroomie.io.vn.” | “Khám phá ngay” and the domain |

## 8. Motion language

- All animation is deterministic and frame-driven with `useCurrentFrame()`, `interpolate()`, springs, and easing functions.
- CSS transitions, CSS keyframe animation, and Tailwind animation utilities are not used.
- Primary motion: fade, slide-up, controlled scale, blur-to-focus, shallow parallax, card push, and short camera zoom.
- Scene transitions overlap only enough to avoid black or empty frames.
- Decorative movement remains slower than content movement.
- No aggressive glitch, rapid shake, flashing color, or strong 3D rotation.
- The final card remains nearly static for at least 20 frames.
- The composition must remain understandable when paused at any key scene.

## 9. Audio design

### 9.1 Voice-over

- Vietnamese female neural voice or equivalent recorded voice.
- Warm, youthful, articulate delivery.
- Target pace: approximately 135–145 Vietnamese words per minute with short pauses between scenes.
- Voice synthesis or recording is performed before final timing lock.
- Preferred output: lossless WAV during editing, then AAC in the final MP4.
- If a preferred named voice is unavailable, use the closest available Vietnamese female voice matching this profile; do not silently switch language or gender.

### 9.2 Music

- Light upbeat chill-pop/electronic bed, approximately 100–110 BPM.
- The track must be original, generated for this video, or supported by a clear royalty-free license.
- Avoid vocals so that Vietnamese narration remains intelligible.
- Music begins softly, rises during product and customization reveals, and resolves under the end card.
- If no third-party track has verifiable usage rights, generate a simple original instrumental bed rather than using an unverified download.

### 9.3 Sound effects and mix

- Soft whoosh for major card entrances.
- Small pop for choice chips and charm selections.
- Gentle shimmer for the logo and slogan.
- Effects remain secondary and do not fire on every animation.
- Voice is the loudness priority. Music is ducked under narration.
- Final mix must not clip. Target integrated loudness is approximately -14 to -16 LUFS, with true peak no higher than -1 dBTP.

## 10. Remotion project architecture

The video is implemented as an isolated Remotion project so the public website bundle and root Next.js dependencies remain untouched.

Proposed location:

```text
video/mushroomie-website-intro/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── public/
│   ├── audio/
│   ├── brand/
│   ├── products/
│   └── screenshots/
└── src/
    ├── index.ts
    ├── Root.tsx
    ├── MushroomieIntro.tsx
    ├── content/
    │   ├── narration.ts
    │   └── scenes.ts
    ├── components/
    │   ├── AmbientBackground.tsx
    │   ├── BrowserFrame.tsx
    │   ├── CaptionLine.tsx
    │   ├── FeatureTile.tsx
    │   ├── ProductCard.tsx
    │   ├── ProgressLine.tsx
    │   └── SceneShell.tsx
    └── scenes/
        ├── HookScene.tsx
        ├── WebsiteScene.tsx
        ├── ProductsScene.tsx
        ├── CustomScene.tsx
        ├── HandmadeScene.tsx
        ├── FeaturesScene.tsx
        ├── ShoppingFlowScene.tsx
        └── EndCardScene.tsx
```

### Component responsibilities

- `MushroomieIntro`: owns the 1,800-frame composition and scene sequence.
- `SceneShell`: applies consistent padding, safe areas, entrance/exit timing, and background coordination.
- `AmbientBackground`: renders deterministic particles and low-opacity glows.
- `BrowserFrame`: displays safe desktop/mobile screenshots with a consistent device treatment.
- `CaptionLine`: displays scene captions and phrase-level color emphasis.
- `ProgressLine`: derives progress only from the current composition frame.
- Scene components: own only their scene-specific layout and motion.
- `content/scenes.ts`: contains timings, copy, asset paths, and emphasis tokens so editorial changes do not require rewriting layout code.

### Data flow

1. Static scene definitions provide frame boundaries, text, emphasis, and asset paths.
2. `MushroomieIntro` maps those definitions into `Sequence` or equivalent scene ranges.
3. Every scene receives local time derived from its sequence start.
4. Captions use the same boundaries as narration phrases.
5. The progress line uses the global frame count.
6. Voice-over and music are loaded from local `public/audio` assets; rendering does not depend on live URLs.

## 11. Asset acquisition and privacy

- Reuse the existing Mushroomie logo and public product/media assets where visually suitable.
- Capture only public-facing routes. Use `https://mushroomie.io.vn` as the primary screenshot source after a health check; use a local development build only as a fallback when the corresponding public content and imagery have been verified to match the intended website experience.
- Prefer current website screenshots over recreating the entire interface.
- Build conceptual cards only where a real screenshot would be too dense or would misrepresent the narrative.
- Do not include personal browser chrome, logged-in account details, admin pages, customer names, real order identifiers, addresses, payment QR codes, analytics IDs, or secrets.
- All remote assets required for the final render are copied locally before rendering.
- Every included third-party audio or visual asset must have documented usage permission or be replaced.

## 12. Error handling and fallbacks

- Missing critical logo, screenshot, narration, or font assets fail the pre-render check instead of rendering blank placeholders.
- Optional decorative images may fall back to simple vector beads or charm shapes.
- Browser screenshots use a local neutral placeholder only during development; final render is blocked if a required screenshot remains a placeholder.
- Fonts are loaded before frame rendering begins.
- Image boxes have fixed aspect ratios to prevent layout shifts between frames.
- No render-time network requests are allowed.
- If narration duration is outside the intended scene range, scene boundaries are adjusted within the 58–62 second acceptance window while keeping the approved sequence and meaning.

## 13. Verification plan

### Static checks

- TypeScript typecheck for the isolated Remotion project.
- Lint if the scaffold includes a lint command.
- Remotion composition listing succeeds.
- Asset preflight confirms every required local asset exists.

### Visual checks

- Render stills at representative frames: 0, 150, 330, 540, 810, 1080, 1320, 1560, 1710, and 1770.
- Assemble a contact sheet for quick scene-level review.
- Confirm captions and CTA remain within the 96 px safe margin.
- Confirm 3:4 product images are not stretched or cropped incorrectly.
- Confirm Vietnamese glyphs and punctuation render correctly.
- Confirm no screenshot exposes private, test, admin, payment, or order data.
- Confirm no broken image, empty scene, flicker, or accidental full-screen red field.

### Audio and encoded-file checks

- Verify voice-over is intelligible over music.
- Verify caption timing is within approximately 250 ms of the associated spoken phrase.
- Measure loudness and peaks; ensure no clipping.
- Inspect final file with FFprobe.
- Required final properties: 1920×1080, 30 fps, H.264 video, yuv420p-compatible output, AAC stereo audio, and 58–62 second duration.
- Play or sample the first, middle, and final sections after encoding.

## 14. Acceptance criteria

The task is complete only when all of the following are true:

- The MP4 exists at the agreed artifact path.
- Duration is 58–62 seconds.
- Resolution is 1920×1080 at 30 fps.
- The video has Vietnamese female voice-over and synchronized animated captions.
- The approved slogan is exactly “Làm bằng tay, trao bằng tim”.
- The overall visual language clearly resembles the supplied reference while remaining recognizably Mushroomie.
- The story includes website overview, product categories, customization, handmade process, supporting website content, shopping flow, and final CTA.
- Product images remain correctly framed.
- No private or production-sensitive information appears.
- Audio has no clipping and narration remains clearly audible.
- The final domain is `mushroomie.io.vn`.
- No production deploy, database mutation, upload cleanup, or payment/auth modification occurs.

## 15. Non-goals

- Redesigning or changing the Mushroomie website.
- Deploying the video to production or social platforms.
- Creating vertical, square, or shorter ad variants in this task.
- Building an interactive product customizer.
- Adding Remotion to the root Next.js application bundle.
- Changing checkout, payment QR, vouchers, authentication, admin behavior, or database schema.
- Committing downloaded unlicensed music, temporary renders, or sensitive screenshots.

## 16. Implementation decision gate

After this written specification is approved, the next step is to create a detailed implementation plan with the `writing-plans` workflow. Implementation begins only after that plan is written. The implementation plan will cover isolated project scaffolding, safe asset capture, voice generation, scene construction, key-frame review, full render, audio normalization, and final FFprobe verification.

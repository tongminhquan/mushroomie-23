# Mushroomie Responsive Showcase Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo và bàn giao một responsive showcase board 16:9 thể hiện tổng thể homepage Mushroomie trên desktop và mobile.

**Architecture:** Dùng công cụ `image_gen` tích hợp để tạo một UI mockup mới từ logo, hero và ảnh sản phẩm thật trong repo. Sau khi kiểm tra trực quan và sửa tối đa một nhóm lỗi mỗi lượt, dùng `sharp` hiện có trong dự án để chuẩn hóa bản được chọn thành PNG và WebP 3840 × 2160 mà không sửa code hoặc asset production.

**Tech Stack:** Built-in `image_gen`, local `view_image`, Node.js, `sharp` 0.34.x, PowerShell, Git.

## Global Constraints

- Chỉ dùng built-in `image_gen`; không dùng CLI fallback hoặc yêu cầu `OPENAI_API_KEY`.
- Không sửa code homepage, schema, database, banner production hoặc upload hiện tại.
- Không deploy production.
- Không ghi đè file đang có; dừng nếu một trong các đường dẫn đầu ra mục tiêu đã tồn tại.
- Canvas bàn giao là `3840 × 2160 px`, tỷ lệ 16:9.
- Xuất cả PNG và WebP; bản WebP dùng quality 90.
- Màu thương hiệu bắt buộc: `#e41d1d`, `#fff7f2`, `#ffd6d6`, `#ffe7a3`, `#b9794b`, `#2b2b2b`.
- Product card phải giữ tỷ lệ ảnh 3:4.
- Không tạo giá bán, voucher hoặc chương trình khuyến mãi có thể bị hiểu là dữ liệu thật.
- Không watermark, logo lạ, asset ngoài dự án hoặc chữ rác dễ thấy.
- Không stage/commit các file untracked có sẵn của người dùng; image artifact chỉ commit khi người dùng yêu cầu rõ.

## File Map

- Read: `docs/superpowers/specs/2026-07-27-mushroomie-responsive-showcase-board-design.md`
- Read: `public/logo.png`
- Read: `public/uploads/1002a915-1479-49e8-b3c2-b04a21eef81f.webp`
- Read: `public/uploads/f25c4021-3c10-4be8-ae3d-09332fb3e0e0.webp`
- Read: `public/uploads/a0b3e750-1035-4148-82d0-277445fca00c.webp`
- Read: `public/uploads/92213f15-af99-4648-a20e-4e2c69e26f33.webp`
- Create: `artifacts/mushroomie-responsive-showcase-board-source.png`
- Create: `artifacts/mushroomie-responsive-showcase-board-selected.png`
- Create: `artifacts/mushroomie-responsive-showcase-board-v1.png`
- Create: `artifacts/mushroomie-responsive-showcase-board-v1.webp`

---

### Task 1: Generate the Source Showcase Board

**Files:**
- Read: `docs/superpowers/specs/2026-07-27-mushroomie-responsive-showcase-board-design.md`
- Read: `public/logo.png`
- Read: `public/uploads/1002a915-1479-49e8-b3c2-b04a21eef81f.webp`
- Read: `public/uploads/f25c4021-3c10-4be8-ae3d-09332fb3e0e0.webp`
- Read: `public/uploads/a0b3e750-1035-4148-82d0-277445fca00c.webp`
- Read: `public/uploads/92213f15-af99-4648-a20e-4e2c69e26f33.webp`
- Create: `artifacts/mushroomie-responsive-showcase-board-source.png`

**Interfaces:**
- Consumes: Five local reference images with fixed roles described in Step 2.
- Produces: One lossless source raster at `artifacts/mushroomie-responsive-showcase-board-source.png`.

- [ ] **Step 1: Verify the required references and protect output paths**

Run:

```powershell
$requiredFiles = @(
  'docs\superpowers\specs\2026-07-27-mushroomie-responsive-showcase-board-design.md',
  'public\logo.png',
  'public\uploads\1002a915-1479-49e8-b3c2-b04a21eef81f.webp',
  'public\uploads\f25c4021-3c10-4be8-ae3d-09332fb3e0e0.webp',
  'public\uploads\a0b3e750-1035-4148-82d0-277445fca00c.webp',
  'public\uploads\92213f15-af99-4648-a20e-4e2c69e26f33.webp'
)
$missingFiles = $requiredFiles | Where-Object { -not (Test-Path -LiteralPath $_) }
if ($missingFiles.Count -gt 0) { throw "Missing required files: $($missingFiles -join ', ')" }
$outputFiles = @(
  'artifacts\mushroomie-responsive-showcase-board-source.png',
  'artifacts\mushroomie-responsive-showcase-board-selected.png',
  'artifacts\mushroomie-responsive-showcase-board-v1.png',
  'artifacts\mushroomie-responsive-showcase-board-v1.webp'
)
$existingOutputs = $outputFiles | Where-Object { Test-Path -LiteralPath $_ }
if ($existingOutputs.Count -gt 0) { throw "Refusing to overwrite: $($existingOutputs -join ', ')" }
```

Expected: command exits successfully with no output.

- [ ] **Step 2: Generate one new board with built-in image generation**

Call `image_gen.imagegen` with these local reference paths:

```json
{
  "referenced_image_paths": [
    "C:\\Users\\Admin\\OneDrive\\Tài liệu\\mushroomie\\public\\logo.png",
    "C:\\Users\\Admin\\OneDrive\\Tài liệu\\mushroomie\\public\\uploads\\1002a915-1479-49e8-b3c2-b04a21eef81f.webp",
    "C:\\Users\\Admin\\OneDrive\\Tài liệu\\mushroomie\\public\\uploads\\f25c4021-3c10-4be8-ae3d-09332fb3e0e0.webp",
    "C:\\Users\\Admin\\OneDrive\\Tài liệu\\mushroomie\\public\\uploads\\a0b3e750-1035-4148-82d0-277445fca00c.webp",
    "C:\\Users\\Admin\\OneDrive\\Tài liệu\\mushroomie\\public\\uploads\\92213f15-af99-4648-a20e-4e2c69e26f33.webp"
  ],
  "prompt": "Use case: ui-mockup\nAsset type: premium responsive website showcase board\nPrimary request: Create one polished 16:9 presentation board that communicates the complete homepage layout for Mushroomie, a youthful Vietnamese handmade personalized-accessories brand. This is a realistic, shippable product UI mockup, not concept art.\nInput images: Image 1 is the exact Mushroomie logo and pixel-mushroom identity reference; keep the recognizable red mushroom and wordmark. Image 2 is the hero art-direction reference for cream-red custom bracelets. Images 3, 4, and 5 are real product-photography references for 3:4 product cards, beads, charms, straps, and pastel styling.\nScene/backdrop: warm cream presentation-board background with extremely subtle paper texture and dotted-grid details.\nSubject: a large desktop homepage mockup occupying about 70 percent of the board; a clear 390px mobile homepage mockup overlapping on the right; a restrained group of color swatches, typography samples, a CTA, badge, and one product-card close-up in the remaining space.\nDesktop homepage flow: header with logo, search, navigation, account and cart; hero; categories; featured products; custom-order CTA; brand story; vision, mission and core values; custom process; handmade behind the scenes; customer reviews; latest posts; final CTA and footer. Represent every group as a clearly separated visual section without trying to render dense body copy.\nMobile flow: same brand and content rhythm, compact navigation, two-column product grid, clear touch targets, no horizontal overflow.\nHero composition: copy and CTA on the left; custom bracelet, beads and charms on the right; small pixel-mushroom accent; balanced negative space.\nStyle/medium: high-fidelity ecommerce UI presentation, clean editorial hierarchy, rounded cards, warm soft shadows, tactile handmade details used sparingly. Heading typography inspired by Paytone One and body typography inspired by Montserrat.\nColor palette: brand red #e41d1d, cream #fff7f2, light pink #ffd6d6, soft yellow #ffe7a3, kraft #b9794b, soft black #2b2b2b.\nText (verbatim): render only these prominent phrases, exactly as written and without extra characters: \"Mushroomie\"; \"Từ từng hạt nhỏ, tạo phong cách riêng.\"; \"Khám phá ngay\"; \"Tự tay chọn hạt, tự do kể câu chuyện của bạn.\"; \"Sản phẩm nổi bật\"; \"Custom theo cách của bạn\". Small secondary UI copy may be represented by short neutral lines rather than invented marketing claims.\nConstraints: desktop remains the dominant focal point; mobile stays large enough to understand; product images and product-card media areas are exactly 3:4; use red as an accent, never as a full-screen background; preserve the recognizable Mushroomie logo identity; practical ecommerce hierarchy; no real prices; no vouchers; no promotion claims; no unrelated logos; no watermark; no browser error states; no broken-image symbols; no illegible pseudo-text blocks; no excessive collage; no generic corporate-blue styling.\nOutput intent: one complete, presentation-ready 16:9 responsive showcase board with generous safe margins so it can be normalized to 3840x2160 without cropping important content."
}
```

Expected: one generated image appears with a returned output hint; no CLI/API-key request.

- [ ] **Step 3: Persist the generated raster in the workspace**

Run immediately after generation:

```powershell
New-Item -ItemType Directory -Force -Path 'artifacts' | Out-Null
$generatedFile = Get-ChildItem -LiteralPath 'C:\Users\Admin\.codex\generated_images' -File -Recurse |
  Sort-Object LastWriteTimeUtc -Descending |
  Select-Object -First 1
if (-not $generatedFile) { throw 'No generated image found under C:\Users\Admin\.codex\generated_images' }
node -e "const sharp=require('sharp'); sharp(process.argv[1]).png().toFile(process.argv[2]).then(()=>console.log(process.argv[2]))" "$($generatedFile.FullName)" "artifacts/mushroomie-responsive-showcase-board-source.png"
```

Expected:

```text
artifacts/mushroomie-responsive-showcase-board-source.png
```

- [ ] **Step 4: Verify the source file is readable**

Run:

```powershell
node -e "const sharp=require('sharp'); sharp('artifacts/mushroomie-responsive-showcase-board-source.png').metadata().then(m=>{if(!m.width||!m.height)process.exit(1); console.log(JSON.stringify({width:m.width,height:m.height,format:m.format}))})"
```

Expected: JSON with positive `width`, positive `height`, and `"format":"png"`.

---

### Task 2: Visual QA and Targeted Correction

**Files:**
- Read: `artifacts/mushroomie-responsive-showcase-board-source.png`
- Create: `artifacts/mushroomie-responsive-showcase-board-selected.png`

**Interfaces:**
- Consumes: The source raster from Task 1.
- Produces: A visually accepted raster at `artifacts/mushroomie-responsive-showcase-board-selected.png`.

- [ ] **Step 1: Inspect the source at original detail**

Open `artifacts/mushroomie-responsive-showcase-board-source.png` with `view_image` using `detail: "original"`.

Expected visual checks:

- Desktop and mobile are both immediately identifiable.
- Desktop is the dominant element.
- The board contains recognizable hero, category, product, custom, story/process, review/blog and footer groups.
- Product media areas read as 3:4.
- Palette stays within the six approved brand colors.
- The recognizable Mushroomie pixel mushroom and wordmark are present.
- No unrelated logo, real price, voucher, promotion, watermark, broken-image icon or obvious pseudo-text block is visible.
- The six required phrases are either correct or small enough that no incorrect prominent copy distracts from the design.

- [ ] **Step 2: Select or correct exactly one failing visual group**

If every check passes, run:

```powershell
Copy-Item -LiteralPath 'artifacts\mushroomie-responsive-showcase-board-source.png' -Destination 'artifacts\mushroomie-responsive-showcase-board-selected.png'
```

If a check fails, first load the source with `view_image`, then call `image_gen.imagegen` in edit mode with `referenced_image_paths` containing only:

```json
[
  "C:\\Users\\Admin\\OneDrive\\Tài liệu\\mushroomie\\artifacts\\mushroomie-responsive-showcase-board-source.png"
]
```

Use exactly one matching correction prompt:

- Layout correction:

```text
Change only the presentation hierarchy: make the desktop homepage the dominant focal point at about 70 percent of the board, keep one clear 390px mobile mockup on the right, and keep the design-token samples subordinate. Preserve the Mushroomie palette, logo identity, product imagery, section order, typography style, and all other content. Maintain a 16:9 board with generous safe margins. No watermark or extra text.
```

- Brand correction:

```text
Change only the brand styling: use #e41d1d, #fff7f2, #ffd6d6, #ffe7a3, #b9794b and #2b2b2b; restore the recognizable red Mushroomie pixel-mushroom and wordmark; remove any unrelated logo or corporate-blue styling. Preserve layout, desktop/mobile hierarchy, product imagery, section order, and all other content. No watermark or extra text.
```

- Product-card correction:

```text
Change only the product-card media areas so every product image is visibly 3:4 and shows plausible handmade bracelets, beads, charms or straps inspired by the source. Remove malformed products, broken-image symbols, real prices, vouchers and promotion claims. Preserve layout, brand styling, logo, section order, desktop/mobile hierarchy, and all other content. No watermark or extra text.
```

- Prominent-text correction:

```text
Change only the prominent copy. Render exactly these phrases and no other large headline text: "Mushroomie"; "Từ từng hạt nhỏ, tạo phong cách riêng."; "Khám phá ngay"; "Tự tay chọn hạt, tự do kể câu chuyện của bạn."; "Sản phẩm nổi bật"; "Custom theo cách của bạn". Replace small secondary text with short neutral visual lines if exact Vietnamese is not possible. Preserve layout, brand styling, logo, products, section order, and desktop/mobile hierarchy. No watermark.
```

After the edit returns, convert the newest generated file to the stable selected path:

```powershell
$correctedFile = Get-ChildItem -LiteralPath 'C:\Users\Admin\.codex\generated_images' -File -Recurse |
  Sort-Object LastWriteTimeUtc -Descending |
  Select-Object -First 1
if (-not $correctedFile) { throw 'No corrected image found under C:\Users\Admin\.codex\generated_images' }
node -e "const sharp=require('sharp'); sharp(process.argv[1]).png().toFile(process.argv[2]).then(()=>console.log(process.argv[2]))" "$($correctedFile.FullName)" "artifacts/mushroomie-responsive-showcase-board-selected.png"
```

Expected: exactly one selected file exists. Do not combine multiple unrelated corrections in one edit.

- [ ] **Step 3: Re-inspect the selected raster**

Open `artifacts/mushroomie-responsive-showcase-board-selected.png` with `view_image` using `detail: "original"` and repeat the Step 1 checks.

Expected: all blocking checks pass. If a non-blocking small-text artifact remains, record it in the handoff instead of repeatedly regenerating the whole composition.

---

### Task 3: Normalize and Validate Final Exports

**Files:**
- Read: `artifacts/mushroomie-responsive-showcase-board-selected.png`
- Create: `artifacts/mushroomie-responsive-showcase-board-v1.png`
- Create: `artifacts/mushroomie-responsive-showcase-board-v1.webp`

**Interfaces:**
- Consumes: The accepted selected raster from Task 2.
- Produces: Final PNG and WebP files, each exactly 3840 × 2160.

- [ ] **Step 1: Export exact-size PNG and WebP without cropping**

Run:

```powershell
node -e "const sharp=require('sharp'); const input='artifacts/mushroomie-responsive-showcase-board-selected.png'; const resize={width:3840,height:2160,fit:'contain',background:'#fff7f2',withoutEnlargement:false}; Promise.all([sharp(input).resize(resize).png({compressionLevel:9}).toFile('artifacts/mushroomie-responsive-showcase-board-v1.png'),sharp(input).resize(resize).webp({quality:90,smartSubsample:true}).toFile('artifacts/mushroomie-responsive-showcase-board-v1.webp')]).then(()=>console.log('exports-ready'))"
```

Expected:

```text
exports-ready
```

- [ ] **Step 2: Validate dimensions and formats**

Run:

```powershell
node -e "const sharp=require('sharp'); const files=['artifacts/mushroomie-responsive-showcase-board-v1.png','artifacts/mushroomie-responsive-showcase-board-v1.webp']; Promise.all(files.map(async file=>({file,...await sharp(file).metadata()}))).then(rows=>{for(const r of rows){if(r.width!==3840||r.height!==2160)process.exit(1); if(r.file.endsWith('.png')&&r.format!=='png')process.exit(1); if(r.file.endsWith('.webp')&&r.format!=='webp')process.exit(1)} console.log(JSON.stringify(rows.map(r=>({file:r.file,width:r.width,height:r.height,format:r.format})),null,2))})"
```

Expected:

```json
[
  {
    "file": "artifacts/mushroomie-responsive-showcase-board-v1.png",
    "width": 3840,
    "height": 2160,
    "format": "png"
  },
  {
    "file": "artifacts/mushroomie-responsive-showcase-board-v1.webp",
    "width": 3840,
    "height": 2160,
    "format": "webp"
  }
]
```

- [ ] **Step 3: Inspect the final PNG**

Open `artifacts/mushroomie-responsive-showcase-board-v1.png` with `view_image` using `detail: "original"`.

Expected:

- No important content is cropped.
- Any added cream padding is balanced.
- Desktop/mobile hierarchy, 3:4 product cards and brand palette remain intact.
- No severe interpolation blur or stretched geometry appears.

---

### Task 4: Workspace Audit and Handoff

**Files:**
- Read: `artifacts/mushroomie-responsive-showcase-board-v1.png`
- Read: `artifacts/mushroomie-responsive-showcase-board-v1.webp`

**Interfaces:**
- Consumes: Both validated exports from Task 3.
- Produces: A user-facing handoff with preview, absolute paths, generation mode, prompt summary and known limitations.

- [ ] **Step 1: Confirm the requested files without staging unrelated work**

Run:

```powershell
Get-Item -LiteralPath `
  'artifacts\mushroomie-responsive-showcase-board-v1.png', `
  'artifacts\mushroomie-responsive-showcase-board-v1.webp' |
  Select-Object FullName,Length,LastWriteTime
git status --short
```

Expected: both files exist; pre-existing unrelated untracked files remain untouched; no production upload, database, environment or build file is staged.

- [ ] **Step 2: Deliver the preview and report**

The final response must:

- Render the PNG inline with its absolute path.
- Link both the PNG and WebP with absolute local paths.
- State that built-in `image_gen` was used.
- Summarize the final prompt direction: responsive ecommerce showcase board, real Mushroomie references, six-color palette, desktop-first with 390px mobile.
- Report the 3840 × 2160 metadata validation result.
- State whether a targeted correction was required.
- State that production code, database, uploads and deployment were not changed.
- Mention any remaining small-text limitation without claiming pixel-perfect production fidelity.

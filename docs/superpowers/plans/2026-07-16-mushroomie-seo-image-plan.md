# Kế hoạch cho Codex — Mushroomie: sửa bố cục ảnh + SEO on-page + Local/Maps + Backlink

**Ngày:** 2026-07-16
**Repo:** `/var/www/mushroomie` (prod) — `github.com/tongminhquan/mushroomie-23`, branch `main`
**Site:** https://mushroomie.io.vn
**Đối tượng thực thi:** Codex (AI coding agent)

> **Đọc `CLAUDE.md` + `AGENTS.md` trước khi sửa bất cứ thứ gì.** Next.js 16 App Router, Tailwind v4, Prisma+MySQL, PM2 standalone. Không dùng `ignoreBuildErrors`. Không đụng logic payment/checkout.

---

## 0. Bối cảnh đã được xác minh (không phải phỏng đoán)

Toàn bộ số liệu dưới đây đo trực tiếp trên production ngày 2026-07-16:

| Hạng mục | Thực tế đo được |
|---|---|
| Bài viết | 64 bài trong sitemap (`/tin-tuc/*`) |
| Sản phẩm | 21 trang (`/san-pham/*`) |
| Tổng URL sitemap | 123 |
| Health | `/` trả 200 trong 0.47s |
| Từ khóa mục tiêu | 30 dòng trong `mushroomie_30_tu_khoa_seo.csv` |

**Toạ độ Google Maps trong yêu cầu (10°59'46.8"N 106°52'56.3"E = `10.9963333, 106.8823056`) ĐÃ có sẵn trong code** tại `src/lib/local-seo.ts`:

```ts
geo: { latitude: 10.996333, longitude: 106.882306 },
mapUrl: 'https://www.google.com/maps?q=10.996333,106.882306',
```

→ Không cần "làm website về vị trí này" từ đầu. Vị trí đã được tích hợp. Việc cần làm là **sửa dữ liệu địa danh bị sai** (mục 2) và **khai thác nó đúng cách**.

---

## 1. PHASE 1 — Sửa bố cục ảnh trong bài viết (ưu tiên cao nhất)

### 1.1 Chẩn đoán gốc rễ — đã đo bằng Playwright

Đo trên `https://mushroomie.io.vn/tin-tuc/qua-tang-handmade`:

| Chỉ số | Mobile (390px) | Desktop (1440px) |
|---|---|---|
| Chiều rộng cột `.prose` | 316px | 638px |
| Kích thước ảnh render | **316 × 316** | **638 × 638** |
| `srcset` | **NONE** | **NONE** |
| Ảnh gốc (natural) | **1024 × 1024** | 1024 × 1024 |
| Thuộc tính khai báo | **960 × 960** | 960 × 960 |

### 1.2 Bốn lỗi cụ thể

**Lỗi A — Hardcode sai kích thước (nghiêm trọng nhất).**
`src/lib/post-media.ts:33` gắn cứng `width="960" height="960"` cho **mọi** ảnh, bất kể kích thước thật:

```ts
'<img src="' + escapeHtml(figure.src) + '" alt="' + escapeHtml(figure.alt) + '" width="960" height="960" loading="lazy" decoding="async">',
```

Bằng chứng: ảnh `seo-article-qua-tang-handmade.webp` thật là **1024×1024** nhưng khai **960×960**. Hiện tại cả hai đều tỉ lệ 1:1 nên *tình cờ* chưa vỡ. **Đây là mìn hẹn giờ**: ngày nào có ảnh không vuông (16:9, 4:3, ảnh dọc), trình duyệt sẽ đặt chỗ theo tỉ lệ vuông → **CLS thật + ảnh méo**. Đây chính là nguồn gốc "bố cục lỗi".

**Lỗi B — Ảnh thô bỏ qua `next/image` hoàn toàn.**
`srcset: NONE`. Ảnh trong bài là `<img>` thô bơm qua `dangerouslySetInnerHTML` (`src/app/(user)/tin-tuc/[slug]/page.tsx:321`), nên không qua `/_next/image`. Mobile tải ảnh **1024px (180KB)** để hiển thị ở khung **316px** → thừa **3.2× chiều rộng ≈ 10.5× số pixel**. Ảnh bìa thì có `srcset` đầy đủ vì dùng `SafeImage` — trong bài thì không. Đây là gánh nặng LCP/băng thông trên mobile.

**Lỗi C — Class CSS chết.**
`mushroomie-article-media` được sinh ra ở `post-media.ts:33` nhưng **không có một dòng CSS nào** style nó (đã grep toàn bộ `src/`, chỉ khớp đúng 1 chỗ là nơi sinh ra). Margin `32px 0px` hiện tại đến từ default của Tailwind Typography, không phải từ class này.

**Lỗi D — Ảnh vuông chiếm trọn cột đọc.**
Ảnh 1:1 trải hết chiều rộng cột → khối vuông **638×638** trên desktop nằm giữa bài. Người đọc phải cuộn qua nguyên một màn hình ảnh giữa hai đoạn văn. Đây là lý do "user không đọc được".

### 1.3 Việc Codex phải làm

**Task 1.1 — Lấy kích thước ảnh thật thay vì hardcode.**
- Sửa `buildArticleFigureHtml()` trong `src/lib/post-media.ts` nhận `width`/`height` thật thay vì hằng số 960.
- Nguồn kích thước: dùng `sharp` (đã có trong stack) đọc metadata tại thời điểm build/publish, hoặc thêm cột `width`/`height` vào bảng media. Ưu tiên đọc bằng `sharp` trong `src/lib/server-image.ts` (đã có sẵn `inspectImageForRender`).
- **Không được** giữ giá trị mặc định 960×960 khi không đọc được — thay vào đó bỏ hẳn `width`/`height` và dùng `aspect-ratio` CSS, vì khai sai còn tệ hơn không khai.

**Task 1.2 — Cho ảnh trong bài đi qua `next/image`.**
Chọn **một** trong hai, ưu tiên (a):

- **(a) Thay `dangerouslySetInnerHTML` bằng parse → React.** Dùng `html-react-parser` (hoặc rehype) ở `src/app/(user)/tin-tuc/[slug]/page.tsx:321`, map `<img>` → `<Image>` của `next/image`. Được srcset + lazy + WebP tự động, đúng chuẩn Next 16. Vẫn giữ `sanitizeHtml()` trước khi parse.
- **(b) Nếu (a) rủi ro cao:** giữ HTML thô nhưng inject sẵn `srcset` + `sizes` trỏ `/_next/image?url=...&w=...&q=75` trong `post-media.ts`. Rẻ hơn nhưng phải tự bảo trì danh sách width.

`sizes` đúng cho cột hiện tại: `(min-width: 768px) 638px, 100vw`.

**Task 1.3 — Style class `mushroomie-article-media` trong `src/app/globals.css`.**
Mục tiêu: ảnh vuông **không** được chiếm trọn cột.

```css
.mushroomie-article-media {
  margin: 2rem auto;
  max-width: 480px;      /* ảnh 1:1 không còn là khối 638px */
  text-align: center;
}
.mushroomie-article-media img {
  width: 100%;
  height: auto;          /* bắt buộc: giữ tỉ lệ thật, chống méo */
  border-radius: 22px;
}
.mushroomie-article-media figcaption {
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-neutral-500);
  text-align: center;
}
```
Con số 480px là điểm khởi đầu — Codex phải tự kiểm tra bằng mắt trên 390px/768px/1440px rồi tinh chỉnh.

**Task 1.4 — Sửa bài lệch chuẩn.**
Quét thấy `tin-tuc/vong-tay-handmade` có **1 ảnh thiếu hẳn `width`/`height`** (các bài khác có đủ) và có **3 figure** thay vì 2. Chuẩn hóa lại bài này.

### 1.5 Nghiệm thu Phase 1
- [ ] `npm run typecheck` sạch
- [ ] `npm run build` (`--webpack`) sạch
- [ ] Đo lại bằng Playwright: `srcset` **khác** NONE; `declared` **khớp** `natural`
- [ ] CLS = 0 trên `/tin-tuc/[slug]` (Lighthouse mobile)
- [ ] Chụp màn hình 390px + 1440px, so sánh trước/sau
- [ ] Ảnh mobile tải về ≤ 640px thay vì 1024px

---

## 2. PHASE 2 — Sửa NAP sai + On-page SEO

### 2.1 `addressLocality` đang SAI — phải sửa

`src/lib/local-seo.ts` khai:
```ts
addressLocality: 'Thành phố Đồng Nai',   // ❌ đơn vị hành chính này KHÔNG tồn tại
addressRegion: 'Đồng Nai',
```

**Đồng Nai là _tỉnh_, không phải thành phố.** Từ 01/07/2025, phường Trảng Dài (sáp nhập với xã Thiện Tân) trực thuộc thẳng **tỉnh Đồng Nai**. Địa chỉ hành chính chuẩn hiện nay có dạng `..., phường Trảng Dài, tỉnh Đồng Nai` (đối chiếu trụ sở UBND: *462 Bùi Trọng Nghĩa, khu phố 3A, phường Trảng Dài, tỉnh Đồng Nai*).

Đây là lỗi **NAP inconsistency** — Google đối chiếu NAP giữa schema / GBP / citation. Sai địa danh làm loãng tín hiệu local, ảnh hưởng trực tiếp mục tiêu top 10 local.

**Task 2.1** — Sửa thành:
```ts
streetAddress: 'Hẻm 2, tổ 11, phường Trảng Dài',
addressLocality: 'Trảng Dài',
addressRegion: 'Đồng Nai',
```
Rồi rà **toàn bộ** nơi hiển thị NAP (footer, `/lien-he`, schema, 12 landing local) cho khớp tuyệt đối từng ký tự. Lưu ý `LocalArea` type đang có `'Biên Hòa'` — giữ được vì vẫn là địa danh người dùng tìm kiếm, nhưng **không** dùng nó trong `postalAddress` của schema.

### 2.2 Slug sản phẩm có dấu + chữ hoa

Sitemap đang chứa:
```
/san-pham/Vòng-tay-quả-táo     ← chữ hoa + dấu
/san-pham/vòng-vỏ-sò           ← dấu
/san-pham/vong-xanh            ← ok
```

URL có dấu bị percent-encode thành `V%C3%B2ng-tay-qu%E1%BA%A3-t%C3%A1o` — xấu khi chia sẻ, khó backlink, và chữ hoa tạo rủi ro trùng lặp URL (case-sensitive). Đây là lỗi on-page trên chính nhóm trang user muốn đẩy top 10.

**Task 2.2:**
- Viết hàm slugify chuẩn (bỏ dấu, lowercase, gạch nối) trong `src/lib/url.ts`.
- Áp dụng khi tạo/sửa sản phẩm ở `/admin/san-pham`.
- Migrate 21 slug hiện có → slug sạch.
- **Bắt buộc: 301 redirect** slug cũ → slug mới trong `next.config.ts`. Không được đổi slug mà không redirect — sẽ mất index.
- Cân nhắc thêm cột `old_slug` để giữ redirect lâu dài.

### 2.3 Rà on-page toàn site

**Task 2.3** — Với 64 bài + 21 sản phẩm, kiểm tra và fix:
- `title` 50–60 ký tự, `meta_description` 140–160, không trùng lặp
- Đúng **một** `<h1>`/trang; heading không nhảy cấp
- `canonical_url` đúng, tự trỏ chính nó
- Alt ảnh mô tả thật (hiện đang có pattern nhồi từ khóa kiểu `"vòng tay handmade - phụ kiện handmade cá nhân hóa Mushroomie"` — **viết lại tự nhiên hơn**, mô tả đúng ảnh)
- Internal link: mỗi bài trỏ ≥2 sản phẩm/danh mục liên quan; landing local liên kết chéo
- Schema: đã có `Product`, `LocalBusiness`, `FAQPage`, `BreadcrumbList` — validate bằng Rich Results Test, đảm bảo `Product` có `offers.price`, `availability`, `aggregateRating` (chỉ khi có review thật)

> Có sẵn `src/lib/post-seo-score.ts` — cân nhắc mở rộng thành gate CI thay vì kiểm thủ công 85 trang.

---

## 3. PHASE 3 — Local SEO / Google Maps

**Phần lớn phase này Codex KHÔNG làm được** — cần con người thao tác.

**Codex làm:**
- Task 3.1 — Nhúng bản đồ tại `/lien-he` bằng `<iframe>` lazy-load (chú ý: `sanitize.ts` đang `FORBID_TAGS: ['iframe']` — chỉ nhúng ở component React, **không** qua đường content).
- Task 3.2 — Bổ sung `hasMap`, `geo`, `openingHoursSpecification`, `areaServed` vào `LocalBusiness` schema.
- Task 3.3 — Thêm chỉ đường bằng chữ ("cách X 5 phút…") vào landing local — đây là nội dung Google dùng để xác thực vị trí.

**Người làm (Codex không thể):**
- Tạo/claim **Google Business Profile** tại đúng toạ độ `10.996333, 106.882306`, xác minh bằng bưu thiếp/video. **Không có GBP thì không bao giờ vào map pack** — đây là điều kiện tiên quyết, không phải tùy chọn.
- Đăng ảnh thật cửa hàng/sản phẩm lên GBP, cập nhật giờ mở cửa
- Thu thập review thật từ khách (không mua review)

---

## 4. PHASE 4 — Nội dung & từ khóa

`mushroomie_30_tu_khoa_seo.csv` đã map sẵn 30 từ khóa → trang đích → slug. Dùng nguyên, không làm lại.

**Task 4.1** — Đối soát 30 từ khóa với 123 URL hiện có, xuất bảng: từ khóa → URL đang nhắm → còn thiếu/trùng.
**Task 4.2** — Diệt keyword cannibalization: `vong-tay-handmade` (bài) vs `vong-tay-handmade-dong-nai` (landing) vs danh mục sản phẩm đang cạnh tranh lẫn nhau. Mỗi từ khóa **đúng một** trang đích; phần còn lại internal link trỏ về.
**Task 4.3** — Bài mỏng: 62/64 bài có đúng 2 ảnh + cấu trúc y hệt nhau → dấu hiệu sinh hàng loạt theo template. Google đánh giá thấp nội dung mỏng/lặp khuôn. Ưu tiên **làm dày 10 bài trọng tâm** (kinh nghiệm thật, ảnh thật, chi tiết sản phẩm thật) hơn là viết thêm bài mới.

---

## 5. PHASE 5 — Backlink: đọc kỹ trước khi làm

### 5.1 Nói thẳng về rủi ro

Yêu cầu "đi 200 backlink do-follow" — tôi cần thẳng thắn: **đây là mô tả gần đúng của link spam theo chính sách Google.** Google Link Spam Policy coi *bất kỳ* link nào được tạo chủ yếu để thao túng thứ hạng là spam — bao gồm mua link, PBN, và blog comment/forum profile hàng loạt. Hậu quả: mất thứ hạng, nặng thì deindex.

Đọc kỹ điều này: **Mushroomie là site nhỏ, domain mới, 123 URL.** Một profile backlink nhảy từ ~0 lên 200 dofollow trong thời gian ngắn là **mẫu bất thường kinh điển** mà hệ thống chống spam của Google được huấn luyện để bắt. Rủi ro ở đây không phải "không hiệu quả" — mà là **phá hỏng chính mục tiêu top 10** mà bạn đang trả tiền để đạt được.

Thêm một điểm dễ hiểu nhầm: **backlink chất lượng thật thường là nofollow** — và điều đó hoàn toàn bình thường. Báo chí, Wikipedia, hầu hết mạng xã hội đều nofollow. Lọc theo tiêu chí "chỉ lấy dofollow" sẽ tự động đẩy bạn về phía các nguồn chất lượng thấp sẵn sàng bán dofollow. **Chính bộ lọc "dofollow" là thứ dẫn đến vùng nguy hiểm.**

### 5.2 Cách làm thay thế — đề xuất

Đặt mục tiêu theo **nguồn hợp lệ**, không theo con số dofollow:

**Nền tảng (làm ngay, ~20–30 link, hợp lệ 100%):**
- Google Business Profile, Bing Places, Apple Business Connect
- Shopee (đã có: `shopee.vn/shop/475544379`), TikTok Shop, Lazada
- Facebook / Instagram / TikTok (đã có trong `BRAND.sameAs`)
- Danh bạ VN uy tín: Yellow Pages VN, Foody, diadiem.vn, trang thương hiệu VNExpress/Kenh14 nếu có

**Tự nhiên (dài hạn, giá trị cao nhất):**
- Nội dung được chia sẻ thật: hướng dẫn làm vòng tay, ảnh sản phẩm đẹp
- Micro-influencer Gen Z, review thật
- PR địa phương Đồng Nai/Biên Hòa
- Cộng đồng handmade — tham gia thật, không spam link

**Thực tế:** 40–80 link chất lượng, xây trong 6–12 tháng, **hiệu quả hơn nhiều** so với 200 link mua. Nếu bạn vẫn muốn đủ 200, hãy nói rõ — nhưng tôi khuyên chốt theo chất lượng.

**Task 5.1 (Codex làm được):** tạo `docs/backlink-tracker.md` — bảng theo dõi: nguồn | URL | loại | ngày | trạng thái | dofollow?
**Task 5.2 (Codex KHÔNG làm được):** Codex là coding agent — **không thể** đi outreach, đăng ký directory, hay tạo backlink. Đây là việc của người/agency marketing.

---

## 6. PHASE 6 — Đo lường

**Task 6.1** — Xác nhận Google Search Console + GA4 đã gắn (có sẵn `src/lib/google-tags.ts`, `src/lib/analytics.ts`), submit sitemap.
**Task 6.2** — Chốt baseline thứ hạng 30 từ khóa **trước** khi sửa, để đo được tác động.
**Task 6.3** — Theo dõi: impression/click theo từ khóa, CWV (LCP/INP/CLS), trang được index, Local Pack.

---

## 7. Về mục tiêu "top 10 tất cả từ khóa"

Thẳng thắn: **không ai — kể cả Codex — có thể bảo đảm top 10.** Thứ hạng do thuật toán Google quyết định dựa trên cạnh tranh, độ tuổi domain, authority, hành vi người dùng. Bất kỳ ai cam kết chắc chắn top 10 đều đang bán ảo tưởng.

Kỳ vọng thực tế:
- Từ khóa **local dài** (`vòng tay handmade Trảng Dài`, `móc khóa handmade Biên Hòa`) — cạnh tranh thấp, **khả năng cao** vào top 10 trong 3–6 tháng nếu GBP + on-page chuẩn.
- Từ khóa **rộng** (`vòng tay`, `phụ kiện nữ`, `phụ kiện thời trang`) — cạnh tranh với Shopee/Lazada/Tiki. Top 10 trong 12 tháng là **rất khó** với domain này. CSV cũng đã tự ghi chú "từ khóa rộng".

Kế hoạch này tối đa hóa **xác suất**, không bán **lời hứa**.

---

## 8. Thứ tự thực thi đề xuất

1. **Phase 1** (ảnh) — lỗi cụ thể, đo được, sửa được ngay ✅
2. **Phase 2.1** (NAP sai) — sửa nhanh, chặn tác hại local đang diễn ra ✅
3. **Phase 2.2** (slug) — cần cẩn thận vì có redirect ⚠️
4. **Phase 3** (GBP) — chặn toàn bộ tham vọng local, cần người 🚧
5. **Phase 2.3 / 4** — dọn on-page + nội dung
6. **Phase 5** — backlink, sau khi thống nhất hướng
7. **Phase 6** — đo liên tục

## 9. Quy tắc bắt buộc cho Codex

- Sau **mỗi** phase: `npm run typecheck` && `npm run build` phải sạch
- **Không** báo hoàn tất nếu build fail / route 500 / ảnh vỡ (theo `CLAUDE.md`)
- **Không** đổi slug mà thiếu 301
- **Không** thêm `aggregateRating` schema nếu chưa có review thật — đó là structured data giả mạo, Google phạt
- Repo có hook **auto-commit + auto-push mọi thay đổi**. Cân nhắc làm trên branch riêng cho Phase 2.2.
- Deploy theo đúng quy trình PM2 standalone trong `CLAUDE.md` (nhớ `cp -r .next/static .next/standalone/.next/static`)

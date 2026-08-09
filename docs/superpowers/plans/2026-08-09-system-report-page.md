# Mushroomie System Report Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xuất bản trang `/bao-cao-he-thong` và README tiếng Việt đầy đủ để trình bày kiến trúc cùng toàn bộ phân hệ Mushroomie trước hội đồng chấm thi.

**Architecture:** Route mới nằm trong `src/app/(user)` để dùng public layout hiện có, được render hoàn toàn bằng Server Component và dữ liệu tĩnh đã kiểm chứng từ source. Nội dung và cấu trúc semantic nằm trong `page.tsx`; phần trình bày responsive/print nằm trong CSS module riêng để không làm phình global stylesheet.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, Tailwind CSS 4, CSS Modules, Vitest/Node test runner, PM2, Nginx.

## Global Constraints

- Không thêm dependency mới.
- Không truy vấn database trong trang báo cáo.
- Không thay đổi schema, auth, payment, upload hoặc admin permissions.
- Không công khai secret, mật khẩu, token, tài khoản ngân hàng hoặc database URL thật.
- Chỉ stage các file được liệt kê trong kế hoạch; giữ nguyên toàn bộ file untracked của người dùng.
- Trang phải tương thích light/dark theme, responsive và in A4.
- Production dùng VPS `103.77.242.153`, PM2 process `mushroomie_pm2`, app port `3001` và Nginx.

---

### Task 1: Khóa hợp đồng nội dung bằng test

**Files:**
- Create: `tests/system-report-page.test.ts`

**Interfaces:**
- Consumes: source files `src/app/(user)/bao-cao-he-thong/page.tsx`, `report.module.css` và `README.md`.
- Produces: source-contract test bảo đảm route, metadata, section, print CSS và liên kết tài liệu không bị xóa nhầm.

- [ ] **Step 1: Viết test thất bại**

Tạo test Node đọc source bằng `readFileSync`, sau đó xác nhận:

```ts
assert.match(page, /Báo cáo hệ thống Mushroomie/)
assert.match(page, /77 route nghiệp vụ/)
assert.match(page, /78 page route/)
assert.match(page, /VietQR \+ Casso/)
assert.match(page, /id="kien-truc"/)
assert.match(styles, /@media print/)
assert.match(readme, /\/bao-cao-he-thong/)
```

- [ ] **Step 2: Chạy RED**

Run:

```bash
node --test --import tsx tests/system-report-page.test.ts
```

Expected: FAIL vì route và CSS module chưa tồn tại.

- [ ] **Step 3: Giữ test ở trạng thái RED để chuyển sang Task 2**

Không sửa assertion cho tới khi lỗi chứng minh đúng feature còn thiếu.

---

### Task 2: Xây dựng route báo cáo dạng Server Component

**Files:**
- Create: `src/app/(user)/bao-cao-he-thong/page.tsx`
- Create: `src/app/(user)/bao-cao-he-thong/report.module.css`
- Test: `tests/system-report-page.test.ts`

**Interfaces:**
- Consumes: public layout, theme token trong `globals.css`, `next/link`, `Metadata` và icon hiện có từ `lucide-react`.
- Produces: route tĩnh `/bao-cao-he-thong` với metadata, anchor section và print stylesheet.

- [ ] **Step 1: Tạo dữ liệu tĩnh có kiểu**

Khai báo các mảng `stats`, `stackGroups`, `systemModules`, `databaseGroups`, `securityControls`, `presentationOutline` bằng object `as const`, đặt ngoài component để không tái tạo trong mỗi lần render.

- [ ] **Step 2: Tạo metadata tĩnh**

```ts
export const metadata: Metadata = {
  title: 'Báo cáo kiến trúc và hệ thống website',
  description: 'Báo cáo tổng quan kiến trúc, công nghệ và các phân hệ của website thương mại điện tử Mushroomie.',
  alternates: { canonical: 'https://mushroomie.io.vn/bao-cao-he-thong' },
  robots: { index: false, follow: false },
}
```

- [ ] **Step 3: Tạo cấu trúc semantic**

Component mặc định render một `article` có đúng một `h1`, mục lục `<nav aria-label="Mục lục báo cáo">`, các `<section id="...">`, bảng có caption và các ordered list cho luồng nghiệp vụ.

- [ ] **Step 4: Tạo sơ đồ kiến trúc không dùng JavaScript**

Sử dụng grid/flex và các node có nhãn: Người dùng → Cloudflare → Nginx → Next.js/PM2 → Prisma → MySQL; các tích hợp payment/email/analytics nằm ở nhánh dịch vụ ngoài.

- [ ] **Step 5: Viết CSS responsive và print**

CSS module dùng token `var(--surface-*)`, `var(--text-*)`, `var(--primary-*)`; bảng có `overflow-x: auto`; section có `scroll-margin-top`; `@media print` ẩn `[data-report-chrome]`, bỏ shadow/background, đặt `@page { size: A4; margin: 14mm; }` và tránh `break-inside` cho card.

- [ ] **Step 6: Chạy GREEN**

```bash
node --test --import tsx tests/system-report-page.test.ts
```

Expected: PASS, không có test failure.

---

### Task 3: Viết lại README thành tài liệu kỹ thuật chính

**Files:**
- Modify: `README.md`
- Test: `tests/system-report-page.test.ts`

**Interfaces:**
- Consumes: nội dung đã kiểm chứng trong design spec và route báo cáo.
- Produces: README UTF-8 có đường dẫn production và trang báo cáo.

- [ ] **Step 1: Cập nhật phần mở đầu và liên kết báo cáo**

Thêm CTA:

```markdown
[Xem báo cáo kiến trúc và toàn bộ phân hệ](https://mushroomie.io.vn/bao-cao-he-thong)
```

- [ ] **Step 2: Bổ sung kiến trúc, phân hệ và database**

Mô tả modular monolith, luồng Cloudflare/Nginx/PM2/Next.js/Prisma/MySQL, payment provider abstraction, auth, media, CMS, game/voucher, SEO và analytics.

- [ ] **Step 3: Giữ hướng dẫn vận hành an toàn**

Không thêm tài khoản mặc định; ví dụ `.env` chỉ dùng placeholder; deploy mô tả PM2/Nginx, không khuyến nghị Vercel hoặc Docker cho production hiện tại.

- [ ] **Step 4: Chạy test tài liệu**

```bash
node --test --import tsx tests/system-report-page.test.ts
```

Expected: PASS.

---

### Task 4: Quality gates và kiểm tra trình duyệt

**Files:**
- Verify: toàn bộ file thay đổi của Tasks 1–3.

**Interfaces:**
- Consumes: route hoàn chỉnh và test contract.
- Produces: bằng chứng type, lint, test, build, responsive, accessibility và network.

- [ ] **Step 1: Chạy static checks**

```bash
npx prisma generate
npm run typecheck
npm run lint --if-present
```

Expected: exit code 0; nếu lint có lỗi cũ ngoài phạm vi, ghi rõ file và không che lỗi.

- [ ] **Step 2: Chạy test**

```bash
npm test
```

Expected: 0 failures.

- [ ] **Step 3: Chạy production build**

```bash
npm run build
```

Expected: exit code 0 và route `/bao-cao-he-thong` xuất hiện trong output hoặc truy cập được từ build.

- [ ] **Step 4: Kiểm tra browser**

Khởi động app local và kiểm tra 1440×900, 390×844, 360×800 bằng Chrome DevTools MCP; xác nhận không horizontal overflow, không broken image, không console error nghiêm trọng và mục lục anchor hoạt động.

- [ ] **Step 5: Kiểm tra bản in**

Emulate print hoặc tạo print preview, xác nhận navigation/footer bị ẩn, section không bị cắt bất hợp lý và chữ còn đọc được trên nền trắng.

---

### Task 5: Commit, push và deploy production

**Files:**
- Stage only: `README.md`
- Stage only: `src/app/(user)/bao-cao-he-thong/page.tsx`
- Stage only: `src/app/(user)/bao-cao-he-thong/report.module.css`
- Stage only: `tests/system-report-page.test.ts`
- Stage only: design spec và implementation plan.

**Interfaces:**
- Consumes: commit đã qua quality gates.
- Produces: `origin/main` và production cùng chạy phiên bản báo cáo mới.

- [ ] **Step 1: Kiểm tra scope và commit**

```bash
git diff --check
git status --short
git add -- README.md 'src/app/(user)/bao-cao-he-thong/page.tsx' 'src/app/(user)/bao-cao-he-thong/report.module.css' tests/system-report-page.test.ts docs/superpowers/plans/2026-08-09-system-report-page.md
git diff --cached
git commit -m "feat: publish Mushroomie system report"
```

- [ ] **Step 2: Đồng bộ và push main**

```bash
git fetch origin
git rebase origin/main
git push origin main
```

Không dùng `--force`; dừng nếu có xung đột hoặc remote đã thay đổi không thể rebase an toàn.

- [ ] **Step 3: Deploy standalone có rollback**

Trên VPS `103.77.242.153`, giữ `.env`, `public/uploads`, backup và release trước; pull commit mới, `npm ci`, `prisma generate`, build standalone, copy static đúng `distDir`, restart `mushroomie_pm2` rồi `pm2 save`. Không chạy migration vì task không thay đổi schema.

- [ ] **Step 4: Xác minh production**

```bash
curl -I https://mushroomie.io.vn/bao-cao-he-thong
curl -I https://mushroomie.io.vn/
curl -s https://mushroomie.io.vn/api/health
```

Lấy ít nhất một CSS và một JS chunk từ HTML; xác nhận HTTP 200 và MIME `text/css`, `application/javascript` hoặc `text/javascript`. Kiểm tra PM2 logs không có runtime error và kiểm tra trang mới bằng browser desktop/mobile.

# Kế hoạch sửa lỗi cho Codex — Mushroomie (rà soát toàn codebase)

**Ngày:** 2026-07-18
**Người rà:** Claude (đã kiểm chứng từng lỗi trên code + DB + site thật, không liệt kê lý thuyết)
**Phạm vi:** 306 file `.ts/.tsx`, 38k dòng, 66 API route, 76 page

> **Đọc trước:** `CLAUDE.md` + `AGENTS.md`. Next.js 16 App Router, Tailwind v4, Prisma+MySQL, PM2 standalone. Không dùng `ignoreBuildErrors`. Không đụng logic payment/checkout đã đúng.

---

## 0. Kết luận tổng quan — codebase VỮNG, ít lỗi thật

Đây không phải một codebase đầy lỗi. Đợt rà này xác nhận phần lớn các vùng rủi ro cao **đã được làm đúng**. Danh sách dưới đây là **đã kiểm chứng an toàn — KHÔNG cần đụng**, để Codex khỏi mất công audit lại và khỏi "sửa" thứ không hỏng:

| Vùng | Trạng thái | Bằng chứng |
|---|---|---|
| Giá đơn hàng | ✅ An toàn | `orders/route.ts` tính lại giá từ DB, **không tin giá client** |
| Trừ kho (race) | ✅ An toàn | `updateMany` với `stock: { gte }` + check `count !== 1` trong `$transaction` |
| Voucher double-spend | ✅ An toàn | `$transaction` + đếm `usageLimit`/`perUserLimit` |
| Webhook thanh toán | ✅ An toàn | Verify chữ ký, trả 401 nếu sai; `JSON.parse` trong try/catch |
| XSS | ✅ An toàn | Mọi `dangerouslySetInnerHTML` đều qua `sanitizeHtml`/`safeJsonLd` |
| SSRF | ✅ An toàn | `/api/qr` chỉ cho `https://img.vietqr.io` (allowlist protocol + host) |
| Reset password | ✅ An toàn | Token có hạn (`gt: new Date()`) + xoá sau khi dùng |
| Leo thang quyền | ✅ An toàn | Đổi role chỉ super_admin, chặn tự hạ quyền, bảo vệ super admin gốc |
| Auth API | ✅ An toàn | `requireAdmin` ép `role ∈ {super_admin, admin}` |
| Security headers | ✅ An toàn | CSP, HSTS, X-Frame DENY, nosniff, Permissions-Policy |
| Cron | ✅ An toàn | Check `CRON_SECRET` Bearer, thiếu secret → luôn 401 |
| Tồn kho 0 | ✅ An toàn | `AddToCartButton` chặn `stock <= 0`, hiện "Tạm hết hàng" |

Chỉ 2 `@ts-ignore`, **0 TODO/FIXME** trong toàn bộ `src/`. Đây là dấu hiệu code được viết kỷ luật.

---

## 1. 🔴 LỖI HỆ THỐNG — Logic hiển thị giá trùng lặp 4 nơi, 2 quy tắc mâu thuẫn

**Đây là lỗi quan trọng nhất, và là gốc rễ của sự cố "bán 5.000đ" đã xảy ra thật.**

`sale_price` được diễn giải khác nhau ở 4 chỗ:

| File:line | Quy tắc | Đúng/Sai |
|---|---|---|
| `src/components/product/ProductCard.tsx:49` | `sale_price && sale_price < price` | ✅ ĐÚNG |
| `src/lib/order-pricing.ts:53` (checkout) | `salePrice > 0 && salePrice < regularPrice` | ✅ ĐÚNG |
| `src/app/(user)/san-pham/[slug]/page.tsx:173` | `salePrice \|\| price` | ❌ SAI |
| `src/components/product/AddToCartButton.tsx:39` | `sale_price \|\| price` | ❌ SAI |

### Kịch bản lỗi cụ thể (đã tái hiện với dữ liệu thật)
Sản phẩm giá `40.000`, `sale_price = 66.000` (dữ liệu lỗi — sale cao hơn giá gốc, đúng ca id 64 đã gặp):
- **Trang chi tiết** (`salePrice || price`): hiện **66.000** (không gạch ngang, vì `isOnSale` = false ở dòng 174 nhưng `displayPrice` không dùng nó)
- **Nút thêm giỏ**: hiện **66.000**
- **Checkout** (đúng): tính **40.000**
- → Khách thấy 66.000 nhưng bị/được tính 40.000. **Giá hiển thị ≠ giá bán.**

Với ca `sale_price = 5.000` trên sản phẩm `45.000`: cả hai chỗ sai đều hiện 5.000 và checkout cũng tính 5.000 → **bán dưới giá vốn**. Đây chính là sự cố đã xảy ra.

### Cách sửa (1 helper dùng chung)
**Task 1.1** — Tạo `src/lib/product-price.ts`:
```ts
/** Quy tắc DUY NHẤT cho giá hiển thị/tính tiền. Khớp với order-pricing.ts (checkout). */
export function resolveDisplayPrice(price: number, salePrice: number | null | undefined) {
  const regular = Number(price)
  const sale = salePrice == null ? null : Number(salePrice)
  const onSale = sale !== null && sale > 0 && sale < regular
  return {
    price: onSale ? sale : regular,
    originalPrice: onSale ? regular : null,
    isOnSale: onSale,
  }
}
```
**Task 1.2** — Thay 2 chỗ SAI dùng helper này:
- `san-pham/[slug]/page.tsx:172-174` → `const { price: displayPrice, isOnSale } = resolveDisplayPrice(Number(product.price), product.sale_price)`
- `AddToCartButton.tsx:39` → tương tự

**Task 1.3** — Refactor 2 chỗ ĐÚNG (`ProductCard`, `order-pricing`) sang cùng helper để về sau chỉ còn **một nguồn chân lý**. (Giữ nguyên hành vi — chỉ gom logic.)

**Nghiệm thu:** với 1 SP đặt `sale_price` = giá gốc + 10.000 (nghịch lý), cả 4 nơi (card, chi tiết, nút, checkout) phải hiện **giá gốc**, không nơi nào hiện sale cao hơn.

---

## 2. 🔴 Lỗ hổng validation `sale_price` (gốc rễ cho phép dữ liệu lỗi tồn tại)

`src/app/api/products/route.ts:16` và `products/[id]/route.ts:16`:
```ts
sale_price: z.number().positive().optional().nullable(),
```
Chỉ chặn `> 0`. **KHÔNG chặn** `sale_price >= price` (sale nghịch lý) hay `sale_price` thấp bất thường (5.000 trên SP 45.000). Chính vì vậy dữ liệu lỗi đã lọt vào DB và bán ra thật.

**Task 2.1** — Thêm cross-field validation ở cả 2 route (dùng `.superRefine` vì `price` và `sale_price` là 2 field):
```ts
.superRefine((data, ctx) => {
  if (data.sale_price != null && data.price != null && data.sale_price >= data.price) {
    ctx.addIssue({ code: 'custom', path: ['sale_price'],
      message: 'Giá khuyến mãi phải NHỎ HƠN giá gốc' })
  }
})
```
> ⚠️ Route PUT chỉ nhận field thay đổi — nếu body không có `price`, phải fetch `price` hiện tại từ DB rồi mới so sánh (route đã có sẵn biến `existing` sau lần sửa revalidate trước — tái dùng, thêm `select: { price: true }`).

**Task 2.2** — Cảnh báo (không chặn) khi `sale_price < price * 0.3` ở form admin `san-pham/them` + `[id]` — bắt người nhập xác nhận, vì đây là dấu hiệu nhầm "số tiền giảm" với "giá sau giảm" (nguyên nhân tâm lý của sự cố).

**Lưu ý:** dữ liệu lỗi trong DB **đã được dọn thủ công** (10 SP ~5.000đ + 1 SP nghịch lý 66.000). Task này là để **chặn tái diễn**, không phải dọn lại.

---

## 3. 🟡 Lỗi nhỏ đã xác minh

**Task 3.1 — `catch {}` rỗng nuốt lỗi.**
`src/components/admin/CategoryPanel.tsx:78` — nuốt lỗi im lặng. Ít nhất `console.error` hoặc hiện toast cho admin biết thao tác thất bại.

**Task 3.2 — 2 `<img>` admin thiếu `alt`.**
`src/app/admin/thu-vien/MediaLibrary.tsx:201,255` — thêm `alt` (WCAG; chỉ admin thấy nên ưu tiên thấp).

**Task 3.3 — 13 `console.log` sót trong code chạy.**
Rà `src/` (trừ `scripts/`), bỏ hoặc đổi sang logger có cấp độ. Không phải bug nhưng rò rỉ thông tin + nhiễu log production.

---

## 4. 🟢 Ghi chú hiệu năng (KHÔNG phải bug — cân nhắc, đừng "sửa" vội)

**Trang `/tin-tuc` và `/tin-tuc/[slug]` render fully-dynamic** (đã xác minh: không có header `x-nextjs-prerender`). Mỗi lượt xem bài đều truy vấn DB, không cache. Với 64 bài, đây là chi phí không cần thiết — nhưng **không sai**, bài luôn tươi.

Nếu muốn tối ưu: thêm `export const revalidate = 3600` cho `[slug]` + gọi `revalidatePath('/tin-tuc/<slug>')` trong API posts khi publish/sửa (giống pattern đã làm cho sản phẩm ở `src/lib/product-revalidate.ts`). **Chỉ làm nếu đo thấy tải bài chậm thật** — đừng đổi khi chưa có số liệu.

> Đối lập: trang **sản phẩm** là static prerender nên **bắt buộc** có `revalidate` + `revalidatePath` (đã sửa xong ở phiên trước, `product-revalidate.ts`). Đừng gỡ.

---

## 5. Việc KHÔNG cần làm (tránh false-positive)

- `src/app/uploads/[filename]/route.ts` trông như trùng việc phục vụ ảnh — **không phải bug**. Nginx phục vụ `/uploads/` trực tiếp qua `alias` + `try_files`; route Next chỉ là fallback, gần như không chạy cho file tồn tại.
- 57 `as any` — phần lớn là ép kiểu `NextRequest`/Prisma hợp lệ, không phải bug. Đừng quét bừa.
- Bài viết dynamic (mục 4) — không phải bug.

---

## 6. Thứ tự & quy tắc

1. **Task 1** (gom logic giá) — impact cao nhất, chặn cả lớp lỗi
2. **Task 2** (validation) — chặn tái diễn sự cố tiền thật
3. **Task 3** (dọn nhỏ)
4. **Task 4** — chỉ khi có số liệu

**Bắt buộc sau mỗi task:** `npm run typecheck` && `npm run build` sạch. Không báo hoàn tất nếu build fail (theo `CLAUDE.md`). Repo auto-commit+push mọi edit; deploy theo quy trình PM2 standalone (`deploy.sh`, có auto-rollback).

**Kiểm chứng đầu-cuối** (không chỉ typecheck): với Task 1–2, tạo 1 SP thử ở admin với `sale_price` nghịch lý → xác nhận API từ chối (Task 2) và 4 nơi hiển thị đồng nhất (Task 1). Xoá SP thử sau khi xong.

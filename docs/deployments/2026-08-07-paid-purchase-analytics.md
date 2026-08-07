# Paid-only Purchase analytics deployment

- **Ngày triển khai:** 2026-08-07
- **Phạm vi:** checkout funnel, GA4 Purchase và Google Ads Purchase conversion
- **Nhánh:** `main`
- **Trạng thái:** Đã triển khai và xác minh production

## Vấn đề

Luồng cũ ghi nhận Google Ads Purchase ngay sau khi API tạo đơn thành công. Điều này làm đơn chuyển khoản chưa thanh toán và các đơn còn `PENDING` bị tính thành giao dịch mua, khiến số conversion và doanh thu quảng cáo cao hơn doanh thu đã xác nhận.

## Chính sách event sau thay đổi

| Điểm trong funnel | Event | Điều kiện |
| --- | --- | --- |
| Khách bắt đầu gửi checkout | `begin_checkout` | Giữ nguyên để đo ý định mua |
| API tạo đơn thành công | `order_created` | Ghi nhận đơn được tạo; không gửi Google Ads Purchase |
| Trang xác nhận nhận trạng thái thanh toán | GA4 `purchase` | Chỉ khi trạng thái provider và trạng thái payment của đơn đều là `PAID` |
| Cùng thời điểm xác nhận thanh toán | Google Ads `conversion` | Chỉ khi trạng thái provider và trạng thái payment của đơn đều là `PAID` |

GA4 Purchase và Google Ads conversion cùng dùng `transaction_id = orderCode`. Giá trị giao dịch và danh sách sản phẩm được dựng từ API chi tiết đơn hàng authoritative, không tin giá trị tổng từ client checkout.

## Tương thích luồng hiện có

- Đơn COD hoặc chuyển khoản còn `PENDING` không phát Purchase và không ghi doanh thu.
- QR, payment provider, webhook, voucher và schema database không bị thay đổi trong phạm vi này.
- Webhook hoặc cơ chế polling hiện có tiếp tục chịu trách nhiệm cập nhật payment sang `PAID`; trang xác nhận chỉ phát Purchase sau khi đọc được trạng thái đã xác nhận.
- `transaction_id` ổn định theo mã đơn để GA4 và Google Ads có khóa khử trùng lặp khi trang xác nhận được tải hoặc polling nhiều lần.

## File runtime chính

- `src/lib/checkout-analytics.ts`
- `src/app/(user)/thanh-toan/page.tsx`
- `src/app/(user)/thanh-toan/xac-nhan/page.tsx`

## Test bổ sung

- `src/lib/__tests__/checkout-analytics.test.ts`
- `src/lib/__tests__/purchase-funnel-integration.test.ts`

Các trường hợp được khóa bằng test gồm: chỉ một phía báo `PAID`, cả hai phía `PAID`, COD `PENDING`, payload GA4/Ads dùng cùng `transaction_id`, và đảm bảo trang tạo đơn không còn gửi Purchase conversion.

## Xác minh local trước deploy

- `npm test`: PASS — Vitest 354/354 và legacy 290/290, tổng 644 test.
- `npx prisma generate`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS — compile thành công và sinh 112/112 route.
- Không có thay đổi Prisma schema hoặc migration trong release.

## Rollback

Nếu health check, PM2, route chính hoặc static asset không đạt, dùng release standalone trước do `/var/www/mushroomie/deploy.sh` lưu tại `.next/standalone.previous`, sau đó restart `mushroomie_pm2`. Không rollback database vì release này không có thay đổi schema hoặc migration.

## Kết quả production

### Lần chạy 1

Deploy dừng an toàn trước bước thay release vì root `tsconfig.json` quét subproject độc lập `video/mushroomie-website-intro`, trong khi `npm ci` của website không cài dependency Remotion của subproject. Release cũ không bị thay thế; PM2 vẫn online và health check vẫn báo database `ok`.

Đã bổ sung `video/mushroomie-website-intro` vào `exclude` của root TypeScript. Root typecheck sau sửa đạt và `tsc --listFilesOnly` xác nhận không còn file video nào bị đưa vào chương trình TypeScript của website. Subproject video tiếp tục dùng `tsconfig.json` và dependency riêng.

### Backup trước deploy

- Uploads: `backups/uploads/uploads-2026-08-07-162026.tar.gz` — 28 MB.
- Database: `backups/db/mysql-2026-08-07-162026.sql.gz` — 119 KB.

### Retry thành công

- Runtime code commit: `a4601d8`.
- Production `npm ci`: PASS; npm audit báo 1 lỗ hổng moderate và 4 lỗ hổng high, chưa tự động sửa để tránh breaking change ngoài phạm vi.
- Prisma Client generation: PASS.
- Production typecheck: PASS.
- Production tests: PASS — Vitest 354/354 và legacy 290/290, tổng 644 test.
- `prisma db push`: PASS; database đã đồng bộ sẵn với schema, không có schema change cần áp dụng.
- Next.js production build: PASS — compile, TypeScript và static generation hoàn tất 143/143 route theo dữ liệu production.
- Standalone release activation: PASS.
- `mushroomie_pm2`: online sau restart; process list đã được `pm2 save`.

### Xác minh production qua domain

| Hạng mục | Kết quả |
| --- | --- |
| `/`, `/san-pham`, `/tin-tuc`, `/mini-game`, `/thanh-toan`, `/voucher`, `/lien-he`, `/gio-hang`, `/tai-khoan/dang-nhap` | PASS — HTTP 200 |
| `/admin` khi chưa đăng nhập | PASS — HTTP 307 về `/tai-khoan/dang-nhap` |
| `/api/health` | PASS — HTTP 200, service `mushroomie`, database `ok` |
| Hai CSS và sáu JavaScript chunk lấy từ HTML trang chủ | PASS — HTTP 200, lần lượt `text/css` và `application/javascript` |
| `/logo.webp` và `/favicon.ico` | PASS — HTTP 200, đúng MIME ảnh |
| Một file thật trong `/uploads/` | PASS — HTTP 200 `image/webp` |
| `/api/qr` với URL VietQR allowlisted | PASS — HTTP 200 `image/png`, 62.212 byte |
| PM2 | PASS — process online tại runtime code commit `a4601d8` |

Error log PM2 có các dòng Server Action/Auth.js probing và lỗi kết nối database lịch sử, nhưng file log được sửa lần cuối lúc `08:40 UTC`, trước PID release mới khởi động lúc `16:32 UTC`; không có error-log entry mới từ release này tại thời điểm xác minh.

Không tạo giao dịch PAID giả trên production để tránh phát sinh đơn hàng, doanh thu hoặc dữ liệu quảng cáo không có thật. Hành vi paid-only và chống phát Purchase ở bước tạo đơn được xác minh bằng regression/integration tests trong release.

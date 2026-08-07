# Paid-only Purchase analytics deployment

- **Ngày triển khai:** 2026-08-07
- **Phạm vi:** checkout funnel, GA4 Purchase và Google Ads Purchase conversion
- **Nhánh:** `main`
- **Trạng thái:** Chuẩn bị triển khai production

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

Sẽ được cập nhật ngay sau khi deploy và chạy đầy đủ kiểm tra route, health, PM2, CSS/JS MIME, logo, favicon, uploads và QR endpoint.

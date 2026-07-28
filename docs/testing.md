# Kiểm thử Mushroomie

Kho sử dụng Vitest theo hướng dẫn đi kèm Next.js 16.2.6, V8 để đo coverage và React Testing Library cho Client Component đồng bộ. Test không được kết nối database production, gửi email thật, gọi cổng thanh toán thật hoặc ghi vào `public/uploads`.

## Chạy kiểm thử

```powershell
npm ci
npx prisma generate
npm test
npm run test:coverage
npm run test:coverage:all
npm run typecheck
npm run lint
npm run build
```

- `npm test`: chạy toàn bộ suite một lần.
- `npm run test:watch`: chạy Vitest ở chế độ theo dõi khi phát triển.
- `npm run test:coverage`: chạy suite và áp coverage gate.
- `npm run test:coverage:all`: audit toàn bộ `src` với ngưỡng baseline thấp để chống tụt coverage, đồng thời hiển thị trung thực phần page/component chưa có test.
- Báo cáo HTML của core gate sinh tại `coverage/core/index.html`; audit toàn site sinh tại `coverage/all/index.html`. Toàn bộ `coverage/` đã bị Git và ESLint bỏ qua.

Coverage gate hiện áp vào logic nghiệp vụ có thể kiểm thử độc lập: utility, bảo mật, chuẩn hóa URL/ảnh/bài viết, xử lý upload, mini-game, order-access, payment/email provider và Zustand stores. Ngưỡng tối thiểu:

| Chỉ số | Ngưỡng |
| --- | ---: |
| Statements | 75% |
| Branches | 70% |
| Functions | 80% |
| Lines | 75% |

Audit toàn bộ `src` có ngưỡng chống hồi quy: statements 15%, branches 14%, functions 13% và lines 16%. Đây không phải mục tiêu chất lượng cuối cùng; core quality gate phía trên vẫn là cổng chính cho logic nghiệp vụ có thể unit-test.

Baseline ngày 19/07/2026:

| Phạm vi | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| Core quality gate | 93,23% | 83,06% | 93,07% | 94,00% |
| Toàn bộ `src` | 19,69% | 18,13% | 15,46% | 21,11% |

Chênh lệch này là có chủ đích và minh bạch: toàn bộ route/page/component vẫn nằm trong báo cáo audit, nhưng không dùng các file async Server Component chưa thể unit-render để làm core gate thất bại. Các test route/component hiện có vẫn chạy trong cả hai lệnh.

## Ma trận hành vi đã phủ

| Nhóm | Hành vi chính |
| --- | --- |
| URL, media và nội dung | Chuẩn hóa `/uploads`, fallback ảnh, chặn đường dẫn nội bộ, sanitize HTML, thống kê bài viết, resize/crop/WebP, MIME và chữ ký file |
| Bảo mật | Secret tối thiểu, IP proxy, rate limit, JSON-LD escaping, hash/constant-time compare, order-access token và game token hết hạn/tamper |
| Auth và admin | Ma trận truy cập ẩn danh cho 37 route được bảo vệ, regular-user denial cho API admin và viewer denial cho thao tác ghi; đăng ký/OTP/đặt lại mật khẩu; phân quyền đổi role; không tự hạ quyền; bảo vệ super admin gốc; media API theo purpose/role |
| Giỏ hàng và voucher | Gộp biến thể, số lượng tối thiểu, tổng tiền, ghi chú custom, fetch/deduplicate wallet, điều kiện đơn tối thiểu và cap giảm giá |
| Đơn hàng và thanh toán | Server tính lại giá/tổng tiền, tồn kho và option, voucher theo user, guest access token, chống tạo payment trùng, dùng tổng tiền từ order, VietQR/PayOS/Casso/SePay webhook |
| Mini-game | Game hợp lệ, score rate sanity, duration clamp, leaderboard period, voucher tier, signed session và transaction ghi điểm |
| Email | Template thanh toán/trạng thái, escaping dữ liệu động, SMTP/Resend, log PENDING/SENT/FAILED, email reset mật khẩu |
| API công khai | Health response không lộ chuỗi kết nối; QR proxy chỉ nhận HTTPS `img.vietqr.io` và chỉ trả MIME ảnh; guest mini-game summary không chạm DB |
| UI đồng bộ | Product card giữ 3:4, giá sale, out-of-stock, add-to-cart, option/custom note, cart drawer, mobile navigation, breadcrumb JSON-LD và UI primitives |

## Ranh giới và phần còn thiếu

Vitest không unit-render async Server Components. Tài liệu Next.js đang cài khuyến nghị kiểm thử E2E cho nhóm này. Suite hiện có route-handler integration và component tests, nhưng chưa tuyên bố phủ E2E production cho các flow sau:

- đăng ký/OTP/Google OAuth bằng tài khoản test;
- checkout hoàn chỉnh qua database dùng một lần và payment sandbox;
- webhook thật từ PayOS/Casso/SePay;
- upload/preview qua trình duyệt với filesystem test riêng;
- admin CRUD nhiều bước, SEO editor và game canvas/âm thanh trong Chromium;
- responsive/visual regression ở 1440, 1366, 390 và 360 px.

Muốn bổ sung E2E, hãy dựng database test riêng, seed user/order/product/voucher giả, cấu hình payment sandbox và cài Playwright. Tuyệt đối không trỏ E2E vào database hoặc payment production.

## Quy tắc viết test mới

1. Viết test mô tả hành vi và chạy để thấy lỗi đúng nguyên nhân.
2. Chỉ mock auth, Prisma, filesystem, email và network ở biên ngoài; không assert hành vi của mock thay cho kết quả người dùng/API.
3. Mọi fixture order/payment/voucher phải đủ trường mà code downstream sử dụng.
4. Reset store, timer, environment và global fetch sau mỗi test.
5. Khi sửa bug production, giữ regression test đã tạo trạng thái đỏ trước bản sửa.
6. Không hạ coverage threshold để hợp thức hóa code chưa được kiểm thử; ghi rõ gap hoặc thêm test.

# Thiết kế cập nhật README, video giới thiệu và dọn repository

Ngày: 2026-08-09

Trạng thái: Đã chọn phương án 2

Nhánh triển khai: `codex/readme-video-repo-cleanup`

## 1. Mục tiêu

- Viết lại `README.md` để phản ánh đúng website Mushroomie hiện tại.
- Đưa video giới thiệu 16:9, 43 giây đã được duyệt vào repository và cho phép khách truy cập README mở xem trực tiếp.
- Loại bỏ mã nguồn video, tệp tạm, báo cáo sinh tự động và tài liệu kế hoạch lịch sử không cần thiết cho website.
- Không ảnh hưởng mã nguồn website, dữ liệu, upload, migration, thanh toán, cấu hình production hoặc tài liệu vận hành.

## 2. Phương án được chọn

Phương án 2: repository tập trung vào website. Video thành phẩm dùng cho README được giữ lại; project Remotion và các tệp làm video không còn được giữ trong repository chính.

## 3. README mới

README dùng UTF-8 và có các phần:

1. Tên thương hiệu, mô tả ngắn, slogan `Làm bằng tay, trao bằng tim` và liên kết production.
2. Preview video có thể bấm để mở MP4 16:9 dài 43 giây.
3. Tính năng thật của website: sản phẩm handmade/custom, giỏ hàng, thanh toán, voucher, đánh giá, bài viết, mini game, tài khoản và admin.
4. Stack được lấy từ `package.json`: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma, NextAuth, PayOS/VietQR, Zustand, Zod và Vitest.
5. Cấu trúc dự án, hướng dẫn cài đặt local, lệnh kiểm tra và mô hình deploy PM2/Nginx hiện tại.
6. Không công khai tài khoản, mật khẩu mặc định, secret, IP máy chủ hoặc dữ liệu production.

GitHub không đảm bảo render thẻ HTML `<video>` trong mọi ngữ cảnh README. Vì vậy giao diện dùng ảnh preview liên kết tới file MP4, kèm liên kết văn bản dự phòng.

## 4. Media được thêm

- `docs/media/mushroomie-intro-43s-16x9.mp4`
- `docs/media/mushroomie-intro-16x9-preview.png`

Video phải giữ SHA-256:

`21B7D1AA66552441556531012E190935CFAC7D0A9821549F3EBA8C2EA00364D8`

Preview phải là khung hình ngang đã kiểm tra, có đầy đủ domain, CTA và không bị cắt chữ.

## 5. Allowlist xóa

Chỉ xóa các đường dẫn sau:

- Toàn bộ `video/mushroomie-website-intro/`.
- `artifacts/mushroomie-full-website-sitemap.png`.
- Toàn bộ `docs/reports/marketing/`.
- 19 tệp lịch sử hiện có trong `docs/superpowers/plans/`.
- 14 tệp lịch sử có trước thiết kế này trong `docs/superpowers/specs/`.
- `temp_html.txt`.
- `temp_html2.txt`.
- `test_svg.html`.
- `lighthouse-mobile.json`.
- `shopee_logo.txt`.
- `logo_facebook_1024.png`.
- `resize.ps1` vì script chỉ ghi tệp logo thử nghiệm vào một đường dẫn máy cá nhân được hardcode.

Thiết kế hiện tại được giữ lại làm tài liệu quyết định đang áp dụng. `docs/reports/README.md` và `tsconfig.json` được cập nhật để không còn tham chiếu tới nhóm đã xóa.

## 6. Nội dung được bảo vệ

Không xóa hoặc sửa ngoài nhu cầu liên kết:

- `public/uploads`, backup, `.env`, database, Prisma migration và `package-lock.json`.
- Cấu hình PM2, Nginx, deploy, production và tài liệu vận hành.
- Mã nguồn trong `src`, `public`, `prisma`, `scripts`, `tests`, `tools`.
- Dữ liệu và tài liệu SEO còn được script hoặc quy trình website sử dụng.
- Template CSV/XLSX phục vụ chức năng website.
- Cấu hình agent/MCP và GitHub workflow.
- Dữ liệu thật về user, đơn hàng, voucher và thanh toán.

## 7. Quy trình xóa an toàn

1. Làm việc trong clone sạch được tạo từ `origin/main`.
2. Xác minh từng mục tồn tại, nằm trong clone tạm và không phải symbolic link/reparse point.
3. Xóa bằng danh sách đường dẫn chính xác, không dùng wildcard và không xóa đệ quy ngoài các thư mục đã duyệt.
4. Dùng Git để ghi nhận deletion; mọi tệp vẫn có thể khôi phục từ lịch sử Git.
5. Tìm lại toàn repository để phát hiện tham chiếu hỏng.

## 8. Kiểm chứng

- Kiểm tra SHA-256 và giải mã đầy đủ MP4 bằng FFmpeg.
- Kiểm tra kích thước/khả năng đọc ảnh preview và mở ảnh ở độ chi tiết gốc.
- Kiểm tra link tương đối trong README trỏ tới tệp tồn tại.
- Quét README và diff để không có mật khẩu, token hoặc secret.
- Chạy `git diff --check`.
- Chạy typecheck, test phù hợp và production build của website.
- Kiểm tra `git diff --cached` trước commit.
- Push nhánh, tạo PR và chỉ merge vào `main` sau khi các gate trên đạt.

## 9. Tiêu chí hoàn tất

- README trên `main` phản ánh đúng website hiện tại và không bị lỗi mã hóa tiếng Việt.
- Người xem repository có thể bấm preview để mở video 16:9, 43 giây.
- Toàn bộ allowlist đã bị xóa; các tệp được bảo vệ còn nguyên.
- Typecheck/build đạt hoặc mọi giới hạn môi trường được báo chính xác, không che lỗi.
- Commit, push và merge GitHub thành công; repository công khai hiển thị README mới.

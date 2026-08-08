# Mushroomie — Phụ kiện handmade cá nhân hóa

> **Làm bằng tay, trao bằng tim**

Mushroomie là website thương mại điện tử B2C dành cho phụ kiện handmade và quà tặng cá nhân hóa: vòng tay, charm, móc khóa, vòng cổ, hộp quà cùng nhiều món nhỏ mang dấu ấn riêng.

[Khám phá Mushroomie](https://mushroomie.io.vn)

## Video giới thiệu

[![Xem video giới thiệu Mushroomie 16:9](docs/media/mushroomie-intro-16x9-preview.png)](docs/media/mushroomie-intro-43s-16x9.mp4)

[Xem hoặc tải video giới thiệu Mushroomie — 16:9, 43 giây](docs/media/mushroomie-intro-43s-16x9.mp4)

## Trải nghiệm chính

- Khám phá phụ kiện handmade theo danh mục, phong cách và sản phẩm nổi bật.
- Cá nhân hóa sản phẩm theo màu sắc, hạt, charm và thông điệp riêng.
- Giỏ hàng, đặt hàng, voucher, đánh giá và theo dõi đơn hàng.
- Thanh toán tích hợp PayOS/VietQR với kiểm tra dữ liệu phía máy chủ.
- Tin tức, câu chuyện thương hiệu và nội dung SEO địa phương.
- Mini game được tách riêng để không làm nặng trang chủ.
- Khu vực tài khoản khách hàng và hệ thống quản trị nội dung, sản phẩm, đơn hàng, media, voucher và người dùng.
- Giao diện responsive cho desktop và mobile.

## Công nghệ

- Next.js 16 App Router, React 19 và TypeScript 5.
- Tailwind CSS 4, GSAP và bộ nhận diện riêng của Mushroomie.
- Prisma 5 với MySQL.
- NextAuth 5 cho xác thực.
- PayOS/VietQR cho luồng thanh toán.
- Zustand, Zod, Sharp và các công cụ xử lý media.
- Vitest, Testing Library và Node test runner.
- PM2 và Nginx trên production hiện tại.

## Cấu trúc dự án

```text
src/app/          Trang, layout và API routes của Next.js
src/components/   Component giao diện dùng chung
src/lib/          Dịch vụ, xác thực, thanh toán và tiện ích
src/store/        Client state với Zustand
prisma/           Schema, migrations và seed
public/           Static assets và uploads công khai
scripts/          Công cụ vận hành, SEO và tối ưu media
tests/            Kiểm thử Node và integration
docs/             Hướng dẫn kỹ thuật và báo cáo đang sử dụng
```

## Chạy local

Yêu cầu khuyến nghị: Node.js 20 LTS hoặc mới hơn, npm và MySQL 8.

```bash
git clone https://github.com/tongminhquan/mushroomie-23.git
cd mushroomie-23
npm ci
```

Tạo `.env` cục bộ, tối thiểu có kết nối MySQL. Không commit tệp này:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
```

Các tích hợp xác thực, email và thanh toán cần thêm biến môi trường tương ứng của môi trường triển khai. Không sử dụng secret production cho máy phát triển.

```bash
npx prisma generate
npm run dev
```

Mặc định ứng dụng phát triển chạy tại `http://localhost:3000`.

## Kiểm tra chất lượng

```bash
npm run typecheck
npm test
npm run build
```

Build yêu cầu `DATABASE_URL` hợp lệ. Các script có khả năng thay đổi dữ liệu hoặc media phải được đọc kỹ và chạy dry-run/backup theo tài liệu vận hành trước khi dùng chế độ apply.

## Production

Production hiện chạy tại [mushroomie.io.vn](https://mushroomie.io.vn) bằng PM2 phía sau Nginx; không dùng Docker trong quy trình production hiện tại.

- [Hướng dẫn triển khai](deployment_guide.md)
- [Production runbook](production_runbook.md)
- [Production checklist](production_checklist.md)
- [Incident checklist](incident_checklist.md)
- [Hướng dẫn kiểm thử](docs/testing.md)

## Bảo mật

- Không commit `.env`, secret, token, mật khẩu, backup, database dump hoặc dữ liệu production.
- API quản trị phải kiểm tra quyền ở phía máy chủ.
- Tổng tiền, voucher và trạng thái thanh toán phải được xác thực lại trên server.
- Upload chỉ sử dụng định dạng ảnh được cho phép và URL công khai dạng `/uploads/<file>`.

## Giấy phép

Dự án thuộc Mushroomie. Vui lòng liên hệ chủ sở hữu trước khi sao chép hoặc phân phối mã nguồn, nội dung và tài sản thương hiệu.

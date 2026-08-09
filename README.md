# Mushroomie — Nền tảng thương mại điện tử phụ kiện handmade

> **Làm bằng tay, trao bằng tim**

Mushroomie là website thương mại điện tử B2C dành cho phụ kiện handmade và quà tặng cá nhân hóa: vòng tay, charm, móc khóa, vòng cổ, dây chuyền, hộp quà cùng nhiều món nhỏ mang dấu ấn riêng.

[Truy cập website](https://mushroomie.io.vn) · [Xem báo cáo kiến trúc và toàn bộ phân hệ](https://mushroomie.io.vn/bao-cao-he-thong) · [Xem video giới thiệu](docs/media/mushroomie-intro-43s-16x9.mp4)

## Báo cáo đề tài

Trang [Báo cáo hệ thống Mushroomie](https://mushroomie.io.vn/bao-cao-he-thong) được xây dựng để trình bày trước hội đồng chấm thi. Báo cáo bao gồm:

- Bối cảnh và mục tiêu kinh doanh.
- Kiến trúc modular monolith full-stack.
- Công nghệ frontend, backend, database và production.
- Toàn bộ phân hệ sản phẩm, đơn hàng, thanh toán, voucher, mini game, CMS và admin.
- Luồng đặt hàng, webhook thanh toán và kiểm soát tồn kho.
- Cấu trúc 29 Prisma model.
- Bảo mật, hiệu suất, SEO, analytics và CI/CD.
- Dàn ý thuyết trình cùng câu hỏi phản biện thường gặp.

Trang sử dụng responsive layout và có stylesheet riêng cho chế độ in, vì vậy có thể dùng trực tiếp khi trình chiếu hoặc lưu thành PDF bằng chức năng Print của trình duyệt.

## Quy mô mã nguồn

Tại thời điểm phát hành trang báo cáo:

| Thành phần | Quy mô |
|---|---:|
| Page route | 78 — gồm 77 route nghiệp vụ và 1 route báo cáo |
| API route | 73 |
| Prisma model | 29 |
| Tệp kiểm thử/tài nguyên kiểm thử | Hơn 100 |

## Kiến trúc tổng thể

Mushroomie sử dụng kiến trúc **modular monolith**. Frontend, backend API và logic nghiệp vụ được đặt trong một dự án Next.js nhưng chia theo module và trách nhiệm rõ ràng.

```mermaid
flowchart LR
    U["Người dùng<br/>Desktop / Mobile"] --> CF["Cloudflare<br/>DNS · CDN · SSL"]
    CF --> NG["Nginx<br/>Reverse proxy · Static · MIME"]
    NG --> APP["Next.js 16<br/>React 19 · Node.js · PM2"]
    APP --> ORM["Prisma ORM<br/>Transaction"]
    ORM --> DB["MySQL<br/>29 models"]
    APP --> PAY["VietQR / Casso / SePay / PayOS"]
    APP --> MAIL["SMTP / Nodemailer"]
    APP --> MEDIA["Sharp / WebP / UUID"]
    APP --> CMS["CMS nội bộ / WordPress"]
    APP --> ANALYTICS["GA4 / GTM / Ads / Clarity"]
```

### Lý do chọn modular monolith

- Phù hợp lưu lượng và nguồn lực vận hành hiện tại.
- Backend và frontend dùng chung TypeScript và kiểu dữ liệu.
- Transaction đơn hàng/thanh toán dễ kiểm soát hơn hệ phân tán.
- Deploy và rollback đơn giản trên một VPS.
- Có thể tách payment, email hoặc media thành service độc lập khi quy mô tăng.

## Công nghệ

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Frontend | Next.js 16.2.11, React 19.2.4, TypeScript, Tailwind CSS 4 | Server rendering, component UI, responsive, light/dark theme |
| Backend | Next.js Route Handlers, Zod, bcryptjs | API, validation và logic nghiệp vụ phía server |
| Database | MySQL, Prisma 5.22 | Dữ liệu quan hệ, transaction và truy vấn có kiểu |
| Authentication | NextAuth 5, Google OAuth, Credentials, JWT | Đăng nhập, session và phân quyền |
| Client state | Zustand | Giỏ hàng và voucher phía trình duyệt |
| Payment | VietQR + Casso, VietQR + SePay, PayOS | QR chuyển khoản, webhook và đối soát |
| Media | Sharp, WebP, AVIF, UUID | Resize, nén, strip metadata và đặt tên an toàn |
| Email | Nodemailer/SMTP | Email đơn hàng, thanh toán và yêu cầu đánh giá |
| Analytics | GTM, GA4, Google Ads, Microsoft Clarity | Ecommerce events và phân tích hành vi |
| Testing | Vitest, Testing Library, Node test runner | Unit, integration, security và source contract |
| Production | Cloudflare, Nginx, PM2 | CDN/SSL, reverse proxy, static files và process manager |

## Các phân hệ website

### 1. Trang chủ và nhận diện thương hiệu

- Hero/banner, danh mục và sản phẩm nổi bật.
- Khu vực sản phẩm custom, câu chuyện thương hiệu và giá trị handmade.
- Đánh giá, bài viết, nội dung SEO địa phương và CTA.
- Mobile-first; không đưa admin, editor hoặc mini-game bundle vào homepage.

### 2. Sản phẩm và danh mục

- Danh sách, chi tiết, tìm kiếm và lọc sản phẩm.
- Album ảnh, tùy chọn, giá gốc/khuyến mãi và tồn kho.
- Slug, metadata và structured data cho SEO.
- Product card giữ tỷ lệ ảnh 3:4.

### 3. Giỏ hàng và checkout

- Zustand persisted store giúp giữ giỏ hàng khi tải lại trang.
- Thêm, xóa, cập nhật số lượng và lựa chọn sản phẩm.
- Áp dụng hoặc gỡ voucher.
- Giá phía client chỉ dùng để hiển thị; server luôn tính lại trước khi tạo đơn.

### 4. Đơn hàng và tồn kho

Backend tạo đơn bằng Prisma transaction:

1. Validate dữ liệu và xác thực người dùng.
2. Đọc lại sản phẩm, giá và tồn kho từ MySQL.
3. Tính subtotal, phí giao hàng, gói quà và voucher.
4. Trừ tồn kho có điều kiện.
5. Tạo Order, OrderItem và OrderStatusHistory.
6. Tạo Payment nếu khách chọn thanh toán online.

### 5. Thanh toán tự động

Payment provider abstraction hiện hỗ trợ:

- VietQR + Casso.
- VietQR + SePay.
- PayOS.

Provider được chọn qua biến môi trường `PAYMENT_PROVIDER`. Webhook thanh toán có các lớp kiểm tra:

- Chữ ký nhà cung cấp.
- Transaction ID và idempotency key.
- Nội dung chuyển khoản/mã đơn.
- Số tiền thực nhận và tài khoản nhận.
- Trạng thái Payment và Order hiện tại.
- PaymentWebhookEvent dùng làm audit log.

Chỉ server mới được chuyển Payment sang `PAID` và Order sang `PROCESSING`.

### 6. Voucher

- Voucher chung hoặc gắn với tài khoản.
- Giảm theo phần trăm hoặc số tiền.
- Điều kiện đơn tối thiểu, hạn sử dụng và giới hạn lượt dùng.
- UserVoucher và VoucherRedemptionLog theo dõi quyền sở hữu/lịch sử.
- Server kiểm tra voucher thuộc đúng người dùng và tự tính lại discount.

### 7. Tài khoản và phân quyền

- Đăng ký bằng OTP.
- Đăng nhập email/mật khẩu hoặc Google OAuth.
- Quên mật khẩu, đặt lại mật khẩu, hồ sơ và ảnh đại diện.
- Lịch sử đơn hàng và kho voucher cá nhân.

Các role chính:

| Role | Phạm vi |
|---|---|
| `user` | Mua hàng, xem đơn, voucher và mini game |
| `viewer` | Xem dữ liệu quản trị được phép nhưng không mutation |
| `admin` | Quản trị sản phẩm, đơn hàng, nội dung, banner và voucher |
| `super_admin` | Quản lý quyền, user quản trị và audit log nhạy cảm |

Quyền được kiểm tra tại backend API, không chỉ ẩn nút trên giao diện.

### 8. Mini game và tích điểm

- Tetris và Block Blast.
- Leaderboard, UserPoint, đổi điểm và phát voucher theo mốc.
- Token lượt chơi ký bằng HMAC.
- Kiểm tra thời gian, mức điểm hợp lý, rate limit và chống replay token.
- Ghi GameScore và cộng điểm trong transaction.

### 9. Admin

- Dashboard và biểu đồ.
- Sản phẩm, danh mục, tồn kho và media.
- Đơn hàng, thanh toán và webhook logs.
- Voucher và lịch sử cấp/đổi.
- Bài viết, banner, review và contact.
- User, settings và AdminLog.

### 10. CMS và xuất bản

- Draft/published/scheduled status.
- Autosave, revision, restore và duplicate.
- Tag, SEO title, meta description, canonical và robots.
- Open Graph, Twitter metadata và schema.
- Import Excel/CSV, bulk publishing và tích hợp WordPress.

### 11. Media pipeline

Ảnh upload được xử lý bằng Sharp:

- Cho phép JPEG, PNG, WebP và AVIF.
- Kiểm tra format thực, không chỉ tin phần mở rộng.
- Giới hạn dung lượng và megapixel.
- Auto-rotate, resize, strip metadata và chuyển WebP.
- Tên file UUID ngẫu nhiên.
- URL công khai chuẩn `/uploads/<uuid>.webp`.

### 12. Review, contact và email

- Review liên kết người dùng, sản phẩm và đơn hàng.
- Kiểm tra quyền sở hữu/đơn hoàn thành và ngăn đánh giá lặp.
- Contact form được lưu để admin xử lý.
- Nodemailer/SMTP gửi email đơn hàng, thanh toán và nhắc đánh giá.
- EmailLog lưu trạng thái gửi.

### 13. SEO

- Metadata, canonical, robots.txt và sitemap XML.
- Product, Merchant listing, ItemList và Breadcrumb schema.
- Article/BlogPosting, LocalBusiness và Website schema.
- Open Graph, Twitter Card và ảnh chia sẻ.
- Noindex cho admin, API, tài khoản, giỏ hàng và thanh toán.
- Landing page địa phương cho Đồng Nai, Biên Hòa, Trảng Dài và TP.HCM.

### 14. Analytics và marketing

- Google Tag Manager.
- Google Analytics 4 ecommerce events.
- Google Ads conversion.
- Microsoft Clarity.
- Các script được trì hoãn để bảo vệ LCP.
- Purchase event dùng transaction ID để giảm ghi nhận trùng.

## Cơ sở dữ liệu

Schema MySQL gồm 29 Prisma model, chia thành các miền:

| Miền | Models |
|---|---|
| Người dùng & xác thực | User, Otp, UserPoint, RateLimitBucket |
| Sản phẩm & giỏ hàng | Category, Product, ProductImage, ProductOption, Cart, CartItem |
| Đơn hàng & thanh toán | Order, OrderItem, OrderStatusHistory, Payment, PaymentWebhookEvent, EmailLog |
| Voucher & trò chơi | Voucher, UserVoucher, VoucherRedemptionLog, GameScore |
| Nội dung | Post, PostRevision, PostTag, PostTagMap |
| Tương tác & vận hành | Contact, Review, Banner, AdminLog, Setting |

## Bảo mật

- Mật khẩu được băm bằng bcryptjs; không lưu plain text.
- Session sử dụng JWT và secret production bắt buộc đủ mạnh.
- API admin kiểm tra role phía server.
- Giá, discount, shipping fee và payment status không tin dữ liệu client.
- Payment webhook dùng signature verification, idempotency và audit log.
- Upload kiểm tra MIME/format, giới hạn kích thước, strip metadata và dùng UUID.
- CSP, HSTS, X-Frame-Options, nosniff, Referrer Policy và Permissions Policy được cấu hình trong Next.js.
- `.env`, secret, token, backup và database dump không được commit.

## Hiệu suất

- Server Components là mặc định; chỉ component cần tương tác mới dùng `use client`.
- Next Image hỗ trợ WebP/AVIF, `sizes`, lazy loading và ảnh LCP ưu tiên cao.
- Nginx phục vụ `/_next/static` và `/uploads` trực tiếp.
- Cloudflare cung cấp CDN, HTTPS và edge caching.
- GTM/GA4/Ads/Clarity được tải trễ.
- Animation ưu tiên `transform`/`opacity` và hỗ trợ `prefers-reduced-motion`.
- PM2 giới hạn bộ nhớ và tự restart process khi cần.

## Cấu trúc repository

```text
mushroomie/
├── src/
│   ├── app/
│   │   ├── (user)/       # Storefront và tài khoản khách hàng
│   │   ├── admin/        # Hệ thống quản trị
│   │   └── api/          # Backend Route Handlers
│   ├── components/       # UI components
│   ├── lib/              # Auth, payment, email, media, SEO
│   ├── store/            # Zustand stores
│   └── hooks/            # React hooks
├── prisma/               # Schema, migrations và seed
├── public/               # Static assets và uploads
├── scripts/              # Deploy, backup, SEO, performance, media
├── tests/                # Unit và integration tests
├── docs/                 # Design specs, plans và runbooks
├── video/                # Video giới thiệu tách khỏi web runtime
├── next.config.ts
└── ecosystem.config.js
```

## Chạy local

### Yêu cầu

- Node.js 20 LTS hoặc mới hơn.
- npm.
- MySQL 8.

```bash
git clone https://github.com/tongminhquan/mushroomie-23.git
cd mushroomie-23
npm ci
```

Tạo `.env` cục bộ. Không commit file này và không sử dụng secret production trên máy phát triển:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
NEXTAUTH_SECRET="LOCAL_SECRET_AT_LEAST_32_CHARACTERS"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Các tích hợp Google OAuth, email và thanh toán cần thêm biến môi trường tương ứng trong môi trường được phép.

```bash
npx prisma generate
npm run dev
```

Ứng dụng phát triển mặc định chạy tại `http://localhost:3000`.

## Kiểm tra chất lượng

```bash
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run build
```

Các script có khả năng thay đổi database hoặc media phải chạy backup/dry-run theo runbook trước khi dùng chế độ apply.

## Production

Production chạy tại [mushroomie.io.vn](https://mushroomie.io.vn) theo mô hình:

```text
Cloudflare → Nginx → PM2 → Next.js standalone → Prisma → MySQL
```

- Project path: `/var/www/mushroomie`.
- PM2 process: `mushroomie_pm2`.
- Origin app: `127.0.0.1:3001`.
- Nginx phục vụ static chunks và `/uploads`.
- Không dùng Docker trong quy trình production hiện tại.
- Release trước được giữ lại để rollback.
- `.env`, `public/uploads`, database, migration và backup phải được bảo toàn qua mỗi lần deploy.

Tài liệu vận hành:

- [Deployment guide](deployment_guide.md).
- [Production runbook](production_runbook.md).
- [Production checklist](production_checklist.md).
- [Incident checklist](incident_checklist.md).
- [Testing guide](docs/testing.md).

## Video giới thiệu

[![Xem video giới thiệu Mushroomie 16:9](docs/media/mushroomie-intro-16x9-preview.png)](docs/media/mushroomie-intro-43s-16x9.mp4)

[Xem hoặc tải video giới thiệu Mushroomie — 16:9, 43 giây](docs/media/mushroomie-intro-43s-16x9.mp4)

Video được xây dựng trong workspace riêng dưới `video/mushroomie-website-intro`; mã Remotion và các công cụ render không được import vào website production.

## Giấy phép

Dự án và tài sản thương hiệu thuộc Mushroomie. Vui lòng liên hệ chủ sở hữu trước khi sao chép hoặc phân phối mã nguồn, nội dung, hình ảnh và tài sản nhận diện.

@AGENTS.md

# Mushroomie Project Instructions

## Role

Bạn là AI coding agent cho website Mushroomie, làm việc như senior full-stack engineer, frontend engineer, UX/UI engineer, backend engineer, DevOps engineer, QA engineer, performance engineer và security reviewer.

## Project

Mushroomie là website thương mại điện tử B2C bán phụ kiện handmade cá nhân hóa cho Gen Z.

Production:
- Domain: https://mushroomie.io.vn
- Server: 103.173.226.86
- Path: /var/www/mushroomie
- Runtime: PM2 (standalone mode)
- PM2 process: mushroomie_pm2
- PM2 script: server.js từ .next/standalone
- Port: 3001
- Nginx proxy: http://127.0.0.1:3001
- Branch: main
- Remote origin: https://github.com/tongminhquan/mushroomie-23.git
- No Docker in production

## Stack

- Framework: Next.js 16.2.6, App Router, output: standalone
- Language: TypeScript 5
- Styling: Tailwind CSS v4
- ORM: Prisma 5 + MySQL
- Auth: next-auth v5 (beta)
- Payment: PayOS + VietQR/Casso + VietQR/SePay
- Rich text: TipTap v3
- Image: sharp (WebP convert), next/image
- State: Zustand
- Build: next build --webpack (not turbopack for production build)

## Routes — User

- `/` — Trang chủ
- `/san-pham` — Danh sách sản phẩm
- `/san-pham/[slug]` — Chi tiết sản phẩm
- `/tin-tuc` — Danh sách bài viết
- `/tin-tuc/[slug]` — Chi tiết bài viết
- `/thanh-toan` — Thanh toán
- `/thanh-toan/xac-nhan` — Xác nhận đơn hàng
- `/mini-game` — Mini game (điểm, đổi voucher)
- `/voucher` — Voucher
- `/lien-he` — Liên hệ
- `/gioi-thieu` — Giới thiệu
- `/tai-khoan` — Tài khoản
- `/tai-khoan/dang-nhap` — Đăng nhập
- `/tai-khoan/dang-ky` — Đăng ký
- `/tai-khoan/quen-mat-khau` — Quên mật khẩu
- `/tai-khoan/dat-lai-mat-khau` — Đặt lại mật khẩu
- `/tai-khoan/don-hang` — Danh sách đơn hàng
- `/tai-khoan/don-hang/[code]` — Chi tiết đơn hàng
- Policy pages: /chinh-sach-bao-mat, /chinh-sach-doi-tra, /chinh-sach-giao-hang, etc.

## Routes — Admin

- `/admin` — Dashboard
- `/admin/san-pham` — Quản lý sản phẩm
- `/admin/san-pham/them` — Thêm sản phẩm
- `/admin/san-pham/[id]` — Sửa sản phẩm
- `/admin/bai-viet` — Quản lý bài viết
- `/admin/bai-viet/them` — Thêm bài viết
- `/admin/bai-viet/[id]` — Sửa bài viết
- `/admin/bai-viet/dang-hang-loat` — Đăng bài tự động (bulk import Excel/CSV + ảnh theo ma_bai, hẹn giờ đăng)
- `/admin/don-hang` — Quản lý đơn hàng
- `/admin/don-hang/[id]` — Chi tiết đơn hàng
- `/admin/thanh-toan` — Quản lý thanh toán
- `/admin/thanh-toan/webhook-logs` — Webhook logs
- `/admin/banner` — Quản lý banner
- `/admin/thu-vien` — Thư viện media
- `/admin/tai-khoan` — Quản lý tài khoản
- `/admin/lien-he` — Liên hệ admin
- `/admin/danh-gia` — Quản lý đánh giá
- `/admin/nhat-ky` — Admin logs
- `/admin/cai-dat` — Cài đặt hệ thống

## API Routes

- `/api/health` — Health check
- `/api/products` — CRUD sản phẩm
- `/api/posts` — CRUD bài viết
- `/api/orders` — CRUD đơn hàng
- `/api/payments` — Thanh toán
- `/api/upload` — Upload ảnh (WebP, sharp)
- `/api/auth/*` — Auth (next-auth + OTP email)
- `/api/users` — Quản lý users
- `/api/banners` — Banners
- `/api/categories` — Danh mục
- `/api/contacts` — Liên hệ
- `/api/minigame/*` — Mini game (start, submit-score, get-points, exchange-voucher)
- `/api/reviews` — Đánh giá
- `/api/admin/stats` — Dashboard stats
- `/api/admin/settings` — Cài đặt
- `/api/admin-logs` — Admin logs
- `/api/webhooks/payment` — Payment webhook (PayOS/VietQR)
- `/api/webhooks/logs` — Webhook logs

## Package Scripts

```
npm run dev          # next dev
npm run build        # next build --webpack
npm run start        # next start
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run seed         # Seed database
npm run db:push      # prisma db push
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
npm run images:optimize:dry-run   # dry-run WebP optimize
npm run images:optimize           # apply WebP optimize
npm run media:convert-webp        # convert uploads to WebP
```

## Brand

- Primary red: #e41d1d
- Cream: #fff7f2
- Pink: #ffd6d6
- Coral: #ff6b6b
- Yellow: #ffe7a3
- Kraft brown: #b9794b
- Soft black: #2b2b2b
- Heading font: Paytone One
- Body font: Montserrat
- Slogan: "Làm bằng tay, Trao bằng tim"
- Brand message: "Từ từng hạt nhỏ, tạo phong cách riêng"
- Visual: Logo nấm đỏ pixel, hạt vòng, charm, sticker, trái tim, sao, nơ, dây vòng, tag cảm ơn, hộp quà, giấy xé/doodle handmade

## Non-negotiables

- KHÔNG xóa: .env, public/uploads, backups/, migrations/, ecosystem.config.js, package-lock.json
- KHÔNG commit: .env, .env.*, node_modules, .next, backups, *.sql, *.dump, logs, secret, private keys
- KHÔNG reset production database hoặc chạy `prisma migrate reset`
- KHÔNG dùng Docker cho production
- KHÔNG dùng `ignoreBuildErrors: true` hoặc `continue-on-error` để che lỗi TypeScript/build
- KHÔNG báo hoàn tất nếu: build fail, PM2 lỗi, route chính trả 500, CSS/JS sai MIME, ảnh/QR broken
- KHÔNG sửa logic nghiệp vụ (payment, checkout, order flow) nếu chưa được yêu cầu rõ ràng

## Required checks before meaningful changes

```
git status                    # Kiểm tra working tree
# Đọc file liên quan trước khi sửa
# Xác định component/API/schema sẽ bị ảnh hưởng
# Lên plan ngắn gọn
```

## Required checks before completion

```
npm ci
npx prisma generate           # Bắt buộc nếu có Prisma thay đổi
npm run typecheck             # tsc --noEmit
npm run build                 # next build --webpack
# Kiểm tra routes chính
# Kiểm tra CSS/JS MIME headers
# Kiểm tra ảnh không broken
# Kiểm tra PM2 logs nếu đã deploy
```

## UX/UI Rules

- Mobile-first. Không horizontal scroll trên mobile.
- Product image ratio 3:4.
- Brand: trẻ trung, handmade, cute, cá nhân hóa, cảm xúc — nhưng professional, không trẻ con.
- Animation: chỉ dùng transform/opacity. Hỗ trợ `prefers-reduced-motion`.
- Tránh dependency nặng không cần thiết.
- CTA rõ ràng, contrast đủ (WCAG AA), tap target ≥ 44px.
- Empty/loading/error state phải có cho mọi data-driven component.

## Media Rules

- Upload URL public: `/uploads/<filename>` (không dùng `/public/uploads`, `localhost`, `127.0.0.1`, absolute path)
- Ảnh upload mới: tự động convert WebP quality 85 qua sharp
- Chỉ cho phép: jpeg, png, webp, avif
- Filename: UUID (không expose tên gốc)
- Luôn có fallback cho user-facing image

## Deploy procedure (PM2 standalone)

```bash
cd /var/www/mushroomie
git status
git pull origin main
npm ci
npx prisma generate
npm run build
# Nếu có migration mới:
npx prisma migrate deploy
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
pm2 restart mushroomie_pm2
pm2 save
pm2 logs mushroomie_pm2 --lines 150 --nostream
```

## Custom slash commands

- `/audit-ux-ui` — Audit và sửa lỗi UX/UI toàn site
- `/audit-production` — Audit health production (PM2, Nginx, MySQL, logs)
- `/fix-media-upload` — Kiểm tra và sửa lỗi upload/ảnh/WebP
- `/deploy-production` — Deploy an toàn lên production
- `/verify-production` — Verify routes, MIME, ảnh sau deploy

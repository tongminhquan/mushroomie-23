# Mushroomie — Phụ kiện Handmade Cá nhân hóa

## Giới thiệu

**Mushroomie** là website thương mại điện tử bán phụ kiện handmade cá nhân hóa dành cho giới trẻ.

## Tech Stack

- **Next.js 14** (App Router)
- **MySQL 8** + **Prisma ORM**
- **NextAuth.js v5** (Authentication)
- **Tailwind CSS** (Styling)
- **Tiptap** (Rich text editor)
- **Nodemailer** (Email)
- **Zustand** (State management)
- **Zod** (Validation)

## Yêu cầu hệ thống

- Node.js >= 18
- MySQL 8.0+
- npm >= 9

## Cài đặt

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd mushroomie
npm install
```

### 2. Cấu hình environment

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
DATABASE_URL="mysql://root:password@localhost:3306/mushroomie"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
PAYMENT_PROVIDER=vietqr_casso
BANK_BIN=970436
BANK_ACCOUNT_NUMBER=your-account-number
BANK_ACCOUNT_NAME=YOUR NAME
# ... (xem .env.example đầy đủ)
```

### 3. Tạo database MySQL

```sql
CREATE DATABASE mushroomie CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Chạy migration

```bash
npx prisma migrate dev --name init
```

### 5. Seed dữ liệu mẫu

```bash
npx prisma db seed
```

Tài khoản mặc định:
- **Admin**: `admin@mushroomie.vn` / `Admin@123`
- **User test**: `user@mushroomie.vn` / `User@123`

### 6. Thêm font Cooper BT (tuỳ chọn)

Bỏ file font vào `/public/fonts/`:
- `CooperBT-Bold.woff2`
- `CooperBT-Bold.woff`

### 7. Chạy development server

```bash
npm run dev
```

Truy cập: http://localhost:3000

Admin panel: http://localhost:3000/admin

## Cấu hình Payment Provider

### VietQR + Casso (Recommended)

1. Đăng ký tài khoản tại [casso.vn](https://casso.vn)
2. Kết nối tài khoản ngân hàng
3. Lấy API key và webhook secret
4. Cấu hình trong `.env`:

```env
PAYMENT_PROVIDER=vietqr_casso
PAYMENT_WEBHOOK_SECRET=your-casso-webhook-secret
PAYMENT_API_KEY=your-casso-api-key
BANK_BIN=970436
BANK_ACCOUNT_NUMBER=your-account
BANK_ACCOUNT_NAME=YOUR NAME
```

5. Cấu hình webhook URL trong Casso: `https://your-domain.com/api/webhooks/payment`

### VietQR + SePay

```env
PAYMENT_PROVIDER=vietqr_sepay
PAYMENT_WEBHOOK_SECRET=your-sepay-webhook-secret
PAYMENT_API_KEY=your-sepay-api-key
```

### Bank BIN Codes phổ biến

| Ngân hàng | BIN |
|---|---|
| Vietcombank | 970436 |
| Techcombank | 970407 |
| MB Bank | 970422 |
| VPBank | 970432 |
| Agribank | 970405 |
| BIDV | 970418 |
| Vietinbank | 970415 |

## Cấu hình Email

### Gmail SMTP

1. Bật 2FA cho Gmail
2. Tạo App Password: Google Account → Security → App Passwords
3. Cấu hình `.env`:

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM="Mushroomie <your-email@gmail.com>"
```

### Resend (Khuyến nghị cho production)

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="Mushroomie <noreply@mushroomie.vn>"
```

## Cấu trúc thư mục

```
src/
├── app/
│   ├── (user)/          # User-facing pages
│   ├── admin/           # Admin pages
│   └── api/             # API routes
├── components/          # React components
├── lib/                 # Utilities & services
│   └── payment/         # Payment adapter
├── store/               # Zustand stores
└── types/               # TypeScript types
```

## Deploy

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Lưu ý webhook khi deploy

Webhook URL phải là public HTTPS URL. Cập nhật trong provider dashboard và `.env`:

```env
APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

## Giấy phép

MIT © 2024 Mushroomie

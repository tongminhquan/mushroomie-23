# Mushroomie — Cowork / Claude Code Setup Guide

## Mở project bằng Claude Cowork

1. Mở Claude Desktop → chọn chế độ **Cowork**
2. Kết nối thư mục project: `C:\Users\Admin\OneDrive\Tài liệu\mushroomie`
3. KHÔNG cấp quyền toàn ổ C:\ — chỉ cấp thư mục project

## Slash commands có sẵn

Gõ `/` trong Cowork để xem danh sách, hoặc dùng trực tiếp:

| Command | Mục đích |
|---|---|
| `/setup-coworks` | Thiết lập lại môi trường làm việc Claude cho project |
| `/audit-ux-ui` | Audit và sửa lỗi UX/UI toàn site (user + admin) |
| `/audit-production` | Audit health production: PM2, Nginx, MySQL, logs, bảo mật |
| `/fix-media-upload` | Kiểm tra và sửa lỗi upload ảnh / WebP / broken images |
| `/deploy-production` | Deploy an toàn lên production với PM2 standalone |
| `/verify-production` | Verify routes, MIME, ảnh, PM2 logs sau deploy |

## Quy tắc bất biến (không được phá vỡ)

- ❌ KHÔNG commit: `.env`, `node_modules`, `.next`, `backups/`, `*.sql`, `*.dump`, secret
- ❌ KHÔNG xóa: `public/uploads/`, `backups/`, `ecosystem.config.js`, `package-lock.json`
- ❌ KHÔNG reset production database
- ❌ KHÔNG dùng Docker cho production

## Quy trình deploy PM2 (standalone mode)

```bash
cd /var/www/mushroomie
git status
git pull origin main
npm ci
npx prisma generate
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
pm2 restart mushroomie_pm2
pm2 save
pm2 logs mushroomie_pm2 --lines 150 --nostream
```

## Checklist trước khi báo hoàn tất

- [ ] `npm run typecheck` pass (không có TypeScript error)
- [ ] `npm run build` thành công (không build fail)
- [ ] PM2 không có error logs sau restart
- [ ] Routes chính trả HTTP 200 (không 500)
- [ ] CSS/JS có đúng MIME type
- [ ] Ảnh không broken (logo, banner, product, uploads)
- [ ] KHÔNG có secret trong git diff

## Scripts có sẵn trong package.json

```
npm run dev                   # Local dev
npm run build                 # Production build (webpack)
npm run start                 # Start production server
npm run lint                  # ESLint
npm run typecheck             # TypeScript check (tsc --noEmit)
npm run db:migrate            # Prisma migrate dev
npm run db:studio             # Prisma Studio GUI
npm run images:optimize       # Convert uploads sang WebP (apply)
npm run images:optimize:dry-run  # Dry-run WebP convert
```

## Stack nhanh

- **Framework:** Next.js 16.2.6, App Router, TypeScript
- **DB:** Prisma 5 + MySQL
- **Auth:** next-auth v5 beta
- **Payment:** PayOS + VietQR
- **Images:** sharp (WebP), next/image
- **Styling:** Tailwind CSS v4
- **Rich text:** TipTap v3

## Production info

- URL: https://mushroomie.io.vn
- Server: 103.173.226.86
- Path: /var/www/mushroomie
- PM2 process: `mushroomie_pm2` (port 3001)
- Branch: main
- Remote: https://github.com/tongminhquan/mushroomie-23.git

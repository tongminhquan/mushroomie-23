# Mushroomie - Cowork / Claude Code Setup Guide

Tai lieu onboarding cho thanh vien cong tac tren du an Mushroomie, kem quy trinh lam viec voi Claude Code/Cowork va cac lenh kiem tra production.

## 1. Mo project bang Claude Cowork

1. Mo Claude Desktop va chon che do **Cowork**.
2. Ket noi dung thu muc project: `C:\Users\Admin\OneDrive\Tai lieu\mushroomie`.
3. Chi cap quyen cho thu muc project, khong cap quyen toan o `C:\`.

## 2. Yeu cau moi truong

- **Node.js** 20+.
- **MySQL** dang chay va truy cap duoc. Prisma dung provider `mysql`.
- File **`.env`** o thu muc goc. File nay bi `.gitignore` bo qua va khong duoc commit.
- Bien moi truong toi thieu:
  - `DATABASE_URL`: chuoi ket noi MySQL.
  - `AUTH_SECRET` hoac `NEXTAUTH_SECRET`: dung cho NextAuth v5 beta.
  - PayOS/VietQR va SMTP variables neu chay thanh toan hoac email OTP.

> Build local co the in `prisma:error ... DATABASE_URL` khi khong co `.env`. Neu build van exit code 0 va TypeScript khong loi, day la canh bao da biet vi cac route du lieu duoc render dynamic.

## 3. Cai dat va chay local

```bash
npm install
npm run db:push
npm run seed
npm run dev
```

## 4. Scripts trong package.json

| Lenh | Tac dung |
|---|---|
| `npm run dev` | Chay local dev server |
| `npm run build` | Build production bang `next build --webpack` |
| `npm run start` | Start ban production da build |
| `npm run typecheck` | Chay `tsc --noEmit` |
| `npm run lint` | Chay ESLint |
| `npm run db:migrate` | Tao va ap Prisma migration trong dev |
| `npm run db:push` | Dong bo schema Prisma vao DB |
| `npm run db:studio` | Mo Prisma Studio |
| `npm run images:optimize` | Convert uploads sang WebP |
| `npm run images:optimize:dry-run` | Dry-run convert uploads sang WebP |

## 5. Luu y ky thuat rieng

- **Next.js 16.2.6 la ban co thay doi so voi Next.js pho bien.** Doc `node_modules/next/dist/docs/` va `AGENTS.md` truoc khi sua API/convention cua Next.
- **Khong commit secret hoac du lieu production:** `.env`, `node_modules`, `.next`, `backups/`, `*.sql`, `*.dump`, log nhay cam.
- **Khong xoa du lieu quan trong:** `public/uploads/`, `backups/`, `ecosystem.config.js`, `package-lock.json`, database, migration, user/order/voucher/payment data.
- **Production khong dung Docker mac dinh.** Runtime hien tai la PM2 standalone.

## 6. Slash commands co san

Go `/` trong Claude Code/Cowork de xem danh sach command. Moi command la mot file Markdown trong `.claude/commands/`.

| Command | Muc dich |
|---|---|
| `/build` | Build production va tom tat loi/route |
| `/typecheck` | Chay TypeScript check |
| `/lint` | Chay ESLint |
| `/db-push` | Dong bo schema vao DB, co canh bao data-loss/production |
| `/seed` | Nap du lieu mau, chi dung dev/staging |
| `/cowork` | Tom tat nhanh quy trinh va lenh cowork |
| `/setup-coworks` | Thiet lap lai moi truong lam viec Claude cho project |
| `/audit-ux-ui` | Audit va sua loi UX/UI user site va admin |
| `/audit-production` | Audit health production: PM2, Nginx, MySQL, logs, bao mat |
| `/fix-media-upload` | Kiem tra va sua upload anh, WebP, broken images |
| `/deploy-production` | Deploy an toan len production voi PM2 standalone |
| `/verify-production` | Verify routes, MIME, anh, PM2 logs sau deploy |

## 7. Quy uoc branch va commit

- Branch chinh: `main`.
- Branch tinh nang nen dung tien to theo cong cu/nguoi, vi du `codex/<mo-ta-ngan>`.
- Commit theo Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`.
- Khong tao commit test vo nghia.

## 8. Quy trinh deploy PM2

Production server:

- URL: `https://mushroomie.io.vn`
- Server: `103.173.226.86`
- Path: `/var/www/mushroomie`
- PM2 process: `mushroomie_pm2`
- App port: `3001`
- Branch: `main`

Lenh deploy co ban:

```bash
cd /var/www/mushroomie
git status
git pull origin main
npm ci
npx prisma generate
npm run build
pm2 restart mushroomie_pm2
pm2 save
pm2 logs mushroomie_pm2 --lines 150 --nostream
```

Neu dung script deploy cua du an, uu tien:

```bash
cd /var/www/mushroomie
git pull origin main
bash deploy.sh
```

## 9. Checklist truoc khi bao hoan tat

- `npm run typecheck` pass.
- `npm run build` pass.
- Lint khong co error neu nam trong pham vi task.
- PM2 online sau restart.
- Routes chinh tra 200 hoac redirect auth hop ly.
- CSS tra `text/css`.
- JS tra `application/javascript` hoac `text/javascript`.
- Logo, favicon, banner, product image, blog image, uploads va QR khong broken.
- Khong co secret trong git diff.

## 10. Stack nhanh

- Framework: Next.js 16.2.6, App Router, TypeScript
- Database: Prisma 5 + MySQL
- Auth: next-auth v5 beta
- Payment: PayOS + VietQR
- Images: sharp, WebP, next/image
- Styling: Tailwind CSS v4
- Rich text: TipTap v3

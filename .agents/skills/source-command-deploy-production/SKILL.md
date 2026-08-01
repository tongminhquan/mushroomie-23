---
name: "source-command-deploy-production"
description: "Deploy Mushroomie safely to production with PM2 standalone mode."
---

# source-command-deploy-production

Use this skill when the user asks to run the migrated source command `deploy-production`.

## Command Template

Bạn là senior DevOps engineer. Deploy Mushroomie lên production an toàn.

## Production info

- Path: /var/www/mushroomie
- Branch: main
- PM2 process: mushroomie_pm2
- App port: 3001
- Mode: standalone (server.js từ .next/standalone)
- No Docker

## Quy trình deploy

```bash
cd /var/www/mushroomie

# 1. Kiểm tra working tree
git status
# Nếu bẩn: báo rõ, KHÔNG git reset --hard mà không hỏi

# 2. Pull code
git pull origin main

# 3. Cài dependencies
npm ci

# 4. Generate Prisma client
npx prisma generate

# 5. Build
npm run build

# 6. Copy static assets sang standalone (QUAN TRỌNG với standalone mode)
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# 7. Migration nếu có schema mới
# npx prisma migrate deploy  # chỉ chạy nếu có migration mới

# 8. Restart PM2
pm2 restart mushroomie_pm2
pm2 save

# 9. Kiểm tra logs
pm2 logs mushroomie_pm2 --lines 150 --nostream

# 10. Verify routes
curl -I https://mushroomie.io.vn
curl -I https://mushroomie.io.vn/san-pham
curl -s https://mushroomie.io.vn/api/health
```

## Ràng buộc

- KHÔNG báo xong nếu: build fail, PM2 lỗi, route chính trả 500, CSS/JS sai MIME
- KHÔNG dùng `--force` hoặc `git reset --hard` mà không hỏi
- KHÔNG migrate nếu không chắc schema thay đổi
- KHÔNG xóa .env, public/uploads, backups

## Sau deploy

Chạy `/verify-production` để kiểm tra toàn diện.

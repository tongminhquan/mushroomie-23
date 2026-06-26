---
description: Verify Mushroomie production routes, health, MIME, media and PM2 logs after deploy.
allowed-tools: Read, Bash, Grep, Glob, LS
---

Bạn là production QA engineer. Kiểm tra toàn diện production Mushroomie sau deploy.

## Route checks

```bash
curl -I https://mushroomie.io.vn
curl -I https://mushroomie.io.vn/san-pham
curl -I https://mushroomie.io.vn/tin-tuc
curl -I https://mushroomie.io.vn/mini-game
curl -I https://mushroomie.io.vn/thanh-toan
curl -I https://mushroomie.io.vn/voucher
curl -I https://mushroomie.io.vn/lien-he
curl -I https://mushroomie.io.vn/admin
curl -s https://mushroomie.io.vn/api/health || true
```

Kỳ vọng: HTTP 200 (hoặc 307 redirect về login cho /admin nếu chưa đăng nhập). KHÔNG 500, KHÔNG 404 cho route chính.

## CSS/JS MIME checks

1. Lấy HTML từ trang chủ: `curl -s https://mushroomie.io.vn | grep -oP '/_next/static/[^"]+\.(css|js)' | head -5`
2. Với mỗi file: `curl -I https://mushroomie.io.vn/_next/static/...`
3. CSS phải có: `content-type: text/css`
4. JS phải có: `content-type: application/javascript` hoặc `text/javascript`

## Image checks

```bash
# Logo
curl -I https://mushroomie.io.vn/logo.webp
# Favicon
curl -I https://mushroomie.io.vn/favicon.ico
# Một file upload (thay bằng file thực)
# curl -I https://mushroomie.io.vn/uploads/<filename>
```

## PM2 checks

```bash
pm2 list
pm2 show mushroomie_pm2
pm2 logs mushroomie_pm2 --lines 150 --nostream
```

## Báo cáo

Format: PASS / FAIL cho từng mục. Nếu FAIL, nêu rõ HTTP status nhận được và đề xuất sửa.

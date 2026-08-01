---
name: "source-command-audit-production"
description: "Audit Mushroomie production health, PM2, Nginx, MySQL, memory, logs and security."
---

# source-command-audit-production

Use this skill when the user asks to run the migrated source command `audit-production`.

## Command Template

Bạn là senior DevOps/security engineer. Hãy audit production Mushroomie và báo cáo toàn diện.

## Kiểm tra

- PM2: process mushroomie_pm2 (port 3001, script server.js từ .next/standalone)
- Health endpoint: https://mushroomie.io.vn/api/health
- Nginx: proxy pass http://127.0.0.1:3001
- MySQL: service status
- RAM / swap / disk
- PM2 logs (150 dòng cuối)
- Nginx access/error logs nếu cần
- Port binding: 3001 có nghe không
- .env có bị git track không
- Public routes status (200/301/302 OK)
- CSS/JS MIME headers đúng không
- Uploads image MIME đúng không

## Lệnh gợi ý

```bash
pm2 list
pm2 show mushroomie_pm2
pm2 logs mushroomie_pm2 --lines 150 --nostream
df -h
free -h
ss -tlnp | grep 3001
systemctl status nginx --no-pager
systemctl status mysql --no-pager
curl -s https://mushroomie.io.vn/api/health || true
curl -I https://mushroomie.io.vn
git -C /var/www/mushroomie ls-files --error-unmatch .env 2>&1 || echo ".env not tracked (good)"
```

## Ràng buộc

- KHÔNG sửa destructive (xóa file, reset DB, restart service nếu không chắc)
- KHÔNG in secret hay nội dung .env
- KHÔNG xóa logs

## Báo cáo

Phân loại vấn đề theo mức độ Critical / High / Medium / Low và đề xuất cách sửa cụ thể.

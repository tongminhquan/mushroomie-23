# Mushroomie Production Runbook (PM2 Runtime)

## 1. Tổng quan hệ thống
- **Domain:** `https://mushroomie.io.vn`
- **Server IP:** `103.173.226.86`
- **Runtime:** PM2 (App name: `mushroomie_pm2`)
- **Database:** MySQL cài đặt trực tiếp trên VPS (port 3306).
- **Upload Volume:** Ghi trực tiếp vào `/var/www/mushroomie/public/uploads`.
- **Reverse Proxy:** Nginx trên VPS trỏ vào `http://127.0.0.1:3001`.
- **Git Branch:** `main`

## 2. Cấu trúc thư mục Production
```txt
/var/www/mushroomie
├── .next/standalone/     # Thư mục chứa production bundle chạy thực tế
├── ecosystem.config.js   # File cấu hình PM2
├── public/uploads        # Chứa toàn bộ ảnh upload thật
├── backups/              # Chứa các file nén backup định kỳ (chmod 700)
│   ├── db/               # MySQL dumps
│   ├── uploads/          # Uploads archives
│   └── logs/             # Chứa log của cron backup
└── scripts/              
    └── backup-production.sh # Script auto backup
```

## 3. Lệnh kiểm tra nhanh hệ thống
Thực hiện trên VPS thông qua SSH:
```bash
cd /var/www/mushroomie
pm2 status
pm2 logs mushroomie_pm2 --lines 50
curl -I https://mushroomie.io.vn
du -sh public/uploads
du -sh backups
```

## 4. Quy trình Deploy chuẩn
Khi có thay đổi trên nhánh `main`:
```bash
cd /var/www/mushroomie
git pull origin main
npm ci
npx prisma generate
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp .env .next/standalone/
pm2 restart mushroomie_pm2
pm2 logs mushroomie_pm2
```

## 5. Quy trình kiểm tra sau Deploy
1. **Homepage:** Đảm bảo HTTP 200 OK.
2. **Admin:** Thử login và truy cập dashboard.
3. **Media:** Banner và ảnh sản phẩm phải hiển thị đầy đủ.
4. **MIME Types:** Kiểm tra các file CSS/JS.
5. **Uploads:** Thử upload 1 file test từ admin panel.

## 6. Quy trình Backup thủ công
Hệ thống tự động backup lúc 02:30 sáng hằng ngày. Nếu cần chạy bằng tay:
```bash
cd /var/www/mushroomie
./scripts/backup-production.sh
```

## 7. Quy trình Khôi phục (Restore)
### 7.1. Restore Uploads
```bash
tar -xzf backups/uploads/uploads-YYYY-MM-DD-HHMMSS.tar.gz -C /var/www/mushroomie
cp -r /var/www/mushroomie/public/uploads /var/www/mushroomie/.next/standalone/public/
pm2 restart mushroomie_pm2
```

### 7.2. Restore MySQL
```bash
gunzip -c backups/db/mysql-YYYY-MM-DD-HHMMSS.sql.gz | mysql -u <db_user> -p <db_name>
```

## 8. Cảnh báo Restore
- LUÔN TẠO BACKUP HIỆN TRẠNG (chạy tay script backup) trước khi đè bất kỳ bản restore nào.
- Không in mật khẩu database ra log, không lưu vào `.bash_history`.

## 9. Quy trình Rollback (Khi deploy bị lỗi)
1. Xác định commit hash ổn định trước đó: `git log`
2. Rollback mã nguồn: `git checkout <commit_hash>`
3. Build lại: Thực hiện quy trình Deploy Chuẩn (Bước 4).
4. Xác minh hệ thống.
5. Sau khi xử lý xong, revert thay đổi trên GitHub rồi pull lại nhánh main.

## 10. Đề xuất Backup Offsite
Hiện tại backup chỉ nằm trong VPS.
**Các phương án đề xuất:**
1. Cloudflare R2 (Khuyến nghị vì rẻ, dễ cấu hình chung với Cloudflare).
2. Google Drive qua rclone.

## 11. Monitor & Healthcheck
Hệ thống cung cấp endpoint healthcheck tại:
`GET https://mushroomie.io.vn/api/health`

### 11.1. Uptime Monitoring
Sử dụng UptimeRobot (hoặc Uptime Kuma) giám sát vào `https://mushroomie.io.vn/api/health`.

## 12. Quản lý dung lượng (Disk)
VPS đã bỏ Docker để tránh full disk.
Kiểm tra dung lượng disk:
```bash
df -h
du -sh /var/www/mushroomie/*
```
Nếu disk đầy do log của PM2:
```bash
pm2 flush
```

## 13. Security Headers
Hệ thống đã bật sẵn `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, và `Content-Security-Policy`.

## 14. Cron jobs

Tất cả cron endpoint đều xác thực bằng `Bearer $CRON_SECRET`. Thiếu `CRON_SECRET` trong `.env` → endpoint luôn trả 401, không bao giờ mở public.

| Endpoint | Tần suất đề xuất | Ghi chú |
|---|---|---|
| `/api/cron/publish-scheduled-posts` | mỗi 5 phút | Backstop cho job in-process |
| `/api/cron/review-requests` | mỗi ngày 1 lần | Email xin đánh giá — **tắt mặc định** |

### 14.1. Email xin đánh giá (`/api/cron/review-requests`)

Gửi email mời đánh giá cho đơn `COMPLETED` sau 3 ngày, tối đa 25 email/lần chạy. Mục đích: có review thật để Product schema gắn được `aggregateRating` (sao vàng trên SERP).

**Chạy thử (dry run) — không gửi email, chỉ liệt kê đơn đủ điều kiện:**

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" https://mushroomie.io.vn/api/cron/review-requests
```

**Bật gửi thật** — thêm vào `.env` rồi `pm2 restart mushroomie_pm2`:

```bash
REVIEW_REQUEST_EMAILS_ENABLED=true
```

**Đăng ký crontab (chạy 09:00 hằng ngày):**

```bash
0 9 * * * curl -sS -H "Authorization: Bearer $CRON_SECRET" https://mushroomie.io.vn/api/cron/review-requests >> /var/log/mushroomie-cron.log 2>&1
```

An toàn khi chạy lặp: mỗi đơn chỉ gửi một lần (chốt bằng bảng `email_logs`), khách bấm huỷ đăng ký sẽ không nhận email loại này nữa. Kiểm tra kết quả gửi:

```bash
mysql -e "SELECT status, COUNT(*) FROM email_logs WHERE template_key='review_request' GROUP BY status;" mushroomie
```

## 15. Các lỗi thường gặp và cách xử lý
- **Lỗi 502 Bad Gateway:** PM2 đang bị sập hoặc lỗi khi khởi động. Chạy `pm2 logs mushroomie_pm2` để check.
- **Disk đầy do cache build:** Xóa thư mục `.next/cache` nếu dung lượng lên quá cao: `rm -rf /var/www/mushroomie/.next/cache/*`
- **Ảnh upload không hiện:** Do thiếu copy `public/uploads` sang `.next/standalone/public/`. Chạy lệnh `cp -r public/uploads .next/standalone/public/` và restart PM2.

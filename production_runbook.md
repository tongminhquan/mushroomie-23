# Mushroomie Production Runbook

## 1. Tổng quan hệ thống
- **Domain:** `https://mushroomie.io.vn`
- **Server IP:** `103.173.226.86`
- **Runtime:** Docker (Container `mushroomie_web`)
- **Database:** MySQL cài đặt trực tiếp trên VPS (port 3306), container web dùng `network_mode: "host"` để truy cập.
- **Upload Volume:** `/var/www/mushroomie/public/uploads` map vào `/app/public/uploads`.
- **Reverse Proxy:** Nginx trên VPS trỏ vào `http://localhost:3000`.
- **Git Branch:** `main`

## 2. Cấu trúc thư mục Production
```txt
/var/www/mushroomie
├── public/uploads        # Chứa toàn bộ ảnh upload thật, không bị mất khi deploy
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
docker compose ps
docker logs mushroomie_web --tail=100
curl -I https://mushroomie.io.vn
du -sh public/uploads
du -sh backups
```

## 4. Quy trình Deploy chuẩn
Khi có thay đổi trên nhánh `main`:
```bash
cd /var/www/mushroomie
git pull origin main
docker compose up -d --build
docker compose logs --tail=100
```

## 5. Quy trình kiểm tra sau Deploy
1. **Homepage:** Đảm bảo HTTP 200 OK.
2. **Admin:** Thử login và truy cập dashboard.
3. **Media:** Banner và ảnh sản phẩm phải hiển thị đầy đủ.
4. **MIME Types:** File JS và CSS (`_next/static/chunks/`) không được phép bị lỗi `text/plain`.
5. **Uploads:** Thử upload 1 file test từ admin panel để xác nhận quyền write vẫn hoạt động.

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
docker compose restart web
```

### 7.2. Restore MySQL
```bash
gunzip -c backups/db/mysql-YYYY-MM-DD-HHMMSS.sql.gz | mysql -u <db_user> -p <db_name>
```

## 8. Cảnh báo Restore
- Chỉ restore khi hệ thống thực sự gặp sự cố hỏng hóc hoặc mất dữ liệu.
- LUÔN TẠO BACKUP HIỆN TRẠNG (chạy tay script backup) trước khi đè bất kỳ bản restore nào.
- Không in mật khẩu database ra log, không lưu vào `.bash_history`.
- Không tự ý đè dữ liệu nếu chưa thông báo rõ cho các chủ sở hữu hệ thống.

## 9. Quy trình Rollback (Khi deploy bị lỗi)
1. Xác định commit hash ổn định trước đó: `git log`
2. Rollback mã nguồn: `git checkout <commit_hash>`
3. Rebuild Docker: `docker compose up -d --build`
4. Xác minh hệ thống.
5. Sau khi xử lý xong, revert thay đổi trên GitHub rồi pull lại nhánh main.

## 10. Đề xuất Backup Offsite (Đang thiếu)
**Rủi ro:** Hiện tại toàn bộ backup chỉ lưu trên cùng một VPS. Nếu VPS hỏng phần cứng hoặc bị xóa nhầm máy ảo, toàn bộ mã nguồn và backup sẽ mất trắng.
**Giải pháp:** Cần thiết lập rclone đẩy dữ liệu lên S3, Google Drive hoặc Cloudflare R2 định kỳ mỗi tuần. (Lưu ý: Không lưu credentials của Rclone vào GitHub repository).

## 11. Đề xuất Monitor & Healthcheck
**Rủi ro:** Hệ thống có thể sập nhưng Docker không tự restart nếu Next.js bị kẹt node process thay vì crash hẳn.
**Giải pháp:** Cần phát triển một route `/api/health` trong Next.js:
```json
{ "status": "ok", "time": "ISO_DATE", "database": "ok" }
```
Sau đó thêm Docker Healthcheck vào `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

## 12. Các lỗi thường gặp và cách xử lý
- **Website trắng (ChunkLoadError):** Lỗi Nginx đọc sai đường dẫn static. Sửa bằng cách proxy_pass hoàn toàn vào `http://localhost:3000`.
- **Lỗi CSS/JS trả về text/plain:** Tương tự như trên.
- **Upload ảnh xong bị mất sau deploy:** Chưa có volume mapping. Sửa bằng `./public/uploads:/app/public/uploads`.
- **Xung đột MySQL Port 3306:** Bỏ container `db` trong docker-compose, dùng `network_mode: "host"` để truy cập MySQL trực tiếp.
- **Disk đầy:** Chạy `docker image prune -a` hoặc xóa bớt backup cũ. (Hiện VPS còn trống khoảng 5GB, mỗi 30 ngày backup tốn ~1GB, nên cân nhắc giảm retention xuống 14 ngày nếu thấy thiếu dung lượng).

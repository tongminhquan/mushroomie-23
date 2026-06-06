# Mushroomie Incident Checklist (PM2)

Bộ tài liệu này chứa các kịch bản xử lý lỗi khẩn cấp trên Production. Hãy làm theo đúng thứ tự các lệnh để khoanh vùng và khắc phục lỗi.

## 1. Website không vào được (Trắng trang, Timeout)
```bash
# B1: Test kết nối HTTP
curl -I https://mushroomie.io.vn

# B2: Kiểm tra trạng thái PM2
pm2 list

# B3: Xem log Next.js (chú ý lỗi Prisma, Node)
pm2 logs mushroomie_pm2 --lines 100

# B4: Kiểm tra Nginx proxy
sudo nginx -t
sudo systemctl status nginx
```

## 2. Server Down (Sập PM2, Lỗi restart loop)
```bash
# B1: Lấy danh sách tiến trình PM2
pm2 list

# B2: Kiểm tra nguyên nhân crash
pm2 logs mushroomie_pm2 --lines 200

# B3: Thử khởi động lại an toàn
pm2 restart mushroomie_pm2
```

## 3. Lỗi giao diện tĩnh (Static Chunk / MIME lỗi)
Lỗi này thường do cấu hình Nginx hoặc build lỗi.
```bash
# B1: Đọc mã HTML xem link chunk sinh ra
curl -s https://mushroomie.io.vn | grep -o "/_next/static/[^\`"']*" | head

# B2: Test một file JS cụ thể
curl -I https://mushroomie.io.vn/_next/static/chunks/<chunk>.js

# B3: Test một file CSS cụ thể
curl -I https://mushroomie.io.vn/_next/static/chunks/<chunk>.css
```

## 4. Ảnh không hiển thị / Lỗi 404 Media
```bash
# B1: Kiểm tra dung lượng thư mục gốc trên Host VPS
du -sh /var/www/mushroomie/public/uploads

# B2: Đếm số lượng ảnh
find /var/www/mushroomie/public/uploads -type f | wc -l

# B3: Kiểm tra xem ảnh đã được copy vào folder standalone chưa (Sau khi build)
ls -la /var/www/mushroomie/.next/standalone/public/uploads/

# B4: Test đường dẫn ảnh từ mạng ngoài
curl -I https://mushroomie.io.vn/uploads/<file_name>.webp
```

## 5. Database lỗi (Connection Refused, Prisma Error)
```bash
# B1: Xem cấu hình .env có bị sai/đổi không (KHÔNG IN PASSWORD)
grep DATABASE_URL /var/www/mushroomie/.env

# B2: Xem log Prisma
pm2 logs mushroomie_pm2 --lines 100 | grep -i prisma
```

## 6. Disk đầy (Hết dung lượng VPS)
Nếu ổ cứng trên 95%, hệ thống sẽ treo.
```bash
# B1: Chạy script kiểm tra
cd /var/www/mushroomie && ./scripts/check-disk.sh

# B2: Xem tổng quan disk
df -h

# B3: Quét dung lượng các thư mục nặng
du -sh /var/www/mushroomie/public/uploads /var/www/mushroomie/backups /var/www/mushroomie/.next

# B4: Dọn rác an toàn (Xóa log của PM2)
pm2 flush
```

## 7. Backup lỗi (Không tự động sinh file)
```bash
# B1: Xem log backup
tail -100 /var/www/mushroomie/backups/logs/backup.log

# B2: Chạy lại thử lệnh script manual
cd /var/www/mushroomie && ./scripts/backup-production.sh

# B3: Xác nhận file có sinh ra mới không
ls -lh /var/www/mushroomie/backups/uploads | tail
ls -lh /var/www/mushroomie/backups/db | tail
```

## 8. Admin không đăng nhập được
- Kiểm tra log ứng dụng (`pm2 logs mushroomie_pm2 --lines 100`).
- Đảm bảo database vẫn sống và Next.js connect được (`curl https://mushroomie.io.vn/api/health`).
- Đảm bảo biến `<secret>` cho phiên đăng nhập (như `NEXTAUTH_SECRET`) trong file `.env` không bị mất.
- Không được tự ý reset hoặc cập nhật DB bằng tay nếu chưa dump toàn bộ CSDL ra ngoài dự phòng.

## 9. PM2 Restart Loop
Nếu app liên tục bị restart loop:
- B1: Kiểm tra xem port 3001 có bị chiếm dụng không (`ss -tulpn | grep 3001`).
- B2: Kiểm tra lại cấu hình `ecosystem.config.js`.
- B3: Fix lỗi code hoặc port, rồi chạy lại `pm2 restart mushroomie_pm2`.

# Mushroomie Incident Checklist

Bộ tài liệu này chứa các kịch bản xử lý lỗi khẩn cấp trên Production. Hãy làm theo đúng thứ tự các lệnh để khoanh vùng và khắc phục lỗi.

## 1. Website không vào được (Trắng trang, Timeout)
```bash
# B1: Test kết nối HTTP
curl -I https://mushroomie.io.vn

# B2: Kiểm tra trạng thái container Docker
docker compose ps

# B3: Xem log Next.js (chú ý lỗi Prisma, Node)
docker logs mushroomie_web --tail=100

# B4: Kiểm tra Nginx proxy
sudo nginx -t
sudo systemctl status nginx
```

## 2. Container Down (Exited, Restarting)
```bash
# B1: Lấy danh sách container
docker compose ps

# B2: Kiểm tra nguyên nhân crash
docker compose logs --tail=200

# B3: Thử khởi động lại an toàn
docker compose up -d
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
du -sh public/uploads

# B2: Đếm số lượng ảnh
find public/uploads -type f | wc -l

# B3: Kiểm tra trong container xem mount volume có bị ngắt không
docker exec mushroomie_web sh -c "du -sh /app/public/uploads && find /app/public/uploads -type f | wc -l"

# B4: Test đường dẫn ảnh từ mạng ngoài
curl -I https://mushroomie.io.vn/uploads/<file_name>.webp
```

## 5. Database lỗi (Connection Refused, Prisma Error)
```bash
# B1: Xem cấu hình .env có bị sai/đổi không (KHÔNG IN PASSWORD)
grep DATABASE_URL .env

# B2: Xem log Prisma
docker logs mushroomie_web --tail=100 | grep -i prisma

# B3: Xem log MySQL
docker logs mushroomie_web --tail=100 | grep -i mysql
```

## 6. Disk đầy (Hết dung lượng VPS)
Nếu ổ cứng trên 95%, hệ thống sẽ treo.
```bash
# B1: Xem tổng quan disk
df -h

# B2: Quét dung lượng các thư mục nặng
du -sh public/uploads backups .next node_modules

# B3: Kiểm tra dung lượng do Docker chiếm dụng
docker system df

# B4: Dọn rác an toàn (Xóa các container/image cũ)
docker image prune -a
```

## 7. Backup lỗi (Không tự động sinh file)
```bash
# B1: Xem log backup
tail -100 backups/logs/backup.log

# B2: Chạy lại thử lệnh script manual
./scripts/backup-production.sh

# B3: Xác nhận file có sinh ra mới không
ls -lh backups/uploads | tail
ls -lh backups/db | tail
```

## 8. Admin không đăng nhập được
- Kiểm tra log ứng dụng (`docker logs mushroomie_web --tail=100`).
- Đảm bảo database vẫn sống và Next.js connect được.
- Đảm bảo biến `<secret>` cho phiên đăng nhập (như `NEXTAUTH_SECRET`) trong file `.env` không bị mất.
- Không được tự ý reset hoặc cập nhật DB bằng tay nếu chưa dump toàn bộ CSDL ra ngoài dự phòng.

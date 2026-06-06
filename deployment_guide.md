# Hướng dẫn deploy Website Next.js (Mushroomie) lên VPS Ubuntu 24.04 LTS bằng Docker

**Địa chỉ IP VPS:** `103.173.226.86`
**Domain:** `https://mushroomie.io.vn`

Tài liệu này ghi nhận cấu hình hiện tại và hướng dẫn bạn chi tiết từng bước để quản lý, cập nhật (deploy) mã nguồn Next.js đã được Docker hóa.

---

## 1. Kiến trúc Deploy Hiện Tại

- **Máy chủ Database:** MySQL được cài đặt trực tiếp trên VPS host (port `3306`), giữ nguyên toàn bộ dữ liệu từ hồi chạy PM2.
- **Web App:** Next.js chạy trong Docker container (`mushroomie_web`), sử dụng `network_mode: "host"` để truy cập trực tiếp MySQL và lắng nghe trên port `3000` của host.
- **Reverse Proxy:** Nginx (cài trên VPS) proxy request từ port 80/443 vào `http://localhost:3000`. Điều này xử lý triệt để lỗi MIME Type (`text/plain`) và 404 static chunks mà PM2 từng gặp phải.
- **Quản lý Process:** Docker Daemon (thay thế cho PM2).

---

## 2. Cấu hình Docker Compose Chuẩn

Dưới đây là cấu hình `docker-compose.yml` chuẩn nhất đã được thiết lập để đảm bảo **không xung đột port**, **không mất ảnh upload** và **tự động khởi động lại**:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      network: host # Quan trọng: Cho phép quá trình build Next.js (Prisma) truy cập MySQL host
    container_name: mushroomie_web
    restart: unless-stopped # Quan trọng: Tự khởi động lại khi crash hoặc VPS reboot
    network_mode: "host" # Container dùng chung mạng với VPS, truy cập localhost bình thường
    env_file:
      - .env
    volumes:
      - ./public/uploads:/app/public/uploads # Quan trọng: Map thư mục upload ra ngoài host để không bị mất ảnh khi deploy lại
```

*(Lưu ý: Không thêm container `db` vào đây vì dự án đang xài MySQL gốc của VPS, nếu thêm sẽ gây lỗi conflict port 3306).*

---

## 3. Quy trình Cập nhật Code (Deploy)

Khi bạn có thay đổi code và đã push lên GitHub nhánh `main`, hãy SSH vào VPS và làm theo 3 bước sau:

1. **Di chuyển vào thư mục dự án:**
   ```bash
   cd /var/www/mushroomie
   ```

2. **Cập nhật code mới nhất từ GitHub:**
   ```bash
   git pull origin main
   ```

3. **Build lại image và khởi động lại container:**
   ```bash
   docker compose up -d --build
   ```

Lệnh trên sẽ tự động:
- Xóa container cũ.
- Tải lại các dependency mới (nếu có).
- Chạy `npx prisma generate` và `npm run build` sinh ra static chunks mới nhất.
- Chạy container mới (các ảnh upload cũ vẫn được giữ nguyên nhờ mount volume).

**Để xem log nếu có lỗi xảy ra:**
```bash
docker compose logs -f --tail=100
```

---

## 4. Các Lưu Ý Vận Hành Quan Trọng (Hậu Kiểm)

1. **Upload Media:** File ảnh được upload qua admin sẽ lưu vào thư mục `./public/uploads` trên VPS. Nếu bạn cần backup dữ liệu, chỉ cần nén thư mục này lại.
2. **React Email:** Các package `@react-email` (components, render,...) đã được gỡ bỏ hoàn toàn khỏi `package.json` vì dự án sử dụng HTML string thuần túy trong `src/lib/payment/email/templates.ts`. Nếu sau này bạn cần dùng email UI component, hãy cài các thư viện tương thích với Next.js 15+ hoặc tiếp tục dùng HTML string.
3. **Nginx:** Không cần trỏ Nginx root vào thư mục `.next/static`. Cấu hình `proxy_pass http://localhost:3000;` là đủ vì Next.js Standalone server đã tự động xử lý static files đúng MIME type khi chạy bằng Docker.
4. **Bảo trì PM2:** Dịch vụ PM2 cũ đã bị tắt và xóa. Xin đừng dùng lệnh `pm2 start` nữa để tránh tranh chấp port 3000. Mọi thứ được Docker lo liệu.

---

## 5. Quy trình Backup An Toàn

Để tránh rủi ro mất mát dữ liệu, thư mục backup đã được thiết lập tại `backups/`. Đảm bảo thư mục này luôn được đưa vào `.gitignore` để không push nhầm dữ liệu nhạy cảm lên GitHub.

### 5.1. Auto Backup bằng Cron
Hệ thống đã được thiết lập chạy backup tự động mỗi ngày thông qua crontab. Các bản backup cũ (quá 30 ngày) sẽ tự động bị xóa.
Logs của cron chạy nằm tại `backups/logs/backup.log`.

### 5.2. Backup Manual
Bạn có thể gọi script backup thủ công bất cứ lúc nào bằng lệnh:
```bash
./scripts/backup-production.sh
```

---

## 6. Hướng dẫn Khôi phục Sơ bộ (Restore Guide)

Nếu cần khôi phục dữ liệu từ các bản backup trong thư mục `backups/`, hãy làm theo hướng dẫn sau:

### 6.1. Restore Uploads (Media)
Xả nén đè lại thư mục `public/uploads`:
```bash
tar -xzf backups/uploads/uploads-YYYY-MM-DD-HHMMSS.tar.gz -C /var/www/mushroomie
```

### 6.2. Restore Database
Giải nén và bơm ngược dữ liệu vào MySQL:
```bash
gunzip -c backups/db/mysql-YYYY-MM-DD-HHMMSS.sql.gz | mysql -u <db_user> -p <db_name>
```

---

## 7. Cảnh Báo Tuyệt Đối (Critical Warnings) ⚠️
- **Không xóa thư mục `public/uploads`** trên máy host.
- **Không xóa cấu hình volume mapping** trong `docker-compose.yml`.
- **Không đưa MySQL container dư thừa vào lại** docker-compose nếu bạn vẫn đang dùng MySQL gốc trên VPS.
- **Không đổi `network_mode: "host"`** trừ khi bạn có kế hoạch cấu hình lại kết nối DB.
- **Không commit `.env`** lên GitHub.
- **Không commit backup** (file `.tar.gz`, `.sql.gz`).
- **Không deploy nếu build fail**.
- **Không xóa cache Cloudflare tùy tiện** nếu chưa cần, nhưng được phép purge cache nếu static chunk gặp lỗi.

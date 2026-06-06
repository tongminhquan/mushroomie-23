# Hướng dẫn deploy Website Next.js (Mushroomie) lên VPS Ubuntu 24.04 LTS bằng PM2

**Địa chỉ IP VPS:** `103.173.226.86`
**Domain:** `https://mushroomie.io.vn`

Tài liệu này ghi nhận cấu hình hiện tại và hướng dẫn bạn chi tiết từng bước để quản lý, cập nhật (deploy) mã nguồn Next.js đã được cấu hình chạy trực tiếp trên VPS thông qua PM2. Phương pháp này giúp tối ưu hóa dung lượng ổ cứng (tránh lỗi full disk do Docker layer cache).

---

## 1. Kiến trúc Deploy Hiện Tại

- **Máy chủ Database:** MySQL được cài đặt trực tiếp trên VPS host (port `3306`).
- **Web App:** Next.js chạy Standalone server thông qua Node.js.
- **Quản lý Process:** PM2 quản lý tiến trình web app (tên app: `mushroomie_pm2`), lắng nghe trên port `3001`.
- **Reverse Proxy:** Nginx proxy request từ port 80/443 vào `http://127.0.0.1:3001`.

---

## 2. Cấu hình PM2 Chuẩn

Dự án sử dụng file `ecosystem.config.js` nằm tại thư mục gốc của dự án (`/var/www/mushroomie/ecosystem.config.js`) với nội dung:

```javascript
module.exports = {
  apps: [
    {
      name: 'mushroomie_pm2',
      script: 'server.js',
      cwd: '/var/www/mushroomie/.next/standalone',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
};
```

---

## 3. Quy trình Cập nhật Code (Deploy)

Khi bạn có thay đổi code và đã push lên GitHub nhánh `main`, hãy SSH vào VPS và làm theo các bước sau:

1. **Di chuyển vào thư mục dự án:**
   ```bash
   cd /var/www/mushroomie
   ```

2. **Cập nhật code mới nhất từ GitHub:**
   ```bash
   git pull origin main
   ```

3. **Cập nhật thư viện và Build lại dự án:**
   ```bash
   npm ci
   npx prisma generate
   npm run build
   ```

4. **Copy các file tĩnh (Bắt buộc cho Next.js Standalone):**
   ```bash
   cp -r public .next/standalone/
   cp -r .next/static .next/standalone/.next/
   cp .env .next/standalone/
   ```

5. **Khởi động lại PM2:**
   ```bash
   pm2 restart mushroomie_pm2
   pm2 save
   ```

**Để xem log nếu có lỗi xảy ra:**
```bash
pm2 logs mushroomie_pm2
```

---

## 4. Các Lưu Ý Vận Hành Quan Trọng (Hậu Kiểm)

1. **Upload Media:** File ảnh được upload qua admin sẽ lưu vào thư mục `public/uploads` trong thư mục dự án. Nhờ lệnh `cp -r public .next/standalone/`, ảnh mới được server nhận diện. API upload được thiết lập ghi thẳng vào thư mục gốc `public/uploads` để lưu trữ lâu dài.
2. **Nginx:** Cấu hình proxy trỏ vào `http://127.0.0.1:3001`. Mọi routing và file tĩnh đều được PM2 xử lý chính xác MIME Type.
3. **Bảo trì Docker:** Hệ thống KHÔNG CÒN sử dụng Docker. Các lệnh `docker compose` sẽ không còn tác dụng. Điều này giúp giải phóng hơn 50% dung lượng VPS (từ ~82% xuống ~49%).

---

## 5. Quy trình Backup An Toàn

Thư mục backup nằm tại `/var/www/mushroomie/backups/`. Đảm bảo thư mục này luôn được đưa vào `.gitignore`.

### 5.1. Backup Uploads (Media/Images)

Tất cả ảnh sản phẩm được lưu tại `public/uploads`.
```bash
mkdir -p backups/uploads
tar -czf backups/uploads/uploads-$(date +%F-%H%M%S).tar.gz public/uploads
```

### 5.2. Backup Database (MySQL)

Thực hiện dump dữ liệu:
```bash
mkdir -p backups/db
mysqldump -u <db_user> -p <db_name> | gzip > backups/db/mysql-$(date +%F-%H%M%S).sql.gz
```

Hệ thống có sẵn cronjob chạy script `./scripts/backup-production.sh` hằng ngày lúc 02:30 sáng.

---

## Cảnh Báo Tuyệt Đối ⚠️
- **Không xóa thư mục `public/uploads`**, `.env`, `backups` trên máy host.
- **Không dùng lại Docker** cho ứng dụng này trên VPS 20GB để tránh lỗi full disk tái diễn.
- **Luôn backup** Database và Uploads trước khi thực hiện deploy thay đổi lớn trên production.

# Mushroomie Production Checklist (PM2 Runtime)

## Hằng ngày
- [ ] Website homepage HTTP 200.
- [ ] Endpoint `/api/health` trả về `status: "ok"`.
- [ ] Trang sản phẩm load được.
- [ ] Admin login được.
- [ ] Tiến trình `mushroomie_pm2` báo trạng thái `online` trong `pm2 list`.
- [ ] Disk không đầy (`df -h`).
- [ ] Backup chạy thành công (kiểm tra file backup mới nhất trong `backups/`).

## Hằng tuần
- [ ] Kiểm tra dung lượng thư mục `public/uploads`.
- [ ] Kiểm tra dung lượng thư mục `backups/`.
- [ ] Kiểm tra log xem có lỗi lặp lại không (`pm2 logs mushroomie_pm2 --lines 500 | grep -i error`).
- [ ] Đảm bảo `pm2-logrotate` đang hoạt động (không có file log nào >10MB).
- [ ] Kiểm tra chứng chỉ SSL và hạn domain (nếu không auto-renew qua Cloudflare).
- [ ] Kiểm tra tốc độ tải trang / PageSpeed Insights nếu có thay đổi UI lớn.

## Sau mỗi đợt Deploy
- [ ] Kiểm tra trạng thái tiến trình: `pm2 status` (đảm bảo `mushroomie_pm2` đang online).
- [ ] Kiểm tra domain: `curl -I https://mushroomie.io.vn` (HTTP 200).
- [ ] Kiểm tra MIME type của static chunks JS/CSS có đúng `application/javascript` và `text/css` không.
- [ ] Kiểm tra các banner ảnh có hiển thị bình thường không.
- [ ] Kiểm tra ảnh thumbnail của sản phẩm.
- [ ] Thử upload 1 file test qua Admin để xác nhận quy trình upload không gặp lỗi quyền ghi.

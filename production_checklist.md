# Mushroomie Production Checklist

## Hằng ngày
- [ ] Website homepage HTTP 200.
- [ ] Endpoint `/api/health` trả về `status: "ok"`.
- [ ] Trang sản phẩm load được.
- [ ] Admin login được.
- [ ] Container `mushroomie_web` Up và trạng thái là `healthy`.
- [ ] Disk không đầy (chạy `./scripts/check-disk.sh` hoặc `df -h`).
- [ ] Backup chạy thành công (kiểm tra file backup mới nhất trong `backups/`).

## Hằng tuần
- [ ] Kiểm tra dung lượng thư mục `public/uploads`.
- [ ] Kiểm tra dung lượng thư mục `backups/`.
- [ ] Kiểm tra docker logs xem có lỗi lặp lại không (`docker compose logs --tail=500 | grep -i error`).
- [ ] Kiểm tra chứng chỉ SSL và hạn domain (nếu không auto-renew qua Cloudflare).
- [ ] Kiểm tra tốc độ tải trang / PageSpeed Insights nếu có thay đổi UI lớn.

## Sau mỗi đợt Deploy
- [ ] Kiểm tra container status: `docker compose ps` (đảm bảo trạng thái Up).
- [ ] Kiểm tra domain: `curl -I https://mushroomie.io.vn` (HTTP 200).
- [ ] Kiểm tra MIME type của static chunks JS/CSS có đúng `application/javascript` và `text/css` không.
- [ ] Kiểm tra các banner ảnh có hiển thị bình thường không.
- [ ] Kiểm tra ảnh thumbnail của sản phẩm.
- [ ] Thử upload 1 file test qua Admin để xác nhận volume mapping vẫn hoạt động.

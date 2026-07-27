# Thiết kế hình sơ đồ toàn bộ website Mushroomie

## Mục tiêu

Tạo một hình sitemap phân cấp, khổ ngang 16:9, mô tả đầy đủ các khu vực chính của website Mushroomie. Hình dùng cho mục đích trình bày và trao đổi nội bộ, ưu tiên dễ đọc hơn tính kỹ thuật.

## Phạm vi

Sơ đồ thể hiện các route giao diện hiện có và gom chúng thành hai nhánh cấp cao:

1. Website khách hàng.
2. Trang quản trị.

Không đưa API, route nội bộ của Next.js, webhook endpoint hoặc cấu trúc database vào hình.

## Cấu trúc nội dung

### Website khách hàng

- Khám phá:
  - Trang chủ `/`
  - Sản phẩm `/san-pham`
  - Chi tiết sản phẩm `/san-pham/[slug]`
  - Câu chuyện `/cau-chuyen`
  - Tin tức `/tin-tuc`
  - Chi tiết bài viết `/tin-tuc/[slug]`
- Mua hàng:
  - Giỏ hàng `/gio-hang`
  - Thanh toán `/thanh-toan`
  - Xác nhận thanh toán `/thanh-toan/xac-nhan`
  - Voucher `/voucher`
- Tài khoản:
  - Đăng nhập `/tai-khoan/dang-nhap`
  - Đăng ký `/tai-khoan/dang-ky`
  - Hoàn tất đăng ký `/tai-khoan/hoan-tat-dang-ky`
  - Quên mật khẩu `/tai-khoan/quen-mat-khau`
  - Đặt lại mật khẩu `/tai-khoan/dat-lai-mat-khau`
  - Hồ sơ tài khoản `/tai-khoan`
  - Đơn hàng `/tai-khoan/don-hang`
  - Chi tiết đơn hàng `/tai-khoan/don-hang/[code]`
  - Voucher cá nhân `/tai-khoan/voucher`
- Tương tác:
  - Mini game `/mini-game`
  - Tetris `/mini-game/tetris`
  - Block Blast `/mini-game/block-blast`
  - Liên hệ `/lien-he`
- Thông tin và chính sách:
  - Giới thiệu `/gioi-thieu`
  - Chính sách đổi trả `/chinh-sach-doi-tra`
  - Chính sách trả góp `/chinh-sach-tra-gop`
  - Chính sách bảo mật `/chinh-sach-bao-mat`
  - Chính sách giao hàng `/chinh-sach-giao-hang`
  - Chính sách và quy định `/chinh-sach-quy-dinh`
  - Điều khoản dịch vụ `/dieu-khoan-dich-vu`

### Trang quản trị

- Tổng quan:
  - Dashboard `/admin`
  - Nhật ký `/admin/nhat-ky`
  - Cài đặt `/admin/cai-dat`
- Bán hàng:
  - Đơn hàng `/admin/don-hang`
  - Chi tiết đơn hàng `/admin/don-hang/[id]`
  - Thanh toán `/admin/thanh-toan`
  - Webhook logs `/admin/thanh-toan/webhook-logs`
- Sản phẩm và nội dung:
  - Sản phẩm `/admin/san-pham`
  - Thêm sản phẩm `/admin/san-pham/them`
  - Sửa sản phẩm `/admin/san-pham/[id]`
  - Bài viết `/admin/bai-viet`
  - Thêm bài viết `/admin/bai-viet/them`
  - Sửa bài viết `/admin/bai-viet/[id]`
  - Banner `/admin/banner`
  - Thư viện `/admin/thu-vien`
- Khách hàng và tương tác:
  - Tài khoản `/admin/tai-khoan`
  - Đánh giá `/admin/danh-gia`
  - Liên hệ `/admin/lien-he`
- Voucher:
  - Danh sách voucher `/admin/voucher`
  - Thêm voucher `/admin/voucher/them`
  - Lịch sử voucher `/admin/voucher-history`

## Bố cục

- Canvas ngang 16:9, độ phân giải mục tiêu 2048 × 1152 px.
- Tiêu đề ở giữa phía trên: “SƠ ĐỒ WEBSITE MUSHROOMIE”.
- Slogan nhỏ bên dưới: “Từ từng hạt nhỏ, tạo phong cách riêng.”
- Nút gốc “Mushroomie” kết nối xuống hai cột cân bằng:
  - Bên trái: “Website khách hàng”.
  - Bên phải: “Trang quản trị”.
- Mỗi cột chia thành các card nhóm; route con đặt trong card dưới dạng danh sách ngắn.
- Dùng đường nối bo cong, không giao cắt, bảo đảm thứ bậc dễ quét mắt.

## Phong cách hình ảnh

- Phong cách infographic trẻ trung, handmade, gọn và chuyên nghiệp.
- Nền kem `#fff7f2`.
- Màu chính đỏ `#e41d1d`.
- Màu hỗ trợ: hồng `#ffd6d6`, vàng kem `#ffe7a3`, nâu kraft `#b9794b`, đen mềm `#2b2b2b`.
- Tiêu đề tròn, đậm, gợi Paytone One; nội dung sạch, dễ đọc, gợi Montserrat.
- Doodle nấm pixel, hạt vòng, charm, sticker và móc khóa chỉ dùng làm điểm nhấn ở viền; không che chữ.
- Không dùng nền đỏ toàn màn hình, không tạo cảm giác template công nghệ.

## Yêu cầu chất lượng

- Tất cả nhãn tiếng Việt phải đúng chính tả.
- Route phải khớp với cấu trúc `src/app` tại thời điểm thiết kế.
- Chữ chính đọc được khi xem toàn màn hình.
- Không có watermark, logo bên thứ ba hoặc nội dung ngoài phạm vi.
- Hình cuối được kiểm tra trực quan về bố cục, lỗi chữ và nhánh bị thiếu.

## Đầu ra

- Một ảnh PNG hoàn chỉnh.
- Tên file dự kiến: `mushroomie-full-website-sitemap.png`.
- Lưu trong thư mục `artifacts/` của dự án để không ảnh hưởng bundle website.

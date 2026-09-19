# Tìm quà hợp ý

Người dùng đã chọn tính năng này ngày 2026-09-19. Mục tiêu: giúp khách tìm quà từ danh mục Mushroomie theo mức chi, loại phụ kiện và nhu cầu cá nhân hóa.

## Trải nghiệm

- Trang `/chon-qua`, lối vào từ `/san-pham` và khu vực sản phẩm nổi bật trên trang chủ.
- Một biểu mẫu GET: ngân sách tối đa 100.000 / 200.000 / 300.000 / 500.000 đồng hoặc tất cả; danh mục sản phẩm hiện có; chỉ mẫu có thể cá nhân hóa.
- Lựa chọn lưu trong URL. Nút tìm áp dụng bộ lọc, nút đặt lại xóa bộ lọc; phân trang giữ lựa chọn.
- Ngân sách áp dụng cho một sản phẩm, chưa gồm vận chuyển/gói quà và chưa trừ voucher. Dùng giá bán hiển thị hiện hành.
- Chỉ trả sản phẩm active, stock > 0, giá niêm yết > 0. Giá sale hợp lệ khi > 0 và thấp hơn giá niêm yết. Không tự nới ngân sách khi thiếu kết quả.
- Mỗi trang tối đa 12 sản phẩm, ưu tiên nổi bật rồi mới nhất theo id. Trang vượt kết quả được đưa về trang cuối; chỉ có trước/sau để tránh sinh hàng nghìn link.
- Kết quả rỗng khác với lỗi dữ liệu. Lỗi dữ liệu có nút thử lại và liên hệ, không giả vờ cửa hàng hết hàng.

## Kiến trúc và giới hạn

- Next.js 16 Server Component, đọc searchParams bất đồng bộ, Prisma lọc trên database và select các trường public cần thiết. Không tải cả catalog về browser.
- Tách chuẩn hóa URL, truy vấn dữ liệu, giao diện để kiểm thử độc lập. Tái sử dụng ProductCard và theme tokens; giữ ảnh 3:4 và fallback sẵn có.
- Không thêm dependency; không đổi schema, auth, checkout, giá thanh toán, voucher hay upload. Không ghi database. Không deploy production trong phạm vi này.
- Trang động đọc dữ liệu mới mỗi request. Canonical `/chon-qua`; bản có query noindex/follow; URL gốc được đưa vào sitemap.
- Form có label, fieldset/legend, focus rõ, điều khiển tối thiểu 44px; không animation mới. Kiểm tra 1440, 1366, 390 và 360px.

## Kiểm chứng

Kiểm thử query độc hại/malformed/lặp, ranh giới ngân sách và sale không hợp lệ, loại mẫu ẩn/hết hàng, phân trang, lỗi database, giữ bộ lọc trong URL, form keyboard và empty/error state. Chạy npm ci, prisma generate, typecheck, build, lint các file thay đổi và test liên quan. Browser dùng Chrome for Testing profile riêng, ưu tiên Chrome DevTools MCP khi có. Nếu thiếu DB local, ghi rõ giới hạn và không báo đã kiểm chứng dữ liệu production.

## Đánh giá thiết kế

Phạm vi một tính năng, không migration hay thay đổi dữ liệu. Các phương án danh sách yêu thích/sản phẩm đã xem được để ngoài phạm vi. Rủi ro chính là khớp giá hiển thị và giữ lọc qua phân trang; có kiểm thử tập trung cho hai phần này. Các thay đổi có sẵn trong workspace không thuộc tính năng này.

## Điều chỉnh sau kiểm tra trình duyệt

ProductCard dùng text theo theme trên badge nền vàng/hồng nên chữ gần trắng ở dark mode. Giữ cố định màu chữ thương hiệu #2b2b2b trên hai badge và trạng thái nút đã thêm có nền vàng; giữ nguyên layout, tỷ lệ ảnh và hành vi mua hàng. Dữ liệu kiểm thử chỉ ghi vào một MySQL tạm độc lập, không ghi vào database cửa hàng.

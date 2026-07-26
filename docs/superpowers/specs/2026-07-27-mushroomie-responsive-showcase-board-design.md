# Đặc tả Responsive Showcase Board cho homepage Mushroomie

## 1. Mục tiêu

Tạo một hình mockup trực quan thể hiện tổng thể homepage Mushroomie trên desktop và mobile. Hình dùng để duyệt hướng UI/UX và truyền đạt ngôn ngữ thương hiệu; không thay thế thiết kế kỹ thuật chi tiết hoặc ảnh chụp production.

## 2. Đầu ra

- Một showcase board ngang tỷ lệ 16:9.
- Kích thước bàn giao chính: `3840 × 2160 px`.
- Định dạng: PNG chất lượng cao và WebP tối ưu để xem nhanh.
- Vị trí dự kiến:
  - `artifacts/mushroomie-responsive-showcase-board-v1.png`
  - `artifacts/mushroomie-responsive-showcase-board-v1.webp`
- Không ghi đè asset đang có.

## 3. Cấu trúc showcase board

Board dùng nền kem ấm và chia thành ba vùng:

1. **Desktop homepage — vùng trọng tâm**
   - Chiếm khoảng 68–72% diện tích board.
   - Thể hiện trang chủ trong một khung trình duyệt tối giản.
   - Hero và các section chính phải đủ lớn để nhận diện bố cục, không nhồi toàn bộ nội dung chữ nhỏ.

2. **Mobile homepage — vùng kiểm chứng responsive**
   - Chiếm khoảng 18–22% diện tích board.
   - Dùng khung điện thoại 390 px theo tỷ lệ thực tế.
   - Giữ cùng hệ màu, hình ảnh và thứ tự nội dung với desktop.
   - Product card hiển thị theo lưới hai cột và giữ tỷ lệ ảnh 3:4.

3. **Design tokens và component close-up**
   - Chiếm phần diện tích còn lại.
   - Hiển thị bảng màu thương hiệu, cặp font, nút CTA, badge và một product card mẫu.
   - Chỉ dùng như chú thích thị giác, không cạnh tranh với mockup chính.

## 4. Thứ tự nội dung homepage

Mockup desktop và mobile phải phản ánh đúng nhịp nội dung hiện tại:

1. Header gồm logo, thanh tìm kiếm, điều hướng và hành động tài khoản/giỏ hàng.
2. Hero giới thiệu phụ kiện handmade cá nhân hóa.
3. Danh mục sản phẩm.
4. Sản phẩm nổi bật.
5. CTA đặt làm sản phẩm custom.
6. Câu chuyện thương hiệu.
7. Tầm nhìn, sứ mệnh và giá trị cốt lõi.
8. Quy trình custom.
9. Hậu trường handmade.
10. Đánh giá khách hàng.
11. Bài viết mới.
12. CTA cuối và footer.

Các section được diễn đạt ở mức mockup; không cần hiển thị toàn bộ nội dung production trong từng block.

## 5. Art direction

- Cảm giác: dễ thương, trẻ trung, handmade, giàu cảm xúc và có dấu ấn cá nhân.
- Màu chủ đạo:
  - Đỏ thương hiệu `#e41d1d`
  - Kem `#fff7f2`
  - Hồng nhạt `#ffd6d6`
  - Vàng kem `#ffe7a3`
  - Kraft `#b9794b`
  - Đen mềm `#2b2b2b`
- Typography:
  - Tiêu đề theo tinh thần Paytone One.
  - Nội dung theo tinh thần Montserrat.
- Chi tiết nhận diện: nấm pixel, hạt, charm, sticker, đường chỉ khâu, giấy thủ công và Polaroid.
- Texture chỉ dùng nhẹ để tạo cảm giác thủ công; nền và card vẫn sạch, rõ và dễ đọc.
- CTA màu đỏ nổi bật, bo góc mềm và có khoảng trắng đủ rộng.

## 6. Nội dung chữ bắt buộc

Chỉ ưu tiên các cụm chữ lớn sau để giảm rủi ro lỗi chữ trong ảnh tạo sinh:

- `Mushroomie`
- `Từ từng hạt nhỏ, tạo phong cách riêng.`
- `Khám phá ngay`
- `Tự tay chọn hạt, tự do kể câu chuyện của bạn.`
- `Sản phẩm nổi bật`
- `Custom theo cách của bạn`

Các nội dung phụ được mô phỏng bằng dòng chữ ngắn, không cần sao chép đầy đủ dữ liệu production. Không tạo giá bán, voucher hoặc thông tin khuyến mãi có thể bị hiểu là chương trình thật.

## 7. Asset tham chiếu

Sử dụng các file sau làm tham chiếu thị giác, không chỉnh sửa hoặc ghi đè:

- `public/logo.png`: tham chiếu nhận diện logo và nấm pixel.
- `public/uploads/1002a915-1479-49e8-b3c2-b04a21eef81f.webp`: tham chiếu hero custom, bố cục cream–đỏ và chi tiết vòng tay.
- `public/uploads/f25c4021-3c10-4be8-ae3d-09332fb3e0e0.webp`: tham chiếu ảnh vòng tay handmade.
- `public/uploads/a0b3e750-1035-4148-82d0-277445fca00c.webp`: tham chiếu charm/móc khóa và bảng màu pastel.
- `public/uploads/92213f15-af99-4648-a20e-4e2c69e26f33.webp`: tham chiếu ảnh phụ kiện 3:4.

Không dùng các upload untracked thuộc dự án bất động sản, xe điện, công trường hoặc slide chiến lược.

## 8. Bố cục chi tiết

- Nền board: kem ấm, có lưới chấm hoặc texture giấy rất nhẹ.
- Khung desktop đặt lệch trái và hơi nổi bằng shadow nâu ấm.
- Khung mobile đặt bên phải, chồng nhẹ lên cạnh desktop để thể hiện quan hệ responsive.
- Bảng màu và component mẫu nằm ở góc phải dưới hoặc dải dưới, không che nội dung mobile.
- Hero desktop:
  - Copy ở nửa trái.
  - Vòng tay/charm ở nửa phải.
  - Nấm pixel làm điểm nhấn, không phóng quá lớn.
- Các section bên dưới dùng nhịp nền trắng/kem/hồng nhạt xen kẽ.
- Product card có ảnh 3:4, tên ngắn, một dòng metadata trung tính không chứa giá/khuyến mãi thật và nút hành động rõ.
- Không dùng nền đỏ toàn màn hình; đỏ chỉ là màu nhấn.

## 9. Phương pháp tạo

1. Dùng công cụ tạo ảnh tích hợp với các asset trong Mục 7 làm ảnh tham chiếu.
2. Prompt theo nhóm `ui-mockup`, yêu cầu showcase board cao cấp, rõ cấu trúc và không có watermark.
3. Kiểm tra ảnh đầu ra về logo, chữ tiếng Việt, thứ tự section, tỷ lệ product card và sự nhất quán desktop/mobile.
4. Nếu cần lặp, chỉ sửa một nhóm lỗi mỗi lượt để hạn chế thay đổi ngoài ý muốn.
5. Chuẩn hóa bản cuối về đúng tỷ lệ 16:9 và xuất PNG/WebP vào `artifacts/`.

## 10. Tiêu chí hoàn thành

- Board thể hiện rõ cả desktop và mobile trong một khung hình.
- Người xem nhận ra ngay đây là thương hiệu phụ kiện handmade Mushroomie.
- Có đủ các nhóm section chính của homepage, không biến thành landing page chỉ có hero.
- Desktop là trọng tâm nhưng mobile vẫn đủ lớn để hiểu cấu trúc responsive.
- Product card giữ tỷ lệ ảnh 3:4.
- Logo, nấm pixel, vòng tay, hạt và charm xuất hiện có chủ đích.
- Các màu thương hiệu được sử dụng nhất quán và CTA đạt độ tương phản tốt.
- Không có watermark, logo lạ, asset ngoài dự án, chữ rác dễ thấy hoặc chi tiết UI bị biến dạng nghiêm trọng.
- File cuối đúng đường dẫn và không ghi đè dữ liệu hiện có.

## 11. Ngoài phạm vi

- Không sửa code homepage, schema, database, banner production hoặc upload hiện tại.
- Không deploy production.
- Không tạo đầy đủ design system hoặc prototype tương tác.
- Không cam kết mockup tạo sinh khớp pixel với giao diện production.

## 12. Rủi ro và cách kiểm soát

- **Chữ tiếng Việt có thể sai:** giới hạn số cụm chữ lớn và kiểm tra trực quan; ưu tiên sửa targeted nếu lỗi.
- **Logo có thể bị biến dạng:** dùng logo thật làm reference và không chấp nhận biến thể nhận diện lạ.
- **Board dễ quá dày:** giữ desktop làm trọng tâm, giảm số chi tiết trang trí và dùng khoảng trắng rõ.
- **Ảnh tạo sinh có thể làm sai sản phẩm:** dùng ảnh sản phẩm thật làm reference, tránh phóng đại cấu trúc charm hoặc thêm vật thể không liên quan.
- **Tỷ lệ 16:9 có thể làm phần full-page quá nhỏ:** thể hiện section theo block rõ ràng, ưu tiên nhịp bố cục hơn là nội dung chữ chi tiết.

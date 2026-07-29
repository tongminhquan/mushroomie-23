# Đặc tả giao diện tối toàn website Mushroomie

## 1. Mục tiêu

Bổ sung chế độ Sáng/Tối cho toàn bộ website Mushroomie, bao gồm:

- Khu vực người dùng và các trang công khai.
- Khu vực tài khoản.
- Giỏ hàng và thanh toán ở lớp giao diện.
- Toàn bộ khu vực quản trị.
- Các thành phần dùng chung như header, footer, modal, drawer, toast, form, bảng, editor và biểu đồ.

Thay đổi chỉ tác động đến giao diện. Không thay đổi logic auth, đơn hàng, voucher, checkout, webhook thanh toán, upload, API, Prisma schema hoặc dữ liệu production.

## 2. Hành vi đã duyệt

- Theme mặc định luôn là `light`.
- Người dùng có thể chủ động chuyển giữa `light` và `dark`.
- Lựa chọn được lưu trong cookie `mushroomie_theme`.
- Website không tự đổi theo `prefers-color-scheme`.
- Theme áp dụng đồng nhất cho cả khu vực user và admin.
- Theme đổi ngay lập tức, không tải lại trang.
- Người dùng đã duyệt sử dụng `transition-all` cho quá trình đổi theme.

## 3. Vòng đời cookie

Cookie không thể tồn tại vô hạn tuyệt đối trên mọi trình duyệt. Chrome giới hạn cookie có thời hạn tối đa 400 ngày. Để đạt hành vi gần như vĩnh viễn:

- Cookie dùng `Max-Age=34560000`, tương đương 400 ngày.
- Khi website phát hiện cookie hợp lệ, thời hạn được gia hạn lại 400 ngày.
- Khi người dùng đổi theme, cookie được ghi lại và bắt đầu một chu kỳ 400 ngày mới.
- Cookie dùng `Path=/` để áp dụng cho toàn website.
- Cookie dùng `SameSite=Lax`.
- Cookie dùng `Secure` khi website chạy HTTPS.
- Cookie không dùng `HttpOnly` vì Client Component cần cập nhật lựa chọn.
- Chỉ chấp nhận hai giá trị `light` và `dark`; giá trị khác được coi như không tồn tại và trả về `light`.

Người dùng vẫn có thể mất lựa chọn nếu tự xóa cookie, dùng chế độ duyệt riêng tư hoặc không truy cập website quá 400 ngày.

## 4. Kiến trúc theme

### 4.1 Nguồn trạng thái

Thuộc tính `data-theme` trên phần tử `<html>` là nguồn trạng thái giao diện duy nhất:

```html
<html data-theme="light">
```

hoặc:

```html
<html data-theme="dark">
```

`document.documentElement.style.colorScheme` được cập nhật đồng bộ để input, select, scrollbar và UI gốc của trình duyệt hiển thị đúng theme.

### 4.2 Khởi tạo trước khi render

Một script rất nhỏ chạy trong `<head>` trước khi giao diện được vẽ:

1. Đọc cookie `mushroomie_theme`.
2. Xác thực giá trị.
3. Mặc định `light` khi cookie thiếu hoặc sai.
4. Gắn `data-theme` và `color-scheme` lên `<html>`.
5. Gia hạn cookie hợp lệ thêm 400 ngày.

Cách này tránh nháy màu khi tải trang và không buộc Root Layout đọc `cookies()` phía server. Nhờ đó các Server Component và chiến lược cache hiện tại được giữ nguyên.

### 4.3 Điều khiển theme

Tạo một Client Component lá dùng chung, không bọc toàn bộ ứng dụng bằng provider:

- Đọc theme hiện tại từ `data-theme` khi hydrate.
- Chuyển giữa `light` và `dark`.
- Cập nhật `data-theme`, `color-scheme`, `theme-color` và cookie.
- Phát một custom event nội bộ để các toggle đang cùng xuất hiện đồng bộ trạng thái.
- Không dùng Zustand hoặc Context toàn cục cho theme.
- Không thêm dependency `next-themes`.

## 5. Chiến lược CSS

### 5.1 Semantic tokens

Giữ hệ token Tailwind v4 hiện có và bổ sung các token giao diện có ý nghĩa:

- `--surface-page`
- `--surface-section`
- `--surface-card`
- `--surface-elevated`
- `--surface-muted`
- `--surface-input`
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--border-default`
- `--border-strong`
- `--shadow-card-theme`
- `--shadow-overlay-theme`
- `--focus-ring`
- `--theme-color`

Các class thương hiệu hiện có như `primary`, `secondary`, `neutral`, `admin-bg` và `warm-border` sẽ được ánh xạ lại theo theme để giảm số file phải sửa thủ công.

### 5.2 Bảng màu sáng

Theme sáng giữ nhận diện hiện tại:

- Nền trang: `#fff7f2`
- Surface chính: `#ffffff`
- Surface phụ: `#fffaf6`
- Chữ chính: `#2b2b2b`
- Chữ phụ: `#66615d`
- Viền ấm: `#ece0d6`
- Đỏ thương hiệu: `#d71919`
- Hồng nhạt: `#ffd6d6`
- Vàng kem: `#ffe7a3`
- Kraft: `#8a5635`

### 5.3 Bảng màu tối

Theme tối theo hướng “xưởng handmade ban đêm”:

- Nền trang: than ấm, không dùng đen tuyệt đối.
- Surface chính: nâu đỏ tối.
- Surface nổi: sáng hơn nền một cấp để giữ chiều sâu.
- Chữ chính: trắng kem, không dùng trắng tuyệt đối.
- Chữ phụ: xám hồng ấm.
- Viền: nâu xám đủ rõ trên surface tối.
- Đỏ Mushroomie vẫn là điểm nhấn chính.
- Hồng, vàng và kraft được hạ độ sáng để không chói.

Màu cụ thể sẽ được kiểm tra bằng contrast test trước khi khóa trong code. Màu nút nền đỏ và màu chữ liên kết đỏ được tách token nếu một màu không thể đồng thời đạt tương phản ở cả hai ngữ cảnh.

## 6. Ngôn ngữ giao diện

### 6.1 Khu vực người dùng

- Giữ phong cách dễ thương, trẻ trung và handmade.
- Không biến dark mode thành giao diện neon hoặc gaming.
- Ảnh sản phẩm nằm trên surface trung tính để không làm sai màu sản phẩm.
- Texture giấy, sticker và doodle chỉ chuyển sang biến thể tối nhẹ, không tăng độ tương phản quá mức.
- Header, footer, menu mobile, bottom navigation, cart drawer và account menu dùng chung một hệ surface.

### 6.2 Khu vực admin

- Dark mode admin yên tĩnh và thực dụng hơn khu vực user.
- Giảm độ nổi của gradient trang trí.
- Bảng, form, modal và sidebar ưu tiên khả năng quét dữ liệu.
- Trạng thái success, warning, danger và info giữ ý nghĩa hiện tại nhưng có màu nền, chữ và ring riêng cho dark mode.
- Biểu đồ dùng màu grid, axis, tooltip và label lấy từ theme thay vì màu hardcode sáng.

### 6.3 Dials thiết kế

Khu vực user:

- `DESIGN_VARIANCE: 6`
- `MOTION_INTENSITY: 3`
- `VISUAL_DENSITY: 4`

Khu vực admin:

- `DESIGN_VARIANCE: 3`
- `MOTION_INTENSITY: 2`
- `VISUAL_DENSITY: 7`

## 7. Vị trí điều khiển

### 7.1 User desktop

Nút biểu tượng Mặt trời/Mặt trăng nằm trong header, cạnh khu vực tài khoản. Nút:

- Có vùng bấm tối thiểu 44 x 44 px.
- Có `aria-label` mô tả hành động kế tiếp.
- Có tooltip khi hover và focus.
- Có focus ring rõ ràng.

### 7.2 User mobile

Trong menu mobile có một hàng “Giao diện” với segmented control:

- `Sáng`
- `Tối`

Không thêm nút vào bottom navigation để tránh tăng mật độ và làm hẹp các mục chính.

### 7.3 Admin

Điều khiển đặt ở footer của sidebar:

- Sidebar mở: hiển thị biểu tượng và nhãn.
- Sidebar thu gọn: chỉ hiển thị biểu tượng và tooltip.
- Mobile: xuất hiện trong sidebar sau khi người dùng mở menu admin.

## 8. Chuyển động

Theo lựa chọn đã duyệt:

- Dùng `transition-all` trên các root surface và thành phần theme-aware.
- Thời lượng mục tiêu 150 ms.
- Easing nhẹ, không tạo cảm giác trễ.
- Không dùng `transition-all` cho animation bố cục, drag, game hoặc hiệu ứng liên tục.
- Khi `prefers-reduced-motion: reduce`, thời lượng chuyển theme được đưa về gần như tức thời.

Việc dùng `transition-all` được giới hạn bằng class theme transition dùng chung, không áp dụng wildcard lên toàn bộ DOM để tránh animate kích thước hoặc vị trí ngoài ý muốn.

## 9. Phạm vi thành phần cần kiểm tra

### 9.1 Shell dùng chung

- Root Layout.
- Public User Layout.
- Header và các dropdown.
- Footer.
- Mobile Bottom Navigation.
- Cart drawer.
- Chat/widget công khai.
- Admin Layout.
- Admin Sidebar.
- Admin UI primitives.

### 9.2 Thành phần nội dung

- Product card và product detail.
- Trang danh sách sản phẩm và bộ lọc.
- Trang chủ và các section marketing.
- Tin tức, bài viết và prose content.
- Tài khoản, đơn hàng và voucher.
- Giỏ hàng và thanh toán ở lớp hiển thị.
- Mini game shell, không đổi màu board hoặc logic game nếu theme hiện tại là chủ ý.

### 9.3 Thành phần admin

- Dashboard cards và charts.
- Bảng dữ liệu.
- Form sản phẩm, banner, voucher và cài đặt.
- Rich text editor.
- Media library.
- Dialog xác nhận và toast.
- Trang bài viết và đăng WordPress tự động.
- Log, webhook log và trang thanh toán admin.

## 10. Khả năng truy cập

- Body text đạt tối thiểu WCAG AA 4.5:1.
- Text lớn và icon chức năng đạt tối thiểu 3:1.
- Focus ring nhìn rõ trên cả hai theme.
- Không truyền đạt trạng thái chỉ bằng màu.
- Input, placeholder, select và disabled state có tương phản riêng.
- Toggle có thể dùng bằng bàn phím.
- Icon có tên truy cập; icon trang trí dùng `aria-hidden`.
- Native form controls nhận đúng `color-scheme`.

## 11. Hiệu suất và hydration

- Không thêm dependency theme.
- Không thêm provider bao quanh toàn bộ app.
- Script khởi tạo được inline và giữ kích thước nhỏ.
- Không đọc cookie bằng `cookies()` trong Root Layout.
- Không làm các route đang static hoặc cached trở thành dynamic.
- Không tải bundle admin vào khu vực user.
- ThemeToggle chỉ là Client Component lá.
- Không tạo hydration mismatch giữa icon và theme hiện tại.
- Không nháy theme sáng trước khi dark mode được áp dụng.

## 12. Kiểm thử

### 12.1 Unit test

- Parser chỉ nhận `light` và `dark`.
- Không có cookie trả về `light`.
- Cookie sai trả về `light`.
- Hàm ghi cookie dùng đúng tên, path, SameSite và Max-Age.
- Toggle đổi đúng giá trị và ghi cookie.
- Cookie hợp lệ được gia hạn.

### 12.2 Component test

- Toggle hiển thị đúng nhãn và icon.
- Click và bàn phím đổi theme.
- Nhiều toggle đồng bộ qua custom event.
- Admin sidebar mở và thu gọn không làm mất điều khiển.

### 12.3 Browser test

Kiểm tra cả Sáng và Tối tại:

- Desktop 1440 px.
- Laptop 1366 px.
- Mobile 390 px.
- Mobile 360 px.

Các route tối thiểu:

- `/`
- `/san-pham`
- Một trang chi tiết sản phẩm.
- `/tin-tuc`
- Một trang bài viết.
- `/tai-khoan`
- `/gio-hang`
- `/thanh-toan`
- `/mini-game`
- `/admin`
- Một trang bảng admin.
- Một trang form admin.
- Trang editor bài viết admin.

### 12.4 Kiểm tra kỹ thuật

- Không có scroll ngang mới.
- Không có chữ tối trên nền tối hoặc chữ sáng trên nền sáng.
- Không có input/select trắng chói trong dark mode.
- Không có ảnh broken.
- Không có console error mới.
- Không có hydration warning.
- `npm run typecheck` pass.
- `npm run build` pass.
- CSS và JS production trả đúng MIME.

## 13. Tiêu chí nghiệm thu

- Website mặc định Sáng khi chưa có cookie.
- User và admin đổi theme từ cùng một cookie.
- Reload và điều hướng không làm mất lựa chọn.
- Cookie được gia hạn lăn 400 ngày.
- Không xuất hiện nháy theme sai khi tải.
- Tất cả trang chính có giao diện tối nhất quán.
- Bảng, form, editor, modal, toast và biểu đồ đọc được trong dark mode.
- Nút chuyển theme đạt tap target và dùng được bằng bàn phím.
- Không thay đổi logic nghiệp vụ.
- Typecheck và build sạch.
- Production PM2 ổn định và các route chính trả HTTP thành công.

## 14. Rủi ro và kiểm soát

- **Màu hardcode phân tán:** ưu tiên semantic tokens, sau đó rà các file có nhiều hex và utility sáng.
- **Một token primary dùng cho cả text và background:** tách token chữ nhấn và control khi cần để giữ tương phản.
- **Flash theme:** script chạy trước render, không chờ React hydrate.
- **Hydration mismatch:** state ban đầu của toggle đọc từ DOM sau khi mount và có fallback ổn định.
- **Editor hoặc chart giữ màu sáng:** có adapter/theme props riêng thay vì ép bằng selector toàn cục.
- **`transition-all` animate thuộc tính ngoài ý muốn:** chỉ gắn qua utility có phạm vi và thời lượng ngắn, không gắn wildcard toàn DOM.
- **Cookie bị xóa:** quay về theme Sáng đúng hành vi đã duyệt.
- **Ảnh sản phẩm đổi cảm nhận màu:** giữ surface ảnh trung tính và không áp filter lên ảnh.

## 15. Ngoài phạm vi

- Không thêm theme thứ ba hoặc chế độ theo hệ thống.
- Không thay đổi logo, font, route, nội dung hoặc cấu trúc điều hướng.
- Không redesign lại từng trang.
- Không thay đổi schema hoặc database.
- Không thay đổi auth, order, checkout, payment, webhook hoặc voucher.
- Không thay đổi logic mini game.
- Không cam kết cookie tồn tại sau khi người dùng xóa dữ liệu trình duyệt.

# Mushroomie Full Website Sitemap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo một ảnh PNG sitemap phân cấp 16:9 mô tả đầy đủ website khách hàng và trang quản trị Mushroomie.

**Architecture:** Dùng công cụ tạo ảnh tích hợp để tạo infographic từ một prompt có cấu trúc, dựa trên route thật đã ghi trong design spec. Lưu ảnh được chọn vào `artifacts/`, sau đó kiểm tra trực quan và kiểm tra thuộc tính file; nếu cần, chỉ lặp lại một lần với yêu cầu sửa lỗi cụ thể.

**Tech Stack:** Built-in image generation, PNG, PowerShell, Codex image viewer.

## Global Constraints

- Canvas ngang 16:9, độ phân giải mục tiêu 2048 × 1152 px.
- Nền kem `#fff7f2`; màu chính đỏ `#e41d1d`.
- Màu hỗ trợ: `#ffd6d6`, `#ffe7a3`, `#b9794b`, `#2b2b2b`.
- Tiêu đề chính phải là “SƠ ĐỒ WEBSITE MUSHROOMIE”.
- Slogan phải là “Từ từng hạt nhỏ, tạo phong cách riêng.”
- Hiển thị hai nhánh cấp cao: “Website khách hàng” và “Trang quản trị”.
- Không đưa API, database, webhook endpoint hoặc route nội bộ Next.js vào hình.
- Không watermark, không logo bên thứ ba, không chữ giả hoặc nội dung ngoài phạm vi.
- Không sửa code website và không ghi ảnh vào `public/uploads`.

---

### Task 1: Tạo infographic sitemap

**Files:**
- Reference: `docs/superpowers/specs/2026-07-27-mushroomie-full-website-sitemap-design.md`
- Create: `artifacts/mushroomie-full-website-sitemap.png`

**Interfaces:**
- Consumes: Nội dung route và quy chuẩn hình ảnh từ design spec.
- Produces: Một ảnh PNG hoàn chỉnh tại `artifacts/mushroomie-full-website-sitemap.png`.

- [ ] **Step 1: Tạo ảnh bằng built-in image generation**

Gửi prompt sau cho công cụ tạo ảnh:

```text
Use case: infographic-diagram
Asset type: sơ đồ kiến trúc toàn bộ website Mushroomie dùng để trình bày nội bộ
Primary request: Tạo một sitemap phân cấp đầy đủ, dễ đọc, khổ ngang 16:9 cho website thương mại điện tử phụ kiện handmade Mushroomie.
Scene/backdrop: Nền kem sạch #fff7f2, nhiều khoảng thở, infographic phẳng và sắc nét.
Style/medium: Editorial infographic cao cấp, trẻ trung, handmade, đường nối bo cong, card bo góc; gợi cảm giác designer làm thủ công, không giống template công nghệ.
Composition/framing: Tiêu đề ở giữa phía trên. Bên dưới là nút gốc “Mushroomie”, tách thành hai cột cân bằng: “Website khách hàng” bên trái và “Trang quản trị” bên phải. Các card nhóm xếp theo lưới, không có đường nối giao nhau. Doodle nấm pixel, hạt vòng, charm, sticker và móc khóa chỉ đặt ở viền.
Color palette: đỏ #e41d1d, nền kem #fff7f2, hồng #ffd6d6, vàng kem #ffe7a3, nâu kraft #b9794b, chữ đen mềm #2b2b2b.
Typography: Tiêu đề tròn đậm gợi Paytone One; nội dung sans-serif sạch gợi Montserrat; ưu tiên chữ tiếng Việt rõ và đúng dấu.
Text (verbatim):
“SƠ ĐỒ WEBSITE MUSHROOMIE”
“Từ từng hạt nhỏ, tạo phong cách riêng.”
“Mushroomie”
“Website khách hàng”
“Khám phá”
“Trang chủ /”
“Sản phẩm /san-pham”
“Chi tiết sản phẩm /san-pham/[slug]”
“Câu chuyện /cau-chuyen”
“Tin tức /tin-tuc”
“Chi tiết bài viết /tin-tuc/[slug]”
“Mua hàng”
“Giỏ hàng /gio-hang”
“Thanh toán /thanh-toan”
“Xác nhận /thanh-toan/xac-nhan”
“Voucher /voucher”
“Tài khoản”
“Đăng nhập /tai-khoan/dang-nhap”
“Đăng ký /tai-khoan/dang-ky”
“Khôi phục mật khẩu”
“Hồ sơ /tai-khoan”
“Đơn hàng /tai-khoan/don-hang”
“Voucher cá nhân /tai-khoan/voucher”
“Tương tác”
“Mini game /mini-game”
“Tetris /mini-game/tetris”
“Block Blast /mini-game/block-blast”
“Liên hệ /lien-he”
“Thông tin & chính sách”
“Giới thiệu /gioi-thieu”
“Đổi trả · Trả góp · Giao hàng”
“Bảo mật · Quy định · Điều khoản”
“Trang quản trị”
“Tổng quan”
“Dashboard /admin”
“Nhật ký /admin/nhat-ky”
“Cài đặt /admin/cai-dat”
“Bán hàng”
“Đơn hàng /admin/don-hang”
“Thanh toán /admin/thanh-toan”
“Webhook logs”
“Sản phẩm & nội dung”
“Sản phẩm /admin/san-pham”
“Bài viết /admin/bai-viet”
“Banner /admin/banner”
“Thư viện /admin/thu-vien”
“Khách hàng & tương tác”
“Tài khoản /admin/tai-khoan”
“Đánh giá /admin/danh-gia”
“Liên hệ /admin/lien-he”
“Voucher”
“Danh sách /admin/voucher”
“Thêm voucher”
“Lịch sử voucher”
Constraints: Bảo toàn đúng cấu trúc hai nhánh và các nhóm. Mọi nhãn phải dễ đọc khi xem toàn màn hình. Dùng route nhỏ hơn tên trang. Doodle không che chữ.
Avoid: watermark, logo bên thứ ba, mockup thiết bị, ảnh chụp, hiệu ứng 3D nặng, nền đỏ toàn màn hình, chữ vô nghĩa, route tự bịa, đường nối giao nhau.
```

Expected: Công cụ trả về một ảnh infographic ngang với đầy đủ hai nhánh và không có watermark.

- [ ] **Step 2: Lưu ảnh được chọn vào workspace**

Sao chép ảnh được công cụ tạo ra từ thư mục mặc định của Codex vào:

```powershell
$sitemapSource = Get-ChildItem -LiteralPath "$env:USERPROFILE\.codex\generated_images" -Recurse -File |
  Where-Object { $_.Extension -eq '.png' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
Copy-Item -LiteralPath $sitemapSource.FullName -Destination 'artifacts/mushroomie-full-website-sitemap.png'
```

Expected: `Test-Path 'artifacts/mushroomie-full-website-sitemap.png'` trả về `True`.

- [ ] **Step 3: Kiểm tra file cơ bản**

Run:

```powershell
Get-Item 'artifacts/mushroomie-full-website-sitemap.png' | Select-Object FullName, Length
```

Expected: File tồn tại, có đuôi `.png`, kích thước lớn hơn `100 KB`.

### Task 2: Kiểm tra trực quan và hoàn thiện

**Files:**
- Inspect: `artifacts/mushroomie-full-website-sitemap.png`
- Replace only if required: `artifacts/mushroomie-full-website-sitemap.png`

**Interfaces:**
- Consumes: Ảnh PNG từ Task 1.
- Produces: Ảnh cuối đã kiểm tra về bố cục, nội dung và nhận diện thương hiệu.

- [ ] **Step 1: Mở ảnh ở độ chi tiết cao**

Dùng image viewer của Codex để xem:

```text
artifacts/mushroomie-full-website-sitemap.png
```

Expected: Ảnh hiển thị đủ canvas, không bị cắt cạnh.

- [ ] **Step 2: Đối chiếu checklist trực quan**

Xác nhận toàn bộ điều kiện:

```text
[ ] Có tiêu đề và slogan đúng.
[ ] Có hai nhánh “Website khách hàng” và “Trang quản trị”.
[ ] Nhánh khách hàng có đủ 5 nhóm: Khám phá, Mua hàng, Tài khoản, Tương tác, Thông tin & chính sách.
[ ] Nhánh quản trị có đủ 5 nhóm: Tổng quan, Bán hàng, Sản phẩm & nội dung, Khách hàng & tương tác, Voucher.
[ ] Không có chữ giả, lỗi dấu nghiêm trọng hoặc route ngoài phạm vi.
[ ] Các card không chồng nhau; đường nối không che chữ.
[ ] Bảng màu và doodle đúng nhận diện Mushroomie.
```

Expected: Tất cả mục đều đạt.

- [ ] **Step 3: Sửa có mục tiêu nếu checklist không đạt**

Nếu có lỗi, chỉnh đúng một nhóm vấn đề bằng một lượt image edit:

```text
Giữ nguyên toàn bộ bố cục, màu sắc, phong cách và các phần đã đạt checklist. Sửa toàn bộ mục chưa đạt theo đúng nội dung của checklist kiểm tra trực quan. Không thêm nội dung mới, không thay đổi tỷ lệ 16:9, không tạo watermark.
```

Expected: Ảnh sửa chỉ thay đổi các lỗi được liệt kê. Sao chép ảnh sửa đè lên file đầu ra sau khi đã xác nhận đúng mục tiêu.

- [ ] **Step 4: Commit ảnh đã kiểm tra**

```powershell
git add -- 'artifacts/mushroomie-full-website-sitemap.png'
git diff --cached --stat
git commit -m "docs: add full Mushroomie website sitemap image"
```

Expected: Commit chỉ chứa file ảnh sitemap.

- [ ] **Step 5: Kiểm tra Git và báo cáo**

Run:

```powershell
git status --short
git log -1 --oneline
```

Expected: Ảnh sitemap đã được commit; các file không liên quan vẫn giữ nguyên và không được stage.

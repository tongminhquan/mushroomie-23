# Thiết kế trang báo cáo hệ thống Mushroomie

## Mục tiêu

Tạo một trang công khai tại `/bao-cao-he-thong` để trình bày toàn bộ kiến trúc, công nghệ và các phân hệ của Mushroomie trước hội đồng chấm thi; đồng thời cập nhật `README.md` thành tài liệu kỹ thuật chính xác, an toàn và liên kết tới trang báo cáo.

## Đối tượng và cách sử dụng

- Hội đồng có thể đọc trực tiếp trên desktop, laptop hoặc điện thoại.
- Người thuyết trình có thể dùng trang như dàn ý trình chiếu liên tục.
- Trang có bố cục in rõ ràng để lưu PDF hoặc làm phụ lục báo cáo.
- Nội dung đủ kỹ thuật cho người chấm chuyên môn nhưng vẫn giải thích nghiệp vụ bằng tiếng Việt dễ hiểu.

## Kiến trúc giao diện

Trang nằm trong route group `src/app/(user)` để kế thừa header, footer, theme và navigation công khai hiện có. Trang là React Server Component tĩnh, không gọi database và không thêm JavaScript tương tác riêng.

Nội dung được chia thành các đơn vị độc lập:

1. Hero và thông tin đề tài.
2. Các số liệu quy mô đã kiểm chứng từ mã nguồn.
3. Mục lục liên kết bằng anchor HTML.
4. Sơ đồ kiến trúc tổng thể bằng HTML/CSS có semantic text.
5. Bảng công nghệ.
6. Cấu trúc mã nguồn.
7. Danh mục phân hệ chức năng.
8. Luồng đặt hàng và thanh toán.
9. Cơ sở dữ liệu và nhóm model.
10. Bảo mật, hiệu suất, SEO, analytics và vận hành.
11. Điểm nổi bật, giới hạn và hướng phát triển.
12. Dàn ý thuyết trình và câu hỏi phản biện thường gặp.

## Ngôn ngữ thiết kế

- Dùng màu thương hiệu hiện có: đỏ Mushroomie, kem, hồng nhạt, vàng kem và nâu kraft.
- Hình thức editorial/technical report thay vì dashboard quản trị hoặc landing page quảng cáo.
- Typography dùng Paytone One cho tiêu đề và Montserrat cho nội dung thông qua token toàn cục.
- Card có thứ bậc rõ, không dùng hiệu ứng kính hoặc gradient AI mặc định.
- Trang trí dạng grid giấy kỹ thuật, nhãn chương, đường nối kiến trúc và chip công nghệ.
- Chuyển động chỉ kế thừa motion nhẹ của hệ thống; hỗ trợ `prefers-reduced-motion`.

## Responsive và accessibility

- Mục lục hai cột ở desktop và một cột trên mobile.
- Sơ đồ kiến trúc chuyển từ hàng ngang sang luồng dọc ở màn hình nhỏ.
- Bảng có vùng cuộn ngang riêng, không làm toàn trang bị overflow.
- Mỗi section có heading theo thứ tự, chỉ một `h1`.
- Anchor có offset để không bị header che.
- Link và nút có focus-visible, tap target tối thiểu 44px.
- Màu chữ và nền dùng token theme để tương thích light/dark mode.

## Chế độ in

CSS `@media print` sẽ:

- Ẩn header, footer, mobile navigation và các widget không thuộc báo cáo.
- Bỏ animation, shadow và nền trang trí tốn mực.
- Hiển thị nội dung theo khổ A4, giữ heading cùng section khi có thể.
- Tránh cắt card, bảng và khối sơ đồ giữa hai trang.
- Hiển thị URL cần thiết dưới dạng văn bản nhưng không lộ cấu hình nhạy cảm.

## Nội dung kỹ thuật bắt buộc

- Next.js 16.2.11, React 19.2.4, TypeScript, Tailwind CSS 4.
- MySQL và Prisma 5.22.
- NextAuth 5 với Google OAuth, Credentials và JWT.
- Zustand, Zod, bcryptjs và Sharp.
- Thanh toán VietQR + Casso, VietQR + SePay và PayOS qua provider abstraction.
- PM2, Nginx, Cloudflare, GitHub Actions và standalone deployment.
- 77 page route, 73 API route, 29 Prisma model và hơn 100 file kiểm thử/tài nguyên kiểm thử tại thời điểm báo cáo.
- Các phân hệ sản phẩm, giỏ hàng, đơn hàng, thanh toán, voucher, mini game, tài khoản, admin, CMS, media, review, contact, SEO, analytics và email.
- Không công khai secret, mật khẩu mẫu, database URL thật, webhook token hoặc thông tin tài khoản ngân hàng.
- VPS production hiện hành là `103.77.242.153`; không sử dụng IP cũ `103.173.226.86` trong tài liệu mới.

## README

`README.md` sẽ được cập nhật bằng UTF-8 chuẩn, gồm:

- Tổng quan đề tài và liên kết production.
- Liên kết nổi bật đến `/bao-cao-he-thong`.
- Kiến trúc và tech stack chính xác.
- Danh sách phân hệ và cơ chế bảo mật quan trọng.
- Cấu trúc thư mục.
- Hướng dẫn local, kiểm thử và production an toàn.
- Không chứa tài khoản/mật khẩu mặc định hoặc khuyến nghị triển khai sai với hạ tầng hiện tại.

## Kiểm thử và tiêu chí hoàn tất

- Test source contract xác nhận route, metadata, heading, các section bắt buộc và link README tồn tại.
- `npm run typecheck` thành công.
- Test liên quan và test suite thành công.
- `npm run lint` không có lỗi trong phạm vi thay đổi.
- `npm run build` thành công và sinh route `/bao-cao-he-thong`.
- Kiểm tra trình duyệt ở 1440px, 390px và 360px: không overflow, không broken asset, không console error nghiêm trọng.
- Production trả HTTP 200 cho trang mới; CSS/JS trả đúng MIME; PM2 không có runtime error.

## Ngoài phạm vi

- Không thay đổi schema database hoặc chạy migration.
- Không thay đổi checkout, payment webhook, auth, upload hoặc quyền admin.
- Không thêm trang báo cáo vào navigation bán hàng chính để tránh làm loãng hành trình mua sắm.
- Không thêm thư viện UI, chart hoặc animation mới.
- Không xóa hoặc commit các file untracked hiện có của người dùng.

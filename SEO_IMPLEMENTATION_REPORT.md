# Báo cáo triển khai SEO Mushroomie

Ngày audit và triển khai: 2026-07-13

Website: https://mushroomie.io.vn
Nguồn từ khóa: `mushroomie_30_tu_khoa_seo.csv`

## 1. Tóm tắt audit

### Stack và cơ chế render

- Next.js 16.2.10 App Router, React 19 và TypeScript.
- Server Components cho trang chủ, danh mục, chi tiết sản phẩm và bài viết; Client Components chỉ dùng cho tương tác.
- Prisma 5 kết nối MySQL; production chạy Next.js standalone qua PM2 và Nginx.
- Metadata được quản lý bằng Metadata API, `generateMetadata`, `robots.ts` và `sitemap.ts` của Next.js.

### Dữ liệu thật được đối chiếu

- 4 danh mục sản phẩm public: `vong-tay`, `charm`, `moc-khoa`, `vong-co`.
- 21 sản phẩm active tại thời điểm audit.
- Crawl sitemap production trước triển khai: 105 URL, không có URL trả 4xx/5xx.
- Nhiều bài viết hỗ trợ cụm vòng tay, charm, móc khóa, quà tặng đã được xuất bản và có trong sitemap.

### Phát hiện ưu tiên cao

1. `/san-pham`, tìm kiếm, sắp xếp, phân trang và mọi danh mục dùng chung metadata tĩnh; thiếu canonical và robots meta theo biến thể.
2. Title ở một số trang đã chứa `| Mushroomie` trong khi root layout cũng áp dụng template, gây title lặp thương hiệu.
3. Sitemap dùng `new Date()` cho nhiều URL tĩnh và danh mục, khiến `lastmod` thay đổi dù nội dung không đổi.
4. Trang danh mục chỉ có lưới sản phẩm, chưa có nội dung hỗ trợ lựa chọn và internal link theo cụm chủ đề.
5. Danh mục chưa có ItemList schema từ sản phẩm thật.
6. Admin, API, tài khoản, giỏ hàng và thanh toán chỉ dựa vào `robots.txt`, chưa có `X-Robots-Tag` để phòng index ngoài ý muốn.
7. GA4/GTM đã có nhưng chưa phát các event thương mại điện tử chính.
8. Hai slug sản phẩm production dùng chữ hoa hoặc ký tự có dấu (`Vòng-tay-quả-táo`, `vòng-vỏ-sò`). Không đổi trong đợt này vì cần cập nhật DB và redirect 301 có kiểm soát.

### Indexability sau triển khai

**Được index:** trang chủ, `/san-pham`, trang đầu của 4 danh mục thật, sản phẩm active, `/tin-tuc`, chủ đề bài viết hợp lệ trang đầu, bài published, giới thiệu, liên hệ, chính sách và landing local đã xuất bản.

**Không index nhưng vẫn cho follow khi phù hợp:** tìm kiếm nội bộ, sắp xếp, phân trang từ trang 2, danh mục không tồn tại và mini game.

**Không index/no follow bằng header và chặn crawl:** `/admin`, `/api`, `/tai-khoan`, `/gio-hang`, `/thanh-toan`.

## 2. Keyword mapping 30 từ khóa

Quyết định quan trọng: không tạo 30 landing page. Các từ khóa cùng search intent được gom vào một URL thương mại mạnh; bài viết đóng vai trò hỗ trợ thông tin và dẫn người đọc về danh mục/sản phẩm.

| # | Primary keyword | Secondary keywords | Intent | URL đích | Page type | Title đề xuất | Meta description đề xuất | H1 đề xuất | Internal links đến/đi | Trạng thái |
|---:|---|---|---|---|---|---|---|---|---|---|
| 1 | vòng tay handmade | vòng tay, handmade 100% | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Chọn vòng tay handmade nữ, vòng hạt cườm, vòng charm và mẫu custom từ Mushroomie. | Vòng tay handmade cá nhân hóa | Home, bài vòng tay → custom, charm, hạt cườm | Tối ưu |
| 2 | vòng tay | vòng tay handmade | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Khám phá mẫu vòng tay đang bán, giá, tồn kho và tùy chọn cá nhân hóa. | Vòng tay handmade cá nhân hóa | Home/category → sản phẩm | Tối ưu |
| 3 | vòng tay nữ | vòng tay handmade nữ | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Chọn vòng tay handmade dễ phối hoặc làm quà, có mẫu hỗ trợ custom. | Vòng tay handmade cá nhân hóa | Bài `vong-tay-handmade-nu` → danh mục | Gom intent |
| 4 | vòng tay handmade nữ | vòng tay nữ, vòng tay nữ cá tính | Thương mại | `/san-pham?category=vong-tay` | Danh mục + bài hỗ trợ | Vòng tay handmade cá nhân hóa | Xem mẫu vòng tay nữ thủ công với màu sắc và charm trẻ trung. | Vòng tay handmade cá nhân hóa | Bài nữ → danh mục và sản phẩm | Gom intent |
| 5 | vòng tay custom | vòng tay cá nhân hóa | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Chọn mẫu hỗ trợ đổi màu, charm hoặc ghi chú custom theo yêu cầu. | Vòng tay handmade cá nhân hóa | Danh mục → `/lien-he`, bài custom | Tối ưu |
| 6 | vòng tay theo yêu cầu | vòng tay custom | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Bắt đầu từ mẫu thật và trao đổi lựa chọn custom với Mushroomie. | Vòng tay handmade cá nhân hóa | Bài `mua-vong-tay-custom` → danh mục/liên hệ | Gom intent |
| 7 | vòng tay hạt cườm | vòng tay hạt pastel | Thương mại | `/san-pham?category=vong-tay` | Danh mục + bài hỗ trợ | Vòng tay handmade cá nhân hóa | Xem vòng hạt cườm đang bán và hướng dẫn chọn màu, kích thước. | Vòng tay handmade cá nhân hóa | `vong-tay-hat-cuom` ↔ danh mục | Gom intent |
| 8 | vòng tay charm | charm vòng tay | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Chọn vòng tay có charm và xem khả năng phối charm theo mẫu. | Vòng tay handmade cá nhân hóa | Danh mục vòng tay ↔ charm ↔ bài charm | Gom intent |
| 9 | vòng tay đôi | vòng tay couple | Thương mại | `/san-pham?category=vong-tay` | Danh mục + bài hỗ trợ | Vòng tay handmade cá nhân hóa | Gợi ý mẫu vòng đôi thủ công để lưu kỷ niệm chung. | Vòng tay handmade cá nhân hóa | `vong-tay-doi-handmade` → sản phẩm | Gom intent |
| 10 | vòng tay tình bạn | vòng tay đôi bạn thân | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Chọn vòng tay tình bạn theo màu sắc hoặc biểu tượng chung. | Vòng tay handmade cá nhân hóa | Bài best friend → danh mục | Gom intent |
| 11 | vòng tay bạn thân | vòng tay best friend | Thương mại | `/san-pham?category=vong-tay` | Danh mục + bài hỗ trợ | Vòng tay handmade cá nhân hóa | Xem mẫu vòng tay handmade phù hợp làm quà cho bạn thân. | Vòng tay handmade cá nhân hóa | `vong-tay-best-friend-handmade` → danh mục | Gom intent |
| 12 | vòng tay handmade cute | vòng tay dễ thương | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Khám phá vòng tay màu trẻ trung, charm nhỏ và thiết kế dễ phối. | Vòng tay handmade cá nhân hóa | Bài phong cách → sản phẩm thật | Gom intent |
| 13 | vòng tay handmade giá rẻ | vòng tay dễ tiếp cận | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | So sánh giá thật trên từng mẫu vòng tay; không cam kết giá rẻ khi dữ liệu thay đổi. | Vòng tay handmade cá nhân hóa | Danh mục → sản phẩm | Giữ an toàn dữ liệu |
| 14 | vòng tay handmade theo tên | vòng custom tên riêng | Thương mại | `/san-pham?category=vong-tay` | Danh mục + bài hỗ trợ | Vòng tay handmade cá nhân hóa | Chọn mẫu custom và gửi tên hoặc thông điệp để được xác nhận phương án. | Vòng tay handmade cá nhân hóa | `vong-tay-custom-theo-ten` → liên hệ | Gom intent |
| 15 | vòng tay handmade làm quà | quà vòng tay | Thương mại | `/san-pham?category=vong-tay` | Danh mục | Vòng tay handmade cá nhân hóa | Chọn vòng tay làm quà theo màu, charm và câu chuyện người nhận. | Vòng tay handmade cá nhân hóa | Bài quà tặng → danh mục/chính sách | Gom intent |
| 16 | phụ kiện handmade | phụ kiện cá nhân hóa | Thương mại | `/san-pham` | Trang trụ cột | Phụ kiện handmade cá nhân hóa | Khám phá vòng tay, charm, móc khóa, vòng cổ handmade và các mẫu custom. | Phụ kiện handmade cá nhân hóa | Home → 4 danh mục → bài quà tặng | Tối ưu |
| 17 | shop phụ kiện handmade | shop handmade online | Điều hướng/Thương mại | `/` | Trang chủ | Mushroomie - Phụ kiện handmade cá nhân hóa | Mushroomie mang đến phụ kiện thủ công có thể cá nhân hóa cho phong cách riêng. | Mushroomie - phụ kiện handmade cá nhân hóa | Home → `/san-pham`, giới thiệu, liên hệ | Tối ưu |
| 18 | trang sức handmade | vòng tay, vòng cổ handmade | Thương mại | `/san-pham` | Trang trụ cột | Phụ kiện handmade cá nhân hóa | Xem vòng tay, vòng cổ, dây chuyền và charm handmade đang bán. | Phụ kiện handmade cá nhân hóa | `trang-suc-handmade` → danh mục | Gom intent |
| 19 | phụ kiện nữ | phụ kiện handmade nữ | Thương mại | `/san-pham` | Trang trụ cột | Phụ kiện handmade cá nhân hóa | Chọn phụ kiện nữ thủ công theo màu sắc, kiểu dáng và mục đích sử dụng. | Phụ kiện handmade cá nhân hóa | Bài phụ kiện nữ → danh mục | Gom intent |
| 20 | phụ kiện thời trang | phụ kiện cá nhân hóa | Thương mại | `/san-pham` | Trang trụ cột | Phụ kiện handmade cá nhân hóa | Phối phụ kiện handmade trẻ trung mà không làm lệch định vị thủ công. | Phụ kiện handmade cá nhân hóa | Bài phối đồ → danh mục | Gom intent |
| 21 | móc khóa handmade | móc khóa cá nhân hóa | Thương mại | `/san-pham?category=moc-khoa` | Danh mục | Móc khóa handmade dễ thương | Chọn móc khóa handmade, xem ảnh thật, giá, tồn kho và khả năng custom. | Móc khóa handmade dễ thương | Home/bài móc khóa → danh mục | Tối ưu |
| 22 | móc khóa điện thoại | dây treo điện thoại handmade | Thương mại | `/san-pham?category=moc-khoa` | Danh mục | Móc khóa handmade dễ thương | Xem mẫu phù hợp cho điện thoại khi công dụng được ghi rõ trên sản phẩm. | Móc khóa handmade dễ thương | Bài điện thoại → danh mục/sản phẩm | Gom intent |
| 23 | móc khóa cute | móc khóa dễ thương | Thương mại | `/san-pham?category=moc-khoa` | Danh mục | Móc khóa handmade dễ thương | Khám phá móc khóa có màu sắc và charm trẻ trung từ sản phẩm thật. | Móc khóa handmade dễ thương | Bài cute → danh mục | Gom intent |
| 24 | charm handmade | charm cá nhân hóa | Thương mại | `/san-pham?category=charm` | Danh mục | Charm handmade cho vòng tay và phụ kiện | Chọn charm handmade để phối vòng tay, móc khóa hoặc mẫu custom. | Charm handmade cho phong cách riêng | Home/vòng tay → charm | Tối ưu |
| 25 | charm vòng tay | vòng tay charm | Thương mại | `/san-pham?category=charm` | Danh mục | Charm handmade cho vòng tay và phụ kiện | Khám phá charm vòng tay và hướng dẫn phối chi tiết hài hòa. | Charm handmade cho phong cách riêng | Charm ↔ vòng tay ↔ bài hướng dẫn | Tối ưu |
| 26 | vòng cổ handmade | trang sức handmade | Thương mại | `/san-pham?category=vong-co` | Danh mục | Vòng cổ và dây chuyền handmade | Khám phá vòng cổ handmade với ảnh thật, giá và thông tin sản phẩm. | Vòng cổ và dây chuyền handmade | Bài vòng cổ → danh mục | Tối ưu |
| 27 | dây chuyền handmade | dây chuyền nữ handmade | Thương mại | `/san-pham?category=vong-co` | Danh mục | Vòng cổ và dây chuyền handmade | Xem dây chuyền handmade đang bán; chưa tách trang khi sản phẩm còn ít. | Vòng cổ và dây chuyền handmade | Bài dây chuyền → danh mục | Gom intent |
| 28 | quà tặng handmade | quà cá nhân hóa | Thương mại/Thông tin | `/tin-tuc/qua-tang-handmade` | Bài trụ cột | Quà tặng handmade: cách chọn món quà có dấu ấn riêng | Gợi ý chọn quà handmade theo người nhận, dịp tặng và sản phẩm thật. | Quà tặng handmade mang dấu ấn riêng | Bài → danh mục, sản phẩm, chính sách | Giữ + tăng link |
| 29 | quà sinh nhật cho bạn thân | quà handmade bạn thân | Thương mại/Thông tin | `/tin-tuc/vong-tay-best-friend-handmade` | Bài hỗ trợ | Vòng tay best friend handmade làm quà bạn thân | Gợi ý vòng tay và phụ kiện handmade cho sinh nhật bạn thân. | Quà handmade cho bạn thân | Bài → vòng tay/móc khóa | Giữ + hỗ trợ |
| 30 | quà handmade cho người yêu | quà đôi cá nhân hóa | Thương mại/Thông tin | `/tin-tuc/qua-handmade-tang-nguoi-yeu` | Bài hỗ trợ | Quà handmade tặng người yêu có dấu ấn riêng | Gợi ý quà thủ công, vòng đôi và chi tiết cá nhân hóa cho người yêu. | Quà handmade cho người yêu | Bài → vòng tay/custom/liên hệ | Giữ + hỗ trợ |

## 3. File đã sửa hoặc tạo

- `src/lib/catalog-seo.ts`: metadata, nội dung và internal link cho trang trụ cột cùng 4 danh mục thật.
- `src/components/product/CatalogSeoContent.tsx`: nội dung hướng dẫn chọn phụ kiện hiển thị trên trang danh mục.
- `src/app/(user)/san-pham/page.tsx`: metadata động, canonical, robots, ItemList schema và nội dung danh mục.
- `src/app/(user)/san-pham/[slug]/page.tsx`: canonical, title không lặp brand, Brand/Seller trong Product schema và tracking view item.
- `src/app/(user)/tin-tuc/page.tsx`: metadata/canonical/indexability theo chủ đề và phân trang.
- `src/app/(user)/page.tsx`, `gioi-thieu/page.tsx` và các trang chính sách: canonical và title chuẩn hóa.
- `src/app/sitemap.ts`, `src/app/robots.ts`, `next.config.ts`: sitemap ổn định và chặn index route riêng tư/kỹ thuật.
- `src/lib/analytics.ts`, ProductCard, AddToCartButton và checkout: event thương mại điện tử không chứa PII.
- `tests/catalog-seo.test.ts`: kiểm tra danh mục thật, canonical và indexability.
- `mushroomie_30_tu_khoa_seo.csv`: nguồn từ khóa được lưu trong repository.
- `docs/seo-admin-guide.md`: hướng dẫn quản trị SEO.

## 4. Trang mới và redirect

- Không tạo landing page public mới. Dữ liệu hiện có chỉ đủ cho 4 danh mục thật; tạo thêm sẽ dẫn đến nội dung mỏng hoặc doorway page.
- Không đổi URL và không thêm redirect trong đợt này.
- Hai slug sản phẩm có chữ hoa/ký tự có dấu được giữ nguyên để tránh 404. Việc chuẩn hóa cần backup DB, bảng redirect 301 và cập nhật internal link trước khi apply.

## 5. Structured data

- Giữ LocalBusiness và WebSite schema trên trang chủ, Article trên bài viết, Product trên chi tiết sản phẩm và BreadcrumbList trên breadcrumb.
- Product schema được bổ sung `Brand` và `seller` từ dữ liệu thương hiệu thật.
- Thêm ItemList schema cho trang trụ cột và trang đầu của danh mục khi có sản phẩm thật.
- Không thêm FAQ schema mới. FAQPage cũ chỉ được giữ ở trang có FAQ hiển thị; không coi đây là tính năng rich result của Google.

## 6. Analytics

Đã bổ sung event theo cấu trúc `dataLayer` hiện có:

- `view_item`
- `select_item`
- `add_to_cart`
- `begin_checkout`
- `purchase` (khử trùng lặp theo mã đơn trong session)
- `click_custom_order`

Không đưa tên, email, số điện thoại, địa chỉ hoặc access token vào analytics.

## 7. Kiểm thử

- `npm run typecheck`: đạt.
- `npm test`: 48/48 đạt.
- `npm run lint -- --max-warnings=999`: 0 lỗi, 214 cảnh báo cũ ngoài phạm vi.
- `npm run build` với URL DB giả để kiểm tra compile/route: đạt, 97 route. Lỗi kết nối Prisma trong log là mong đợi do DB giả và các trang đã dùng fallback.
- Crawl sitemap production trước deploy: 105/105 URL không có 4xx/5xx.
- Build production và route/MIME/header sau deploy được ghi bổ sung trong báo cáo triển khai cuối của commit.

## 8. Giới hạn và việc cần con người xác nhận

1. Xác nhận dữ liệu sản phẩm: sản phẩm “Dây chuyền pha lê” đang có mô tả mở đầu về charm điện thoại; một số `sale_price` thấp bất thường so với giá gốc. Không tự sửa vì đây là dữ liệu kinh doanh.
2. Duyệt kế hoạch chuẩn hóa hai slug sản phẩm có chữ hoa/ký tự có dấu trước khi tạo redirect 301.
3. Kiểm tra các event mới trong GA4 DebugView/GTM Preview sau khi có traffic thật.
4. Gửi lại sitemap trong Google Search Console và theo dõi Indexing/Coverage; code không thể bảo đảm thứ hạng hoặc thời điểm Google index.
5. Theo dõi Search Console theo cụm URL trong 4-8 tuần để phát hiện cannibalization trước khi cân nhắc landing page mới.

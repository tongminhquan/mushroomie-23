# Thiết kế tối ưu 4 từ khóa Local SEO ưu tiên

## 1. Bối cảnh

Mushroomie đang theo dõi bốn từ khóa local có ý định thương mại rõ:

| Từ khóa | Owner URL |
| --- | --- |
| vòng tay handmade Đồng Nai | `/vong-tay-handmade-dong-nai` |
| vòng tay custom Biên Hòa | `/vong-tay-custom-bien-hoa` |
| móc khóa handmade Đồng Nai | `/moc-khoa-handmade-dong-nai` |
| quà tặng handmade Đồng Nai | `/qua-tang-handmade-dong-nai` |

Baseline ngày 28/07/2026 cho thấy Google đã phát hiện Mushroomie với ba từ khóa, nhưng đang chọn `/lien-he`, `/` hoặc `/tin-tuc` thay vì landing page chuyên biệt. Từ khóa móc khóa chưa phát hiện Mushroomie trong phạm vi đo. Đây là vấn đề phân tán tín hiệu và chọn sai owner URL, không phải thiếu landing page.

Production đã có đủ bốn landing page, self-canonical, sitemap, nội dung riêng theo ý định tìm kiếm và LocalBusiness, Service, Breadcrumb, FAQ schema. Đợt triển khai này củng cố quyền sở hữu truy vấn và tín hiệu thương mại; không tạo thêm landing page.

## 2. Mục tiêu

1. Tập trung tín hiệu on-page và internal link về đúng bốn owner URL.
2. Giảm cannibalization từ trang chủ, liên hệ và tin tức mà không làm giảm giá trị các trang đó.
3. Tăng độ phù hợp thương mại bằng sản phẩm và hành động mua hàng có thật.
4. Giữ NAP, schema, canonical, robots và sitemap nhất quán.
5. Tạo baseline kỹ thuật có thể kiểm tra lại sau khi Google thu thập dữ liệu.

Top 5 là mục tiêu đo lường, không phải kết quả có thể bảo đảm bằng thay đổi mã nguồn. Thời gian đánh giá hợp lý là 2-8 tuần sau khi Google thu thập và xử lý lại các URL.

## 3. Phạm vi

### Trong phạm vi

- Bốn owner URL nêu trên.
- Trang chủ, trang liên hệ, footer và trang danh mục liên quan với vai trò nguồn internal link.
- Metadata, canonical, sitemap lastmod, structured data và nội dung hiển thị liên quan trực tiếp.
- Kiểm thử tự động cho owner map, anchor quan trọng, schema và indexability.
- Xác minh production và gửi lại bốn URL cho Google Search Console nếu phiên đăng nhập cho phép.

### Ngoài phạm vi

- Tạo thêm landing page địa phương.
- Mua backlink, tạo backlink tự động hoặc dùng PBN.
- Tạo review, rating, địa chỉ hay thông tin cửa hàng không có thật.
- Thay đổi auth, checkout, payment, order, voucher hoặc dữ liệu sản phẩm.
- Cam kết hoặc thao túng thứ hạng.

## 4. Kiến trúc tín hiệu

### 4.1. Một từ khóa, một owner URL

Tạo một cấu hình dùng chung mô tả bốn từ khóa, owner URL và các trang nguồn cần liên kết. Kiểm thử sẽ bảo đảm không có hai owner cho cùng từ khóa.

Các trang chủ, liên hệ và tin tức vẫn có thể nhắc đến khu vực phục vụ, nhưng không được tự nhận canonical hoặc metadata exact-match của bốn truy vấn ưu tiên.

### 4.2. Internal link

Mỗi owner URL phải nhận liên kết trực tiếp, có ngữ cảnh từ tối thiểu ba nhóm nguồn:

- Trang chủ hoặc khối khu vực trên trang chủ.
- Trang danh mục phù hợp với sản phẩm.
- Trang liên hệ, footer hoặc một landing local liên quan.

Anchor text cần tự nhiên và có biến thể, không lặp exact-match dày đặc. Ưu tiên liên kết trong nội dung hiển thị thay vì chỉ dựa vào footer.

### 4.3. Bằng chứng thương mại

Mỗi landing phải thể hiện đúng ý định mua hàng:

- Liên kết tới danh mục sản phẩm phù hợp.
- Mô tả cách chọn, custom, thời gian hoàn thiện và giao nhận có thật.
- CTA rõ tới sản phẩm hoặc liên hệ.
- Không hiển thị giá, tồn kho, thời gian giao hay ưu đãi không lấy từ dữ liệu thật.

Không thêm nội dung dài chỉ để tăng số từ. Nội dung bổ sung phải giải đáp một quyết định mua hàng cụ thể.

### 4.4. Local entity và schema

NAP tiếp tục lấy từ `BRAND` trong `src/lib/local-seo.ts` làm nguồn chân lý. Bốn landing dùng cùng một LocalBusiness `@id`, đồng thời có Service riêng theo URL và khu vực.

Không thêm `aggregateRating` hoặc `review` nếu không có dữ liệu đánh giá thật. Không khai báo cửa hàng vật lý tại Biên Hòa nếu địa điểm thật ở Trảng Dài.

### 4.5. Indexability

Bốn owner URL phải:

- Trả HTTP 200.
- Không có `noindex`.
- Có self-canonical HTTPS.
- Có trong sitemap với `lastmod` phản ánh lần cập nhật thực.
- Không bị robots.txt chặn.
- Không redirect qua URL khác.

Sau deploy, gửi sitemap và yêu cầu lập chỉ mục bốn URL trong Search Console. Việc gửi lại không đồng nghĩa Google chắc chắn lập chỉ mục hoặc xếp hạng ngay.

## 5. Trải nghiệm người dùng

Các thay đổi giữ giao diện hiện tại, mobile-first và phong cách Mushroomie. Khối internal link hoặc sản phẩm bổ sung phải:

- Có tap target tối thiểu 44px.
- Không gây cuộn ngang ở 360px và 390px.
- Không làm tăng đáng kể JavaScript phía client.
- Giữ ảnh sản phẩm theo tỷ lệ 3:4 nếu hiển thị ProductCard.
- Dùng server-rendered HTML để bot và người dùng nhận nội dung đồng nhất.

## 6. Kiểm thử

### Tự động

- Kiểm tra bốn owner URL tồn tại duy nhất.
- Kiểm tra metadata, canonical và sitemap cho từng owner.
- Kiểm tra LocalBusiness, Service, Breadcrumb và FAQ schema.
- Kiểm tra mỗi owner có đủ nguồn internal link theo ma trận đã định.
- Kiểm tra NAP hiển thị khớp schema.
- Chạy test liên quan, `npm run typecheck` và `npm run build`.

### Production

- Curl bốn owner URL, sitemap.xml và robots.txt.
- Xác minh HTTP 200, canonical, noindex, schema và MIME tài nguyên.
- Kiểm tra desktop 1440px và mobile 390px/360px.
- Kiểm tra PM2 logs sau deploy.

## 7. Rollback

Thay đổi chỉ nằm ở metadata, nội dung local, internal link và test. Rollback bằng cách revert commit triển khai và chạy lại `deploy.sh`. Không có migration hoặc thay đổi dữ liệu production.

## 8. Tiêu chí hoàn tất

- Bốn owner URL đạt toàn bộ tiêu chí indexability.
- Internal link tập trung đúng owner và không tạo exact-match spam.
- Nội dung và schema không chứa thông tin địa phương giả.
- Test, typecheck và build sạch.
- Commit được push lên GitHub và production chạy đúng commit.
- Có baseline ngày triển khai để so sánh lại sau 2-8 tuần.

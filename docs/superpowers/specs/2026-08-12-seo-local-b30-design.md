# Đặc tả SEO Local B30 cho Mushroomie

Ngày phê duyệt thiết kế: 12/08/2026

Phạm vi: 30 truy vấn local, 23 owner URL, property `sc-domain:mushroomie.io.vn`
Địa bàn thật: xưởng tại Trảng Dài, Đồng Nai; phục vụ Biên Hòa và giao online đến TP.HCM

## 1. Mục tiêu

Mushroomie tối ưu 30 truy vấn local có ý định mua hoặc đặt làm phụ kiện handmade. Hệ thống phải:

1. Gán mỗi truy vấn cho đúng một owner URL canonical.
2. Không tạo doorway page chỉ để đổi tên địa phương.
3. Làm rõ mô hình kinh doanh thật: có xưởng tại Trảng Dài; TP.HCM chỉ là khu vực giao online.
4. Đưa đủ 23 owner URL vào trạng thái Google có thể crawl, index và hiểu đúng canonical.
5. Tăng thứ hạng bằng nội dung có ích, internal link, entity/NAP, Google Business Profile, review thật, citation và local authority.
6. Theo dõi riêng từng truy vấn, owner URL, organic rank và Local Pack cho đến khi có bằng chứng top 1.

Top 1 là mục tiêu dài hạn, không phải trạng thái có thể bảo đảm bằng code hoặc Search Console API. Google quyết định crawl, index và xếp hạng. Mushroomie chỉ coi một truy vấn đạt mục tiêu khi hệ thống đo lường có bằng chứng vị trí 1, đúng owner URL, trên cùng cấu hình địa lý/ngôn ngữ/thiết bị trong ba lần đo hàng tuần liên tiếp. Một ảnh SERP đơn lẻ không đủ bằng chứng.

## 2. Baseline xác thực ngày 12/08/2026

### 2.1 Search Console 90 ngày

- Khoảng dữ liệu cuối: 12/05/2026–09/08/2026, dữ liệu `final`.
- 33 cặp query–page, 17 truy vấn duy nhất.
- Truy vấn `mushroomie`: 28 click, 111 impression, CTR 25,23%, vị trí trung bình 2,05.
- Trong danh sách 30 từ khóa tổng quát cũ, chỉ `vòng tay handmade nữ` có impression: 1 impression, vị trí 24.
- Tín hiệu local ngoài thương hiệu còn quá ít để suy ra thứ hạng ổn định.

### 2.2 Indexability 23 owner URL local

- 23/23 trả HTTP 200.
- 23/23 nằm trong sitemap.
- 23/23 có canonical tự tham chiếu chính xác.
- 23/23 có đúng một H1.
- 23/23 có JSON-LD parse được, gồm `LocalBusiness`, `Service`, `BreadcrumbList` và `FAQPage`.
- 23/23 có ít nhất 600 từ trong HTML server-rendered; thực tế khoảng 967–1.199 từ.
- 23/23 có ba internal link local theo cấu trúc hiện tại.
- 4/23 được URL Inspection trả `PASS / Submitted and indexed`.
- 19/23 được trả `NEUTRAL / URL is unknown to Google`.
- 0 lỗi canonical, robots, xác thực GSC hoặc lỗi vận hành worker.

Bốn URL đã index:

- `/vong-tay-handmade-dong-nai`
- `/vong-tay-custom-bien-hoa`
- `/moc-khoa-handmade-dong-nai`
- `/qua-tang-handmade-dong-nai`

### 2.3 Baseline kỹ thuật và nội dung

- 21/21 kiểm thử Local SEO hiện hữu pass.
- NAP tập trung tại `BRAND` và nhất quán giữa trang, schema và trang liên hệ.
- Tọa độ đã khai báo: `10.996333, 106.882306`.
- 23 landing có đoạn nội dung địa phương riêng; kiểm thử 5-gram không phát hiện near-duplicate vượt ngưỡng 35%.
- Trang TP.HCM đã bị khóa bằng test để không nhận là có cửa hàng/xưởng tại TP.HCM.
- 23/23 title dài 50–60 ký tự.
- Chỉ 5/23 meta description nằm trong ngưỡng tham chiếu 140–165 ký tự; đây là cơ hội tối ưu CTR, không phải lỗi indexability.

## 3. Bản đồ 30 truy vấn và owner URL

Mỗi hàng là một truy vấn đo lường độc lập. Một owner có thể sở hữu nhiều biến thể nếu ý định và SERP trùng nhau. Không tạo thêm URL cho bảy biến thể phụ.

| # | Truy vấn | Owner URL | Vai trò |
|---:|---|---|---|
| 1 | phụ kiện handmade Đồng Nai | `/phu-kien-handmade-dong-nai` | primary |
| 2 | shop phụ kiện handmade Đồng Nai | `/shop-phu-kien-handmade-dong-nai` | primary |
| 3 | phụ kiện handmade Biên Hòa | `/phu-kien-handmade-bien-hoa` | primary |
| 4 | phụ kiện handmade TP.HCM | `/phu-kien-handmade-tphcm` | primary, giao online |
| 5 | vòng tay handmade Đồng Nai | `/vong-tay-handmade-dong-nai` | primary |
| 6 | vòng tay custom Đồng Nai | `/vong-tay-custom-dong-nai` | primary |
| 7 | vòng tay custom Biên Hòa | `/vong-tay-custom-bien-hoa` | primary |
| 8 | móc khóa handmade Đồng Nai | `/moc-khoa-handmade-dong-nai` | primary |
| 9 | móc khóa handmade theo yêu cầu Đồng Nai | `/moc-khoa-handmade-theo-yeu-cau-dong-nai` | primary |
| 10 | quà tặng handmade Đồng Nai | `/qua-tang-handmade-dong-nai` | primary |
| 11 | quà tặng cá nhân hóa Đồng Nai | `/qua-tang-ca-nhan-hoa-dong-nai` | primary |
| 12 | phụ kiện handmade Trảng Dài | `/phu-kien-handmade-trang-dai` | primary |
| 13 | vòng tay handmade Trảng Dài | `/vong-tay-handmade-trang-dai` | primary |
| 14 | shop phụ kiện handmade Biên Hòa | `/shop-phu-kien-handmade-bien-hoa` | primary |
| 15 | vòng tay handmade Biên Hòa | `/vong-tay-handmade-bien-hoa` | primary |
| 16 | móc khóa handmade Biên Hòa | `/moc-khoa-handmade-bien-hoa` | primary |
| 17 | quà tặng handmade Biên Hòa | `/qua-tang-handmade-bien-hoa` | primary |
| 18 | vòng tay custom TP.HCM | `/vong-tay-custom-tphcm` | primary, giao online |
| 19 | móc khóa handmade TP.HCM | `/moc-khoa-handmade-tphcm` | primary, giao online |
| 20 | quà tặng handmade TP.HCM | `/qua-tang-handmade-tphcm` | primary, giao online |
| 21 | vòng tay cặp đôi Đồng Nai | `/vong-tay-cap-doi-dong-nai` | primary |
| 22 | charm handmade Đồng Nai | `/charm-handmade-dong-nai` | primary |
| 23 | dây chuyền handmade Đồng Nai | `/day-chuyen-handmade-dong-nai` | primary |
| 24 | vòng tay theo yêu cầu Đồng Nai | `/vong-tay-custom-dong-nai` | secondary |
| 25 | vòng tay handmade theo tên Đồng Nai | `/vong-tay-custom-dong-nai` | secondary |
| 26 | móc khóa custom Đồng Nai | `/moc-khoa-handmade-theo-yeu-cau-dong-nai` | secondary |
| 27 | quà sinh nhật handmade Đồng Nai | `/qua-tang-handmade-dong-nai` | secondary |
| 28 | quà handmade cho người yêu Đồng Nai | `/qua-tang-ca-nhan-hoa-dong-nai` | secondary |
| 29 | charm vòng tay Đồng Nai | `/charm-handmade-dong-nai` | secondary |
| 30 | shop vòng tay handmade Đồng Nai | `/vong-tay-handmade-dong-nai` | secondary |

## 4. Kiến trúc nội dung

### 4.1 Hub và cluster

- Hub địa phương cấp website: homepage section `Mushroomie tại khu vực của bạn` và trang `/lien-he`.
- Hub Đồng Nai: `/phu-kien-handmade-dong-nai`.
- Hub Biên Hòa: `/phu-kien-handmade-bien-hoa`.
- Hub Trảng Dài: `/phu-kien-handmade-trang-dai`.
- TP.HCM là cluster giao hàng online, không phải location/store hub.
- Cluster sản phẩm: vòng tay, móc khóa, quà tặng, charm/dây chuyền.

Mỗi owner URL phải:

1. Có một primary keyword duy nhất.
2. Link về hub địa bàn phù hợp trong phần nội dung.
3. Nhận ít nhất ba incoming internal link có ngữ cảnh từ hub, bài viết hoặc trang sản phẩm liên quan.
4. Link đến hai hoặc ba sibling URL có ích cho hành trình mua.
5. Không dùng một anchor exact-match quá 40% tổng internal link trỏ đến URL.
6. Không tự nhận primary keyword của owner khác trong title, H1 hoặc canonical.

### 4.2 Bảy truy vấn phụ

Bảy secondary keyword được thêm bằng section đáp ứng đúng nhu cầu, FAQ hiển thị hoặc anchor tự nhiên. Không ép exact match vào title/H1 và không tạo URL mới.

- `vòng tay theo yêu cầu Đồng Nai`: quy trình nhận brief, phối màu/charm, duyệt mẫu.
- `vòng tay handmade theo tên Đồng Nai`: chữ cái/tên, giới hạn đổi trả hàng cá nhân hóa.
- `móc khóa custom Đồng Nai`: chữ, charm, khoen và đơn nhóm.
- `quà sinh nhật handmade Đồng Nai`: chọn theo người nhận, ngân sách và thời gian cần.
- `quà handmade cho người yêu Đồng Nai`: cá nhân hóa bằng màu, ký hiệu, ngày kỷ niệm.
- `charm vòng tay Đồng Nai`: tương thích khoen, cách phối và mua charm rời.
- `shop vòng tay handmade Đồng Nai`: thông tin xem mẫu/đặt online/hẹn nhận tại Trảng Dài.

### 4.3 Chất lượng và chống doorway

- Giữ hoặc nâng nội dung riêng tối thiểu 60 từ cho mỗi landing; không hạ ngưỡng overlap 35% để làm test pass.
- Mỗi trang phải có ít nhất một bằng chứng địa phương hoặc trải nghiệm thật: thời gian giao, hẹn nhận, khoảng cách, quy trình custom, lưu ý vật liệu hoặc dịp dùng.
- Không thay tên địa phương trên cùng một mẫu nội dung rồi xuất bản hàng loạt.
- Không thêm đánh giá, chứng nhận, số liệu bán hàng, ảnh xưởng hoặc giá trị doanh nghiệp nếu không có bằng chứng thật.
- FAQPage được giữ cho khả năng hiểu nội dung/entity; không coi đó là rich result vì Google đã ngừng FAQ rich results cho phần lớn website.

## 5. Metadata và structured data

### 5.1 Metadata

- Title duy nhất, khoảng 50–60 ký tự, chứa primary keyword tự nhiên.
- Meta description mục tiêu 140–165 ký tự; không cắt USP, khu vực hoặc CTA chỉ để đạt độ dài.
- Canonical tuyệt đối, tự tham chiếu, không query string.
- Initial HTML phải chứa title, description, canonical, robots và JSON-LD; không dựa vào client-side injection.
- OG/Twitter dùng ảnh production hợp lệ, không localhost hoặc file upload chưa chuẩn hóa.

### 5.2 Schema

- `LocalBusiness` dùng chung NAP, geo, giờ mở cửa và `@id` canonical của xưởng Trảng Dài.
- `Service` mô tả dịch vụ của landing và `areaServed` đúng khu vực.
- TP.HCM dùng `areaServed`/delivery language; không tạo LocalBusiness branch ở TP.HCM.
- `BreadcrumbList` phản ánh hierarchy thật.
- Không thêm AggregateRating hoặc Review schema nếu review không có nguồn công khai, có thể kiểm chứng.
- Không thêm HowTo schema.

## 6. Indexation và Search Console

Ưu tiên đầu tiên là đưa 19 URL hiện `URL is unknown to Google` vào trạng thái được crawl/index trước khi kỳ vọng thứ hạng.

- Hệ thống discovery hiện có tiếp tục kiểm tra sitemap, eligibility, canonical và URL Inspection theo quota.
- Mọi thay đổi material ở landing phải cập nhật `lastModified` đúng URL và ghi publication event idempotent.
- Không dùng Google Indexing API cho landing thương mại; API này không dành cho loại nội dung này.
- Không gửi sitemap hoặc yêu cầu crawl lặp lại theo từng phút.
- Theo dõi coverage, Google-selected canonical, last crawl và page fetch state.
- Nếu một URL vẫn unknown sau hai chu kỳ kiểm tra, audit lại internal links, content differentiation, crawl path và chất lượng trước khi tạo thêm nội dung.

## 7. Google Business Profile, review và citation

Đây là phần bắt buộc để cạnh tranh Local Pack nhưng là external mutation, phải có ủy quyền riêng trước khi thao tác tài khoản.

### 7.1 Google Business Profile

- Xác minh hoặc claim đúng hồ sơ Mushroomie tại địa chỉ thật ở Trảng Dài.
- Chọn primary category phù hợp nhất với mô hình bán phụ kiện/quà tặng handmade; không chọn category không đúng chỉ vì có volume.
- Đồng bộ tên, địa chỉ, số điện thoại, website, giờ làm việc và tọa độ với `BRAND`.
- Không tạo location TP.HCM giả.
- Đăng ảnh sản phẩm/xưởng thật và cập nhật sản phẩm/dịch vụ đúng inventory.

### 7.2 Review

- Xin review từ khách thật sau giao dịch; không mua review, không review gating.
- Duy trì nhịp review ổn định và phản hồi mọi review bằng nội dung không tiết lộ thông tin đơn hàng.
- Chỉ hiển thị review trên website khi có nguồn và quyền sử dụng rõ ràng.

### 7.3 Citation và authority

- Đồng bộ NAP trên Facebook, Instagram, TikTok, Shopee, Google Business Profile và các profile được claim thật.
- Ưu tiên citation địa phương có kiểm duyệt, báo/cộng đồng/sự kiện Đồng Nai–Biên Hòa và quan hệ đối tác thật.
- Không mua backlink hàng loạt, không spam diễn đàn, không tạo profile rỗng chỉ để chèn link.
- Theo dõi URL nguồn, target URL, anchor, trạng thái live/no-follow và ngày kiểm tra trong citation tracker.

## 8. Đo lường và định nghĩa thành công

### 8.1 Nguồn dữ liệu

- Search Console Search Analytics: query, page, clicks, impressions, CTR, average position.
- URL Inspection: index status, Google canonical, last crawl, page fetch.
- Google Business Profile Performance khi được cấp quyền.
- Geo-grid hoặc rank tracker có cấu hình vị trí cố định cho Local Pack/organic.
- GA4: organic landing sessions, contact/checkout/purchase conversion nếu quyền reporting có sẵn.

### 8.2 Tần suất

- Hằng ngày: indexation/errors/lease/worker health tự động.
- Hằng tuần: 30 keyword × owner URL, organic rank, Local Pack, impressions, clicks, CTR.
- Hằng tháng: review velocity, citation health, conversion, content freshness và competitor delta.

### 8.3 Success gate

Mục tiêu chỉ hoàn thành khi:

1. Đủ 30/30 truy vấn có owner URL đã khai báo.
2. 23/23 owner URL indexable và được Google lập chỉ mục, trừ khi SERP overlap dẫn đến quyết định hợp nhất có tài liệu.
3. Không owner conflict/canonical conflict/cannibalization đã xác nhận.
4. Cả 30 truy vấn đạt vị trí organic 1 theo cấu hình đo cố định trong ba tuần liên tiếp; nếu mục tiêu riêng là Local Pack thì báo riêng, không trộn với organic.
5. Owner URL Google chọn đúng URL đã khai báo.
6. Không đạt bằng cloaking, keyword stuffing, review giả, location giả, doorway pages hoặc backlink spam.

Nếu Google thay đổi SERP, mục tiêu vẫn giữ nguyên; hệ thống tiếp tục tối ưu và không đánh dấu hoàn thành bằng một báo cáo hoặc một lần đo thuận lợi.

## 9. Lộ trình triển khai

### Pha 1 — Measurement contract và owner registry

- Chuyển B30 thành cấu trúc dữ liệu có type và test.
- Mỗi query có primary/secondary role, owner URL, area, intent và baseline fields.
- Thay baseline cũ đang trống bằng dữ liệu Search Console xác thực; không commit credential.
- Thêm kiểm thử uniqueness, owner existence, local truth và URL canonical.

### Pha 2 — On-page, cluster và internal links

- Bổ sung bảy secondary-intent section vào năm owner hiện hữu.
- Chuẩn hóa meta description có tác động CTR mà không viết máy móc theo độ dài.
- Tạo hub-to-owner và contextual incoming links; kiểm tra anchor diversity.
- Giữ Server Components và không thêm JavaScript client vào public bundle.

### Pha 3 — Indexation và content support

- Cập nhật lastmod/publication event cho URL material-changed.
- Theo dõi 19 URL unknown và xử lý theo dữ liệu crawl/index.
- Viết hoặc nâng bài hỗ trợ chỉ khi có content gap và intent thật; mỗi bài phải có E-E-A-T/kinh nghiệm thực tế và link hai chiều.

### Pha 4 — GBP, citation, review và local authority

- Thực hiện sau khi người dùng cấp quyền external mutation.
- Claim/optimize GBP, NAP sync, review workflow, citation cleanup và local outreach.

### Pha 5 — Theo dõi và tối ưu lặp

- Scorecard hàng tuần cho 30 truy vấn.
- Ưu tiên query position 4–10 có impression; sửa snippet/intent/owner trước khi tăng độ dài nội dung.
- Đối với query chưa impression, ưu tiên indexation, topical support và authority.
- Mọi quyết định tách/hợp URL phải có SERP overlap hoặc GSC page evidence.

## 10. Kiểm thử và cổng phát hành

### Bắt buộc trước commit implementation

- TDD RED → GREEN cho owner registry, secondary intent, internal link và metadata contract.
- `npx tsx --test` cho toàn bộ Local SEO legacy tests.
- SEO source/route tests liên quan.
- `npm run typecheck`.
- ESLint các file thay đổi.
- `npx prisma generate` nếu code chạm Prisma types; không cần schema migration theo thiết kế hiện tại.
- `npm run build` với cấu hình DB offline an toàn nếu không có quyền DB.
- Secret scan và `git diff --check`.

### Bắt buộc trước và sau deploy

- Backup config/database/uploads theo runbook production nếu deploy có mutation dữ liệu.
- Smoke tất cả 23 owner URL, sitemap, robots và health.
- Kiểm tra canonical, robots, H1, JSON-LD, CSS/JS MIME và ảnh.
- Kiểm tra desktop 1440/1366 và mobile 390/360 bằng Chrome DevTools MCP khi khả dụng.
- Lighthouse matrix không được giảm so với baseline đã lưu; thay đổi SEO public không được kéo admin/GSC/worker vào public bundle.
- PM2 online, không unstable restart, log mới không có lỗi route/Prisma/GSC.
- Giữ rollback release cho tới khi mọi gate pass.

## 11. Ranh giới an toàn

- Không đổi dữ liệu đơn hàng, thanh toán, user, voucher, uploads hoặc auth.
- Không chỉnh Nginx/schema production cho pha B30 hiện tại nếu không có phát hiện riêng được phê duyệt.
- Không commit credential, export GSC có PII, private key, `.env`, build output hoặc database dump.
- Không tự tạo GBP/citation/review ngoài website khi chưa được ủy quyền.
- Không tuyên bố top 1 nếu dữ liệu chưa chứng minh đủ 30/30 theo success gate.

## 12. Rollback

- Code/content rollback theo standalone release và commit trước deploy.
- Owner registry/metadata/internal links không cần DB migration nên rollback chỉ là code release.
- Nếu một landing gây cannibalization sau deploy, tạm ngừng thay đổi tiếp theo, lưu GSC evidence, khôi phục owner mapping trước và revalidate URL; không xóa URL hoặc đặt noindex theo cảm tính.
- External GBP/citation changes phải lưu ảnh/bản ghi trước khi sửa và rollback từng trường về NAP chuẩn nếu phát hiện sai.

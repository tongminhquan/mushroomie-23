# Mushroomie Backlink Baseline - 2026-07-17

## Kết luận

**Backlink Health Score: INSUFFICIENT DATA (0/7 yếu tố có dữ liệu).**

Không có DataForSEO, Moz API, Bing Webmaster API hoặc export GSC Links trong
phiên audit. Vì vậy không thể đưa ra số referring domains, tỷ lệ follow, anchor
distribution, toxic-link ratio, link velocity, geographic relevance hoặc điểm
health 0-100 một cách trung thực.

## Phạm vi kiểm tra

- Domain: `https://mushroomie.io.vn`
- Tracker: `docs/backlink-tracker.md`
- Entity links trong code: Facebook, Instagram, TikTok và Shopee từ
  `BRAND.sameAs`.
- Kiểm tra HTTP profile ngày `2026-07-17`.
- Web discovery bằng truy vấn exact domain/brand.
- Chính sách đối chiếu: Google Search spam policies.

## Nguồn dữ liệu

| Nguồn | Trạng thái | Có thể kết luận |
|---|---|---|
| DataForSEO | Không cấu hình | Không có backlink index, anchors, spam score hoặc new/lost |
| Moz API | Không cấu hình | Không có DA/PA, Spam Score hoặc linking root domains |
| Bing Webmaster | Không cấu hình | Không có inbound-link export hoặc competitor comparison |
| Google Search Console Links | Không có export | Không có top linking sites/pages/text |
| Common Crawl helper | Không có trong skill cài đặt hiện tại | Không có domain graph để tính in-degree/PageRank |
| Web search discovery | Đã chạy | Không thấy mention độc lập đủ tin cậy trong kết quả trả về; không đồng nghĩa bằng 0 backlink |
| Direct profile fetch | Đã chạy | Bốn URL profile/shop trả HTTP 200 nhưng backlink không xuất hiện trong HTML fetch |

## Bằng chứng hiện tại

1. Website Mushroomie đang xuất bốn URL Facebook, Instagram, TikTok và Shopee
   trong entity graph và giao diện public.
2. Bốn URL ngoài site đều truy cập được với HTTP 200 tại thời điểm kiểm tra.
3. HTML không-JavaScript của bốn nguồn không chứa `mushroomie.io.vn`. Các nền
   tảng này phụ thuộc JavaScript/login, nên kết luận đúng là `unverifiable_js`,
   không phải `link_removed`.
4. Chưa có URL listing GBP, Bing Places, Apple Business hoặc OpenStreetMap được
   chủ doanh nghiệp xác minh.
5. Chưa có danh sách backlink thật để đánh giá reciprocal links, anchor text,
   nguồn độc hại hoặc tạo disavow file.

## Ma trận 7 yếu tố

| Yếu tố | Trạng thái | Nguồn | Confidence |
|---|---|---|---|
| Referring domain count | Chưa có dữ liệu | Cần DataForSEO/Moz/Bing/GSC/CC | N/A |
| Domain quality distribution | Chưa có dữ liệu | Cần DataForSEO/Moz | N/A |
| Anchor text naturalness | Chưa có dữ liệu | Cần DataForSEO/Moz/Bing/GSC | N/A |
| Toxic link ratio | Chưa có dữ liệu | Cần DataForSEO/Moz + manual review | N/A |
| Link velocity | Chưa có dữ liệu | Cần DataForSEO hoặc snapshot định kỳ | N/A |
| Follow/nofollow ratio | Chưa có dữ liệu | Cần backlink detail export | N/A |
| Geographic relevance | Chưa có dữ liệu | Cần referring-domain country data | N/A |

Không tái phân bổ trọng số và không tạo điểm số khi chưa đạt tối thiểu 4/7 yếu
tố có dữ liệu.

## Rủi ro đã loại trừ khỏi kế hoạch

- Không đặt KPI 200 backlink dofollow.
- Không mua link, PBN, guest-post network hoặc directory package.
- Không dùng comment/forum profile hàng loạt.
- Không ép anchor exact-match.
- Không tạo review, citation hoặc địa điểm giả.
- Không tạo disavow khi chưa có manual action hoặc bằng chứng link độc hại.

Google liệt kê việc mua/bán link để xếp hạng, trao đổi link quá mức, dùng chương
trình tự động, low-quality directory, site-wide link và forum comment tối ưu
anchor là link spam. Link quảng cáo/tài trợ hợp lệ phải được qualify bằng
`nofollow` hoặc `sponsored`.

## Kế hoạch 90 ngày

### Tuần 1-2

1. Chủ tài khoản xác minh website/NAP trên Facebook, Instagram, TikTok và Shopee.
2. Hoàn tất GBP đúng pin; sau đó import/sync Bing Places và Apple Business.
3. Export GSC Links và Bing inbound links để tạo baseline referring domains.
4. Ghi URL listing thật vào tracker; không ghi URL trang đăng ký chung là backlink.

### Tuần 3-6

1. Kiểm tra OpenStreetMap tại đúng tọa độ; chỉ thêm POI nếu địa điểm vật lý có thật.
2. Chuẩn bị media kit gồm câu chuyện thương hiệu, logo, ảnh sản phẩm/quy trình thật
   và NAP.
3. Lập shortlist tối đa 10 creator/CLB/đối tác liên quan; đánh giá từng nguồn bằng
   quality gate trước khi outreach.
4. Chọn 2-3 tài sản có khả năng được chia sẻ tự nhiên từ 10 content brief Phase 4.

### Tuần 7-12

1. Outreach cá nhân hóa theo quan hệ thật, không gửi hàng loạt.
2. Theo dõi mention/link được xuất bản, rel, anchor, URL đích và ngày xác minh.
3. Chụp snapshot hằng tháng để có new/lost link velocity.
4. Chỉ mở rộng khi profile anchor và referring-domain diversity vẫn tự nhiên.

## Tiêu chí hoàn thành Phase 5

- Tracker có owner, trạng thái, ngày kiểm tra và bằng chứng cho từng nguồn.
- Không có nguồn nào được đánh dấu `verified` khi chưa nhìn thấy link/NAP.
- Có checklist cho GBP/Bing/Apple/OSM và social profiles.
- Có queue outreach được kiểm duyệt, không có PBN/comment/directory spam.
- Baseline ghi rõ giới hạn dữ liệu và không đưa điểm số giả.
- Các thao tác claim/outreach còn lại được bàn giao cho chủ doanh nghiệp/marketing.

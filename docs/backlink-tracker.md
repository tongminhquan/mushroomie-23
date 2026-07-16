# Mushroomie Backlink & Citation Tracker

Tracker này chỉ ghi nhận liên kết và citation có thật, có ngữ cảnh và có bằng
chứng kiểm tra. Không đánh giá chất lượng chỉ bằng `dofollow`; không mua PBN,
không tạo profile/comment hàng loạt và không đặt mục tiêu 200 link trong thời
gian ngắn.

Baseline kỹ thuật gần nhất: `2026-07-17`.

## Mục tiêu vận hành

- Xây tự nhiên khoảng `40-80` liên kết/citation chất lượng trong `6-12 tháng`.
- Đo theo referring domain hợp lệ, mức liên quan, độ đa dạng anchor và giá trị
  referral; không dùng tổng số `dofollow` làm KPI.
- Không xem `20-30` nền tảng được liệt kê trong brief là danh sách phải đăng ký
  bằng mọi giá. Chỉ tạo hoặc claim hồ sơ khi Mushroomie có hiện diện thật và
  đáp ứng điều khoản của nền tảng.
- Mỗi nguồn chỉ được cộng vào kết quả sau khi đạt quality gate và có URL/bằng
  chứng thực tế trong tracker.

## Quy ước trạng thái

- `verified`: URL nguồn truy cập được và đã nhìn thấy URL đích/NAP trên nguồn.
- `unverifiable_js`: profile truy cập được nhưng HTML không-JavaScript không đủ
  để xác nhận link; cần chủ tài khoản kiểm tra trực tiếp trong bio/profile.
- `owner_action`: cần chủ doanh nghiệp đăng nhập, claim hoặc xác minh.
- `research`: mới là cơ hội; chưa outreach và chưa được tính là backlink.
- `lost`: từng xác minh có link nhưng lần kiểm tra sau không còn.
- `rejected`: không đạt quality gate hoặc có dấu hiệu link spam.

`Rel` chỉ ghi `follow`, `nofollow`, `ugc`, `sponsored`, `self` hoặc
`chưa xác minh`. Không suy đoán `follow` từ việc profile trả HTTP 200.

## Tracker đã biết

| Nguồn | URL nguồn | URL đích | Nhóm | Rel | NAP | Kiểm tra gần nhất | Trạng thái | Bằng chứng | Owner | Việc tiếp theo |
|---|---|---|---|---|---|---|---|---|---|---|
| Website chính | `https://mushroomie.io.vn` | `https://mushroomie.io.vn` | Entity | self | Đúng | 2026-07-17 | verified | Canonical domain; đây không phải backlink ngoài site | Kỹ thuật | Giữ canonical ổn định |
| Facebook Mushroomie | `https://www.facebook.com/mushr00mie` | `https://mushroomie.io.vn` | Social | chưa xác minh | Cần kiểm tra | 2026-07-17 | unverifiable_js | Profile trả HTTP 200; HTML fetch không thấy URL đích | Marketing | Mở profile khi đăng nhập, kiểm tra bio/website và NAP |
| Instagram Mushroomie | `https://www.instagram.com/mushr00mie._/` | `https://mushroomie.io.vn` | Social | chưa xác minh | Cần kiểm tra | 2026-07-17 | unverifiable_js | Profile trả HTTP 200; HTML fetch không thấy URL đích | Marketing | Kiểm tra link bio và đồng bộ tên/handle |
| TikTok Mushroomie | `https://www.tiktok.com/@mushr00mie._` | `https://mushroomie.io.vn` | Social | chưa xác minh | Cần kiểm tra | 2026-07-17 | unverifiable_js | Profile trả HTTP 200; HTML fetch không thấy URL đích | Marketing | Kiểm tra website trong bio và dùng một handle canonical |
| Shopee Mushroomie | `https://shopee.vn/shop/475544379` | `https://mushroomie.io.vn` | Marketplace | chưa xác minh | Cần kiểm tra | 2026-07-17 | unverifiable_js | Shop trả HTTP 200; HTML fetch không thấy URL đích | E-commerce | Kiểm tra mô tả shop và thông tin thương hiệu trong tài khoản |
| Google Business Profile | Chưa có URL listing được xác minh | `https://mushroomie.io.vn/?utm_source=google&utm_medium=organic&utm_campaign=google_business_profile` | Local citation | chưa xác minh | Bắt buộc |  | owner_action | Website/schema đã chuẩn bị; chưa có quyền đọc profile | Chủ doanh nghiệp | Claim/xác minh đúng pin, tránh tạo listing trùng |
| Bing Places | `https://www.bing.com/forbusiness/` | `https://mushroomie.io.vn` | Local citation | chưa xác minh | Bắt buộc |  | owner_action | Chưa có URL listing hoặc Bing Webmaster access | Chủ doanh nghiệp | Import từ GBP sau khi GBP đúng |
| Apple Business Connect | `https://business.apple.com/` | `https://mushroomie.io.vn` | Local citation | chưa xác minh | Bắt buộc |  | owner_action | Chưa có URL place card được xác minh | Chủ doanh nghiệp | Claim một listing duy nhất, dùng đúng NAP |
| OpenStreetMap | `https://www.openstreetmap.org/` | `https://mushroomie.io.vn` | Map citation | chưa xác minh | Bắt buộc |  | owner_action | Chưa xác minh có POI Mushroomie tại tọa độ cửa hàng | Chủ doanh nghiệp | Chỉ thêm dữ liệu khách quan khi địa điểm vật lý có thật |

## NAP chuẩn để đối chiếu

- Tên: `Mushroomie`
- Địa chỉ: `Hẻm 2, tổ 11, phường Trảng Dài, tỉnh Đồng Nai`
- Điện thoại: `0947 192 590`
- Email: `cskh@mushroomie.io.vn`
- Website: `https://mushroomie.io.vn`
- Tọa độ: `10.996333, 106.882306`

Chủ cửa hàng phải xác nhận địa chỉ, giờ hoạt động và khả năng tiếp khách vẫn
đúng trước khi claim hoặc sửa bất kỳ listing nào.

## Outreach queue hợp lệ

| Ưu tiên | Đối tác/nhóm | Tài sản để pitch | URL đích phù hợp | Quality gate | Trạng thái | Next action |
|---|---|---|---|---|---|---|
| P0 | Chủ các social profile | Website chính thức + NAP | `/` | Tài khoản thuộc Mushroomie, link hiển thị công khai | owner_action | Xác minh link bio trên bốn profile hiện có |
| P0 | GBP, Bing Places, Apple Business Connect | Hồ sơ doanh nghiệp thật | `/` | Một listing mỗi nền tảng, đúng pin và NAP | owner_action | Hoàn tất GBP trước, sau đó đồng bộ hai nền tảng còn lại |
| P1 | OpenStreetMap | POI cửa hàng/điểm hẹn có thật | `/lien-he` | Chỉ dữ liệu khách quan, không dùng nội dung quảng cáo | owner_action | Kiểm tra POI tại tọa độ rồi mới thêm/sửa |
| P1 | CLB/sự kiện handmade Đồng Nai | Hướng dẫn custom + ảnh quy trình thật | Bài hướng dẫn phù hợp | Có hoạt động thật và biên tập viên/người quản trị duyệt | research | Lập shortlist tối đa 10 đơn vị liên quan |
| P1 | Micro-creator Gen Z | Sản phẩm custom và case quà tặng thật | Trang sản phẩm/bài quà tặng | Review trung thực; tài trợ phải minh bạch, link dùng `sponsored` khi phù hợp | research | Chọn creator theo độ phù hợp, không mua link riêng |
| P2 | Báo/kênh đời sống địa phương | Câu chuyện thương hiệu + ảnh/dữ liệu gốc | `/cau-chuyen` hoặc bài chuyên sâu | Có giá trị tin tức, không mua advertorial truyền PageRank | research | Chuẩn bị media kit và pitch cá nhân hóa |
| P2 | Nhà cung cấp/đối tác thật | Case study vật liệu hoặc quy trình | Bài quy trình liên quan | Quan hệ kinh doanh thật, anchor tự nhiên | research | Xin mention khi có case study cùng xuất bản |

## Quality gate trước khi ghi nhận link

1. Nguồn có liên quan đến handmade, phụ kiện, quà tặng, Gen Z hoặc địa phương.
2. Trang nguồn có nội dung thật và được người dùng truy cập, không phải link farm.
3. Anchor ưu tiên `Mushroomie`, URL trần hoặc mô tả tự nhiên; không ép exact-match.
4. Link trả phí/tài trợ phải dùng `rel="sponsored"` hoặc `nofollow`.
5. Không trao đổi link hàng loạt, không đặt site-wide footer/sidebar link.
6. Không ghi `verified` khi chỉ thấy HTTP 200; phải nhìn thấy link/NAP thực tế.
7. Mọi citation phải dùng đúng NAP và không tạo listing trùng.

## Báo cáo hằng tháng

| Chỉ số | Giá trị kỳ này | Nguồn dữ liệu | Ghi chú |
|---|---|---|---|
| Referring domains mới/mất | Chưa có baseline | GSC Links/Bing/Moz/DataForSEO | Không suy đoán từ Google search |
| Link verified/unverifiable/lost | 1 / 4 / 0 | Tracker này | `self` không tính là referring domain |
| Citation có NAP sai | Chưa xác minh | GBP/Bing/Apple/OSM | Chủ tài khoản kiểm tra |
| Anchor branded/URL/generic/exact | Chưa có dữ liệu | Export backlink provider | Exact-match không phải KPI chiến dịch |
| Link cần gỡ hoặc sửa | Chưa phát hiện | Cần danh sách nguồn thật | Chưa tạo disavow |
| Nội dung được nhắc đến nhiều nhất | Chưa có dữ liệu | Top linked pages | Đo sau khi kết nối nguồn |

## Chính sách tham chiếu

- Google Search spam policies:
  `https://developers.google.com/search/docs/essentials/spam-policies#link-spam`
- Google Business Profile guidelines:
  `https://support.google.com/business/answer/3038177`
- Bing for Business:
  `https://www.bing.com/forbusiness/`
- Apple Business:
  `https://business.apple.com/`
- OpenStreetMap:
  `https://www.openstreetmap.org/`

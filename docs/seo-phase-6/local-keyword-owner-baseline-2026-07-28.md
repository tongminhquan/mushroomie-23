# Baseline owner URL cho 4 từ khóa Local SEO

Ngày ghi nhận: 28/07/2026

## Phạm vi và mục tiêu

Tài liệu này ghi lại trạng thái quan sát trước khi tiếp tục đo lường bốn từ khóa Local SEO ưu tiên của Mushroomie. Mỗi truy vấn có một owner URL chính để tập trung tín hiệu nội dung, liên kết nội bộ và theo dõi thứ hạng. Owner URL là đích cần được Google nhận diện; vị trí bên dưới là kết quả quan sát tại thời điểm ghi nhận, không phải cam kết thứ hạng cố định.

| Từ khóa | Vị trí quan sát | URL Google đang chọn | Owner URL |
| --- | ---: | --- | --- |
| vòng tay handmade Đồng Nai | 2 | `/lien-he` | `/vong-tay-handmade-dong-nai` |
| vòng tay custom Biên Hòa | 3 | `/` | `/vong-tay-custom-bien-hoa` |
| móc khóa handmade Đồng Nai | >20, chưa phát hiện | Chưa có | `/moc-khoa-handmade-dong-nai` |
| quà tặng handmade Đồng Nai | 5 | `/tin-tuc` | `/qua-tang-handmade-dong-nai` |

## Phương pháp đo lại

- Đo cùng vị trí địa lý, ngôn ngữ và trạng thái đăng nhập tương đương với lần ghi nhận baseline.
- Ghi đồng thời vị trí quan sát và URL mà Google chọn; không chỉ ghi thứ hạng.
- Đối chiếu dữ liệu Google Search Console theo từng truy vấn và trang trong cửa sổ 28 ngày.
- Thực hiện lần đo đầu tiên sau 14 ngày kể từ lần triển khai owner-link hiện tại, sau đó theo dõi liên tục trong 8 tuần.
- Không coi một ảnh chụp SERP đơn lẻ là Average position chính thức của Search Console; ảnh chỉ là bằng chứng cho lần quan sát cụ thể.
- Đánh giá thành công theo cả hai tín hiệu: owner URL được chọn đúng hơn và dữ liệu Search Console cải thiện ổn định, không chỉ theo một lần dao động thứ hạng.

## Kiểm tra chống cannibalization

Đã đọc và kiểm tra tĩnh ba file được chỉ định:

- `src/app/(user)/page.tsx`
- `src/app/(user)/lien-he/layout.tsx`
- `src/app/(user)/tin-tuc/page.tsx`

Lệnh xác minh:

```bash
git grep -n -I -e "vòng tay handmade Đồng Nai" -e "vòng tay custom Biên Hòa" -e "móc khóa handmade Đồng Nai" -e "quà tặng handmade Đồng Nai" -- "src/app/(user)/page.tsx" "src/app/(user)/lien-he/layout.tsx" "src/app/(user)/tin-tuc/page.tsx"
```

Kết quả: không có exact-match trong ba file. Do đó không phát hiện title, canonical hoặc H1 exact-match tự nhận bốn intent ưu tiên trên các trang cạnh tranh này. Việc một trang có thể chứa liên kết điều hướng đến owner URL không được xem là cannibalization; owner URL vẫn được xác định trong bảng baseline ở trên.

## Mốc theo dõi

- Mốc hiện tại: baseline ngày 28/07/2026.
- Mốc kiểm tra đầu tiên: 11/08/2026, tương ứng 14 ngày sau baseline.
- Chu kỳ theo dõi: hàng tuần cho đến hết tuần thứ 8.
- Mỗi lần ghi nhận cần lưu: truy vấn, thiết bị/vị trí/ngôn ngữ, vị trí quan sát, URL Google chọn, URL owner, số liệu Search Console 28 ngày và ghi chú biến động.

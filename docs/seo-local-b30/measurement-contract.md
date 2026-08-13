# Hợp đồng đo lường SEO Local B30

## Mục đích và phạm vi cố định

Tài liệu này quy định cách đo lường trung thực cho đúng **exactly 30 target queries** trong registry B30 và URL owner đã khai báo cho từng truy vấn. Công cụ chỉ đọc thuộc tính Search Console `sc-domain:mushroomie.io.vn`, với bộ lọc `web / final / VNM`, rồi ghép dữ liệu chẩn đoán đó với quan sát thứ hạng độc lập.

Việc hoàn thiện code, nội dung, sitemap hoặc công cụ **không** đồng nghĩa 30 từ khóa đã đạt top 1. Google rankings cannot be guaranteed. Trạng thái hoàn thành chỉ được công nhận khi đủ bằng chứng quan sát cho cả 30 mục theo phần “Định nghĩa hoàn thành” bên dưới.

## Chạy công cụ

Script package duy nhất là `seo:local:b30:scorecard`. Mỗi cờ phải xuất hiện tối đa một lần và luôn theo cặp `--flag value`; không dùng dạng `--flag=value`.

Các cờ được chấp nhận:

- `--start-date YYYY-MM-DD`
- `--end-date YYYY-MM-DD`
- `--rank-input <file.csv>`
- `--output-dir <existing-directory>`
- `--concurrency 1|2`

Nếu không truyền ngày, công cụ dùng cửa sổ 28 ngày bao gồm cả hai đầu mốc, kết thúc ba ngày trước ngày chạy để chỉ dùng dữ liệu đã finalized. Khoảng tùy chỉnh tối đa 90 ngày và ngày kết thúc cũng phải cách ngày chạy ít nhất ba ngày. Mỗi lần chạy tạo đúng một Search Analytics request cho mỗi target, tức 30 request, concurrency mặc định/tối đa là 2 và không retry.

### Chế độ stdout-only an toàn mặc định

Lệnh này không ghi report xuống filesystem và không cần CSV thứ hạng:

```powershell
npm run seo:local:b30:scorecard -- --start-date 2026-07-21 --end-date 2026-08-17
```

### Chạy hàng tuần trên VPS mới với dữ liệu riêng tư

Trước khi chạy, người vận hành phải tạo sẵn thư mục đầu ra Linux bên ngoài repo, Git và web root. CSV quan sát cũng phải nằm ngoài `/var/www/mushroomie`, `public` và mọi đường dẫn được Nginx phục vụ. Từ PowerShell của máy vận hành:

```powershell
ssh root@103.77.242.153 "cd /var/www/mushroomie && npm run seo:local:b30:scorecard -- --start-date 2026-07-21 --end-date 2026-08-17 --rank-input /var/lib/mushroomie-private/seo-local-b30/rank-observations.csv --output-dir /var/lib/mushroomie-private/seo-local-b30/reports/2026-08-17"
```

Lệnh không chứa đường dẫn hoặc nội dung service-account credential. Ngày phải được thay bằng chu kỳ thật đang đo; ví dụ trên chỉ minh họa cú pháp vận hành.

## Dữ liệu Search Analytics và ý nghĩa chỉ số

Công cụ luôn trả 30 measurement theo thứ tự registry. Target bị lỗi provider, không có impression hoặc không xuất hiện trong response vẫn phải có một dòng; không được lọc bỏ để làm đẹp tỷ lệ thành công.

Search Console có thể chỉ trả về các hàng đứng đầu theo giới hạn nội bộ, không bảo đảm trả mọi hàng dữ liệu. Vì vậy, không có hàng trả về chỉ có nghĩa **không có bằng chứng được API trả về**; nó không chứng minh truy vấn có zero demand, URL chưa được index hay thứ hạng bằng 0.

- `clicks`: tổng lượt nhấp của các hàng hợp lệ cho truy vấn và profile đã lọc.
- `impressions`: tổng lượt hiển thị tương ứng.
- `CTR`: `clicks / impressions` trên aggregate hợp lệ; bằng 0 khi tổng impression bằng 0.
- `averagePosition`: trung bình vị trí có trọng số theo impression của các hàng hợp lệ.

GSC averagePosition = aggregated diagnostic metric, never exact rank proof.

Giá trị `averagePosition = 1` không tự tạo bằng chứng top 1 chính xác. Dữ liệu GSC dùng để chẩn đoán xu hướng và đối chiếu tổng với giao diện Search Console, không thay thế quan sát SERP độc lập.

## Hợp đồng bằng chứng thứ hạng

Một quan sát hợp lệ phải khớp đồng thời:

- query chính xác trong registry và đúng URL owner canonical đã khai báo;
- kết quả **organic**, không phải quảng cáo hay Local Pack;
- profile bắt buộc `VN / vi / mobile`;
- `location` đúng khu vực mục tiêu của query;
- ngày `measured_at` dạng `YYYY-MM-DD`, không nằm sau `end-date`;
- `source` cụ thể và ổn định, chỉ nhận `rank-tracker` or `manual-serp`;
- `organic_position` là số nguyên dương, hoặc để trống khi chưa đo.

organicTopOne = true only after three valid weekly rank observations.

Ba quan sát mới nhất phải thuộc cùng profile bắt buộc, đều có `organic_position = 1`, và từng cặp tuần liên tiếp phải cách nhau **6–8 days apart**. Quan sát desktop được báo cáo riêng nếu thu thập, nhưng không bao giờ thay thế profile mobile bắt buộc. Quan sát sai owner, sai địa điểm, sai quốc gia/ngôn ngữ/thiết bị, trùng hoặc mâu thuẫn sẽ làm bằng chứng không hợp lệ.

Local Pack position is reported separately.

`local_pack_position` có thể để trống nếu chưa đo. Vị trí Local Pack không chứng minh organic top one và không được dùng để bật `organicTopOne`.

### Trạng thái và xung đột

- `rankEvidenceStatus = missing`: chưa có quan sát hợp lệ cho target.
- `rankEvidenceStatus = insufficient`: có quan sát hợp lệ nhưng chưa đủ ba tuần đạt chuẩn.
- `rankEvidenceStatus = invalid`: tập quan sát mới nhất vi phạm hợp đồng, chẳng hạn ngày trùng/mâu thuẫn hoặc khoảng cách tuần sai.
- `rankEvidenceStatus = verified`: chỉ khi đủ ba quan sát top 1 hợp lệ như trên.
- `ownerConflict = true`: Search Analytics có impression dương cho cùng exact query trên URL canonical khác owner đã khai báo. Đây là bằng chứng xung đột, không được bỏ qua dù hàng đó có metric lỗi.

Bất kỳ provider/tool error nào cũng làm `complete = false`. Lỗi hoặc `ownerConflict` không được đổi thành “không có dữ liệu” và không được che khỏi báo cáo.

## CSV quan sát

File [`rank-observation.example.csv`](./rank-observation.example.csv) chỉ là **schema example**. Hai cột vị trí để trống có nghĩa “not measured”, không phải vị trí 0 và không phải top 1. Khi tạo CSV thật:

- giữ nguyên header và đúng 10 cột;
- chỉ dùng 30 query/owner đã khai báo;
- không đưa công thức bảng tính, secret, token, credential hoặc dữ liệu provider thô vào file;
- lưu file ngoài repo, Git, `public` và web root;
- không commit hoặc gửi CSV thật vào kênh công khai.

## Bảo mật và tính toàn vẹn đầu ra

- Service-account key phải ở ngoài repo và ngoài `public`, là regular file chỉ root đọc được; không paste, log hoặc commit nội dung/đường dẫn key vào report.
- Stdout-only là chế độ mặc định. Output công khai chỉ là summary giới hạn; report chi tiết và CSV rank là dữ liệu riêng tư.
- Ghi report tường minh chỉ được hỗ trợ trên Linux, dùng thao tác **descriptor-bound** vào thư mục đã tồn tại để không theo symlink/junction bị tráo trong lúc chạy.
- Trên Windows, `--output-dir` **fails closed** trước khi gọi provider. Có thể dùng chế độ stdout-only trên Windows.
- Hai file `b30-scorecard.json` và `b30-scorecard.csv` được publish thành một cặp. Trước commit point, lỗi sẽ rollback/khôi phục cặp cũ; sau commit point, cleanup backup chỉ best-effort và không rollback cặp mới đã nhất quán.
- `--rank-input` phải là regular file đọc được, giới hạn 256 KiB/1.000 hàng và không được trùng đường dẫn report hay credential.

## Runbook hàng tuần

1. Chọn `end-date` đã finalized: không muộn hơn ba ngày trước ngày chạy; tính `start-date` 28 ngày bao gồm hai đầu mốc.
2. Thu thập quan sát organic bằng cùng công cụ/phương pháp và cùng profile `VN / vi / mobile`, đúng target location, đúng exact query và owner.
3. Cập nhật CSV riêng tư; để trống vị trí chưa đo thay vì đoán hoặc ghi 0.
4. Xác nhận thư mục output Linux riêng tư đã tồn tại, rồi chạy lệnh hàng tuần.
5. Kiểm tra output có đúng 30 target và đọc các bộ đếm provider failures, owner conflicts, missing/insufficient/invalid evidence và verified organic top one.
6. Nếu có error hoặc `ownerConflict`, dừng tuyên bố hoàn thành và điều tra theo target; không xóa hàng lỗi.
7. So sánh clicks, impressions, CTR và average position với giao diện Search Console cho **cùng property, search type, data state, country, device và date range**.
8. Lưu JSON/CSV trong kho riêng ngoài web root/Git, có phân quyền và retention; không lưu trong `public`.
9. Lặp lại mỗi tuần với cùng profile. Khi thứ hạng giảm, owner đổi, tuần bị thiếu hoặc nguồn đo đổi, đánh dấu regression và bắt đầu lại chuỗi bằng chứng hợp lệ nếu cần.

## Định nghĩa hoàn thành và cách bác bỏ

Một run chỉ được `complete = true` khi đồng thời có:

- đúng 30 target distinct; không unknown, missing target hoặc duplicate;
- **30 organicTopOne**;
- **0 owner conflicts**;
- **0 operational errors**;
- toàn bộ bằng chứng theo cùng profile `VN / vi / mobile`, đúng target location và exact owner;
- mỗi target có ba tuần liên tiếp, khoảng cách từng tuần 6–8 ngày, và cả ba lần đều organic position 1.

Chỉ một quan sát sai owner, khác position 1, sai profile/location, thiếu tuần, khoảng cách ngoài 6–8 ngày, duplicate/conflict hoặc một lỗi provider/tool cũng đủ bác bỏ trạng thái hoàn thành. Không được suy diễn thành công từ metadata, indexing, sitemap, GSC average position, Local Pack hoặc một lần kiểm tra thủ công.

## Nguồn chính thức

- [Search Analytics: query — tham số, dimension, metric và giới hạn hàng trả về](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Hướng dẫn truy vấn Search Analytics — kiểm tra sự hiện diện của dữ liệu và phân tích theo dimension](https://developers.google.com/webmaster-tools/v1/how-tos/search_analytics)
- [Search Console API usage limits](https://developers.google.com/webmaster-tools/limits)
- [Google Business Profile: cách Google mô tả yếu tố xếp hạng local](https://support.google.com/business/answer/7091/improve-your-local-ranking-on-google)

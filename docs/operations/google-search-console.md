# Cấu hình Google Search Console cho SEO Discovery

Hệ thống dùng Search Console Sitemap API để đăng ký sitemap khi cần và URL
Inspection API để **đọc trạng thái Google đã quan sát**. Đây không phải Google
Indexing API, không tự động bấm “Request indexing”, và không bảo đảm một URL sẽ
được Google lập chỉ mục ngay lập tức.

## Cấu hình mặc định an toàn

Giữ cả hai cờ tắt khi mới triển khai:

```dotenv
SEO_DISCOVERY_ENABLED=false
GSC_INTEGRATION_ENABLED=false
GSC_PROPERTY=sc-domain:mushroomie.io.vn
GOOGLE_APPLICATION_CREDENTIALS=/etc/mushroomie/gsc-service-account.json
```

`.env` chỉ được chứa **đường dẫn** đến credential. Không dán JSON, private key,
access token, client secret hoặc bản mã hóa base64 vào `.env`, Git, log, database
hay giao diện quản trị.

## Chuẩn bị service account

1. Tạo một service account riêng cho Mushroomie và tải tệp JSON của tài khoản đó
   bằng quy trình quản trị Google Cloud được phê duyệt.
2. Đặt tệp tại `/etc/mushroomie/gsc-service-account.json`, nằm ngoài repository
   `/var/www/mushroomie`, ngoài mọi thư mục `public` và ngoài thư mục upload.
3. Gán chủ sở hữu cho đúng tài khoản chạy/deploy ứng dụng và chỉ cho tài khoản đó
   đọc tệp. Ví dụ sau chỉ áp dụng sau khi đã xác minh tên tài khoản thực tế:

   ```bash
   sudo chown <app-user>:<app-group> /etc/mushroomie/gsc-service-account.json
   sudo chmod 600 /etc/mushroomie/gsc-service-account.json
   ```

4. Lấy `client_email` trong tệp JSON và thêm email đó vào property
   `sc-domain:mushroomie.io.vn` trên Search Console. Chỉ cấp mức quyền thấp nhất
   vẫn cho phép kiểm tra kết nối, đọc URL Inspection và quản lý sitemap theo nhu
   cầu vận hành; không cấp quyền rộng hơn nếu chưa có lý do.
5. Không di chuyển credential vào repository để “sửa nhanh” lỗi quyền đọc. Adapter
   chủ động từ chối đường dẫn tương đối, đường dẫn trong repository/public, tệp
   không tồn tại, thư mục hoặc tệp không đọc được.

## Trình tự bật tính năng

1. Deploy với hai cờ vẫn là `false` và xác nhận website hoạt động bình thường.
2. Bật `SEO_DISCOVERY_ENABLED=true` để kích hoạt hàng đợi discovery, nhưng tiếp
   tục giữ `GSC_INTEGRATION_ENABLED=false`.
3. Chạy thao tác kiểm tra kết nối được bảo vệ trong trang quản trị. Chỉ tiếp tục
   khi kết quả xác nhận property đúng và service account có quyền cần thiết.
4. Sau khi kiểm tra kết nối thành công, mới đặt
   `GSC_INTEGRATION_ENABLED=true` và restart tiến trình PM2 theo runbook deploy.
5. Theo dõi trạng thái sitemap, lỗi `CONFIGURATION_REQUIRED`, 401/403, 429/5xx và
   lịch URL Inspection. Không lặp lại request mỗi phút khi credential hoặc quyền
   đang sai.

Khi cần dừng mọi cuộc gọi Google mà không ảnh hưởng việc xuất bản nội dung, đặt
`GSC_INTEGRATION_ENABLED=false`. Khi cần dừng cả việc ghi nhận/xử lý discovery,
đặt thêm `SEO_DISCOVERY_ENABLED=false`; các bài viết và sản phẩm đã công khai vẫn
giữ nguyên.

## Phạm vi API và bảo mật

- OAuth scope duy nhất: `https://www.googleapis.com/auth/webmasters`.
- Sitemap REST API: `https://www.googleapis.com/webmasters/v3`.
- URL Inspection REST API:
  `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`.
- Mọi request có thời hạn tổng cộng 5 giây, không đi theo redirect và lỗi được
  chuẩn hóa; response thô, credential path và token không được ghi log hoặc trả
  về client.
- Chỉ sitemap cố định `https://mushroomie.io.vn/sitemap.xml` được phép submit.
  URL Inspection chỉ nhận canonical HTTPS trên origin
  `https://mushroomie.io.vn` sau khi qua cổng eligibility của hệ thống.

Nếu credential bị lộ hoặc nghi ngờ bị lộ, tắt `GSC_INTEGRATION_ENABLED`, thu hồi
key trong Google Cloud, tạo key mới bằng quy trình được phê duyệt, cập nhật tệp
ngoài repository và kiểm tra kết nối lại trước khi bật.

# Thiết kế tự động đối soát sitemap cho Google Discovery

**Ngày:** 2026-08-12

**Trạng thái:** Đã được người dùng phê duyệt phương án A

**Phạm vi:** Phát hiện tự động URL trang tĩnh/local/catalog mới từ sitemap; không thay đổi schema, credential hoặc chính sách Google API

## 1. Bối cảnh và khoảng trống cần đóng

Mushroomie đã ghi một `SeoDiscoveryJob` ngay sau khi bài viết hoặc sản phẩm công khai được tạo, kích hoạt hoặc cập nhật. Bài viết đến lịch cũng đi qua cùng publication helper. Tuy nhiên, URL trang tĩnh, landing page local SEO và trang catalog chỉ xuất hiện trong `https://mushroomie.io.vn/sitemap.xml`; hiện chúng chỉ được đưa vào hàng đợi khi quản trị viên gọi thủ công hành động `sync_sitemap`.

Đối chiếu production ngày 2026-08-12 cho thấy:

- sitemap có 138 URL;
- hàng đợi có 102 URL;
- 101 URL sitemap đã có trong hàng đợi;
- 37 URL còn thiếu gồm trang chủ, catalog/category và trang tĩnh/local;
- một job legacy có URL sai được giữ `SKIPPED` và không thuộc sitemap hợp lệ.

Mục tiêu của thay đổi này là làm cho mọi URL hợp lệ mới xuất hiện trong sitemap được phát hiện tự động mà không cần thao tác quản trị, đồng thời giữ tải mạng và database thấp.

## 2. Quyết định kiến trúc

Ứng dụng sẽ chạy sitemap reconciliation:

1. ngay trong lần maintenance đầu tiên sau khi PM2 khởi động hoặc restart;
2. sau đó tối đa một lần thành công trong mỗi cửa sổ 60 phút;
3. trước discovery worker trong cùng maintenance tick.

Chu kỳ maintenance hiện vẫn chạy mỗi 60 giây. Một coordinator cấp process quyết định tick nào được phép gọi sitemap reconciliation. Coordinator được neo trên `globalThis`, tương tự singleton timer hiện có, để các lời gọi cron/interval trong cùng process chia sẻ trạng thái và không tạo nhiều lần đồng bộ cạnh tranh.

Không thêm cron riêng, dependency mới, bảng mới hay cột mới.

## 3. Thành phần và trách nhiệm

### 3.1 Sitemap maintenance coordinator

Một module server-only mới cung cấp hàm dạng:

```ts
runSitemapReconciliationIfDue(options?): Promise<SitemapMaintenanceResult>
```

Coordinator chịu trách nhiệm:

- không làm gì khi `SEO_DISCOVERY_ENABLED` khác literal `true`;
- chạy ngay khi process chưa có lần đồng bộ thành công;
- bỏ qua khi lần thành công gần nhất chưa đủ 60 phút;
- chia sẻ cùng một promise khi có nhiều lời gọi đồng thời;
- chỉ ghi nhận thời điểm hoàn tất sau khi reconciliation thành công;
- không ghi nhận success khi reader, parser hoặc transaction lỗi, để tick sau có thể retry;
- chỉ trả summary giới hạn, không trả URL hoặc dữ liệu nhạy cảm.

`lastSuccessfulAt` là thời gian wall-clock theo millisecond. Nếu đồng hồ hệ thống lùi, coordinator coi công việc chưa đến hạn cho đến khi mốc hiện tại vượt mốc thành công trước đó; không tạo vòng lặp đồng bộ liên tục.

### 3.2 Reconciliation hiện có

Coordinator tái sử dụng nguyên vẹn `syncSitemapDiscoveryJobs()`:

- chỉ đọc sitemap cố định của Mushroomie;
- parser giới hạn kích thước và fail-closed;
- tạo job `source_type=sitemap_sync` bằng unique URL và `skipDuplicates`;
- dùng transaction/CAS để chống race;
- reset chỉ khi `lastmod` tiến lên;
- đánh dấu URL sitemap-owned đã biến mất mà không xóa job;
- không sửa/xóa Post, Product hoặc job do publication sở hữu.

Không nhân bản logic sitemap trong scheduler.

### 3.3 Tích hợp maintenance

Thứ tự một maintenance tick là:

1. xuất bản bài viết đến lịch;
2. giải phóng reservation tồn kho hết hạn;
3. chạy sitemap reconciliation nếu đến hạn;
4. chạy một discovery batch giới hạn tối đa 10 job.

Mỗi bước giữ boundary lỗi độc lập. Sitemap lỗi không được chặn inventory, publication hoặc worker. Log lỗi dùng event/code cố định, không chứa URL tùy ý, response body, credential hay raw exception message.

## 4. Luồng dữ liệu

### 4.1 Trang tĩnh hoặc landing page mới

1. Code thêm URL hợp lệ vào `src/app/sitemap.ts` hoặc nguồn sitemap hiện hữu.
2. Release được deploy và PM2 restart.
3. Maintenance đầu tiên gọi reconciliation ngay.
4. `syncSitemapDiscoveryJobs()` tạo job `sitemap_sync` ở trạng thái pending.
5. Worker trong cùng tick hoặc tick kế tiếp chạy eligibility.
6. Khi GSC được cấu hình, worker kiểm tra trạng thái Google và quản lý sitemap theo quota/cooldown hiện có.

### 4.2 Bài viết hoặc sản phẩm mới

Publication helper vẫn là đường nhanh: job được ghi ngay sau database commit và cache revalidation. Reconciliation hàng giờ chỉ đóng vai trò repair/reconciliation, không thay thế publication hook và không tạo job trùng nhờ unique URL.

## 5. Xử lý lỗi và khả năng phục hồi

- **Sitemap HTTP/XML lỗi:** lần chạy thất bại, không ghi mốc success, tick sau retry.
- **Transaction lỗi:** không có trạng thái nửa vời; tick sau retry.
- **Hai caller đồng thời:** dùng chung một in-flight promise; chỉ một lần fetch/transaction.
- **PM2 restart:** state process-local mất có chủ ý; lần maintenance đầu tiên đồng bộ ngay.
- **Google integration tắt:** reconciliation vẫn tạo/đối soát job; worker dừng fail-closed ở `CONFIGURATION_REQUIRED` và không gọi Google.
- **Discovery feature tắt:** coordinator không fetch sitemap và không ghi DB.
- **Đồng hồ lùi:** không chạy dồn; chỉ chạy lại khi đủ interval theo mốc success đã lưu.

## 6. Hiệu suất và quota

- Tối đa 24 sitemap reconciliation thành công mỗi ngày cho mỗi PM2 process ổn định.
- Sau restart có thêm đúng một lần chạy ngay để không bỏ lỡ release.
- Không import coordinator, parser, Google adapter hoặc `google-auth-library` vào public rendering graph.
- Không thay đổi bundle public, HTML, CSS, ảnh hoặc Core Web Vitals trực tiếp.
- Reconciliation không gọi URL Inspection API; quota Google vẫn do worker hiện hữu quản lý.
- Worker tiếp tục giới hạn tối đa 10 job mỗi batch.

## 7. Bảo mật

- Sitemap URL và production origin là hằng số đã được xác thực; không nhận URL từ request/user.
- Không đọc hoặc ghi service-account credential trong module này.
- Không log raw XML, URL tùy ý, token, key hoặc lỗi provider.
- Không thêm endpoint công khai.
- Admin action `sync_sitemap` vẫn được giữ để vận hành thủ công khi cần và tiếp tục có auth/rate-limit/audit hiện hữu.

## 8. Kế hoạch kiểm thử bắt buộc

TDD phải chứng minh từng hành vi sau bằng RED rồi GREEN:

1. maintenance hiện thiếu reconciliation tự động;
2. lần gọi đầu tiên chạy ngay;
3. tick trong vòng 60 phút không chạy lại;
4. tick sau đủ 60 phút chạy lại;
5. hai caller đồng thời dùng chung một lần sync;
6. sync lỗi không ghi mốc success và tick kế tiếp retry;
7. sync lỗi không chặn discovery worker;
8. reconciliation hoàn tất trước worker trong cùng tick;
9. feature flag tắt không fetch/ghi DB;
10. summary/log không làm lộ raw error hoặc URL;
11. URL sitemap mới được tạo thành job idempotent bằng implementation thật;
12. public import graph vẫn không chạm sitemap maintenance/Google/admin code.

Sau focused tests phải chạy toàn bộ:

- Vitest và legacy tests;
- `npx prisma generate`;
- TypeScript typecheck;
- scoped ESLint và full lint để phân biệt warning cũ;
- production build với cấu hình DB offline an toàn;
- bundle/performance boundary tests;
- `git diff --check` và staged secret scan.

## 9. Rollout và bằng chứng chấp nhận

1. Commit và push nhánh feature.
2. Fast-forward `main` sau khi toàn bộ gate xanh.
3. Build release standalone mới trên VPS; không dùng deploy path có thể xóa previous release.
4. Smoke stage ở port riêng.
5. Kích hoạt release bằng same-filesystem rename, giữ previous release để rollback.
6. Giữ `GSC_INTEGRATION_ENABLED=false` trong rollout này.
7. Sau restart, xác minh sitemap reconciliation tự chạy.
8. Chờ worker xử lý 37 URL mới; trạng thái dự kiến khi GSC còn tắt là 138 URL hợp lệ ở `CONFIGURATION_REQUIRED` và một URL legacy ở `SKIPPED`.
9. Xác minh health, PM2, Nginx, MySQL, route, sitemap, CSS/JS MIME, upload và logs.
10. Chạy lại các performance boundary gates; không tuyên bố 100/100 nếu Lighthouse không đạt.

## 10. Ngoài phạm vi

- Không tạo Google Cloud project/service account/key trong thay đổi này.
- Không bật `GSC_INTEGRATION_ENABLED` trước khi probe quyền Sitemap và URL Inspection đạt.
- Không dùng Google Indexing API cho bài viết/sản phẩm thông thường vì Google chỉ hỗ trợ JobPosting và BroadcastEvent phù hợp.
- Không thêm daily URL Inspection quota table; rollout GSC vẫn phải tuân thủ giới hạn inventory/backlog trong runbook hiện có.
- Không thay đổi UI quản trị, schema Prisma, payment, auth, upload, inventory hoặc public page design.

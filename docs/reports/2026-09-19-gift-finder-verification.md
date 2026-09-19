# Tìm quà hợp ý — triển khai và kiểm chứng

Ngày: 2026-09-19. Người dùng đã chọn phương án Tìm quà hợp ý.

## Kết quả

Thêm `/chon-qua` với bộ lọc ngân sách tối đa (100.000 / 200.000 / 300.000 / 500.000 đồng hoặc không giới hạn), danh mục và khả năng cá nhân hóa. Chỉ hiện sản phẩm active, còn hàng, giá niêm yết dương. Giá giảm hợp lệ được tính đúng theo quy tắc hiển thị của ProductCard. Không có kết quả thì không tự nới bộ lọc.

Biểu mẫu GET và link phân trang giữ lựa chọn trong URL. Mỗi trang tối đa 12 mẫu. Trang quá lớn được đưa về trang cuối. Có trạng thái rỗng, lỗi dữ liệu và nút thử lại giữ nguyên lựa chọn. Thêm link từ catalog và khu vực sản phẩm nổi bật; thêm route gốc vào sitemap.

Canonical trỏ production `/chon-qua`; mọi biến thể query noindex/follow. Open Graph và Twitter có ảnh thương hiệu. Không thêm dependency, đổi schema hay logic auth/checkout/voucher/upload. Database sản phẩm chỉ được đọc bởi tính năng.

## Phạm vi file

- `src/lib/gift-finder.ts`: allowlist/chuẩn hóa query, URL phân trang, điều kiện Prisma.
- `src/lib/gift-finder-server.ts`: select dữ liệu public, count, truy vấn có giới hạn và trạng thái lỗi.
- `src/components/product/GiftFinder.tsx`: form, kết quả, empty/error state, phân trang.
- `src/app/(user)/chon-qua/{page,loading}.tsx`: route động, metadata và loading.
- `src/app/(user)/san-pham/page.tsx`, `src/components/home/landing/HomeFeaturedProducts.tsx`: lối vào.
- `src/app/sitemap.ts`: URL gốc.
- `src/components/product/ProductCard.tsx`: chỉ đổi màu chữ trên hai badge và nút trạng thái đã thêm có nền sáng sang #2b2b2b để đọc được trong dark mode.
- Bốn file test mới cho bộ lọc, dữ liệu server, giao diện và metadata.

Các thay đổi dở dang có trước trong workspace không nằm trong commit tính năng.

## Bằng chứng kiểm chứng

| Hạng mục | Kết quả |
| --- | --- |
| `npm ci` | Pass; lockfile giữ nguyên |
| `npx prisma generate` | Pass, Prisma 5.22.0 |
| `npm run typecheck --if-present` | Pass; build cuối cũng kiểm tra TypeScript thành công |
| `npm run build` | Pass trên Next.js 16.2.11; `/chon-qua` là route động, 142 static pages được tạo |
| `npm run test:vitest` | 45 file / 363 test pass trước khi thêm test metadata |
| Test metadata mới | 4/4 pass, gồm ảnh chia sẻ và query rỗng |
| `npm run test:legacy` | 281/281 pass |
| Sau sửa màu ProductCard | Chạy lại ProductCard, GiftFinder và metadata: 13/13 pass |
| ESLint các file thay đổi | Pass |
| Review độc lập | Hai vấn đề metadata đã sửa; không còn finding cần sửa trong phạm vi tính năng |

Test được viết và chạy thất bại trước khi triển khai phần mới. Hai lỗi metadata cũng được tái hiện bằng test trước khi sửa.

### MySQL thật, tách biệt production

Khởi tạo instance MySQL riêng, chỉ bind loopback, cổng 33419, database `mushroomie_gift_finder_test`. Chỉ instance tạm này được đồng bộ schema và tạo fixture. Không truy cập hay thay đổi database cửa hàng.

32 bản ghi fixture gồm 28 mẫu hợp lệ và 4 trường hợp ẩn/draft/hết hàng/giá không hợp lệ. Kiểm tra 40 tổ hợp ngân sách × danh mục × cá nhân hóa bằng câu truy vấn thật, so sánh với `resolveDisplayPrice`. Bao gồm sale null, âm, 0, bằng giá gốc, cao hơn giá gốc và giảm hợp lệ; ngân sách bao gồm đúng giá ở ranh giới.

Phân trang thực tế 12/12/4, không trùng sản phẩm. Yêu cầu trang 9999 trả dữ liệu trang cuối. Script và fixture kiểm chứng là dữ liệu tạm, không commit.

### Trình duyệt và HTTP trên bản standalone

Chrome DevTools MCP chạy qua CLI/daemon của chính gói MCP, với Chrome for Testing 149 và profile `--isolated`; không dùng profile cá nhân.

- Viewport thực đo: 1440, 1366, 390, 360px. Không scroll ngang; mỗi trang 1 H1; khung ảnh đều có tỷ lệ 0,75 (3:4).
- Select cao 48px, nút tìm và link reset cao 44px. Kiểm tra thao tác chọn ngân sách/danh mục bằng bàn phím rồi submit native GET.
- Chọn 100.000đ + vòng tay + cá nhân hóa trả 5 mẫu fixture đúng điều kiện; giá hiển thị đều <= 100.000đ.
- Click Trang sau giữ ngân sách 100.000đ trong URL; trang cuối có 6 mẫu trong bộ lọc đó.
- Danh mục không tồn tại hiện empty state, giữ lựa chọn trong form, không hiện sản phẩm không khớp.
- Không ảnh đã tải nào bị broken; kiểm tra cả ảnh upload và fallback.
- Console error/warn: không có trong các lượt kiểm tra; các request được quan sát thành công.
- Dark mode: chữ badge trước sửa gần trắng; sau sửa rgb(43,43,43), tương phản 11,60:1 trên vàng và 10,68:1 trên hồng.
- `/`, `/san-pham`, `/chon-qua`, các URL lọc/rỗng/trang lớn và `/sitemap.xml`: HTTP 200. Lối vào tính năng và URL sitemap được xác nhận trong HTML.
- 16 asset JS: HTTP 200, MIME JavaScript đúng. 3 asset CSS: HTTP 200, `text/css`. CSS được kiểm tra riêng vì cấu hình hiện có bật `inlineCss`.
- Metadata trong HTML thực tế có canonical production, Open Graph image và noindex cho query.

## Giới hạn và vận hành

- Đã kiểm chứng local với dữ liệu thử nghiệm, chưa deploy production, chưa chạy kiểm tra PM2/domain thật. Chưa push GitHub.
- Npm báo 15 lỗ hổng trong dependency hiện có (5 moderate, 9 high, 1 critical). Không thêm/nâng cấp package hay chạy `audit fix` trong tính năng này; cần một đợt xử lý dependency riêng.
- Build có cảnh báo cấu hình Cache-Control hiện có cho static assets; kiểm tra MIME/HTTP local vẫn pass.
- Tính năng dùng dữ liệu mới mỗi request, nhưng tồn kho có thể thay đổi sau khi trang đã tải; việc xác nhận mua hàng vẫn do luồng checkout hiện có thực hiện.
- Rollback phần tính năng bằng revert commit riêng; không cần rollback schema hay dữ liệu production.

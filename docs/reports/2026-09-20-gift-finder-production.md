# Tìm quà hợp ý — GitHub và production

Ngày triển khai: 2026-09-20. Người dùng yêu cầu đưa tính năng lên GitHub và production. Độ phức tạp: phức tạp do có tích hợp main và chuyển runtime production; sử dụng model Codex mạnh.

## Phiên bản và phạm vi

- Tính năng: https://mushroomie.io.vn/chon-qua
- Commit ứng dụng: `0fd701b7d4a99fd3ccf763ae36926a45c6bc5853` — `feat: add budget-based gift finder`, đã push trực tiếp bằng fast-forward lên `origin/main`.
- Repo: https://github.com/tongminhquan/mushroomie-23
- Tích hợp riêng commit tính năng từ workspace phát triển vào `origin/main` mới nhất (`ec81714`). Giữ nguyên ProductCard Server Component và màu `text-brand-ink` đã có trên main. Các thay đổi dở dang của workspace ban đầu không được push/deploy.
- Source production trước triển khai là `592f491`; release mới bao gồm những cập nhật SEO đã có sẵn trên main cùng tính năng chọn quà. Schema Prisma, lockfile, ecosystem và Nginx không đổi so với source production trước đó.
- Không chạy migration, `prisma db push`, seed hay tác vụ chỉnh sửa dữ liệu cửa hàng. Database và uploads thật được sao lưu, không bị thay thế.

## Kiểm chứng trước phát hành

| Kiểm tra | Kết quả |
| --- | --- |
| `npm ci` | Đạt tại local và thư mục dựng release Linux riêng |
| `npx prisma generate` | Đạt tại local và server |
| `npm run typecheck` | Đạt tại local và server |
| Build production | Đạt tại local và server, `/chon-qua` là route động |
| Vitest | 68 file, 914/914 test đạt |
| Legacy | 406 test đạt, 7 test được đánh dấu skip sẵn, không có test thất bại |
| `npm run test:coverage` | Đạt; coverage lines 92,36%, branches 78,24% trong phạm vi core |
| `npm run test:coverage:all` | Đạt ngưỡng hiện có; coverage lines 32,04% trên toàn phạm vi |
| `npm run lint` | 0 lỗi, 205 cảnh báo hiện có |
| Release chạy thử cổng loopback 3002 | Health/database OK, trang chọn quà và query lọc tải thành công |

Lượt test đầu chạy đồng thời với build gặp một timeout 5 giây khi import route trong bộ kiểm tra quyền truy cập. Chạy riêng 83 test của file đó và chạy lại toàn bộ suite đều đạt, không đổi timeout hay bỏ test. Build local đầu tiên dừng vì instance MySQL thử nghiệm của phiên trước đã tắt; khởi động lại đúng instance loopback cổng 33419 rồi build đạt. Không dùng database production cho build local.

GitHub Actions run https://github.com/tongminhquan/mushroomie-23/actions/runs/35498208113 bị chặn trước khi chạy bất kỳ step nào: tài khoản GitHub bị khóa do vấn đề billing. Workflow được giữ nguyên. Các bước kiểm tra ứng dụng và coverage đã chạy độc lập tại local; build Linux và kiểm tra runtime thực tế đã chạy trên server. Không báo CI xanh.

## Cách phát hành và bảo toàn runtime

Server được xác minh bằng SSH là `103.77.242.153`, project `/var/www/mushroomie`; thông tin IP cũ trong một số hướng dẫn không được dùng để triển khai.

- Dựng trong worktree riêng `/var/www/mushroomie/.release-builds/gift-finder-0fd701b`, với dependency riêng. Runtime cũ dùng symlink tới root `node_modules`, nên không chạy `npm ci` trên thư mục root đang phục vụ traffic.
- Release standalone độc lập: `/var/www/mushroomie/.releases/gift-finder-0fd701b`, chứa dependency runtime riêng và file `REVISION` ghi commit ứng dụng.
- Đường dẫn PM2 `.next/standalone` hiện là symlink tới release này. PM2 vẫn tên `mushroomie_pm2`, fork một process, bind `127.0.0.1:3001`; đã restart và `pm2 save`.
- `release/public/uploads` trỏ tới `/var/www/mushroomie/public/uploads`. Các `.env` được giữ private với mode `600`.
- Static mới được chuẩn hóa directory `755`/file `644` trước khi copy cộng thêm vào `.next/static`, rồi kiểm tra quyền đọc bằng chính user Nginx `www-data`. Không thay đổi cấu hình Nginx.
- Runtime cũ được giữ nguyên ở `/var/www/mushroomie/.releases/pre-gift-finder-20260920`. Các chunk cũ và root `node_modules` vẫn được giữ để phục hồi được runtime trước.
- Script activation có recovery khi restart/health/route/MIME thất bại. Guard chỉ tháo đúng symlink do lượt triển khai tạo; chỉ báo phục hồi thành công sau khi di chuyển runtime cũ, restart PM2 và health/database check đều thành công.
- Bốn tình huống recovery được kiểm tra trong thư mục mock riêng: link mới đã tạo, tạo link thất bại, restart phục hồi thất bại và xuất hiện link của release khác. Cả bốn đạt; không thử failure injection trên runtime production.

Build intermediate `.next` và `node_modules` do lượt này tạo trong worktree release đã được xóa sau khi xác minh release độc lập. Giữ source checkout, `.env`, release mới, runtime cũ và mọi backup. Dung lượng trống sau dọn: khoảng 2,7 GB, tăng từ khoảng 1,1 GB khi hai bản build cùng tồn tại.

## Bằng chứng trên domain thật

Chrome DevTools MCP chạy qua CLI/daemon của gói MCP với Chrome for Testing 149 và profile isolated; không dùng profile cá nhân.

- Viewport thực đo: 1440, 1366, 390 và 360px. Không tràn ngang; một H1; 12 card/trang; khung ảnh 3:4; không ảnh đã tải nào bị broken. Select cao 48px, nút tìm và reset cao 44px.
- Form native GET được thao tác chọn bằng bàn phím và click submit sau khi cuộn nút vào vùng nhìn thấy. Ngân sách 100.000đ + vòng tay + cá nhân hóa trả 6 sản phẩm đúng danh mục, có badge cá nhân hóa, giá từ 30.000đ đến 45.000đ; URL giữ đủ ba bộ lọc.
- Click Trang sau giữ `budget=100000`, chuyển `page=2` và trả 12 card. Danh mục không tồn tại trả trạng thái rỗng, không tự nới bộ lọc.
- Giao diện tối không tràn ngang; chữ badge vẫn `rgb(43,43,43)` trên nền vàng/hồng. Không có console error/warn trong các lượt kiểm tra responsive và thao tác cuối. Có một browser issue CORB trong lượt kiểm tra kéo dài; không có request ứng dụng thất bại trong lượt cuối.
- Các route `/`, `/san-pham`, `/chon-qua`, URL lọc/rỗng/trang lớn, `/gioi-thieu`, `/tin-tuc`, `/mini-game`, `/tai-khoan/dang-nhap`, `/gio-hang`, `/thanh-toan`, `/voucher`, `/lien-he`, `/sitemap.xml`, `/api/health` trả HTTP 200.
- `/cau-chuyen` trả 308 về `/gioi-thieu`, đúng alias có sẵn trong code; trang đích 200. `/admin` trả 307 về đăng nhập khi chưa xác thực, đúng thiết kế.
- 21 file JS và 2 file CSS lấy từ HTML thực tế đều HTTP 200 và đúng MIME. Logo, favicon và các ảnh sản phẩm quan sát trong browser tải thành công.
- Canonical `/chon-qua`, noindex/follow cho query, link từ trang chủ/catalog và URL trong sitemap được xác nhận từ HTML production.
- PM2 sau gần 7 phút: online, cùng PID sau lần restart chủ động, unstable restarts 0, không phát sinh byte mới trong error log. Đã đọc snapshot `pm2 logs --lines 150 --nostream`; health và database OK sau khi dọn build tạm.

## Backup và vận hành tiếp

- Database: `/var/www/mushroomie/backups/db/mysql-20260920T075200Z.sql.gz`.
- Uploads: `/var/www/mushroomie/backups/uploads/uploads-20260920T075200Z.tar.gz`.
- Hai backup được tạo và kiểm tra bằng `scripts/backup-production.sh` hiện có; script không prune backup cũ.
- Hồ sơ vận hành private: `/var/www/mushroomie/backups/deploy-gift-finder-20260920/`, gồm build logs, activation script, revision/runtime trước đó, thời điểm activation, health và log PM2. Runtime cũ nằm tại đường dẫn nêu trên; không xóa nó hoặc root `node_modules` khi còn cần khả năng phục hồi.
- Bản chạy production được xác định bằng `REVISION` trong release. Commit tài liệu triển khai được thêm sau commit ứng dụng, không thay đổi bundle.

Các giới hạn còn lại: GitHub Actions cần chủ tài khoản xử lý billing; dependency hiện có vẫn có cảnh báo bảo mật, gồm mức critical ở Next.js, và chưa được nâng cấp trong đợt phát hành tính năng này. Không có thay đổi dependency trong commit tính năng. Việc kiểm tra checkout chỉ xác nhận route tải được; không tạo đơn hàng thật hoặc giao dịch thử trên production.

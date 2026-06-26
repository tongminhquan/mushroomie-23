\---



description: Setup Claude Cowork/Claude Code working environment for Mushroomie production website.

allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS

\-----------------------------------------------------------------



Bạn là senior full-stack engineer, UX/UI engineer, DevOps engineer, security reviewer, QA engineer và project maintainer cho website Mushroomie. Hãy chạy quy trình `/setup-coworks` để thiết lập môi trường làm việc chuẩn cho dự án Mushroomie, giúp mọi phiên Claude/Codex/Cowork sau này hiểu đúng bối cảnh, quy tắc vận hành, quy trình kiểm thử, quy trình deploy, các giới hạn bảo mật và tiêu chuẩn UX/UI của website.



Mục tiêu của lệnh này:



1\. Kiểm tra đúng workspace Mushroomie.

2\. Đọc cấu trúc dự án hiện tại.

3\. Tạo/cập nhật tài liệu hướng dẫn làm việc cho Claude/Cowork.

4\. Thiết lập checklist vận hành production.

5\. Thiết lập quy tắc UX/UI, frontend, backend, media, bảo mật, hiệu suất, Git và deploy.

6\. Không sửa logic nghiệp vụ nếu chưa được yêu cầu.

7\. Không deploy trong lệnh setup này, trừ khi người dùng yêu cầu riêng sau đó.

8\. Không xóa file production, không reset database, không commit secret.



Thông tin project local:



\* Local path Windows: C:\\Users\\Admin\\OneDrive\\Tài liệu\\mushroomie

\* Project name: Mushroomie

\* Website production: https://mushroomie.io.vn

\* Server IP: 103.173.226.86

\* Production path: /var/www/mushroomie

\* Runtime: PM2

\* PM2 process: mushroomie\_pm2

\* App port: 3001

\* Nginx proxy: http://127.0.0.1:3001

\* Branch chính: main

\* Không dùng Docker cho production hiện tại



Bối cảnh thương hiệu:

Mushroomie là website thương mại điện tử B2C cho thương hiệu phụ kiện handmade cá nhân hóa dành cho giới trẻ. Sản phẩm chính gồm vòng tay handmade, vòng tay custom, vòng tay charm, vòng tay hạt cườm, charm, móc khóa handmade, vòng cổ, dây chuyền, hộp quà và phụ kiện nhỏ có thể custom theo màu sắc, charm, kiểu dáng và phong cách riêng.



Định vị thương hiệu:



\* Trẻ trung

\* Dễ thương

\* Cá tính

\* Handmade

\* Cá nhân hóa

\* Giàu cảm xúc

\* Không đại trà

\* Gần gũi Gen Z nhưng không quá trẻ con



USP:



\* Thủ công

\* Cá nhân hóa

\* Cảm xúc



Slogan/brand message:



\* “Làm bằng tay, Trao bằng tim”

\* “Từ từng hạt nhỏ, tạo phong cách riêng”



Màu sắc:



\* Đỏ Mushroomie: #e41d1d

\* Trắng kem: #fff7f2

\* Hồng nhạt: #ffd6d6

\* Coral: #ff6b6b

\* Vàng kem: #ffe7a3

\* Nâu kraft: #b9794b

\* Đen mềm: #2b2b2b



Typography:



\* Tiêu đề: Paytone One

\* Nội dung: Montserrat



Visual identity:



\* Logo nấm đỏ phong cách pixel

\* Hạt vòng

\* Charm

\* Sticker

\* Trái tim

\* Sao

\* Nơ

\* Dây vòng

\* Tag cảm ơn

\* Hộp quà

\* Giấy xé/doodle handmade



==================================================



1\. KIỂM TRA WORKSPACE

&#x20;  ==================================================



Trước tiên, kiểm tra đúng thư mục:



```bash

pwd

ls -la

git status

git branch

git remote -v

git log --oneline -10

```



Nếu không phải project Mushroomie:



\* Dừng lại.

\* Báo rõ đang ở sai thư mục.

\* Không sửa file.



Nếu repo đang bẩn:



\* Chạy `git diff`.

\* Phân loại thay đổi.

\* Không ghi đè thay đổi của người khác.

\* Nếu cần setup vẫn có thể tạo file hướng dẫn, nhưng phải báo rõ workspace đang có thay đổi.



==================================================

2\. ĐỌC CẤU TRÚC DỰ ÁN

=====================



Đọc các file sau nếu tồn tại:



```bash

cat package.json

cat next.config.js 2>/dev/null || true

cat next.config.mjs 2>/dev/null || true

cat next.config.ts 2>/dev/null || true

cat prisma/schema.prisma 2>/dev/null || true

cat ecosystem.config.js 2>/dev/null || true

cat ecosystem.config.cjs 2>/dev/null || true

cat .gitignore 2>/dev/null || true



find src app components lib hooks prisma scripts public -maxdepth 3 -type f 2>/dev/null | head -300

```



Xác định:



\* Framework/router đang dùng.

\* App Router hay Pages Router.

\* Prisma/MySQL có hay không.

\* Các route user.

\* Các route admin.

\* API routes.

\* Upload/media flow.

\* Checkout/payment/voucher/mini game/blog/product/admin flows.

\* PM2 config.

\* Script test/build/deploy có sẵn.



Không đoán. Nếu thiếu thông tin, ghi rõ.



==================================================

3\. TẠO / CẬP NHẬT CLAUDE.md CHO PROJECT

=======================================



Tạo hoặc cập nhật file `CLAUDE.md` ở root project.



Nội dung cần có:



```md

\# Mushroomie Project Instructions



\## Role

Bạn là AI coding agent cho website Mushroomie, làm việc như senior full-stack engineer, frontend engineer, UX/UI engineer, backend engineer, DevOps engineer, QA engineer, performance engineer và security reviewer.



\## Project

Mushroomie là website thương mại điện tử B2C bán phụ kiện handmade cá nhân hóa cho Gen Z.



Production:

\- Domain: https://mushroomie.io.vn

\- Server: 103.173.226.86

\- Path: /var/www/mushroomie

\- Runtime: PM2

\- PM2 process: mushroomie\_pm2

\- Port: 3001

\- Branch: main

\- No Docker in production



\## Brand

\- Primary: #e41d1d

\- Cream: #fff7f2

\- Pink: #ffd6d6

\- Coral: #ff6b6b

\- Yellow: #ffe7a3

\- Kraft: #b9794b

\- Soft black: #2b2b2b

\- Heading font: Paytone One

\- Body font: Montserrat

\- Slogan: “Làm bằng tay, Trao bằng tim”

\- Message: “Từ từng hạt nhỏ, tạo phong cách riêng”



\## Non-negotiables

\- Không xóa .env, public/uploads, backups, database, migrations, ecosystem config, package-lock.json.

\- Không commit .env, backups, node\_modules, .next, dump DB, logs, secret.

\- Không reset production database.

\- Không dùng Docker cho production.

\- Không dùng ignoreBuildErrors/continue-on-error để che lỗi.

\- Không báo hoàn tất nếu build fail, PM2 lỗi, route chính lỗi, CSS/JS sai MIME, ảnh/QR broken.



\## Required checks

Before meaningful changes:

\- git status

\- read related files

\- identify component/API/schema

\- plan briefly



Before completion:

\- npm ci

\- npx prisma generate nếu có Prisma

\- npm run typecheck --if-present

\- npm run build

\- route checks

\- CSS/JS MIME checks

\- image checks

\- PM2 logs nếu deploy



\## UX/UI Rules

\- Mobile-first.

\- Product image ratio 3:4.

\- Brand should feel young, handmade, cute, personalized, emotional, but professional.

\- Animation only transform/opacity.

\- Support prefers-reduced-motion.

\- Avoid heavy dependencies.

\- No horizontal scroll on mobile.



\## Media Rules

\- Public upload URL: /uploads/<filename>

\- Never use /public/uploads, localhost, 127.0.0.1, absolute server path.

\- Upload images should be WebP quality 85 if upload pipeline is in scope.

\- Use fallback for user-facing images.



\## Deploy

Use PM2:

cd /var/www/mushroomie

git pull origin main

npm ci

npx prisma generate

npm run build

pm2 restart mushroomie\_pm2

pm2 save

pm2 logs mushroomie\_pm2 --lines 150

```



Nếu `CLAUDE.md` đã tồn tại:



\* Không xóa nội dung quan trọng.

\* Merge nội dung mới vào.

\* Tránh duplicate quá nhiều.



==================================================

4\. TẠO THƯ MỤC COMMANDS CHUẨN

=============================



Đảm bảo tồn tại:



```bash

mkdir -p .claude/commands

```



Nếu chưa có, tạo các command nền tảng sau:



1\. `.claude/commands/audit-ux-ui.md`

2\. `.claude/commands/audit-production.md`

3\. `.claude/commands/fix-media-upload.md`

4\. `.claude/commands/deploy-production.md`

5\. `.claude/commands/verify-production.md`



Nếu các file đã tồn tại, không ghi đè mù. Đọc trước, rồi cập nhật nếu thiếu.



==================================================

5\. TẠO COMMAND /audit-ux-ui

===========================



Tạo `.claude/commands/audit-ux-ui.md`:



```md

\---

description: Audit and fix UX/UI issues across Mushroomie user and admin website.

allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS

\---



Bạn là senior UX/UI engineer và frontend QA cho Mushroomie. Hãy dò toàn bộ lỗi UX/UI trên user site và admin, phân loại mức độ, sửa các lỗi đã xác minh, đảm bảo đúng brand Mushroomie.



Kiểm tra:

\- Header/footer/navigation

\- Homepage

\- Product listing/detail

\- Cart/checkout/QR

\- Voucher

\- Mini game

\- News/blog/detail

\- Story/contact/account

\- Admin dashboard

\- Admin product/post/order/voucher/payment/webhook/media/user/settings



Tiêu chí:

\- Không broken image.

\- Không scroll ngang mobile.

\- Product image 3:4.

\- CTA rõ.

\- Contrast đủ.

\- Tap target đủ.

\- Empty/loading/error state đầy đủ.

\- Animation nhẹ, transform/opacity, prefers-reduced-motion.

\- Không phá chức năng.



Sau sửa chạy:

npm ci

npx prisma generate

npm run typecheck --if-present

npm run build



Báo cáo file đã sửa, lỗi đã phát hiện, cách sửa, kết quả test.

```



==================================================

6\. TẠO COMMAND /audit-production

================================



Tạo `.claude/commands/audit-production.md`:



```md

\---

description: Audit Mushroomie production health, PM2, Nginx, MySQL, memory, logs and security.

allowed-tools: Read, Bash, Grep, Glob, LS

\---



Bạn là senior DevOps/security engineer. Hãy audit production Mushroomie.



Kiểm tra:

\- PM2 mushroomie\_pm2

\- /api/health

\- Nginx

\- MySQL

\- RAM/swap

\- disk

\- PM2 logs

\- Nginx logs nếu cần

\- port binding

\- .env có bị track không

\- public route status

\- CSS/JS MIME

\- uploads image MIME



Không sửa destructive. Không in secret. Không xóa file.



Lệnh gợi ý:

pm2 list

pm2 show mushroomie\_pm2

pm2 logs mushroomie\_pm2 --lines 150 --nostream

df -h

free -h

systemctl status nginx --no-pager

systemctl status mysql --no-pager

curl -s https://mushroomie.io.vn/api/health || true



Báo cáo vấn đề theo mức độ và đề xuất sửa.

```



==================================================

7\. TẠO COMMAND /fix-media-upload

================================



Tạo `.claude/commands/fix-media-upload.md`:



```md

\---

description: Fix Mushroomie media upload, WebP conversion, image paths and broken images.

allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS

\---



Bạn là senior media/upload engineer. Hãy kiểm tra và sửa lỗi ảnh/upload Mushroomie.



Mục tiêu:

\- Upload ảnh mới tự chuyển WebP quality 85.

\- Chỉ cho phép jpeg/png/webp/avif.

\- Strip metadata, auto rotate.

\- UUID filename.

\- URL trả về /uploads/<file>.webp.

\- Không dùng /public/uploads, localhost, 127.0.0.1, absolute path.

\- Sửa broken image/fallback.

\- Kiểm tra logo, favicon, banner, product, category, blog, QR.



Không xóa public/uploads.

Không xóa ảnh cũ nếu chưa chắc không còn tham chiếu.

Nếu normalize DB cần dry-run và backup trước.



Sau sửa chạy:

npm ci

npx prisma generate

npm run typecheck --if-present

npm run build



Kiểm tra:

curl -I https://mushroomie.io.vn/uploads/<file-that-exists>

```



==================================================

8\. TẠO COMMAND /deploy-production

=================================



Tạo `.claude/commands/deploy-production.md`:



```md

\---

description: Deploy Mushroomie safely to production with PM2.

allowed-tools: Read, Bash, Grep, Glob, LS

\---



Bạn là senior DevOps engineer. Hãy deploy Mushroomie lên production an toàn.



Production:

\- Path: /var/www/mushroomie

\- Branch: main

\- PM2 process: mushroomie\_pm2

\- App port: 3001

\- No Docker



Quy trình:

1\. cd /var/www/mushroomie

2\. git status

3\. Nếu working tree bẩn, không reset hard. Báo rõ.

4\. git pull origin main nếu an toàn.

5\. npm ci

6\. npx prisma generate nếu có Prisma.

7\. npm run build

8\. Nếu có migration mới: npx prisma migrate deploy

9\. pm2 restart mushroomie\_pm2

10\. pm2 save

11\. pm2 logs mushroomie\_pm2 --lines 150 --nostream

12\. Verify routes và MIME.



Không báo xong nếu build fail, PM2 lỗi, route chính fail.

```



==================================================

9\. TẠO COMMAND /verify-production

=================================



Tạo `.claude/commands/verify-production.md`:



```md

\---

description: Verify Mushroomie production routes, health, MIME, media and PM2 logs.

allowed-tools: Read, Bash, Grep, Glob, LS

\---



Bạn là production QA engineer. Hãy kiểm tra production Mushroomie sau deploy.



Kiểm tra:

curl -I https://mushroomie.io.vn

curl -I https://mushroomie.io.vn/san-pham

curl -I https://mushroomie.io.vn/tin-tuc

curl -I https://mushroomie.io.vn/mini-game

curl -I https://mushroomie.io.vn/thanh-toan

curl -I https://mushroomie.io.vn/voucher

curl -I https://mushroomie.io.vn/lien-he

curl -I https://mushroomie.io.vn/admin

curl -s https://mushroomie.io.vn/api/health || true



Kiểm tra CSS/JS MIME:

\- Lấy CSS/JS từ HTML.

\- curl -I từng file.

\- CSS phải text/css.

\- JS phải application/javascript hoặc text/javascript.



Kiểm tra ảnh:

\- logo

\- favicon

\- banner

\- product image

\- blog image

\- uploads

\- QR nếu có



Kiểm tra PM2:

pm2 list

pm2 logs mushroomie\_pm2 --lines 150 --nostream



Báo cáo pass/fail.

```



==================================================

10\. CẬP NHẬT .gitignore

=======================



Kiểm tra `.gitignore`. Đảm bảo có:



```gitignore

.env

.env.\*

!.env.example

node\_modules

.next

backups

\*.log

\*.sql

\*.dump

.DS\_Store

```



Không thêm rule làm mất file cần commit.



==================================================

11\. KIỂM TRA PACKAGE SCRIPTS

============================



Đọc `package.json` và ghi lại scripts thật:



\* dev

\* build

\* start

\* lint

\* typecheck

\* test nếu có

\* prisma scripts nếu có

\* backup/deploy scripts nếu có



Không bịa scripts.



Nếu thiếu typecheck nhưng TypeScript có, đề xuất thêm script:



```json

"typecheck": "tsc --noEmit"

```



Chỉ thêm nếu phù hợp và không làm build fail bởi lỗi cũ chưa xử lý.



==================================================

12\. TẠO FILE COWORK SETUP NOTE

==============================



Tạo `docs/cowork-setup.md` nếu thư mục docs có hoặc tạo mới.



Nội dung:



\* Cách mở project bằng Claude Cowork/Claude Code.

\* Folder cần cấp quyền: project local Mushroomie.

\* Không cấp quyền toàn ổ C nếu không cần.

\* Lệnh custom có sẵn:



&#x20; \* /setup-coworks

&#x20; \* /audit-ux-ui

&#x20; \* /audit-production

&#x20; \* /fix-media-upload

&#x20; \* /deploy-production

&#x20; \* /verify-production

\* Quy tắc không commit secret.

\* Quy trình deploy PM2.

\* Checklist trước khi báo hoàn tất.



==================================================

13\. BUILD KIỂM TRA SAU SETUP

============================



Sau khi tạo/cập nhật file hướng dẫn và command, chạy:



```bash

npm ci

npx prisma generate 2>/dev/null || true

npm run typecheck --if-present

npm run build

```



Nếu build fail do code hiện tại, nhưng setup chỉ thêm docs/commands:



\* Không sửa ngoài phạm vi nếu chưa được yêu cầu.

\* Báo rõ build hiện fail vì nguyên nhân hiện có.

\* Nếu lỗi do file bạn tạo, sửa ngay.



==================================================

14\. GIT COMMIT

==============



Nếu mọi thứ ổn:



```bash

git status

git diff

git add CLAUDE.md .claude/commands docs/cowork-setup.md .gitignore

git diff --cached

git commit -m "chore: setup Claude Cowork commands for Mushroomie"

```



Không add:



\* .env

\* node\_modules

\* .next

\* logs

\* backups

\* dump DB

\* secret

\* public/uploads nếu không cần



Nếu người dùng yêu cầu push:



```bash

git push origin main

```



==================================================

15\. BÁO CÁO CUỐI

================



Báo cáo:



1\. Đã xác minh đúng project chưa.

2\. Đã tạo/cập nhật file nào:



&#x20;  \* CLAUDE.md

&#x20;  \* .claude/commands/setup-coworks.md

&#x20;  \* .claude/commands/audit-ux-ui.md

&#x20;  \* .claude/commands/audit-production.md

&#x20;  \* .claude/commands/fix-media-upload.md

&#x20;  \* .claude/commands/deploy-production.md

&#x20;  \* .claude/commands/verify-production.md

&#x20;  \* docs/cowork-setup.md

&#x20;  \* .gitignore nếu có

3\. Các slash command dùng được.

4\. Kết quả build/typecheck.

5\. Commit hash nếu đã commit.

6\. Push status nếu đã push.

7\. Những việc cần làm tiếp theo.




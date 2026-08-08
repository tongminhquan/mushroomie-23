# Mushroomie README Video and Repository Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a current, safe Mushroomie README with the approved 43-second 16:9 video, while removing the exact non-website files selected in option 2.

**Architecture:** Work only in the clean clone and feature branch created from `origin/main`. Keep the final MP4 and its preview under `docs/media`, remove the old Remotion project and historical/generated material through an exact allowlist, update stale references, then verify the website and publish through a reviewed pull request.

**Tech Stack:** Markdown, Git/GitHub CLI, FFmpeg/FFprobe, PowerShell, Next.js 16.2.11, React 19.2.4, TypeScript 5, Prisma 5.22, Vitest 4.1.10, PM2/Nginx production documentation.

## Global Constraints

- Worktree: `C:\Users\Admin\AppData\Local\Temp\codex-mushroomie-readme-video-20260809-022723`.
- Branch: `codex/readme-video-repo-cleanup`, based on the fetched `origin/main` commit `891fb9d`.
- Exact slogan: `Làm bằng tay, trao bằng tim`.
- Production URL: `https://mushroomie.io.vn`.
- Approved video path: `docs/media/mushroomie-intro-43s-16x9.mp4`.
- Approved video SHA-256: `21B7D1AA66552441556531012E190935CFAC7D0A9821549F3EBA8C2EA00364D8`.
- Preview path: `docs/media/mushroomie-intro-16x9-preview.png`.
- Never delete or modify `public/uploads`, backups, `.env`, database data, Prisma migrations, `package-lock.json`, PM2/Nginx/deployment configuration, production runbooks, or real user/order/voucher/payment data.
- Never commit a secret, token, password, database dump, `.next`, `node_modules`, log, backup, or production upload.
- Do not install a new dependency.
- Do not push directly to `main`; publish through the feature branch and a pull request, then merge only after verification and review pass.
- Deletions must use exact paths, verified to be inside the clean clone and not symbolic links or reparse points.

---

## File Structure

- Create `docs/media/mushroomie-intro-43s-16x9.mp4`: approved 43-second horizontal delivery file displayed from the README.
- Create `docs/media/mushroomie-intro-16x9-preview.png`: clickable preview for GitHub Markdown.
- Modify `README.md`: current public project overview, video entry point, features, stack, local workflow and production documentation links.
- Modify `docs/reports/README.md`: remove the deleted Marketing section and retain the SEO report index.
- Modify `tsconfig.json`: remove the deleted Remotion subproject exclusion while preserving every website exclusion.
- Keep `docs/superpowers/specs/2026-08-09-readme-video-repository-cleanup-design.md`: active design decision.
- Keep this plan: active implementation and audit trail.
- Delete only the paths named in Task 2.

---

### Task 1: Publishable README and approved media

**Files:**

- Create: `docs/media/mushroomie-intro-43s-16x9.mp4`
- Create: `docs/media/mushroomie-intro-16x9-preview.png`
- Modify: `README.md`

**Interfaces:**

- Consumes: the approved video checksum and exact brand copy from Global Constraints.
- Produces: stable relative paths used by GitHub Markdown and the later verification task.

- [ ] **Step 1: Record the pre-change gate and confirm media identity**

Run:

```powershell
$ErrorActionPreference = 'Stop'
git status --short --branch
Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/media/mushroomie-intro-43s-16x9.mp4'
Get-Item -LiteralPath 'docs/media/mushroomie-intro-43s-16x9.mp4', 'docs/media/mushroomie-intro-16x9-preview.png' |
  Select-Object Length, FullName
```

Expected: the MP4 hash is exactly `21B7D1AA66552441556531012E190935CFAC7D0A9821549F3EBA8C2EA00364D8`; both media files exist; only the already committed design and untracked media are present.

- [ ] **Step 2: Replace README with current UTF-8 content**

Use `apply_patch` to replace `README.md` with the following exact structure and copy:

```markdown
# Mushroomie — Phụ kiện handmade cá nhân hóa

> **Làm bằng tay, trao bằng tim**

Mushroomie là website thương mại điện tử B2C dành cho phụ kiện handmade và quà tặng cá nhân hóa: vòng tay, charm, móc khóa, vòng cổ, hộp quà cùng nhiều món nhỏ mang dấu ấn riêng.

[Khám phá Mushroomie](https://mushroomie.io.vn)

## Video giới thiệu

[![Xem video giới thiệu Mushroomie 16:9](docs/media/mushroomie-intro-16x9-preview.png)](docs/media/mushroomie-intro-43s-16x9.mp4)

[Xem hoặc tải video giới thiệu Mushroomie — 16:9, 43 giây](docs/media/mushroomie-intro-43s-16x9.mp4)

## Trải nghiệm chính

- Khám phá phụ kiện handmade theo danh mục, phong cách và sản phẩm nổi bật.
- Cá nhân hóa sản phẩm theo màu sắc, hạt, charm và thông điệp riêng.
- Giỏ hàng, đặt hàng, voucher, đánh giá và theo dõi đơn hàng.
- Thanh toán tích hợp PayOS/VietQR với kiểm tra dữ liệu phía máy chủ.
- Tin tức, câu chuyện thương hiệu và nội dung SEO địa phương.
- Mini game được tách riêng để không làm nặng trang chủ.
- Khu vực tài khoản khách hàng và hệ thống quản trị nội dung, sản phẩm, đơn hàng, media, voucher và người dùng.
- Giao diện responsive cho desktop và mobile.

## Công nghệ

- Next.js 16 App Router, React 19 và TypeScript 5.
- Tailwind CSS 4, GSAP và bộ nhận diện riêng của Mushroomie.
- Prisma 5 với MySQL.
- NextAuth 5 cho xác thực.
- PayOS/VietQR cho luồng thanh toán.
- Zustand, Zod, Sharp và các công cụ xử lý media.
- Vitest, Testing Library và Node test runner.
- PM2 và Nginx trên production hiện tại.

## Cấu trúc dự án

```text
src/app/          Trang, layout và API routes của Next.js
src/components/   Component giao diện dùng chung
src/lib/          Dịch vụ, xác thực, thanh toán và tiện ích
src/store/        Client state với Zustand
prisma/           Schema, migrations và seed
public/           Static assets và uploads công khai
scripts/          Công cụ vận hành, SEO và tối ưu media
tests/            Kiểm thử Node và integration
docs/             Hướng dẫn kỹ thuật và báo cáo đang sử dụng
```

## Chạy local

Yêu cầu khuyến nghị: Node.js 20 LTS hoặc mới hơn, npm và MySQL 8.

```bash
git clone https://github.com/tongminhquan/mushroomie-23.git
cd mushroomie-23
npm ci
```

Tạo `.env` cục bộ, tối thiểu có kết nối MySQL. Không commit tệp này:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE"
```

Các tích hợp xác thực, email và thanh toán cần thêm biến môi trường tương ứng của môi trường triển khai. Không sử dụng secret production cho máy phát triển.

```bash
npx prisma generate
npm run dev
```

Mặc định ứng dụng phát triển chạy tại `http://localhost:3000`.

## Kiểm tra chất lượng

```bash
npm run typecheck
npm test
npm run build
```

Build yêu cầu `DATABASE_URL` hợp lệ. Các script có khả năng thay đổi dữ liệu hoặc media phải được đọc kỹ và chạy dry-run/backup theo tài liệu vận hành trước khi dùng chế độ apply.

## Production

Production hiện chạy tại [mushroomie.io.vn](https://mushroomie.io.vn) bằng PM2 phía sau Nginx; không dùng Docker trong quy trình production hiện tại.

- [Hướng dẫn triển khai](deployment_guide.md)
- [Production runbook](production_runbook.md)
- [Production checklist](production_checklist.md)
- [Incident checklist](incident_checklist.md)
- [Hướng dẫn kiểm thử](docs/testing.md)

## Bảo mật

- Không commit `.env`, secret, token, mật khẩu, backup, database dump hoặc dữ liệu production.
- API quản trị phải kiểm tra quyền ở phía máy chủ.
- Tổng tiền, voucher và trạng thái thanh toán phải được xác thực lại trên server.
- Upload chỉ sử dụng định dạng ảnh được cho phép và URL công khai dạng `/uploads/<file>`.

## Giấy phép

Dự án thuộc Mushroomie. Vui lòng liên hệ chủ sở hữu trước khi sao chép hoặc phân phối mã nguồn, nội dung và tài sản thương hiệu.
```

- [ ] **Step 3: Verify README semantics and secret hygiene**

Run:

```powershell
$ErrorActionPreference = 'Stop'
$readme = Get-Content -Raw -Encoding UTF8 -LiteralPath 'README.md'
$required = @(
  'Làm bằng tay, trao bằng tim',
  'https://mushroomie.io.vn',
  'docs/media/mushroomie-intro-16x9-preview.png',
  'docs/media/mushroomie-intro-43s-16x9.mp4',
  'Next.js 16',
  'React 19',
  'PM2',
  'Nginx'
)
foreach ($value in $required) {
  if (-not $readme.Contains($value)) { throw "README missing: $value" }
}
$forbidden = @('Admin@123', 'user@mushroomie.vn', 'PAYMENT_API_KEY=', 'PAYMENT_WEBHOOK_SECRET=')
foreach ($value in $forbidden) {
  if ($readme.Contains($value)) { throw "README exposes forbidden content: $value" }
}
foreach ($path in @(
  'docs/media/mushroomie-intro-16x9-preview.png',
  'docs/media/mushroomie-intro-43s-16x9.mp4',
  'deployment_guide.md',
  'production_runbook.md',
  'production_checklist.md',
  'incident_checklist.md',
  'docs/testing.md'
)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Broken README target: $path" }
}
```

Expected: exit 0 and no output.

- [ ] **Step 4: Decode and inspect the media**

Run:

```powershell
$ErrorActionPreference = 'Stop'
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -show_entries format=duration,size -of json 'docs/media/mushroomie-intro-43s-16x9.mp4'
ffmpeg -v error -i 'docs/media/mushroomie-intro-43s-16x9.mp4' -map 0:v:0 -f null NUL
ffmpeg -v error -i 'docs/media/mushroomie-intro-43s-16x9.mp4' -map 0:a:0 -f null NUL
```

Expected: H.264 video, 1920×1080, approximately 43 seconds, video decode exit 0 and audio decode exit 0 with no error output. Open the PNG at original detail and confirm it is horizontal, legible and contains the complete domain/CTA.

- [ ] **Step 5: Commit Task 1**

Run:

```powershell
$ErrorActionPreference = 'Stop'
git diff --check -- README.md
git add -- README.md docs/media/mushroomie-intro-43s-16x9.mp4 docs/media/mushroomie-intro-16x9-preview.png
git diff --cached --check
git diff --cached --stat
git commit -m 'docs: add Mushroomie introduction video to README'
```

Expected: one commit containing only the README and two media files.

---

### Task 2: Remove option-2 files and repair repository references

**Files:**

- Delete: `video/mushroomie-website-intro/` (71 tracked files at the plan baseline)
- Delete: `artifacts/mushroomie-full-website-sitemap.png`
- Delete: `docs/reports/marketing/`
- Delete: the 19 pre-existing files under `docs/superpowers/plans/`, preserving this plan
- Delete: the 14 pre-existing files under `docs/superpowers/specs/`, preserving the active 2026-08-09 design
- Delete: `temp_html.txt`, `temp_html2.txt`, `test_svg.html`, `lighthouse-mobile.json`, `shopee_logo.txt`, `logo_facebook_1024.png`, `resize.ps1`
- Modify: `docs/reports/README.md`
- Modify: `tsconfig.json`

**Interfaces:**

- Consumes: the protected-path rules and exact allowlist in the design.
- Produces: a repository with no stale website dependency on the deleted Remotion subproject or Marketing report directory.

- [ ] **Step 1: Validate all destructive targets before deletion**

Run a PowerShell validation script that sets `$ErrorActionPreference = 'Stop'`, resolves the clone root, verifies every target begins with `$root + [IO.Path]::DirectorySeparatorChar`, verifies every target exists, and rejects any item carrying the `ReparsePoint` attribute. Validate the exact baseline counts: 71 files in `video/mushroomie-website-intro`, one artifact, two Marketing files, 19 historical plan files and 14 historical spec files.

The two files to preserve from the historical-document roots are:

```text
docs/superpowers/plans/2026-08-09-readme-video-repository-cleanup.md
docs/superpowers/specs/2026-08-09-readme-video-repository-cleanup-design.md
```

Expected: every target prints as validated; the protected media, `public/uploads`, `prisma/migrations`, `package-lock.json`, production documents and deploy configuration are not in the deletion list.

- [ ] **Step 2: Delete only the approved paths**

Use `Remove-Item -LiteralPath` on the validated exact files. For the Remotion, artifact and Marketing directories, delete their exact validated files first, then remove the now-empty exact directories without recursion. For historical plans/specs, enumerate the baseline tracked files and remove every exact file except the two active 2026-08-09 documents. Delete each root candidate by its exact name.

Expected: all allowlisted files are absent and the two active documents remain.

- [ ] **Step 3: Repair the report index and TypeScript configuration**

Use `apply_patch` to remove the full `## Marketing` section and its two bullet entries from `docs/reports/README.md`. Retain the title, purpose, SEO report, and repository hygiene paragraph.

Use `apply_patch` to remove only this exact entry from the `exclude` array in `tsconfig.json`:

```json
"video/mushroomie-website-intro",
```

Do not change the remaining exclusions.

- [ ] **Step 4: Prove deletion completeness and protected-path integrity**

Run:

```powershell
$ErrorActionPreference = 'Stop'
$mustBeAbsent = @(
  'video/mushroomie-website-intro',
  'artifacts/mushroomie-full-website-sitemap.png',
  'docs/reports/marketing',
  'temp_html.txt',
  'temp_html2.txt',
  'test_svg.html',
  'lighthouse-mobile.json',
  'shopee_logo.txt',
  'logo_facebook_1024.png',
  'resize.ps1'
)
foreach ($path in $mustBeAbsent) {
  if (Test-Path -LiteralPath $path) { throw "Approved target remains: $path" }
}
$mustRemain = @(
  'README.md',
  'docs/media/mushroomie-intro-43s-16x9.mp4',
  'docs/media/mushroomie-intro-16x9-preview.png',
  'docs/superpowers/plans/2026-08-09-readme-video-repository-cleanup.md',
  'docs/superpowers/specs/2026-08-09-readme-video-repository-cleanup-design.md',
  'docs/reports/seo/bao-cao-thu-hang-34-tu-khoa-seo-mushroomie-2026-07-28.docx',
  'package-lock.json',
  'prisma/schema.prisma',
  'deployment_guide.md',
  'production_runbook.md',
  'ecosystem.config.js'
)
foreach ($path in $mustRemain) {
  if (-not (Test-Path -LiteralPath $path)) { throw "Protected path missing: $path" }
}
if ((Get-ChildItem -LiteralPath 'docs/superpowers/plans' -File).Count -ne 1) { throw 'Unexpected plan file count' }
if ((Get-ChildItem -LiteralPath 'docs/superpowers/specs' -File).Count -ne 1) { throw 'Unexpected spec file count' }
```

Then search references outside historical deployment records:

```powershell
rg -n --hidden --glob '!.git/**' 'temp_html\.txt|temp_html2\.txt|test_svg\.html|lighthouse-mobile\.json|shopee_logo\.txt|logo_facebook_1024\.png|docs/reports/marketing|video/mushroomie-website-intro' .
```

Expected: only the active design/plan and the historical deployment report may describe the removed video path; no executable source or active config references a deleted file.

- [ ] **Step 5: Commit Task 2**

Run:

```powershell
$ErrorActionPreference = 'Stop'
git diff --check
git add -u -- .
git add -- docs/reports/README.md tsconfig.json docs/superpowers/plans/2026-08-09-readme-video-repository-cleanup.md
git diff --cached --check
git diff --cached --stat
git diff --cached --name-status
git commit -m 'chore: remove non-website repository artifacts'
```

Expected: the commit contains exactly the approved deletions plus `docs/reports/README.md`, `tsconfig.json`, and the active plan; it contains no deletion under protected paths.

---

### Task 3: Full verification, review and GitHub publication

**Files:**

- Verify: all branch changes from merge-base `891fb9d` to `HEAD`
- Create temporarily and remove before commit: PR body text file if required by `gh pr create --body-file`
- External state: remote branch, pull request and `main` after merge

**Interfaces:**

- Consumes: commits and reviewer approvals from Tasks 1 and 2.
- Produces: a verified public README and cleanup on GitHub `main`.

- [ ] **Step 1: Install exact website dependencies**

Run:

```powershell
$ErrorActionPreference = 'Stop'
npm ci
npx prisma generate
```

Expected: both commands exit 0; no lockfile change.

- [ ] **Step 2: Run fresh website quality gates**

Set a non-production test `DATABASE_URL` only for build configuration validation; do not print or commit any real credential. Run:

```powershell
$ErrorActionPreference = 'Stop'
npm run typecheck
npm test
npm run build
```

Expected: all commands exit 0. If build needs a reachable database or another external service beyond the configuration gate, record the exact failure without weakening or bypassing checks.

- [ ] **Step 3: Run final repository and media audit**

Run fresh:

```powershell
$ErrorActionPreference = 'Stop'
git diff --check 891fb9d..HEAD
git status --short --branch
Get-FileHash -Algorithm SHA256 -LiteralPath 'docs/media/mushroomie-intro-43s-16x9.mp4'
ffmpeg -v error -i 'docs/media/mushroomie-intro-43s-16x9.mp4' -map 0:v:0 -f null NUL
ffmpeg -v error -i 'docs/media/mushroomie-intro-43s-16x9.mp4' -map 0:a:0 -f null NUL
git diff --name-status 891fb9d..HEAD
```

Expected: clean worktree, exact approved video checksum, zero decode errors, and a diff limited to the active design/plan, README/media, exact deletions, report index and TypeScript reference cleanup.

- [ ] **Step 4: Obtain final whole-branch review**

Generate a review package from merge-base `891fb9d` to `HEAD`. The reviewer must verify both spec compliance and quality, including deletion allowlist, protected-path preservation, README accuracy, video/link integrity, security hygiene and test evidence. Resolve every Critical or Important finding and re-run its covering checks before proceeding.

- [ ] **Step 5: Push the feature branch and create a ready pull request**

Run:

```powershell
$ErrorActionPreference = 'Stop'
$prBodyPath = Join-Path (Get-Location) '.git/codex-pr-body.md'
git push -u origin codex/readme-video-repo-cleanup
gh pr create --base main --head codex/readme-video-repo-cleanup --title 'docs: refresh Mushroomie README and clean repository' --body-file $prBodyPath
```

The PR body must summarize the README/video, exact cleanup groups, protected content, typecheck/test/build results, video checksum and recovery note that deleted tracked files remain available in Git history. Remove the temporary PR body file after PR creation.

Expected: push succeeds and a non-draft pull request URL is returned.

- [ ] **Step 6: Confirm checks, merge and verify public main**

Run:

```powershell
$ErrorActionPreference = 'Stop'
$prNumber = gh pr view codex/readme-video-repo-cleanup --json number --jq '.number'
gh pr checks $prNumber --watch
gh pr merge $prNumber --squash --delete-branch
gh api repos/tongminhquan/mushroomie-23/contents/README.md?ref=main
gh api repos/tongminhquan/mushroomie-23/contents/docs/media/mushroomie-intro-43s-16x9.mp4?ref=main
```

Expected: required checks succeed, squash merge succeeds, `main` returns the new README and MP4 metadata, and the repository homepage uses the new README. If branch protection requires a human approval, stop before merge and report the ready PR rather than bypassing protection.

---

## Self-Review Results

- Spec coverage: every section of the 2026-08-09 design maps to Task 1, Task 2 or Task 3.
- Placeholder scan: no `TBD`, `TODO`, `implement later`, unspecified code step or unnamed test command remains. Runtime values such as the PR number are captured from preceding commands.
- Interface consistency: README media paths and the SHA-256 value are identical in all tasks; the two active superpowers documents are consistently excluded from historical-document deletion; merge-base and branch names are consistent.
- Destructive-scope check: no protected upload, database, migration, lockfile, deployment configuration or runbook appears in the deletion allowlist.

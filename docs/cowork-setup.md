# Cowork Setup — Mushroomie

Tài liệu onboarding cho thành viên cộng tác trên dự án (kèm hỗ trợ Claude Code).

## 1. Yêu cầu môi trường

- **Node.js** 20+ (khớp `@types/node: ^20`).
- **MySQL** đang chạy và truy cập được (Prisma dùng provider `mysql`).
- File **`.env`** ở thư mục gốc (bị `.gitignore` bỏ qua — **không commit**). Tối thiểu cần:
  - `DATABASE_URL` — chuỗi kết nối MySQL.
  - `AUTH_SECRET` / `NEXTAUTH_SECRET` — cho NextAuth v5 (beta).
  - Biến PayOS (thanh toán) và SMTP/nodemailer (email OTP) nếu chạy các tính năng tương ứng.

> Build vẫn chạy được khi thiếu `DATABASE_URL`; các route dữ liệu là dynamic nên được bỏ qua lúc build (xem mục Build bên dưới).

## 2. Cài đặt & chạy local

```bash
npm install
npm run db:push      # đồng bộ schema Prisma vào DB (xem cảnh báo ở /db-push)
npm run seed         # (tuỳ chọn) nạp dữ liệu mẫu
npm run dev          # chạy dev server
```

Các script khác trong `package.json`:

| Lệnh | Tác dụng |
|------|----------|
| `npm run build` | Build production (`next build --webpack`, giới hạn heap 2 GB) |
| `npm run start` | Chạy bản production đã build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Tạo & áp migration (giữ lịch sử) |
| `npm run db:studio` | Mở Prisma Studio |
| `npm run images:optimize` | Tối ưu ảnh upload sang WebP |

## 3. Lưu ý kỹ thuật riêng của dự án

- **Next.js 16.2.6 — bản tùy biến.** API/quy ước có thể khác với kiến thức mặc định. **Đọc guide trong `node_modules/next/dist/docs/` trước khi viết code** (xem `AGENTS.md`). Tôn trọng các thông báo deprecation.
- **Build không có `.env`:** các dòng `prisma:error ... Environment variable not found: DATABASE_URL` là **vô hại** — mọi route dữ liệu là dynamic (`ƒ`) nên bị bỏ qua khi build. Build chỉ thực sự lỗi khi exit code khác 0 hoặc có lỗi TypeScript.
- **`.gitignore`:** bỏ qua mọi `*.js` (trừ vài file config) và `*.sql`. Nếu thêm script JS mới cần commit, hãy thêm ngoại lệ tương ứng.

## 4. Quy ước branch & commit

- Branch mặc định để mở PR: **`main`**.
- Branch tính năng đặt tiền tố theo công cụ/người, ví dụ: `codex/<mô-tả-ngắn>`.
- Commit theo **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, …
  - Ví dụ thực tế trong lịch sử: `fix: add react-is for recharts build`, `feat: refresh homepage ...`.
- **Không** commit `.env`, file build, hay dữ liệu nhạy cảm.

## 5. Slash command cho Claude Code

Các command nằm trong `.claude/commands/` (commit kèm repo để cả nhóm dùng chung):

| Command | Tác dụng |
|---------|----------|
| `/build` | Build production và tóm tắt lỗi/route (đã biết bỏ qua `prisma:error` vô hại) |
| `/typecheck` | Chạy `tsc --noEmit` và báo lỗi kiểu |
| `/lint` | Chạy ESLint, gợi ý `--fix` (hỏi trước khi áp dụng) |
| `/db-push` | Đồng bộ schema vào DB — có cảnh báo data-loss/production |
| `/seed` | Nạp dữ liệu mẫu (chỉ dev/staging) |
| `/cowork` | Tóm tắt nhanh quy trình & lệnh (đọc chính tài liệu này) |

Gõ `/` trong Claude Code để xem danh sách. Mỗi command là một file `.md` trong `.claude/commands/` — sửa file đó để chỉnh hành vi cho cả nhóm.

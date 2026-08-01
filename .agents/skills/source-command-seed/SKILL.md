---
name: "source-command-seed"
description: "Nạp dữ liệu mẫu vào database (prisma seed)"
---

# source-command-seed

Use this skill when the user asks to run the migrated source command `seed`.

## Command Template

Chạy `npm run seed` để nạp dữ liệu mẫu (xem `prisma/seed.ts`).

⚠️ Chỉ chạy trên database **dev/staging**. KHÔNG chạy trên production vì có thể ghi đè/nhân bản dữ liệu. Nếu không chắc đang ở môi trường nào, hỏi trước.

Báo kết quả ngắn gọn sau khi chạy.

---
description: Build production (next build) và tóm tắt lỗi/route
allowed-tools: Bash(npm run build), Bash(npm run build:*)
---

Chạy lệnh build production của dự án:

```
npm run build
```

Sau khi chạy xong:

- Nếu build **thành công**: xác nhận ngắn gọn, liệt kê cảnh báo (warnings) nếu có.
- Nếu build **thất bại**: trích đúng đoạn lỗi (kèm `file:dòng`), giải thích nguyên nhân, đề xuất cách sửa. KHÔNG tự sửa code trừ khi được yêu cầu.

Lưu ý dành riêng cho dự án này: các dòng

```
prisma:error ... Environment variable not found: DATABASE_URL
```

khi build **không có** `.env` là **vô hại** — mọi route dữ liệu đều là dynamic (`ƒ`) nên Next.js bỏ qua chúng lúc build. Chỉ coi là lỗi thật khi build kết thúc với exit code khác 0, hoặc có lỗi TypeScript/biên dịch.

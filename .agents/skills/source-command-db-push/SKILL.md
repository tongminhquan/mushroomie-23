---
name: "source-command-db-push"
description: "Đồng bộ schema Prisma vào database (prisma db push)"
---

# source-command-db-push

Use this skill when the user asks to run the migrated source command `db-push`.

## Command Template

⚠️ Lệnh này **thay đổi schema của database thật**. Trước khi chạy:

1. Xác nhận đang trỏ tới **đúng** database — kiểm tra biến `DATABASE_URL` có tồn tại trong `.env`. **KHÔNG in giá trị bí mật** (mật khẩu/host) ra màn hình; chỉ xác nhận là đã được set.
2. Nếu nghi ngờ đây là database **production**, cảnh báo và hỏi người dùng trước.

Sau khi xác nhận, chạy:

```
npm run db:push
```

Báo kết quả. Nếu Prisma cảnh báo **mất dữ liệu** (data loss / drop column), DỪNG ngay và hỏi người dùng — không tự xác nhận.

Gợi ý: với thay đổi schema cần lưu lịch sử migration, cân nhắc `npm run db:migrate` thay vì `db:push`.

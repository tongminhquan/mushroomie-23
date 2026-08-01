---
name: "source-command-typecheck"
description: "Kiểm tra kiểu TypeScript (tsc --noEmit)"
---

# source-command-typecheck

Use this skill when the user asks to run the migrated source command `typecheck`.

## Command Template

Chạy `npm run typecheck` (tức `tsc --noEmit`) và báo cáo mọi lỗi kiểu.

Với mỗi lỗi: nêu `file:dòng`, giải thích ngắn gọn nguyên nhân, đề xuất cách sửa. Không tự sửa code trừ khi được yêu cầu rõ ràng.

Nếu không có lỗi, xác nhận "typecheck pass".

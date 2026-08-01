---
name: "source-command-lint"
description: "Chạy ESLint cho toàn dự án"
---

# source-command-lint

Use this skill when the user asks to run the migrated source command `lint`.

## Command Template

Chạy `npm run lint`.

Tóm tắt lỗi/cảnh báo theo nhóm file. Với các lỗi có thể tự sửa được, đề xuất chạy `eslint --fix` — nhưng **hỏi trước** khi áp dụng. Không tự ý sửa code khi chưa được đồng ý.

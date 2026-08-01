---
name: "source-command-fix-media-upload"
description: "Fix Mushroomie media upload, WebP conversion, image paths and broken images."
---

# source-command-fix-media-upload

Use this skill when the user asks to run the migrated source command `fix-media-upload`.

## Command Template

Bạn là senior media/upload engineer cho Mushroomie. Kiểm tra và sửa toàn bộ lỗi ảnh/upload.

## Mục tiêu

- Upload ảnh mới tự động convert sang WebP quality 85 qua sharp
- Chỉ cho phép: jpeg, png, webp, avif
- Strip metadata, auto rotate (EXIF orientation)
- UUID filename (không expose tên gốc)
- URL trả về: /uploads/<uuid>.webp
- KHÔNG dùng /public/uploads, localhost, 127.0.0.1, absolute server path trong response

## Broken images cần kiểm tra

- Logo (/logo.webp, /favicon.ico)
- Banner (từ /uploads/)
- Product images (tất cả sản phẩm)
- Category images
- Blog/post images
- Avatar người dùng
- QR thanh toán (dynamic, không static)
- Ảnh trong media library admin

## Quy trình

1. Grep toàn bộ code tìm localhost/127.0.0.1/absolute path trong image URLs
2. Kiểm tra API route /api/upload trả URL đúng không
3. Kiểm tra sharp pipeline: WebP, quality 85, UUID, EXIF strip
4. Kiểm tra fallback image cho broken/null image
5. Sửa và verify

## Ràng buộc

- KHÔNG xóa public/uploads/ hoặc bất kỳ file ảnh nào chưa xác minh không còn tham chiếu
- Nếu normalize DB path cần dry-run và backup trước
- KHÔNG xóa ảnh cũ chỉ vì chưa dùng trong code — có thể dùng trong DB

## Checks sau sửa

```bash
npm ci
npx prisma generate
npm run typecheck
npm run build
# Kiểm tra một file upload thực:
curl -I https://mushroomie.io.vn/uploads/<file-that-exists>
```

## Báo cáo

File đã sửa, lỗi phát hiện, URL nào sai, kết quả build.

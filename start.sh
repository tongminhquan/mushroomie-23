#!/bin/sh

# Đợi Database sẵn sàng (tùy chọn nhưng an toàn khi dùng docker-compose)
echo "Đang khởi tạo Prisma Client..."
npx prisma generate

echo "Đồng bộ Schema vào Database..."
npx prisma db push --accept-data-loss

echo "Khởi động Next.js Web Server..."
node server.js

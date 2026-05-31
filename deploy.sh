#!/bin/bash
echo "🚀 Đang triển khai Mushroomie..."

# Chuyển đến thư mục dự án
cd /var/www/mushroomie || exit

# Cập nhật mã nguồn
echo "📦 Kéo mã nguồn mới nhất từ Github..."
git pull origin main

# Cài đặt dependencies (nếu có thay đổi)
echo "📦 Cài đặt dependencies..."
npm install

# Build dự án
echo "🏗️ Đang build Next.js app..."
npm run build

# Xóa các file tĩnh cũ trong standalone
echo "🧹 Dọn dẹp cache cũ..."
rm -rf .next/standalone/.next/static
rm -rf .next/standalone/public

# Copy các file tĩnh mới sang standalone
echo "📂 Sao chép file tĩnh sang standalone..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Khởi động lại ứng dụng
echo "🔄 Khởi động lại PM2..."
pm2 restart mushroomie --update-env

echo "✅ Triển khai hoàn tất thành công!"

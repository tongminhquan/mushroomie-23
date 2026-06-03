#!/bin/bash
echo "🚀 Đang triển khai Mushroomie..."

# Chuyển đến thư mục dự án
cd /var/www/mushroomie || exit

# Cập nhật mã nguồn
echo "📦 Kéo mã nguồn mới nhất từ Github..."
git pull origin main

# Cài đặt dependencies (nếu có thay đổi)
echo "📦 Cài đặt dependencies..."
npm install --legacy-peer-deps

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
cp .env .next/standalone/.env

# Xóa thư mục uploads trống (nếu có) và tạo symlink
echo "🔗 Tạo liên kết cho thư mục uploads..."
rm -rf .next/standalone/public/uploads
ln -s /var/www/mushroomie/public/uploads /var/www/mushroomie/.next/standalone/public/uploads

# Khởi động lại ứng dụng
echo "🔄 Khởi động lại PM2..."
pm2 restart mushroomie --update-env

echo "✅ Triển khai hoàn tất thành công!"

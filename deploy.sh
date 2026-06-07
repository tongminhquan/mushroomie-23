#!/bin/bash
set -euo pipefail

echo "Đang triển khai Mushroomie..."

# Chuyển đến thư mục dự án
cd /var/www/mushroomie || exit

BUILD_DIR=".next-deploy"
RELEASE_DIR=".next-release"
CURRENT_DIR=".next/standalone"
PREVIOUS_DIR=".next/standalone.previous"

# Cập nhật mã nguồn
echo "Kéo mã nguồn mới nhất từ GitHub..."
git pull --ff-only origin main

# Cài đặt dependencies (nếu có thay đổi)
echo "Cài đặt dependencies..."
npm ci

echo "Cập nhật database và Prisma Client..."
npx prisma db push
npx prisma generate

# Build dự án
echo "Đang build Next.js app trong thư mục staging..."
rm -rf "$BUILD_DIR" "$RELEASE_DIR"
NODE_OPTIONS="--max-old-space-size=1024" NEXT_DIST_DIR="$BUILD_DIR" npm run build

# Chuẩn bị release hoàn chỉnh trước khi thay bản đang chạy.
echo "Chuẩn bị standalone release..."
mv "$BUILD_DIR/standalone" "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/$BUILD_DIR"
cp -a "$BUILD_DIR/static" "$RELEASE_DIR/$BUILD_DIR/static"
rm -rf "$RELEASE_DIR/public"
cp -a public "$RELEASE_DIR/public"
cp .env "$RELEASE_DIR/.env"

echo "Tạo liên kết cho thư mục uploads..."
rm -rf "$RELEASE_DIR/public/uploads"
ln -s /var/www/mushroomie/public/uploads "$RELEASE_DIR/public/uploads"

# Chỉ thay release hiện tại sau khi build và copy asset đều thành công.
echo "Kích hoạt release mới..."
rm -rf "$PREVIOUS_DIR"
if [ -d "$CURRENT_DIR" ]; then
  mv "$CURRENT_DIR" "$PREVIOUS_DIR"
fi
mv "$RELEASE_DIR" "$CURRENT_DIR"

# Khởi động lại ứng dụng
echo "Khởi động lại PM2..."
if ! pm2 restart mushroomie_pm2 --update-env; then
  echo "PM2 restart thất bại, khôi phục release trước..."
  rm -rf "$CURRENT_DIR"
  if [ -d "$PREVIOUS_DIR" ]; then
    mv "$PREVIOUS_DIR" "$CURRENT_DIR"
    pm2 restart mushroomie_pm2 --update-env
  fi
  exit 1
fi
pm2 save

rm -rf "$PREVIOUS_DIR" "$BUILD_DIR"

echo "Triển khai hoàn tất thành công."

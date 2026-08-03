#!/bin/bash
set -euo pipefail

echo "Đang triển khai Mushroomie..."

# Chuyển đến thư mục dự án
cd /var/www/mushroomie || exit

BUILD_DIR=".next-deploy"
RELEASE_DIR=".next-release"
CURRENT_DIR=".next/standalone"
PREVIOUS_DIR=".next/standalone.previous"
NGINX_STATIC_DIR=".next/static"
APP_ORIGIN="http://127.0.0.1:3001"
REQUIRED_PUBLIC_ASSETS=(
  "logo.webp"
  "favicon.ico"
  "favicon-16x16.png"
  "favicon-32x32.png"
  "apple-touch-icon.png"
)

verify_public_assets() {
  local public_dir="$1"
  local asset

  for asset in "${REQUIRED_PUBLIC_ASSETS[@]}"; do
    if [ ! -s "$public_dir/$asset" ]; then
      echo "Thiếu hoặc rỗng public asset bắt buộc: $public_dir/$asset" >&2
      return 1
    fi
  done
}

verify_runtime_asset() {
  local path="$1"
  local expected_type="$2"
  local headers

  headers="$(curl --fail --silent --show-error --head "$APP_ORIGIN/$path")" || return 1
  echo "$headers" | grep -Eiq "^content-type:[[:space:]]*$expected_type([;[:space:]]|$)"
}

rollback_release() {
  echo "Kiểm tra runtime thất bại, khôi phục release trước..."
  rm -rf "$CURRENT_DIR"
  if [ -d "$PREVIOUS_DIR" ]; then
    mv "$PREVIOUS_DIR" "$CURRENT_DIR"
    pm2 restart mushroomie_pm2 --update-env
  fi
}

# Cập nhật mã nguồn
echo "Kéo mã nguồn mới nhất từ GitHub..."
git pull --ff-only origin main

echo "Kiểm tra logo và favicon nguồn..."
verify_public_assets "public"

# Cài đặt dependencies (nếu có thay đổi)
echo "Cài đặt dependencies..."
npm ci --legacy-peer-deps

echo "Tạo Prisma Client từ schema hiện tại..."
npm exec prisma generate

echo "Kiểm tra kiểu dữ liệu và regression tests..."
npm run typecheck
npm test

echo "Cập nhật database..."
npm exec prisma db push

# Build dự án
echo "Đang build Next.js app trong thư mục staging..."
rm -rf "$BUILD_DIR" "$RELEASE_DIR"
npm run prebuild
NODE_OPTIONS="--max-old-space-size=1024" NEXT_DIST_DIR="$BUILD_DIR" npm exec -- next build --webpack

# Chuẩn bị release hoàn chỉnh trước khi thay bản đang chạy.
echo "Chuẩn bị standalone release..."
mv "$BUILD_DIR/standalone" "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR/$BUILD_DIR"
cp -a "$BUILD_DIR/static" "$RELEASE_DIR/$BUILD_DIR/static"
mkdir -p "$RELEASE_DIR/public"
cp -a public/. "$RELEASE_DIR/public/"
cp .env "$RELEASE_DIR/.env"

echo "Tạo liên kết cho thư mục uploads..."
rm -rf "$RELEASE_DIR/public/uploads"
ln -s /var/www/mushroomie/public/uploads "$RELEASE_DIR/public/uploads"

echo "Xác minh standalone assets trước khi kích hoạt..."
verify_public_assets "$RELEASE_DIR/public"
if [ ! -L "$RELEASE_DIR/public/uploads" ]; then
  echo "Standalone uploads không phải symbolic link an toàn." >&2
  exit 1
fi

# Chỉ thay release hiện tại sau khi build và copy asset đều thành công.
echo "Kích hoạt release mới..."
echo "Updating static assets for Nginx..."
mkdir -p "$NGINX_STATIC_DIR"
cp -a "$BUILD_DIR/static/." "$NGINX_STATIC_DIR/"

rm -rf "$PREVIOUS_DIR"
if [ -d "$CURRENT_DIR" ]; then
  mv "$CURRENT_DIR" "$PREVIOUS_DIR"
fi
mv "$RELEASE_DIR" "$CURRENT_DIR"

# Khởi động lại ứng dụng
echo "Khởi động lại PM2..."
if ! pm2 restart mushroomie_pm2 --update-env; then
  rollback_release
  exit 1
fi
pm2 save

echo "Kiểm tra logo và favicon trực tiếp trên Next.js origin..."
runtime_ready=false
for _ in {1..15}; do
  if verify_runtime_asset "logo.webp" "image/webp" \
    && verify_runtime_asset "favicon.ico" "image/(x-icon|vnd\\.microsoft\\.icon)"; then
    runtime_ready=true
    break
  fi
  sleep 1
done

if [ "$runtime_ready" != "true" ]; then
  rollback_release
  exit 1
fi

rm -rf "$PREVIOUS_DIR" "$BUILD_DIR"

echo "Triển khai hoàn tất thành công."

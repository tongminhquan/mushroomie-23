FROM node:20-alpine AS base

# Cài đặt thư viện OS cần thiết
RUN apk add --no-cache libc6-compat openssl

# Stage 1: Cài đặt dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Build project
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate prisma client để phục vụ quá trình build Next.js
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner (Image cuối cùng)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Tạo thư mục .next và phân quyền
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy public, prisma, và file khởi động
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/start.sh ./start.sh
COPY --from=builder /app/package.json ./package.json

# Copy standalone output từ Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cấp quyền thực thi cho start.sh
RUN chmod +x ./start.sh

# Cài đặt prisma CLI vào node_modules cục bộ để start.sh có thể chạy lệnh
RUN npm install prisma@5.22.0

# Chuyển quyền thư mục /app cho user nextjs (để prisma có thể tạo client trong node_modules)
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./start.sh"]

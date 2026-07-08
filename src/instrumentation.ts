/**
 * Next.js instrumentation — chạy MỘT LẦN khi server khởi động
 * (cả `next dev` lẫn standalone server.js trên production).
 *
 * Dùng để khởi động job xuất bản bài viết theo lịch (Đăng bài tự động).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamic import để tránh kéo Prisma vào edge runtime bundle.
    const { startScheduledPublisher } = await import('@/lib/scheduled-publisher')
    startScheduledPublisher()
  }
}

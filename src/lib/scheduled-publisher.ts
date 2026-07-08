import { prisma } from '@/lib/prisma'

/**
 * Bộ xuất bản bài viết theo lịch (tính năng "Đăng bài tự động").
 *
 * Bài viết có status = 'scheduled' và published_at <= hiện tại sẽ được
 * tự động chuyển sang 'published'. Job chạy trong instrumentation.ts
 * (register) — một lần mỗi server instance, tick mỗi 60 giây.
 */

const TICK_MS = 60_000

// Singleton guard: instrumentation có thể được nạp lại khi dev HMR,
// nên neo interval vào globalThis để không nhân đôi job.
const globalStore = globalThis as unknown as {
  __mushroomieScheduledPublisher?: ReturnType<typeof setInterval>
}

export async function publishDuePosts(): Promise<number> {
  try {
    const result = await prisma.post.updateMany({
      where: {
        status: 'scheduled',
        published_at: { lte: new Date() },
      },
      data: { status: 'published' },
    })
    if (result.count > 0) {
      console.log(`[scheduled-publisher] Đã tự động xuất bản ${result.count} bài viết`)
    }
    return result.count
  } catch (error) {
    // Không để job làm sập server — chỉ ghi log và thử lại ở tick sau.
    console.error('[scheduled-publisher] Lỗi khi xuất bản bài theo lịch:', error)
    return 0
  }
}

export function startScheduledPublisher() {
  if (globalStore.__mushroomieScheduledPublisher) return

  // Chạy ngay một lần lúc khởi động để không bỏ lỡ bài đến hạn khi server restart.
  void publishDuePosts()

  const timer = setInterval(() => { void publishDuePosts() }, TICK_MS)
  // Không giữ event loop sống chỉ vì job này (an toàn khi chạy script/test).
  timer.unref?.()
  globalStore.__mushroomieScheduledPublisher = timer

  console.log('[scheduled-publisher] Đã khởi động job xuất bản theo lịch (60s/tick)')
}

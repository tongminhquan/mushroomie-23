import { Prisma, type Post } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { releaseExpiredOrderReservations } from '@/lib/order-inventory'
import { recordAndRevalidatePublication } from '@/lib/seo-discovery/publication'
import { buildPublicContentUrl } from '@/lib/seo-discovery/urls'

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

export type ScheduledPublishedPost = Pick<Post, 'id' | 'slug' | 'updated_at'>

function isLostScheduledPublicationRace(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === 'P2025'
}

export async function publishDuePosts(): Promise<ScheduledPublishedPost[]> {
  const duePosts = await prisma.post.findMany({
    where: {
      status: 'scheduled',
      published_at: { lte: new Date() },
    },
    select: { id: true },
  })
  const publishedPosts: ScheduledPublishedPost[] = []

  for (const duePost of duePosts) {
    let publishedPost: ScheduledPublishedPost
    try {
      publishedPost = await prisma.post.update({
        where: { id: duePost.id, status: 'scheduled' },
        data: { status: 'published' },
        select: { id: true, slug: true, updated_at: true },
      })
    } catch (error) {
      if (isLostScheduledPublicationRace(error)) continue
      throw error
    }

    publishedPosts.push(publishedPost)
    await recordAndRevalidatePublication({
      source: 'post',
      sourceId: publishedPost.id,
      url: buildPublicContentUrl('post', publishedPost.slug),
      contentUpdatedAt: publishedPost.updated_at,
      reason: 'scheduled',
    })
  }

  if (publishedPosts.length > 0) {
    console.info(
      `[scheduled-publisher] Đã tự động xuất bản ${publishedPosts.length} bài viết`,
    )
  }

  return publishedPosts
}

async function runMaintenance() {
  try {
    await publishDuePosts()
  } catch (error) {
    // Không để một tick lỗi làm sập server; cron sẽ phản hồi 500 để được retry.
    console.error('[scheduled-publisher] Lỗi khi xuất bản bài theo lịch:', error)
  }
  try {
    const released = await releaseExpiredOrderReservations()
    if (released > 0) console.info(`[inventory] Released ${released} expired order reservations`)
  } catch (error) {
    console.error('[inventory] Failed to release expired order reservations:', error)
  }
}

export function startScheduledPublisher() {
  if (globalStore.__mushroomieScheduledPublisher) return

  // Chạy ngay một lần lúc khởi động để không bỏ lỡ bài đến hạn khi server restart.
  void runMaintenance()

  const timer = setInterval(() => { void runMaintenance() }, TICK_MS)
  // Không giữ event loop sống chỉ vì job này (an toàn khi chạy script/test).
  timer.unref?.()
  globalStore.__mushroomieScheduledPublisher = timer

  console.info('[scheduled-publisher] Đã khởi động job xuất bản theo lịch (60s/tick)')
}

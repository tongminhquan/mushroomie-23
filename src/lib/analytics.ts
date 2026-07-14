export interface AnalyticsItem {
  item_id: string
  item_name: string
  item_category?: string
  price?: number
  quantity?: number
}

type AnalyticsParams = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    mushroomieGoogleTagsConfigured?: boolean
  }
}

/**
 * gtag.js xử lý dataLayer tuần tự: một 'event' nằm TRƯỚC 'config' không có đích nào
 * để gửi tới và bị bỏ qua. Thẻ Google chỉ được cấu hình sau load + idle (xem
 * deferThirdPartyScript), nên event bắn sớm — ví dụ 'purchase' ngay khi khách quay
 * lại từ cổng thanh toán — phải xếp hàng chờ, không đẩy thẳng vào dataLayer.
 */
const POLL_MS = 250
const MAX_WAIT_MS = 30000

let pending: Array<[string, AnalyticsParams]> = []
let poller: number | undefined
let waitedMs = 0

function tagsReady() {
  return typeof window !== 'undefined' && Boolean(window.gtag && window.mushroomieGoogleTagsConfigured)
}

function flushPending() {
  const queued = pending
  pending = []
  queued.forEach(([event, params]) => window.gtag?.('event', event, params))
}

function stopPoller() {
  if (poller === undefined) return
  window.clearInterval(poller)
  poller = undefined
}

function waitForTags() {
  if (poller !== undefined) return
  waitedMs = 0
  poller = window.setInterval(() => {
    waitedMs += POLL_MS
    if (tagsReady()) {
      stopPoller()
      flushPending()
      return
    }
    // Thẻ không bao giờ nạp (bị chặn / mất mạng) — bỏ hàng chờ để không giữ mãi.
    if (waitedMs >= MAX_WAIT_MS) {
      stopPoller()
      pending = []
    }
  }, POLL_MS)
}

export function trackAnalyticsEvent(event: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []

  if (tagsReady()) {
    window.gtag?.('event', event, params)
    return
  }

  pending.push([event, params])
  waitForTags()
}

export function trackAnalyticsEventOnce(key: string, event: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return
  const storageKey = `mushroomie_analytics_${key}`

  try {
    if (window.sessionStorage.getItem(storageKey)) return
    window.sessionStorage.setItem(storageKey, '1')
  } catch {
    // Analytics must never interrupt the user flow when storage is unavailable.
  }

  trackAnalyticsEvent(event, params)
}

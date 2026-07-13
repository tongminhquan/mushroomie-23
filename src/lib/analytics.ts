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
  }
}

export function trackAnalyticsEvent(event: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  if (window.gtag) {
    window.gtag('event', event, params)
    return
  }
  window.dataLayer.push(['event', event, params])
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

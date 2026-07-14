/**
 * Hoãn nạp script bên thứ ba (GA4, Google Ads, GTM, Clarity) để không ảnh hưởng LCP.
 *
 * Mọi đường dẫn nạp đều nằm SAU sự kiện `load`, nên LCP (đã chốt trước đó) không bị ảnh hưởng.
 *
 * Có 2 đường kích hoạt, cái nào tới trước thì chạy:
 *  1. Người dùng tương tác (pointerdown/keydown) → nạp ngay, để gtag đọc được `gclid`
 *     trên URL đích trước khi họ chuyển trang (nếu trễ sẽ mất attribution quảng cáo).
 *  2. Fallback: sau `load` + idle (tối đa FALLBACK_TIMEOUT_MS) → nạp dù không ai tương tác.
 *
 * Fallback là bắt buộc: bot kiểm tra thẻ của Google render trang nhưng KHÔNG bấm/gõ.
 * Bản cũ chỉ nạp khi có tương tác nên Google báo "không phát hiện thấy thẻ Google",
 * và mọi khách thoát mà không bấm gì đều không được GA4/Ads ghi nhận.
 */
const FALLBACK_TIMEOUT_MS = 3000

export function deferThirdPartyScript(load: () => void) {
  let done = false
  let timer: number | undefined
  let idleId: number | undefined

  const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown']

  const cleanup = () => {
    events.forEach((event) => window.removeEventListener(event, run))
    window.removeEventListener('load', schedule)
    if (timer !== undefined) window.clearTimeout(timer)
    if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId)
    }
  }

  function run() {
    if (done) return
    done = true
    cleanup()
    load()
  }

  function schedule() {
    if (done) return
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(run, { timeout: FALLBACK_TIMEOUT_MS })
    } else {
      timer = window.setTimeout(run, FALLBACK_TIMEOUT_MS)
    }
  }

  events.forEach((event) => window.addEventListener(event, run, { once: true, passive: true }))

  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })

  return cleanup
}

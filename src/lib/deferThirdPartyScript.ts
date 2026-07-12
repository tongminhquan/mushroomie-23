const THIRD_PARTY_DELAY_MS = 8000

export function deferThirdPartyScript(load: () => void) {
  let timer: number | undefined
  let scheduled = false

  const schedule = () => {
    if (scheduled) return
    scheduled = true
    removeListeners()
    timer = window.setTimeout(load, THIRD_PARTY_DELAY_MS)
  }

  const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown']
  const removeListeners = () => {
    events.forEach((event) => window.removeEventListener(event, schedule))
  }

  events.forEach((event) => window.addEventListener(event, schedule, { once: true, passive: true }))

  return () => {
    removeListeners()
    if (timer !== undefined) window.clearTimeout(timer)
  }
}

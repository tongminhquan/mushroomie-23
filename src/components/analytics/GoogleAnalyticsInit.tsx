'use client'

import { useEffect } from 'react'

const GA_ID = 'G-R95TLDCP0W'

export default function GoogleAnalyticsInit() {
  useEffect(() => {
    let loaded = false

    const load = () => {
      if (loaded || document.querySelector(`script[data-ga-id="${GA_ID}"]`)) return
      loaded = true

      window.dataLayer = window.dataLayer || []
      const gtag = (...args: unknown[]) => window.dataLayer?.push(args)
      gtag('js', new Date())
      gtag('config', GA_ID)

      const script = document.createElement('script')
      script.async = true
      script.dataset.gaId = GA_ID
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
      document.head.appendChild(script)
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown']
    events.forEach((event) => window.addEventListener(event, load, { once: true, passive: true }))

    return () => events.forEach((event) => window.removeEventListener(event, load))
  }, [])

  return null
}

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

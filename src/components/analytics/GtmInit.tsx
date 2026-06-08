'use client'

import { useEffect } from 'react'

const GTM_ID = 'GTM-K55B6RVG'

export default function GtmInit() {
  useEffect(() => {
    let loaded = false

    const load = () => {
      if (loaded || document.querySelector(`script[data-gtm-id="${GTM_ID}"]`)) return
      loaded = true

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })

      const script = document.createElement('script')
      script.async = true
      script.dataset.gtmId = GTM_ID
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
      document.head.appendChild(script)
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll']
    events.forEach((event) => window.addEventListener(event, load, { once: true, passive: true }))

    return () => {
      events.forEach((event) => window.removeEventListener(event, load))
    }
  }, [])

  return null
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

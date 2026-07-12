'use client'

import { useEffect } from 'react'
import { deferThirdPartyScript } from '@/lib/deferThirdPartyScript'

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

    return deferThirdPartyScript(load)
  }, [])

  return null
}

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

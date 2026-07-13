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
      window.gtag = (...args: unknown[]) => window.dataLayer?.push(args)
      window.gtag('js', new Date())
      window.gtag('config', GA_ID)

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
    gtag?: (...args: unknown[]) => void
  }
}

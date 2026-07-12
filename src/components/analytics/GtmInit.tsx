'use client'

import { useEffect } from 'react'
import { deferThirdPartyScript } from '@/lib/deferThirdPartyScript'

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

    return deferThirdPartyScript(load)
  }, [])

  return null
}

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

'use client'

import { useEffect } from 'react'
import { deferThirdPartyScript } from '@/lib/deferThirdPartyScript'
import {
  GOOGLE_ADS_ID,
  GOOGLE_ANALYTICS_ID,
  configureGoogleTags,
} from '@/lib/google-tags'

export default function GoogleAnalyticsInit() {
  useEffect(() => {
    let loaded = false

    const load = () => {
      if (loaded) return
      loaded = true

      window.dataLayer = window.dataLayer || []
      const gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args))
      window.gtag = gtag

      if (!window.mushroomieGoogleTagsConfigured) {
        configureGoogleTags(gtag)
        window.mushroomieGoogleTagsConfigured = true
      }

      if (document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]')) return

      const script = document.createElement('script')
      script.async = true
      script.dataset.googleTagIds = `${GOOGLE_ANALYTICS_ID},${GOOGLE_ADS_ID}`
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`
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
    mushroomieGoogleTagsConfigured?: boolean
  }
}

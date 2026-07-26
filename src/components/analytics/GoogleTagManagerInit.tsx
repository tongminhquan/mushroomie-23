'use client'

import { useEffect } from 'react'
import { deferThirdPartyScript } from '@/lib/deferThirdPartyScript'
import {
  GOOGLE_TAG_MANAGER_ID,
  createGoogleTagManagerBootstrap,
} from '@/lib/google-tags'

export default function GoogleTagManagerInit() {
  useEffect(() => {
    let loaded = false

    const load = () => {
      if (loaded) return
      loaded = true

      window.dataLayer = window.dataLayer || []
      window.gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args))

      if (!window.mushroomieGoogleTagsConfigured) {
        window.dataLayer.push(createGoogleTagManagerBootstrap())
        window.mushroomieGoogleTagsConfigured = true
      }

      if (document.querySelector(`script[data-gtm-container="${GOOGLE_TAG_MANAGER_ID}"]`)) return

      const script = document.createElement('script')
      script.async = true
      script.dataset.gtmContainer = GOOGLE_TAG_MANAGER_ID
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_MANAGER_ID}`
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

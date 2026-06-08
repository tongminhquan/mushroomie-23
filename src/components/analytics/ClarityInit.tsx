'use client'

import { useEffect } from 'react'

const CLARITY_ID = 'wztywnpske'

export default function ClarityInit() {
  useEffect(() => {
    const startClarity = () => {
      if (document.querySelector(`script[data-clarity-id="${CLARITY_ID}"]`)) return

      window.setTimeout(() => {
        const script = document.createElement('script')
        script.async = true
        script.dataset.clarityId = CLARITY_ID
        script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`
        document.head.appendChild(script)
      }, 2500)
    }

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(startClarity, { timeout: 5000 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timer = globalThis.setTimeout(startClarity, 3500)
    return () => globalThis.clearTimeout(timer)
  }, [])

  return null
}

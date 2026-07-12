'use client'

import { useEffect } from 'react'

const CLARITY_ID = 'wztywnpske'

export default function ClarityInit() {
  useEffect(() => {
    const load = () => {
      if (document.querySelector(`script[data-clarity-id="${CLARITY_ID}"]`)) return

      const script = document.createElement('script')
      script.async = true
      script.dataset.clarityId = CLARITY_ID
      script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`
      document.head.appendChild(script)
    }

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown']
    events.forEach((event) => window.addEventListener(event, load, { once: true, passive: true }))

    return () => {
      events.forEach((event) => window.removeEventListener(event, load))
    }
  }, [])

  return null
}

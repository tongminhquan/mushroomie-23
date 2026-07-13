'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false })
const FloatingWidgets = dynamic(() => import('@/components/layout/FloatingWidgets'), { ssr: false })

export default function DeferredPublicWidgets() {
  const cartOpen = useCartStore((state) => state.isOpen)
  const [widgetsReady, setWidgetsReady] = useState(false)

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
      cancelIdleCallback?: (handle: number) => void
    }

    let idleId: number | undefined
    const timer = window.setTimeout(() => {
      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleId = idleWindow.requestIdleCallback(() => setWidgetsReady(true), { timeout: 2000 })
        return
      }
      setWidgetsReady(true)
    }, 5000)

    return () => {
      window.clearTimeout(timer)
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId)
    }
  }, [])

  return (
    <>
      {cartOpen && <CartDrawer />}
      {widgetsReady && <FloatingWidgets />}
    </>
  )
}

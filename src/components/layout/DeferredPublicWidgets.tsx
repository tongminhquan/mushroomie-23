'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart'

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false })
const FloatingWidgets = dynamic(() => import('@/components/layout/FloatingWidgets'), { ssr: false })

export default function DeferredPublicWidgets() {
  const cartOpen = useCartStore((state) => state.isOpen)
  const [widgetsReady, setWidgetsReady] = useState(false)
  /**
   * Vì sao không render thẳng `{cartOpen && <CartDrawer />}` như trước:
   *
   * Cách đó gỡ CartDrawer khỏi DOM ngay khoảnh khắc `cartOpen` thành false, nên
   * useDrawerTransition bên trong không còn phần tử nào để chạy hiệu ứng đóng — panel
   * biến mất phụt. Và ở lần mở đầu tiên, component mount khi `isOpen` đã là true nên
   * cũng chẳng có trạng thái đóng nào để trượt ra từ đó.
   *
   * Một khi đã cần tới, giữ luôn trong DOM: CartDrawer tự trả về null lúc đóng, việc
   * gắn/gỡ để hook quyết định. Vẫn giữ nguyên tính trì hoãn — chunk chỉ tải ở lần mở
   * đầu tiên hoặc khi trình duyệt rảnh, không đụng tới lúc tải trang.
   */
  const [cartNeeded, setCartNeeded] = useState(false)

  useEffect(() => {
    if (cartOpen) setCartNeeded(true)
  }, [cartOpen])

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
      {(cartNeeded || widgetsReady) && <CartDrawer />}
      {widgetsReady && <FloatingWidgets />}
    </>
  )
}

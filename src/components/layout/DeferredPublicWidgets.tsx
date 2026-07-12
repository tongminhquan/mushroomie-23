'use client'

import dynamic from 'next/dynamic'
import { useCartStore } from '@/store/cart'

const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), { ssr: false })
const FloatingWidgets = dynamic(() => import('@/components/layout/FloatingWidgets'), { ssr: false })

export default function DeferredPublicWidgets() {
  const cartOpen = useCartStore((state) => state.isOpen)

  return (
    <>
      {cartOpen && <CartDrawer />}
      <FloatingWidgets />
    </>
  )
}

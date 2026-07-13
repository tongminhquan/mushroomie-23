'use client'

import { useEffect } from 'react'
import { trackAnalyticsEventOnce } from '@/lib/analytics'

interface ProductViewTrackerProps {
  product: {
    id: number
    name: string
    category?: string | null
    price: number
  }
}

export default function ProductViewTracker({ product }: ProductViewTrackerProps) {
  useEffect(() => {
    trackAnalyticsEventOnce(`view_item_${product.id}`, 'view_item', {
      currency: 'VND',
      value: product.price,
      items: [{
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category || undefined,
        price: product.price,
        quantity: 1,
      }],
    })
  }, [product])

  return null
}

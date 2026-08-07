'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { trackAnalyticsEvent } from '@/lib/analytics'

interface ProductCardLinkProps {
  href: string
  itemId: number
  itemName: string
  categoryName?: string
  price: number
  className: string
  children: ReactNode
}

export default function ProductCardLink({
  href,
  itemId,
  itemName,
  categoryName,
  price,
  className,
  children,
}: ProductCardLinkProps) {
  const handleSelectItem = () => {
    trackAnalyticsEvent('select_item', {
      item_list_name: categoryName || 'Tất cả sản phẩm',
      items: [{
        item_id: String(itemId),
        item_name: itemName,
        item_category: categoryName,
        price,
      }],
    })
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={handleSelectItem}
      className={className}
    >
      {children}
    </Link>
  )
}

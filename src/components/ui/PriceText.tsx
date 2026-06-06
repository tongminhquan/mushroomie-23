import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function PriceText({
  price,
  originalPrice,
  className,
}: {
  price: number
  originalPrice?: number | null
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-baseline gap-2 tabular-nums', className)}>
      <strong className="text-xl text-primary">{formatPrice(price)}</strong>
      {originalPrice && originalPrice > price && (
        <span className="text-xs text-neutral-400 line-through">{formatPrice(originalPrice)}</span>
      )}
    </div>
  )
}

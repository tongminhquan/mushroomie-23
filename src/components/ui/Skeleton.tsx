import { cn } from '@/lib/utils'

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card">
      <div className="skeleton h-64 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-8 w-full" />
      </div>
    </div>
  )
}

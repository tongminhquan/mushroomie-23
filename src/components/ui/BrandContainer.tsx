import { cn } from '@/lib/cn'

export default function BrandContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('brand-container', className)}>{children}</div>
}

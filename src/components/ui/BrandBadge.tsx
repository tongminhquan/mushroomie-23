import { cn } from '@/lib/cn'

export default function BrandBadge({
  children,
  tone = 'red',
  className,
}: {
  children: React.ReactNode
  tone?: 'red' | 'pink' | 'yellow' | 'kraft' | 'neutral'
  className?: string
}) {
  const tones = {
    red: 'bg-primary text-white',
    pink: 'bg-pink text-brand-ink',
    yellow: 'bg-yellow text-brand-ink',
    kraft: 'bg-kraft text-white',
    neutral: 'border border-theme-border bg-theme-subtle text-theme-secondary',
  }

  return (
    <span className={cn('theme-transition inline-flex min-h-7 items-center rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]', tones[tone], className)}>
      {children}
    </span>
  )
}

import { cn } from '@/lib/utils'

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
    pink: 'bg-pink text-text',
    yellow: 'bg-yellow text-text',
    kraft: 'bg-kraft text-white',
    neutral: 'bg-white text-text border border-neutral-200',
  }

  return (
    <span className={cn('inline-flex min-h-7 items-center rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]', tones[tone], className)}>
      {children}
    </span>
  )
}

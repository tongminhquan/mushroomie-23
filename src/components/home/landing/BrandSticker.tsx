import { cn } from '@/lib/cn'

export default function BrandSticker({
  children,
  tone = 'cream',
  className,
}: {
  children: React.ReactNode
  tone?: 'cream' | 'pink' | 'yellow' | 'red' | 'white'
  className?: string
}) {
  const tones = {
    cream: 'border-kraft/20 bg-secondary text-text',
    pink: 'border-primary/10 bg-pink text-text',
    yellow: 'border-kraft/15 bg-yellow text-text',
    red: 'border-primary bg-primary text-white',
    white: 'border-white/35 bg-white text-primary',
  }

  return (
    <span className={cn(
      'inline-flex min-h-8 items-center rounded-lg border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] shadow-[0_4px_0_rgba(43,43,43,0.06)]',
      tones[tone],
      className,
    )}>
      {children}
    </span>
  )
}

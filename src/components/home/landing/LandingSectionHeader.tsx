import { cn } from '@/lib/utils'

export default function LandingSectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <header className={cn(
      'mb-8 max-w-3xl md:mb-11',
      align === 'center' && 'mx-auto text-center',
      className,
    )}>
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-primary">{eyebrow}</p>
      <h2 className="text-balance font-heading text-3xl leading-[1.12] text-text sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className={cn(
          'mt-4 max-w-2xl text-sm leading-7 text-neutral-500 md:text-base',
          align === 'center' && 'mx-auto',
        )}>
          {description}
        </p>
      )}
    </header>
  )
}

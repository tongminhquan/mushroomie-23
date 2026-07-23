import { cn } from '@/lib/cn'

export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-7 flex items-end justify-between gap-5 md:mb-9', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="brand-kicker mb-3">{eyebrow}</p>}
        <h2 className="text-balance font-heading text-2xl leading-[1.15] text-text md:text-4xl">{title}</h2>
        {description && <p className="mt-3 max-w-[60ch] text-sm leading-6 text-neutral-500 md:text-base">{description}</p>}
      </div>
      {action && <div className="hidden shrink-0 sm:block">{action}</div>}
    </div>
  )
}

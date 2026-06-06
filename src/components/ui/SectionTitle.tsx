import { cn } from '@/lib/utils'

interface SectionTitleProps {
  emoji?: string
  title: string
  subtitle?: string
  className?: string
  align?: 'left' | 'center'
  badge?: string
}

export default function SectionTitle({ emoji, title, subtitle, className, align = 'center', badge }: SectionTitleProps) {
  return (
    <div className={cn(align === 'center' ? 'text-center' : 'text-left', 'mb-8', className)}>
      {badge && (
        <div className={cn('inline-flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-md', align === 'center' && 'mx-auto')}>
          {emoji && <span>{emoji}</span>}
          {badge}
        </div>
      )}
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary uppercase tracking-wide">
        {!badge && emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h2>
      {subtitle && (
        <p className="text-neutral-500 text-sm md:text-base mt-2 max-w-xl mx-auto">{subtitle}</p>
      )}
    </div>
  )
}

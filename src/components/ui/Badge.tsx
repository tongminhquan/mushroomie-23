import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'handmade' | 'custom' | 'sale' | 'new' | 'status'
  className?: string
}

export default function Badge({ children, variant = 'handmade', className }: BadgeProps) {
  const variants = {
    handmade: 'bg-accent-mint text-neutral-700',
    custom: 'bg-primary-light text-primary',
    sale: 'bg-red-500 text-white',
    new: 'bg-accent-peach text-white',
    status: 'bg-neutral-100 text-neutral-700',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

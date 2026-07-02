import { cn } from '@/lib/utils'

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-warm-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">Mushroomie admin</p>
        <h1 className="font-heading text-2xl text-neutral-900 md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <section className={cn('rounded-[16px] border border-warm-border bg-white shadow-card', className)}>{children}</section>
}

export function AdminStatusBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const tones = {
    neutral: 'bg-neutral-100 text-neutral-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-800',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-sky-50 text-sky-700',
  }
  return <span className={cn('inline-flex rounded-md px-2 py-1 text-xs font-bold', tones[tone])}>{children}</span>
}

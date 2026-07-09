import { cn } from '@/lib/utils'

/**
 * Bộ UI dùng chung cho admin Mushroomie — tông handmade ấm áp:
 * kem #fff7f2, đỏ #e41d1d, kraft #b9794b, viền warm, bo góc mềm.
 * API giữ tương thích ngược; các prop mới đều tùy chọn.
 */

export function AdminPageHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  /** Emoji/sticker nhỏ đặt cạnh tiêu đề, vd "🍄" "🧸" "📦" */
  icon?: string
}) {
  return (
    <header className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
          <span aria-hidden>🍄</span> Mushroomie admin
        </p>
        <h1 className="font-heading text-2xl text-neutral-900 md:text-3xl">
          {icon && <span className="mr-2" aria-hidden>{icon}</span>}
          {title}
        </h1>
        {/* Gạch chân kiểu băng dính washi */}
        <div className="mt-2 h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,#e41d1d_0%,#ff6b6b_55%,#ffd6d6_100%)] opacity-80" aria-hidden />
        {description && <p className="mt-2 text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function AdminCard({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode
  className?: string
  /** Nhấc nhẹ card khi hover (chỉ transform/opacity — tôn trọng reduced-motion) */
  hover?: boolean
}) {
  return (
    <section
      className={cn(
        'rounded-[16px] border-[1.5px] border-warm-border bg-white shadow-card',
        hover && 'transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-hover motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function AdminStatusBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const tones = {
    neutral: 'bg-[#fff7f2] text-[#8a5635] ring-[#ecd9c9]',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-[#fff3d6] text-[#8a6a1f] ring-[#f0dc9e]',
    danger: 'bg-red-50 text-red-700 ring-red-200',
    info: 'bg-sky-50 text-sky-700 ring-sky-200',
  }
  const dots = {
    neutral: 'bg-[#b9794b]',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset', tones[tone])}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} aria-hidden />
      {children}
    </span>
  )
}

/** Empty state đồng bộ toàn admin: nấm + thông điệp + hành động gợi ý */
export function AdminEmptyState({
  emoji = '🍄',
  title,
  hint,
  action,
}: {
  emoji?: string
  title: string
  hint?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff7f2] text-2xl shadow-[inset_0_0_0_1.5px_#f0e0d6]" aria-hidden>
        {emoji}
      </div>
      <p className="text-sm font-semibold text-neutral-600">{title}</p>
      {hint && <p className="max-w-[420px] text-xs text-neutral-400">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

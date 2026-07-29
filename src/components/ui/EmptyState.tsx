interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({
  title = 'Chưa có nội dung',
  description = 'Nội dung sẽ xuất hiện tại đây khi sẵn sàng.',
  action,
}: EmptyStateProps) {
  return (
    <div className="theme-transition flex flex-col items-center justify-center rounded-[28px] border border-dashed border-theme-border bg-theme-card px-6 py-16 text-center text-theme-primary shadow-card">
      <div
        className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-primary-light text-2xl font-heading text-primary shadow-card"
        aria-hidden="true"
      >
        M
      </div>
      <h3 className="mb-2 font-heading text-xl font-bold text-theme-primary">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-theme-muted">{description}</p>
      {action}
    </div>
  )
}

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
    <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-warm-border bg-white px-6 py-16 text-center shadow-card">
      <div
        className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-primary-light text-2xl font-heading text-primary shadow-card"
        aria-hidden="true"
      >
        M
      </div>
      <h3 className="mb-2 font-heading text-xl font-bold text-neutral-800">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-neutral-500">{description}</p>
      {action}
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title = 'Chưa có nội dung', description = 'Nội dung sẽ xuất hiện tại đây khi sẵn sàng.', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white/70 px-4 py-16 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-pink text-3xl shadow-card" aria-hidden="true">🍄</div>
      <h3 className="font-heading text-xl font-bold text-neutral-700 mb-2">{title}</h3>
      <p className="text-neutral-500 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  )
}

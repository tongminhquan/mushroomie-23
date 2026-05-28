interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ title = 'Khong co gi o day', description = 'Thu tim kiem voi tu khoa khac nhe!', action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="text-6xl mb-4 animate-bounce">🍄</div>
      <h3 className="font-heading text-xl font-bold text-neutral-700 mb-2">{title}</h3>
      <p className="text-neutral-500 text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  )
}

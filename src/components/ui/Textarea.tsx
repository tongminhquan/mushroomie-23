import { cn } from '@/lib/cn'
import { forwardRef, TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const fieldId = id || props.name
    return (
      <div className="w-full">
        {label && <label htmlFor={fieldId} className="mb-2 block text-sm font-bold text-theme-secondary">{label}</label>}
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            'theme-transition w-full resize-y rounded-xl border bg-theme-input px-4 py-3 text-sm leading-6 text-theme-primary outline-none',
            'border-theme-border hover:border-theme-border-strong focus:border-primary focus:ring-4 focus:ring-primary/10',
            error && 'border-red-400 bg-red-50/40',
            className,
          )}
          {...props}
        />
        {error ? <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p> : hint && <p className="mt-1.5 text-xs text-theme-muted">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
export default Textarea

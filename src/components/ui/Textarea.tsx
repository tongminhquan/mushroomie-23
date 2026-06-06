import { cn } from '@/lib/utils'
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
        {label && <label htmlFor={fieldId} className="mb-2 block text-sm font-bold text-neutral-700">{label}</label>}
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            'w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 outline-none',
            'border-neutral-200 hover:border-neutral-300 focus:border-primary focus:ring-4 focus:ring-primary/10',
            error && 'border-red-400 bg-red-50/40',
            className,
          )}
          {...props}
        />
        {error ? <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p> : hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
export default Textarea

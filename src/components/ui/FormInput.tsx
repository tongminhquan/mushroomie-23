import { cn } from '@/lib/cn'
import { forwardRef, InputHTMLAttributes } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-theme-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'theme-transition w-full rounded-xl border px-4 py-3 font-body text-sm text-theme-primary outline-none',
            'focus:border-primary focus:ring-4 focus:ring-primary/10',
            'placeholder:text-theme-muted',
            error
              ? 'border-red-300 bg-red-50/50'
              : 'border-theme-border bg-theme-input hover:border-theme-border-strong',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-theme-muted">{hint}</p>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
export default FormInput

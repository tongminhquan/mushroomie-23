import { cn } from '@/lib/utils'
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
          <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border px-4 py-3 text-sm font-body outline-none',
            'focus:border-primary focus:ring-4 focus:ring-primary/10 transition-colors',
            'placeholder:text-neutral-400',
            error
              ? 'border-red-300 bg-red-50/50'
              : 'border-neutral-200 bg-white hover:border-neutral-300',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
export default FormInput

import { cn } from '@/lib/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  { className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref
) => {
  const variants = {
    primary: 'bg-primary text-white shadow-[0_10px_24px_rgba(228,29,29,0.22)] hover:bg-primary-dark hover:-translate-y-0.5',
    secondary: 'bg-pink text-text hover:bg-primary hover:text-white',
    outline: 'border-[1.5px] border-primary bg-white text-primary hover:bg-primary hover:text-white',
    ghost: 'text-primary hover:bg-primary-light',
  }
  const sizes = {
    sm: 'min-h-10 px-4 py-2 text-sm',
    md: 'min-h-11 px-5 py-2.5 text-sm',
    lg: 'min-h-12 px-7 py-3 text-base',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang xử lý...
        </>
      ) : children}
    </button>
  )
})
Button.displayName = 'Button'
export default Button

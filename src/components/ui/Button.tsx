import { cn } from '@/lib/utils'
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
    primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md hover:-translate-y-0.5',
    secondary: 'bg-primary-light text-primary hover:bg-primary hover:text-white',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
    ghost: 'text-primary hover:bg-primary-light',
  }
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' }
  return (
    <button ref={ref} disabled={disabled || isLoading}
      className={cn('inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
      {...props}>
      {isLoading ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Dang xu ly...</>) : children}
    </button>
  )
})
Button.displayName = 'Button'
export default Button

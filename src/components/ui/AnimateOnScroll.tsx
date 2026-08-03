'use client'
import { useEffect, useRef, useState, ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface AnimateOnScrollProps {
  children: ReactNode
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'fade'
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

export default function AnimateOnScroll({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
  once = true,
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  // SSR và hydration phải luôn hiển thị nội dung. Chỉ ẩn phần tử đã xác nhận nằm
  // ngoài viewport sau khi JavaScript chạy; nếu observer/hydration lỗi, trang vẫn đọc được.
  const [isVisible, setIsVisible] = useState(true)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      setIsVisible(true)
      return
    }

    // If already in viewport on mount, show immediately (no flash of invisible content)
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight - 40 && rect.bottom > 0) {
      setIsVisible(true)
      return
    }

    setIsVisible(false)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once, reduced])

  // Khi người dùng bật giảm chuyển động, nội dung giữ trạng thái ổn định và không
  // chạy cả dịch chuyển lẫn fade.
  const baseStyles: React.CSSProperties = {
    transitionProperty: reduced ? 'opacity' : 'opacity, transform',
    transitionDuration: reduced ? '0ms' : `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: reduced ? '0ms' : `${delay}ms`,
  }

  const hiddenStyles: Record<string, React.CSSProperties> = reduced
    ? {
        'fade-up': { opacity: 0 },
        'fade-down': { opacity: 0 },
        'fade-left': { opacity: 0 },
        'fade-right': { opacity: 0 },
        'zoom-in': { opacity: 0 },
        'fade': { opacity: 0 },
      }
    : {
        'fade-up': { opacity: 0, transform: 'translateY(40px)' },
        'fade-down': { opacity: 0, transform: 'translateY(-40px)' },
        'fade-left': { opacity: 0, transform: 'translateX(-40px)' },
        'fade-right': { opacity: 0, transform: 'translateX(40px)' },
        'zoom-in': { opacity: 0, transform: 'scale(0.92)' },
        'fade': { opacity: 0, transform: 'none' },
      }

  const visibleStyle: React.CSSProperties = { opacity: 1, transform: 'none' }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...baseStyles,
        ...(isVisible ? visibleStyle : hiddenStyles[animation]),
      }}
    >
      {children}
    </div>
  )
}

export function StaggerChildren({
  children,
  animation = 'fade-up',
  staggerDelay = 100,
  baseDelay = 0,
  duration = 600,
  className = '',
}: {
  children: ReactNode[]
  animation?: AnimateOnScrollProps['animation']
  staggerDelay?: number
  baseDelay?: number
  duration?: number
  className?: string
}) {
  return (
    <>
      {children.map((child, i) => (
        <AnimateOnScroll
          key={i}
          animation={animation}
          delay={baseDelay + i * staggerDelay}
          duration={duration}
          className={className}
        >
          {child}
        </AnimateOnScroll>
      ))}
    </>
  )
}

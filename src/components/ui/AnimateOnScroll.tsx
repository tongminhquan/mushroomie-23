'use client'
import { useEffect, useRef, useState, ReactNode } from 'react'

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
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

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
  }, [once])

  const baseStyles: React.CSSProperties = {
    transitionProperty: 'opacity, transform',
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: `${delay}ms`,
  }

  const hiddenStyles: Record<string, React.CSSProperties> = {
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

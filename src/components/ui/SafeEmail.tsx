'use client'

import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'

interface SafeEmailProps {
  email: string
  className?: string
  showIcon?: boolean
}

export default function SafeEmail({ email, className, showIcon = false }: SafeEmailProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Khi chưa mount (render ở server), render một span an toàn không chứa chữ '@' hay 'mailto'
  if (!mounted) {
    return (
      <span className={className}>
        {showIcon && <Mail size={12} className="mr-1.5 inline" />}
        Email: cskh(at)mushroomie.io.vn
      </span>
    )
  }

  // Khi đã mount (render ở client), render thẻ a mailto bình thường
  return (
    <a href={`mailto:${email}`} className={className}>
      {showIcon && <Mail size={12} className="mr-1.5 inline" />}
      {email}
    </a>
  )
}

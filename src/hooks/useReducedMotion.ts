'use client'

import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Đọc thiết lập "giảm chuyển động" của hệ điều hành.
 *
 * CSS tự xử lý được phần hoạt ảnh khai báo bằng stylesheet, nhưng chuyển động do JS
 * điều khiển (IntersectionObserver, GSAP, canvas) thì media query không chạm tới —
 * phải hỏi qua matchMedia.
 *
 * Khởi tạo `false` (tức là có chuyển động) rồi đồng bộ lại trong effect: giá trị này
 * chỉ tồn tại phía client, đọc lúc render SSR sẽ gây lệch hydration.
 *
 * Có lắng nghe sự kiện `change` vì người dùng bật/tắt thiết lập trong hệ điều hành mà
 * trang không reload; thiếu listener thì trang giữ nguyên trạng thái cũ.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mq = window.matchMedia(QUERY)
    const sync = () => setReduced(mq.matches)

    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

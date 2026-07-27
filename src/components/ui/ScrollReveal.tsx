'use client'

import { useEffect } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Cho các phần tử mang `data-reveal` hiện dần lên khi cuộn tới.
 *
 * Vì sao làm theo kiểu quan sát thuộc tính thay vì bọc mỗi khối bằng một component:
 * template trang địa phương là server component với 10 `<section>` liền mạch. Bọc từng
 * cái sẽ thêm 10 client component và 10 thẻ div, đổi cấu trúc DOM và có nguy cơ phá
 * layout. Ở đây chỉ cần thêm một thuộc tính, DOM giữ nguyên.
 *
 * An toàn khi JS lỗi: HTML trả về từ server hiển thị đầy đủ. Trạng thái ẩn chỉ được
 * gắn sau khi component này chạy được — nếu JS không chạy, nội dung vẫn hiện bình
 * thường thay vì biến mất vĩnh viễn. Đây cũng là lý do không đặt trạng thái ẩn trong
 * CSS tĩnh.
 */
export default function ScrollReveal() {
  const reduced = useReducedMotion()

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (targets.length === 0) return

    // Bật giảm chuyển động: hiện luôn, không ẩn rồi trượt lên.
    if (reduced) {
      for (const el of targets) el.removeAttribute('data-m-reveal')
      return
    }

    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          el.dataset.mReveal = 'shown'
          observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )

    for (const el of targets) {
      el.classList.add('m-reveal')

      // Phần tử đã nằm trong khung nhìn ngay lúc tải thì hiện luôn — nếu ẩn rồi mới
      // trượt lên sẽ thành một cú giật ngay khi mở trang, và làm hỏng LCP.
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.dataset.mReveal = 'shown'
        continue
      }

      el.dataset.mReveal = 'hidden'
      observer.observe(el)
    }

    return () => observer.disconnect()
  }, [reduced])

  return null
}

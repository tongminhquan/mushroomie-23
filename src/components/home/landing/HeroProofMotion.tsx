'use client'

import { useEffect, useRef } from 'react'

/**
 * Hoạt ảnh xuất hiện lần lượt cho dải 4 điểm tin cậy dưới hero trang chủ.
 *
 * GSAP được nạp ĐỘNG (`await import('gsap')`) và chỉ ở component này. Thư viện nặng
 * ~23KB gzip; nạp tĩnh sẽ cộng vào bundle của cả 54 trang, trong khi chỉ trang chủ
 * dùng tới. Nạp động đẩy nó sang một chunk riêng, tải sau khi trang đã tương tác được
 * nên không ảnh hưởng LCP.
 *
 * Dùng `gsap.matchMedia()` thay vì tự đọc matchMedia: GSAP tự hoàn tác đúng phần
 * animation khi người dùng đổi thiết lập hệ điều hành giữa chừng, không cần dọn tay.
 */
export default function HeroProofMotion({ targetId }: { targetId: string }) {
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    let revert: (() => void) | undefined
    let cancelled = false

    const run = async () => {
      const container = document.getElementById(targetId)
      if (!container) return

      const items = container.children
      if (items.length === 0) return

      const { gsap } = await import('gsap')
      if (cancelled) return

      const mm = gsap.matchMedia()

      mm.add(
        {
          motionOK: '(prefers-reduced-motion: no-preference)',
          motionReduce: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { motionOK } = ctx.conditions as { motionOK: boolean }

          if (motionOK) {
            gsap.from(items, {
              y: 18,
              opacity: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
            })
          } else {
            // Tầng 2: bỏ dịch chuyển, chỉ còn một nhịp fade ngắn.
            gsap.from(items, {
              opacity: 0,
              duration: 0.15,
              stagger: 0.03,
              clearProps: 'opacity',
            })
          }
        },
      )

      revert = () => mm.revert()
    }

    void run()

    return () => {
      cancelled = true
      revert?.()
    }
  }, [targetId])

  return null
}

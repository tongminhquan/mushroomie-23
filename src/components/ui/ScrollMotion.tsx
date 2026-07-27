'use client'

import { useEffect, useRef } from 'react'

/**
 * Hiệu ứng cuộn mạnh cho các trang public: parallax nền, thanh tiến trình đọc bài,
 * và hiện theo cụm cho lưới thẻ.
 *
 * Ba quyết định kỹ thuật đáng ghi lại:
 *
 * 1. GSAP + ScrollTrigger nạp ĐỘNG, và chỉ ở component này. Nạp tĩnh sẽ kéo ~34KB gzip
 *    vào bundle của cả 54 trang; nạp động đẩy sang chunk riêng, tải sau hydration nên
 *    không đụng tới LCP.
 *
 * 2. Parallax là chuyển động Tầng 1 (gợi chiều sâu, gây chóng mặt) — khi người dùng bật
 *    giảm chuyển động thì KHÔNG khởi tạo ScrollTrigger nào cả, chứ không phải khởi tạo
 *    rồi đặt biên độ bằng 0. Media query CSS không với tới GSAP nên phải chặn ở đây.
 *
 * 3. Dùng `ScrollTrigger.batch` thay vì một trigger cho mỗi thẻ: batch gom các phần tử
 *    cùng vào khung nhìn trong một khoảng ngắn rồi chạy chung một stagger — mượt hơn và
 *    ít instance hơn hẳn so với 12 trigger rời cho 12 thẻ sản phẩm.
 */
export default function ScrollMotion() {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    let cleanup: (() => void) | undefined
    let cancelled = false

    const run = async () => {
      // Tầng 1: không dựng gì cả khi người dùng yêu cầu giảm chuyển động.
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

      const hasWork =
        document.querySelector('[data-parallax]') ||
        document.querySelector('[data-scroll-progress]') ||
        document.querySelector('[data-batch-reveal]')
      if (!hasWork) return

      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return

      gsap.registerPlugin(ScrollTrigger)
      const ctx = gsap.context(() => {
        // --- Parallax: nền trôi chậm hơn nội dung ---
        // data-parallax nhận cường độ 0..1 (mặc định 0.3). Chỉ dịch theo trục Y và
        // dùng yPercent để biên độ tự co giãn theo chiều cao phần tử.
        for (const el of document.querySelectorAll<HTMLElement>('[data-parallax]')) {
          const strength = Number(el.dataset.parallax) || 0.3
          el.classList.add('m-parallax')

          gsap.fromTo(
            el,
            { yPercent: -strength * 12 },
            {
              yPercent: strength * 12,
              ease: 'none',
              scrollTrigger: {
                trigger: el.parentElement ?? el,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          )
        }

        // --- Thanh tiến trình đọc: gắn vào chiều dài bài viết ---
        for (const bar of document.querySelectorAll<HTMLElement>('[data-scroll-progress]')) {
          const targetSelector = bar.dataset.scrollProgress
          const target = targetSelector ? document.querySelector(targetSelector) : document.body
          if (!target) continue

          gsap.fromTo(
            bar,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: 'none',
              transformOrigin: 'left center',
              scrollTrigger: { trigger: target, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
            },
          )
        }

        // --- Hiện theo cụm cho lưới thẻ ---
        const batchTargets = document.querySelectorAll<HTMLElement>('[data-batch-reveal] > *')
        if (batchTargets.length > 0) {
          gsap.set(batchTargets, { opacity: 0, y: 28 })
          ScrollTrigger.batch(batchTargets, {
            start: 'top 88%',
            once: true,
            batchMax: 6,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.07,
                ease: 'power3.out',
                overwrite: true,
                clearProps: 'transform,opacity',
              }),
          })
        }
      })

      // Ảnh tải xong làm đổi chiều cao trang → mốc start/end của ScrollTrigger lệch.
      // Resize được GSAP tự xử lý, ảnh thì không.
      const onLoad = () => ScrollTrigger.refresh()
      window.addEventListener('load', onLoad)

      cleanup = () => {
        window.removeEventListener('load', onLoad)
        ctx.revert()
      }
    }

    void run()

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return null
}

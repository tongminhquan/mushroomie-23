'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export type DrawerState = 'entering' | 'open' | 'exiting'

/**
 * Giữ panel ở lại trong DOM đủ lâu để chạy hiệu ứng đóng.
 *
 * Vấn đề: các drawer viết kiểu `if (!isOpen) return null` sẽ biến mất ngay lập tức khi
 * đóng — không có gì còn lại để animate. Đó là lý do giỏ hàng hiện tại bật/tắt cụt lủn.
 * Hook này tách "trạng thái người dùng muốn" (isOpen) khỏi "trạng thái thực tế trong
 * DOM" (mounted), rồi trì hoãn việc gỡ bỏ đúng bằng thời lượng hiệu ứng.
 *
 * Không dùng Framer Motion: AnimatePresence giải quyết đúng bài toán này nhưng kéo theo
 * ~40KB cho một panel. Hook này khoảng 30 dòng và không phụ thuộc gì.
 *
 * Chi tiết dễ sai: khi mở, phần tử phải render MỘT khung hình ở trạng thái đóng
 * (ngoài màn hình) rồi mới lật sang mở — nếu đặt luôn trạng thái mở thì trình duyệt
 * không có gì để nội suy và panel xuất hiện tức thì. Dùng hai lớp requestAnimationFrame
 * để chắc chắn kiểu dáng ban đầu đã được áp trước khi đổi.
 */
export function useDrawerTransition(isOpen: boolean, durationMs = 280) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(isOpen)
  /**
   * Mount lúc đã mở sẵn thì vẫn phải bắt đầu ở 'entering', không phải 'open'.
   *
   * Panel nạp động (CartDrawer qua next/dynamic) chỉ xuất hiện SAU khi người dùng bấm
   * mở, nên lần render đầu tiên của nó đã có isOpen = true. Khởi tạo thẳng bằng 'open'
   * làm khung hình đầu tiên vẽ ngay ở vị trí cuối — trình duyệt không còn khoảng nào
   * để nội suy và panel hiện tức thì, không trượt.
   *
   * Với panel mount lúc đang đóng (menu, tìm kiếm) thì không đổi gì: isOpen = false
   * nên vẫn là 'exiting' như cũ.
   */
  const [state, setState] = useState<DrawerState>(isOpen ? 'entering' : 'exiting')

  useEffect(() => {
    // Giảm chuyển động: bỏ qua toàn bộ phần trì hoãn, đóng/mở tức thì.
    if (reduced) {
      setMounted(isOpen)
      setState(isOpen ? 'open' : 'exiting')
      return
    }

    if (isOpen) {
      setMounted(true)
      setState('entering')

      let inner = 0
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setState('open'))
      })
      return () => {
        cancelAnimationFrame(outer)
        cancelAnimationFrame(inner)
      }
    }

    // Đang mở → đóng: chạy hiệu ứng trước, gỡ khỏi DOM sau.
    setState('exiting')
    const timer = setTimeout(() => setMounted(false), durationMs)
    return () => clearTimeout(timer)
  }, [isOpen, durationMs, reduced])

  return { mounted, state }
}

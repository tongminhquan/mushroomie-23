'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_GIFT_WRAP_FEE,
  giftWrapFeeValueSchema,
  type GiftWrapSnapshot,
} from '@/lib/gift-wrap'

const POLL_INTERVAL_MS = 5_000

export interface GiftWrapUpdateNotice {
  previousFee: number
  currentFee: number
}

function parseGiftWrapSnapshot(value: unknown): GiftWrapSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error('GIFT_WRAP_LOAD_FAILED')
  }

  const candidate = value as Record<string, unknown>
  const fee = giftWrapFeeValueSchema.safeParse(candidate.fee)
  if (!fee.success || typeof candidate.enabled !== 'boolean' || typeof candidate.updatedAt !== 'string') {
    throw new Error('GIFT_WRAP_LOAD_FAILED')
  }

  return {
    enabled: candidate.enabled,
    fee: fee.data,
    updatedAt: candidate.updatedAt,
  }
}

/**
 * Theo dõi giá gói quà theo thời gian thực (poll 5s khi tab đang hiển thị),
 * để admin đổi giá là khách thấy ngay thay vì chỉ phát hiện lúc đặt hàng.
 */
export function useGiftWrap({ poll = true }: { poll?: boolean } = {}) {
  const [snapshot, setSnapshot] = useState<GiftWrapSnapshot>({
    enabled: true,
    fee: DEFAULT_GIFT_WRAP_FEE,
    updatedAt: '',
  })
  const [isReady, setIsReady] = useState(false)
  const [notice, setNotice] = useState<GiftWrapUpdateNotice | null>(null)
  const feeRef = useRef<number | null>(null)
  const requestSequence = useRef(0)
  const isFetching = useRef(false)

  const applySnapshot = useCallback((next: GiftWrapSnapshot) => {
    if (feeRef.current !== null && feeRef.current !== next.fee) {
      setNotice({ previousFee: feeRef.current, currentFee: next.fee })
    }
    feeRef.current = next.fee
    setSnapshot(next)
    setIsReady(true)
  }, [])

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (isFetching.current) return
    isFetching.current = true
    const requestId = ++requestSequence.current
    try {
      const response = await fetch('/api/gift-wrap', {
        cache: 'no-store',
        signal,
      })
      if (!response.ok) throw new Error('GIFT_WRAP_LOAD_FAILED')

      const next = parseGiftWrapSnapshot(await response.json())
      if (requestId === requestSequence.current) applySnapshot(next)
    } finally {
      isFetching.current = false
    }
  }, [applySnapshot])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal).catch(() => setIsReady(true))

    // Trang sản phẩm chỉ cần giá lúc mở trang (poll=false) — tránh mọi khách xem
    // hàng đều gọi API 5 giây/lần. Chỉ trang thanh toán mới cần theo dõi liên tục.
    if (!poll) {
      return () => controller.abort()
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh(controller.signal).catch(() => undefined)
      }
    }, POLL_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh(controller.signal).catch(() => undefined)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      controller.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refresh, poll])

  /** Nhận mức phí server trả về khi đơn bị từ chối vì giá vừa đổi. */
  const acceptServerFee = useCallback((fee: number) => {
    const parsed = giftWrapFeeValueSchema.safeParse(fee)
    if (!parsed.success) return

    requestSequence.current += 1
    applySnapshot({
      enabled: true,
      fee: parsed.data,
      updatedAt: new Date().toISOString(),
    })
  }, [applySnapshot])

  const dismissNotice = useCallback(() => setNotice(null), [])

  return {
    ...snapshot,
    isReady,
    notice,
    refresh,
    acceptServerFee,
    dismissNotice,
  }
}

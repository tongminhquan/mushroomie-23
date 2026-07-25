'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SHIPPING_FEE,
  createShippingFeeUpdateNotice,
  shippingFeeValueSchema,
  type ShippingFeeSnapshot,
  type ShippingFeeUpdateNotice,
} from '@/lib/shipping-fee'

const POLL_INTERVAL_MS = 5_000

function parseShippingFeeSnapshot(value: unknown): ShippingFeeSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error('SHIPPING_FEE_LOAD_FAILED')
  }

  const candidate = value as Record<string, unknown>
  const shippingFee = shippingFeeValueSchema.safeParse(candidate.shippingFee)
  if (!shippingFee.success || typeof candidate.updatedAt !== 'string') {
    throw new Error('SHIPPING_FEE_LOAD_FAILED')
  }

  return {
    shippingFee: shippingFee.data,
    updatedAt: candidate.updatedAt,
  }
}

export function useShippingFee() {
  const [snapshot, setSnapshot] = useState<ShippingFeeSnapshot>({
    shippingFee: DEFAULT_SHIPPING_FEE,
    updatedAt: '',
  })
  const [isReady, setIsReady] = useState(false)
  const [notice, setNotice] = useState<ShippingFeeUpdateNotice | null>(null)
  const feeRef = useRef<number | null>(null)
  const requestSequence = useRef(0)
  const isFetching = useRef(false)

  const applySnapshot = useCallback((next: ShippingFeeSnapshot) => {
    const nextNotice = createShippingFeeUpdateNotice(feeRef.current, next.shippingFee)
    if (nextNotice) setNotice(nextNotice)
    feeRef.current = next.shippingFee
    setSnapshot(next)
    setIsReady(true)
  }, [])

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (isFetching.current) return
    isFetching.current = true
    const requestId = ++requestSequence.current
    try {
      const response = await fetch('/api/shipping-fee', {
        cache: 'no-store',
        signal,
      })
      if (!response.ok) throw new Error('SHIPPING_FEE_LOAD_FAILED')

      const next = parseShippingFeeSnapshot(await response.json())
      if (requestId === requestSequence.current) applySnapshot(next)
    } finally {
      isFetching.current = false
    }
  }, [applySnapshot])

  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal).catch(() => setIsReady(true))

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
  }, [refresh])

  const acceptServerFee = useCallback((shippingFee: number) => {
    const parsed = shippingFeeValueSchema.safeParse(shippingFee)
    if (!parsed.success) return

    requestSequence.current += 1
    applySnapshot({
      shippingFee: parsed.data,
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

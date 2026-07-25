import { z } from 'zod'

export const DEFAULT_SHIPPING_FEE = 30_000
export const MAX_SHIPPING_FEE = 1_000_000
export const DEFAULT_SHIPPING_FEE_UPDATED_AT = '1970-01-01T00:00:00.000Z'

export const shippingFeeValueSchema = z.number().int().min(0).max(MAX_SHIPPING_FEE)

export interface ShippingFeeSnapshot {
  shippingFee: number
  updatedAt: string
}

export interface ShippingFeeUpdateNotice {
  previousFee: number
  currentFee: number
}

export interface ShippingFeeConflict {
  code: 'SHIPPING_FEE_CHANGED'
  shippingFee: number
  message: string
}

export function normalizeShippingFee(value: unknown): number {
  const normalizedValue = typeof value === 'string'
    ? (/^\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN)
    : value

  const parsed = shippingFeeValueSchema.safeParse(normalizedValue)
  return parsed.success ? parsed.data : DEFAULT_SHIPPING_FEE
}

export function createShippingFeeConflict(
  expectedFee: number | null | undefined,
  currentFee: number,
): ShippingFeeConflict | null {
  if (expectedFee === currentFee) return null

  return {
    code: 'SHIPPING_FEE_CHANGED',
    shippingFee: currentFee,
    message: expectedFee == null
      ? 'Phí vận chuyển đã được cập nhật. Vui lòng tải lại trang để kiểm tra tổng tiền.'
      : 'Phí vận chuyển vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.',
  }
}

export function createShippingFeeUpdateNotice(
  previousFee: number | null,
  currentFee: number,
): ShippingFeeUpdateNotice | null {
  if (previousFee === null || previousFee === currentFee) return null
  return { previousFee, currentFee }
}

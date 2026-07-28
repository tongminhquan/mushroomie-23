import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GIFT_WRAP_FEE,
  MAX_GIFT_MESSAGE_LENGTH,
  createGiftWrapFeeConflict,
  createGiftWrapUnavailable,
  normalizeGiftMessage,
  normalizeGiftWrapEnabled,
  normalizeGiftWrapFee,
  resolveGiftWrapFee,
} from '@/lib/gift-wrap'
import { resolveOrderDeletionPolicy } from '@/lib/order-deletion'
import {
  analyzeProductSlugNormalization,
  decodeProductSlug,
  generateSlug,
  getProductSlugLookupCandidates,
  normalizeProductSlugInput,
} from '@/lib/product-slug'
import {
  DEFAULT_SHIPPING_FEE,
  createShippingFeeConflict,
  createShippingFeeUpdateNotice,
  normalizeShippingFee,
  shippingFeeValueSchema,
} from '@/lib/shipping-fee'

describe('live commerce settings', () => {
  it('normalizes shipping fees and rejects invalid persisted values', () => {
    expect(normalizeShippingFee('25000')).toBe(25_000)
    expect(normalizeShippingFee(0)).toBe(0)
    for (const value of ['', 'abc', '1000.5', '-1', '1000001', null, undefined]) {
      expect(normalizeShippingFee(value)).toBe(DEFAULT_SHIPPING_FEE)
    }
    expect(shippingFeeValueSchema.safeParse(0).success).toBe(true)
    expect(shippingFeeValueSchema.safeParse(1_000_000).success).toBe(true)
    expect(shippingFeeValueSchema.safeParse(-1).success).toBe(false)
    expect(shippingFeeValueSchema.safeParse(10.5).success).toBe(false)
  })

  it('reports shipping conflicts and notices only when a reviewed fee changes', () => {
    expect(createShippingFeeConflict(25_000, 25_000)).toBeNull()
    expect(createShippingFeeConflict(30_000, 25_000)).toMatchObject({
      code: 'SHIPPING_FEE_CHANGED',
      shippingFee: 25_000,
    })
    expect(createShippingFeeConflict(undefined, 25_000)?.message).toContain('tải lại')
    expect(createShippingFeeUpdateNotice(null, 25_000)).toBeNull()
    expect(createShippingFeeUpdateNotice(25_000, 25_000)).toBeNull()
    expect(createShippingFeeUpdateNotice(30_000, 25_000)).toEqual({
      previousFee: 30_000,
      currentFee: 25_000,
    })
  })

  it('normalizes gift-wrap settings and charges only an enabled requested service', () => {
    expect(normalizeGiftWrapFee('25000')).toBe(25_000)
    expect(normalizeGiftWrapFee(0)).toBe(0)
    expect(normalizeGiftWrapFee('abc')).toBe(DEFAULT_GIFT_WRAP_FEE)
    expect(normalizeGiftWrapFee(-5)).toBe(DEFAULT_GIFT_WRAP_FEE)
    expect(normalizeGiftWrapFee(null)).toBe(DEFAULT_GIFT_WRAP_FEE)

    expect(normalizeGiftWrapEnabled(undefined)).toBe(true)
    expect(normalizeGiftWrapEnabled('true')).toBe(true)
    expect(normalizeGiftWrapEnabled('false')).toBe(false)
    expect(normalizeGiftWrapEnabled(false)).toBe(false)

    expect(resolveGiftWrapFee(true, { enabled: true, fee: 15_000 })).toBe(15_000)
    expect(resolveGiftWrapFee(false, { enabled: true, fee: 15_000 })).toBe(0)
    expect(resolveGiftWrapFee(undefined, { enabled: true, fee: 15_000 })).toBe(0)
    expect(resolveGiftWrapFee(true, { enabled: false, fee: 15_000 })).toBe(0)
  })

  it('normalizes handwritten notes and detects gift-wrap conflicts safely', () => {
    expect(normalizeGiftMessage('  Chúc mừng sinh nhật  ')).toBe('Chúc mừng sinh nhật')
    expect(normalizeGiftMessage('   ')).toBeNull()
    expect(normalizeGiftMessage(undefined)).toBeNull()
    expect(normalizeGiftMessage(123)).toBeNull()
    expect(normalizeGiftMessage('a'.repeat(900))?.length).toBe(MAX_GIFT_MESSAGE_LENGTH)

    expect(createGiftWrapFeeConflict(false, 10_000, 20_000)).toBeNull()
    expect(createGiftWrapFeeConflict(undefined, undefined, 20_000)).toBeNull()
    expect(createGiftWrapFeeConflict(true, 20_000, 20_000)).toBeNull()
    expect(createGiftWrapFeeConflict(true, 10_000, 20_000)).toMatchObject({
      code: 'GIFT_WRAP_FEE_CHANGED',
      giftWrapFee: 20_000,
    })
    expect(createGiftWrapFeeConflict(true, undefined, 20_000)?.message).toContain('tải lại')
    expect(createGiftWrapUnavailable(true, { enabled: true })).toBeNull()
    expect(createGiftWrapUnavailable(false, { enabled: false })).toBeNull()
    expect(createGiftWrapUnavailable(true, { enabled: false })?.code).toBe('GIFT_WRAP_UNAVAILABLE')
  })
})

describe('product slug rules', () => {
  it('generates, decodes, and resolves safe lookup candidates', () => {
    expect(generateSlug('  ĐỒNG HỒ ĐỎ -- Cá Tính  ')).toBe('dong-ho-do-ca-tinh')
    expect(generateSlug('--- Vòng @ tay___custom ---')).toBe('vong-taycustom')
    expect(generateSlug('🔥✨')).toBe('')
    expect(decodeProductSlug('%E0%A4%A')).toBe('%E0%A4%A')
    expect(getProductSlugLookupCandidates('Vòng-Tay-%C4%90%E1%BB%8F')).toEqual([
      'Vòng-Tay-Đỏ',
      'Vòng-Tay-%C4%90%E1%BB%8F',
      'vong-tay-do',
    ])
    expect(getProductSlugLookupCandidates('vong-tay-do')).toEqual(['vong-tay-do'])
  })

  it('normalizes editor input and reports unsafe migration collisions', () => {
    expect(normalizeProductSlugInput('  VÒNG---ĐỎ  ', 'Tên khác')).toBe('vong-do')
    expect(normalizeProductSlugInput('', 'Vòng tay tên riêng')).toBe('vong-tay-ten-rieng')
    expect(normalizeProductSlugInput('🔥', 'Tên hợp lệ')).toBeNull()
    expect(normalizeProductSlugInput(undefined, '✨')).toBeNull()

    const unsafe = analyzeProductSlugNormalization([
      { id: 30, name: 'Vòng tay', slug: 'VÒNG TAY' },
      { id: 20, name: 'Vòng tay', slug: 'Vòng-tay' },
      { id: 40, name: 'Emoji', slug: '🔥' },
      { id: 10, name: 'Canonical', slug: 'vong-tay' },
      { id: 50, name: '✨', slug: '✨' },
    ])
    expect(unsafe.collisions).toHaveLength(1)
    expect(unsafe.nonRedirectable).toEqual([
      { id: 40, from: '🔥', to: 'emoji' },
      { id: 50, from: '✨', to: 'san-pham-50' },
    ])
    expect(unsafe.safeToApply).toBe(false)

    const safe = analyzeProductSlugNormalization([
      { id: 1, name: 'Vòng táo', slug: 'Vòng-táo' },
      { id: 2, name: 'Vòng xanh', slug: 'vong-xanh' },
    ])
    expect(safe.changes).toEqual([{ id: 1, from: 'Vòng-táo', to: 'vong-tao' }])
    expect(safe.safeToApply).toBe(true)
  })
})

describe('order deletion policy', () => {
  it('preserves paid, refunded, shipping, and completed financial records', () => {
    for (const paymentStatus of ['PAID', 'REFUNDED']) {
      expect(resolveOrderDeletionPolicy({
        paymentStatus,
        orderStatus: 'PROCESSING',
        inventoryReserved: true,
      })).toMatchObject({ canDelete: false, shouldRestoreInventory: false })
    }
    for (const orderStatus of ['SHIPPING', 'COMPLETED']) {
      expect(resolveOrderDeletionPolicy({
        paymentStatus: 'PENDING',
        orderStatus,
        inventoryReserved: true,
      })).toMatchObject({ canDelete: false, shouldRestoreInventory: false })
    }
  })

  it('restores inventory only for deletable non-cancelled reservations', () => {
    expect(resolveOrderDeletionPolicy({
      paymentStatus: 'PENDING',
      orderStatus: 'PROCESSING',
      inventoryReserved: true,
    })).toEqual({ canDelete: true, shouldRestoreInventory: true, reason: null })
    expect(resolveOrderDeletionPolicy({
      paymentStatus: null,
      orderStatus: 'CANCELLED',
      inventoryReserved: true,
    })).toEqual({ canDelete: true, shouldRestoreInventory: false, reason: null })
  })
})

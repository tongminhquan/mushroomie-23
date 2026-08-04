import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  orderFindMany: vi.fn(),
  orderFindUnique: vi.fn(),
  orderUpdateMany: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentUpdateMany: vi.fn(),
  productUpdate: vi.fn(),
  voucherUpdateMany: vi.fn(),
  historyCreate: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findMany: mocks.orderFindMany },
    $transaction: mocks.transaction,
  },
}))

import { releaseExpiredOrderReservations } from '@/lib/order-inventory'

describe('expired order reservation release', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))

    const candidate = {
      id: 99,
      order_status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
      inventory_reserved_at: new Date('2026-07-19T11:00:00Z'),
      created_at: new Date('2026-07-19T11:00:00Z'),
      items: [{ product_id: 10, quantity: 2 }],
      payment: {
        id: 4,
        status: 'PENDING',
        expires_at: new Date('2026-07-19T11:30:00Z'),
      },
    }

    mocks.orderFindMany.mockResolvedValue([candidate])
    mocks.orderFindUnique.mockResolvedValue(candidate)
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 })
    mocks.paymentFindUnique.mockResolvedValue(candidate.payment)
    mocks.paymentUpdateMany.mockResolvedValue({ count: 1 })
    mocks.productUpdate.mockResolvedValue({})
    mocks.voucherUpdateMany.mockResolvedValue({ count: 1 })
    mocks.historyCreate.mockResolvedValue({})
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      order: {
        findUnique: mocks.orderFindUnique,
        updateMany: mocks.orderUpdateMany,
      },
      payment: {
        findUnique: mocks.paymentFindUnique,
        updateMany: mocks.paymentUpdateMany,
      },
      product: { update: mocks.productUpdate },
      userVoucher: { updateMany: mocks.voucherUpdateMany },
      orderStatusHistory: { create: mocks.historyCreate },
    }))
  })

  it('does not cancel or release inventory when a webhook wins the expiry claim', async () => {
    mocks.paymentUpdateMany.mockResolvedValue({ count: 0 })

    await expect(releaseExpiredOrderReservations()).resolves.toBe(0)

    expect(mocks.orderUpdateMany).toHaveBeenCalledTimes(1)
    expect(mocks.productUpdate).not.toHaveBeenCalled()
    expect(mocks.voucherUpdateMany).not.toHaveBeenCalled()
    expect(mocks.historyCreate).not.toHaveBeenCalled()
  })

  it('expires and releases a reserved order exactly once when the expiry claim succeeds', async () => {
    await expect(releaseExpiredOrderReservations()).resolves.toBe(1)

    expect(mocks.paymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 4, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })
    expect(mocks.orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 99,
        order_status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        inventory_reserved_at: { not: null },
      },
      data: { order_status: 'CANCELLED', inventory_reserved_at: null },
    })
    expect(mocks.productUpdate).toHaveBeenCalledTimes(1)
    expect(mocks.voucherUpdateMany).toHaveBeenCalledTimes(1)
    expect(mocks.historyCreate).toHaveBeenCalledTimes(1)
  })

  it('does not cancel when a fresh payment is created after the candidate snapshot', async () => {
    mocks.orderFindMany.mockResolvedValue([{
      id: 99,
      order_status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
      inventory_reserved_at: new Date('2026-07-19T11:00:00Z'),
      created_at: new Date('2026-07-19T11:00:00Z'),
      items: [{ product_id: 10, quantity: 2 }],
      payment: null,
    }])
    mocks.paymentFindUnique.mockResolvedValue({
      id: 5,
      status: 'PENDING',
      expires_at: new Date('2026-07-19T12:30:00Z'),
    })

    await expect(releaseExpiredOrderReservations()).resolves.toBe(0)

    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled()
    expect(mocks.productUpdate).not.toHaveBeenCalled()
    expect(mocks.voucherUpdateMany).not.toHaveBeenCalled()
    expect(mocks.historyCreate).not.toHaveBeenCalled()
  })

  it('does not expire or cancel after the order advances out of pending payment', async () => {
    mocks.orderUpdateMany.mockResolvedValue({ count: 0 })

    await expect(releaseExpiredOrderReservations()).resolves.toBe(0)

    expect(mocks.paymentFindUnique).not.toHaveBeenCalled()
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled()
    expect(mocks.productUpdate).not.toHaveBeenCalled()
    expect(mocks.voucherUpdateMany).not.toHaveBeenCalled()
    expect(mocks.historyCreate).not.toHaveBeenCalled()
  })
})

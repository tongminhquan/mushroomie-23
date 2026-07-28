import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: { userVoucher: { findFirst: mocks.findFirst } } }))

import { POST as applyVoucher } from '@/app/api/checkout/apply-voucher/route'
import { POST as removeVoucher } from '@/app/api/checkout/remove-voucher/route'

function request(body: unknown) {
  return new NextRequest('https://mushroomie.test/api/checkout/apply-voucher', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('checkout voucher routes', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ user: { id: '7' } })
  })

  it('requires authentication before querying a user voucher', async () => {
    mocks.auth.mockResolvedValue(null)
    const response = await applyVoucher(request({ userVoucherId: 'uv-1', subtotal: 100_000 }))

    expect(response.status).toBe(401)
    expect(mocks.findFirst).not.toHaveBeenCalled()
    expect((await removeVoucher()).status).toBe(401)
  })

  it('rejects malformed and unavailable vouchers', async () => {
    expect((await applyVoucher(request({ userVoucherId: 1, subtotal: -1 }))).status).toBe(400)

    mocks.findFirst.mockResolvedValue(null)
    const unavailable = await applyVoucher(request({ userVoucherId: 'uv-1', subtotal: 100_000 }))
    expect(unavailable.status).toBe(400)
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'uv-1', userId: 7, status: 'AVAILABLE' }),
    }))
  })

  it('enforces minimum order value before calculating a discount', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'uv-1', expiresAt: null,
      voucher: { code: 'MINIMUM', minOrderValue: 200_000, discountType: 'FIXED', discountValue: 10_000 },
    })

    expect((await applyVoucher(request({ userVoucherId: 'uv-1', subtotal: 100_000 }))).status).toBe(400)
  })

  it('caps percentage discounts by template maximum and subtotal', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 'uv-1', expiresAt: new Date('2099-01-01'),
      voucher: { code: 'HALF', minOrderValue: 0, discountType: 'PERCENT', discountValue: 50, maxDiscount: 20_000 },
    })

    const response = await applyVoucher(request({ userVoucherId: 'uv-1', subtotal: 100_000 }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ voucher: { id: 'uv-1', code: 'HALF', discountAmount: 20_000 } })

    mocks.findFirst.mockResolvedValue({
      id: 'uv-2', expiresAt: null,
      voucher: { code: 'FIXED', minOrderValue: 0, discountType: 'FIXED', discountValue: 200_000 },
    })
    expect(await (await applyVoucher(request({ userVoucherId: 'uv-2', subtotal: 80_000 }))).json())
      .toMatchObject({ voucher: { discountAmount: 80_000 } })
  })

  it('removes the client-side voucher marker for an authenticated user', async () => {
    const response = await removeVoucher()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })
})

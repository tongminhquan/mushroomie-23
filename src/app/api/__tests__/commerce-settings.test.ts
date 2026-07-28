import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  transaction: vi.fn(),
  settingFindMany: vi.fn(),
  settingUpsert: vi.fn(),
  adminLogCreate: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    setting: { findMany: mocks.settingFindMany },
    $transaction: mocks.transaction,
  },
}))

import {
  GET as getAdminGiftWrap,
  PATCH as updateGiftWrap,
} from '@/app/api/admin/gift-wrap/route'
import { PATCH as updateShippingFee } from '@/app/api/admin/shipping-fee/route'
import { GET as getGiftWrap } from '@/app/api/gift-wrap/route'
import { GET as getShippingFee } from '@/app/api/shipping-fee/route'

function patchRequest(path: string, body: unknown) {
  return new NextRequest(`https://mushroomie.test${path}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(body),
  })
}

const persistedSettings = [
  { key: 'default_shipping_fee', value: '30000' },
  { key: 'shipping_fee_updated_at', value: '2026-07-19T00:00:00.000Z' },
  { key: 'gift_wrap_enabled', value: 'true' },
  { key: 'gift_wrap_fee', value: '15000' },
  { key: 'gift_wrap_updated_at', value: '2026-07-19T00:00:00.000Z' },
]

describe('live shipping and gift-wrap settings routes', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ user: { id: '1', role: 'admin' } })
    mocks.settingFindMany.mockResolvedValue(persistedSettings)
    mocks.settingUpsert.mockResolvedValue({})
    mocks.adminLogCreate.mockResolvedValue({})
    mocks.transaction.mockImplementation((callback) => callback({
      setting: {
        findMany: mocks.settingFindMany,
        upsert: mocks.settingUpsert,
      },
      adminLog: { create: mocks.adminLogCreate },
    }))
  })

  it('serves current public snapshots without caching', async () => {
    const shipping = await getShippingFee()
    expect(shipping.status).toBe(200)
    expect(shipping.headers.get('cache-control')).toBe('no-store')
    expect(await shipping.json()).toMatchObject({ shippingFee: 30_000 })

    const giftWrap = await getGiftWrap()
    expect(giftWrap.status).toBe(200)
    expect(giftWrap.headers.get('cache-control')).toBe('no-store')
    expect(await giftWrap.json()).toMatchObject({ enabled: true, fee: 15_000 })
  })

  it('allows an admin viewer to read gift-wrap settings', async () => {
    mocks.auth.mockResolvedValue({ user: { id: '2', role: 'viewer' } })
    const response = await getAdminGiftWrap()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ enabled: true, fee: 15_000 })
  })

  it('rejects anonymous and read-only writes before starting a transaction', async () => {
    mocks.auth.mockResolvedValueOnce(null)
    expect((await updateShippingFee(
      patchRequest('/api/admin/shipping-fee', { shippingFee: 35_000 }),
    )).status).toBe(401)

    mocks.auth.mockResolvedValueOnce({ user: { id: '2', role: 'viewer' } })
    expect((await updateGiftWrap(
      patchRequest('/api/admin/gift-wrap', { fee: 20_000, enabled: false }),
    )).status).toBe(401)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('strictly validates both update payloads', async () => {
    expect((await updateShippingFee(
      patchRequest('/api/admin/shipping-fee', { shippingFee: -1, extra: true }),
    )).status).toBe(400)
    expect((await updateGiftWrap(
      patchRequest('/api/admin/gift-wrap', { fee: 10.5, enabled: 'yes' }),
    )).status).toBe(400)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('persists changed values atomically and audits the administrator', async () => {
    const shipping = await updateShippingFee(
      patchRequest('/api/admin/shipping-fee', { shippingFee: 35_000 }),
    )
    expect(shipping.status).toBe(200)
    expect(await shipping.json()).toMatchObject({ shippingFee: 35_000, changed: true })

    const giftWrap = await updateGiftWrap(
      patchRequest('/api/admin/gift-wrap', { fee: 20_000, enabled: false }),
    )
    expect(giftWrap.status).toBe(200)
    expect(await giftWrap.json()).toMatchObject({ fee: 20_000, enabled: false, changed: true })

    expect(mocks.settingUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: 'default_shipping_fee' },
    }))
    expect(mocks.settingUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: 'gift_wrap_enabled' },
    }))
    expect(mocks.adminLogCreate).toHaveBeenCalledTimes(2)
  })

  it('does not rewrite settings or audit when values are unchanged', async () => {
    const shipping = await updateShippingFee(
      patchRequest('/api/admin/shipping-fee', { shippingFee: 30_000 }),
    )
    const giftWrap = await updateGiftWrap(
      patchRequest('/api/admin/gift-wrap', { fee: 15_000, enabled: true }),
    )

    expect(await shipping.json()).toMatchObject({ changed: false, shippingFee: 30_000 })
    expect(await giftWrap.json()).toMatchObject({ changed: false, fee: 15_000, enabled: true })
    expect(mocks.settingUpsert).not.toHaveBeenCalled()
    expect(mocks.adminLogCreate).not.toHaveBeenCalled()
  })
})

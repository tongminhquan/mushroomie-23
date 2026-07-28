import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  productFindMany: vi.fn(),
  orderFindUnique: vi.fn(),
  orderFindMany: vi.fn(),
  orderCount: vi.fn(),
  paymentCreate: vi.fn(),
  transaction: vi.fn(),
  txOrderCreate: vi.fn(),
  txHistoryCreate: vi.fn(),
  txVoucherFindFirst: vi.fn(),
  txVoucherUpdateMany: vi.fn(),
  isLimited: vi.fn(),
  getLimitResponse: vi.fn(),
  createOrderAccessToken: vi.fn(),
  verifyOrderAccessToken: vi.fn(),
  checkRateLimit: vi.fn(),
  providerCreatePayment: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/rate-limit', () => ({
  rateLimiter: { isLimited: mocks.isLimited, getLimitResponse: mocks.getLimitResponse },
}))
vi.mock('@/lib/order-access', () => ({
  createOrderAccessToken: mocks.createOrderAccessToken,
  verifyOrderAccessToken: mocks.verifyOrderAccessToken,
}))
vi.mock('@/lib/security', () => ({ checkRateLimit: mocks.checkRateLimit }))
vi.mock('@/lib/payment/factory', () => ({
  getPaymentProvider: () => ({ providerKey: 'test-bank', createPayment: mocks.providerCreatePayment }),
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findMany: mocks.productFindMany },
    order: { findUnique: mocks.orderFindUnique, findMany: mocks.orderFindMany, count: mocks.orderCount },
    payment: { create: mocks.paymentCreate },
    $transaction: mocks.transaction,
  },
}))

import { GET as listOrders, POST as createOrder } from '@/app/api/orders/route'
import { POST as createPayment } from '@/app/api/payments/route'

const validOrderBody = {
  customer_name: 'Nguyễn An',
  customer_email: 'buyer@example.com',
  customer_phone: '0901234567',
  shipping_address: '123 Đường Nấm, Thành phố Hồ Chí Minh',
  items: [{
    product_id: 42,
    product_name: 'Client-controlled name',
    quantity: 2,
    price_snapshot: 1,
    selected_options: { color: 'đỏ' },
  }],
  payment_method: 'bank_transfer',
}

function jsonRequest(path: string, body: unknown) {
  return new NextRequest(`https://mushroomie.test${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.10' },
    body: JSON.stringify(body),
  })
}

describe('order and payment route contracts', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue(null)
    mocks.isLimited.mockReturnValue(false)
    mocks.getLimitResponse.mockReturnValue(new Response(null, { status: 429 }))
    mocks.createOrderAccessToken.mockReturnValue('guest-access-token')
    mocks.verifyOrderAccessToken.mockReturnValue(false)
    mocks.checkRateLimit.mockReturnValue({ allowed: true, remaining: 19, retryAfter: 0 })
    mocks.productFindMany.mockResolvedValue([{
      id: 42,
      name: 'Vòng tay nấm',
      stock: 10,
      price: 125_000,
      sale_price: 100_000,
      options: [{ option_name: 'color', option_type: 'select', option_values: '["đỏ","vàng"]' }],
    }])
    mocks.txOrderCreate.mockResolvedValue({ id: 99, order_code: 'MSH-99', items: [] })
    mocks.txHistoryCreate.mockResolvedValue({})
    mocks.txVoucherFindFirst.mockResolvedValue(null)
    mocks.txVoucherUpdateMany.mockResolvedValue({ count: 1 })
    mocks.transaction.mockImplementation(async (argument: unknown) => {
      if (typeof argument !== 'function') return Promise.all(argument as Promise<unknown>[])
      return argument({
        order: { create: mocks.txOrderCreate },
        orderStatusHistory: { create: mocks.txHistoryCreate },
        userVoucher: { findFirst: mocks.txVoucherFindFirst, updateMany: mocks.txVoucherUpdateMany },
      })
    })
  })

  it('rejects malformed orders before reading products', async () => {
    const response = await createOrder(jsonRequest('/api/orders', { ...validOrderBody, customer_phone: '123' }))
    expect(response.status).toBe(400)
    expect(mocks.productFindMany).not.toHaveBeenCalled()
  })

  it('recalculates item prices and totals from active server-side products', async () => {
    const response = await createOrder(jsonRequest('/api/orders', validOrderBody))

    expect(response.status).toBe(201)
    expect(mocks.txOrderCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        subtotal: 200_000,
        shipping_fee: 30_000,
        total: 230_000,
        payment_status: 'PENDING',
        order_status: 'PENDING_PAYMENT',
        items: { create: [expect.objectContaining({
          product_id: 42,
          product_name: 'Vòng tay nấm',
          quantity: 2,
          price_snapshot: 100_000,
          total_price: 200_000,
        })] },
      }),
    }))
    expect(await response.json()).toEqual({ orderId: 99, orderCode: 'MSH-99', accessToken: 'guest-access-token' })
  })

  it('rejects unavailable products, invalid options, and guest voucher use', async () => {
    mocks.productFindMany.mockResolvedValueOnce([])
    expect((await createOrder(jsonRequest('/api/orders', validOrderBody))).status).toBe(400)

    mocks.productFindMany.mockResolvedValueOnce([{
      id: 42, name: 'Vòng tay nấm', stock: 10, price: 125_000, sale_price: null, options: [],
    }])
    expect((await createOrder(jsonRequest('/api/orders', validOrderBody))).status).toBe(400)

    expect((await createOrder(jsonRequest('/api/orders', { ...validOrderBody, user_voucher_id: 'uv-1' }))).status).toBe(401)
  })

  it('scopes non-admin order listings to the authenticated user', async () => {
    mocks.auth.mockResolvedValue({ user: { id: '7', role: 'user' } })
    mocks.orderFindMany.mockResolvedValue([])
    mocks.orderCount.mockResolvedValue(0)
    const response = await listOrders(new NextRequest('https://mushroomie.test/api/orders?page=2&limit=500'))

    expect(response.status).toBe(200)
    expect(mocks.orderFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 7 }, skip: 100, take: 100 }))
    expect(await response.json()).toMatchObject({ pagination: { page: 2, limit: 100, total: 0, totalPages: 0 } })
  })

  it('requires an owner, admin, or valid guest token before creating payment', async () => {
    mocks.orderFindUnique.mockResolvedValue({
      id: 99, order_code: 'MSH-99', user_id: 7, payment_method: 'bank_transfer', payment_status: 'PENDING', payment: null,
    })

    const response = await createPayment(jsonRequest('/api/payments', { orderId: 99 }))
    expect(response.status).toBe(401)
    expect(mocks.providerCreatePayment).not.toHaveBeenCalled()
  })

  it('returns an existing payment without creating a duplicate', async () => {
    mocks.verifyOrderAccessToken.mockReturnValue(true)
    mocks.orderFindUnique.mockResolvedValue({
      id: 99, order_code: 'MSH-99', user_id: null, payment_method: 'bank_transfer', payment_status: 'PENDING',
      payment: { id: 5, status: 'PENDING' },
    })

    const response = await createPayment(jsonRequest('/api/payments', { orderId: 99, accessToken: 'valid' }))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 5, status: 'PENDING' })
    expect(mocks.providerCreatePayment).not.toHaveBeenCalled()
  })

  it('creates payment from authoritative order amount for the order owner', async () => {
    mocks.auth.mockResolvedValue({ user: { id: '7', role: 'user' } })
    mocks.orderFindUnique.mockResolvedValue({
      id: 99,
      order_code: 'MSH-99',
      user_id: 7,
      total: 230_000,
      customer_email: 'buyer@example.com',
      customer_name: 'Nguyễn An',
      payment_method: 'bank_transfer',
      payment_status: 'PENDING',
      payment: null,
    })
    mocks.providerCreatePayment.mockResolvedValue({
      transferContent: 'MSH-99', bankName: 'VCB', bankAccount: '123', accountName: 'MUSHROOMIE', bankBin: '970436',
      qrCodeUrl: 'https://img.vietqr.io/qr.png', qrCodePayload: '{}',
    })
    mocks.paymentCreate.mockResolvedValue({ id: 10, amount: 230_000, status: 'PENDING' })

    const response = await createPayment(jsonRequest('/api/payments', { orderId: 99 }))
    expect(response.status).toBe(201)
    expect(mocks.providerCreatePayment).toHaveBeenCalledWith(expect.objectContaining({ orderId: 99, orderCode: 'MSH-99', amount: 230_000 }))
    expect(mocks.paymentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ order_id: 99, amount: 230_000, status: 'PENDING' }) }))
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  orderFindFirst: vi.fn(),
  orderFindUnique: vi.fn(),
  orderUpdate: vi.fn(),
  orderUpdateMany: vi.fn(),
  orderFindUniqueOrThrow: vi.fn(),
  paymentUpdateMany: vi.fn(),
  paymentFindUnique: vi.fn(),
  txPaymentFindUnique: vi.fn(),
  productUpdate: vi.fn(),
  voucherUpdateMany: vi.fn(),
  historyCreate: vi.fn(),
  userFindUnique: vi.fn(),
  reviewCreate: vi.fn(),
  transaction: vi.fn(),
  verifyOrderAccessToken: vi.fn(),
  checkRateLimit: vi.fn(),
  sendOrderEmail: vi.fn(),
  logAdminAction: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({ auth: mocks.auth }))
vi.mock('@/lib/order-access', () => ({ verifyOrderAccessToken: mocks.verifyOrderAccessToken }))
vi.mock('@/lib/security', () => ({ checkRateLimit: mocks.checkRateLimit }))
vi.mock('@/lib/payment/email/sender', () => ({ sendOrderEmail: mocks.sendOrderEmail }))
vi.mock('@/lib/admin-logger', () => ({ logAdminAction: mocks.logAdminAction }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: mocks.orderFindFirst,
      findUnique: mocks.orderFindUnique,
      update: mocks.orderUpdate,
    },
    payment: {
      updateMany: mocks.paymentUpdateMany,
      findUnique: mocks.paymentFindUnique,
    },
    userVoucher: { updateMany: mocks.voucherUpdateMany },
    orderStatusHistory: { create: mocks.historyCreate },
    user: { findUnique: mocks.userFindUnique },
    review: { create: mocks.reviewCreate },
    $transaction: mocks.transaction,
  },
}))

import { GET as getOrder, PUT as updateOrder } from '@/app/api/orders/[id]/route'
import { GET as getPaymentStatus } from '@/app/api/orders/[id]/payment-status/route'
import { POST as createOrderReview } from '@/app/api/orders/[id]/reviews/route'

const params = (id = '99') => ({ params: Promise.resolve({ id }) })

function request(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`https://mushroomie.test${path}`, init)
}

function jsonRequest(path: string, body: unknown, method = 'POST') {
  return request(path, {
    method,
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
    body: JSON.stringify(body),
  })
}

const order = {
  id: 99,
  order_code: 'MSH-99',
  user_id: 7,
  customer_email: 'buyer@example.com',
  customer_phone: '0901234567',
  order_status: 'PROCESSING',
  payment_status: 'PENDING',
  payment: null,
  items: [],
  status_history: [],
}

describe('order detail, payment status, and review contracts', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue(null)
    mocks.verifyOrderAccessToken.mockReturnValue(false)
    mocks.checkRateLimit.mockReturnValue({ allowed: true, retryAfter: 0 })
    mocks.sendOrderEmail.mockResolvedValue(undefined)
    mocks.logAdminAction.mockResolvedValue(undefined)
    mocks.orderFindFirst.mockResolvedValue(order)
    mocks.orderFindUnique.mockResolvedValue(order)
    mocks.orderUpdate.mockResolvedValue({ ...order, order_status: 'CANCELLED' })
    mocks.orderUpdateMany.mockResolvedValue({ count: 1 })
    mocks.orderFindUniqueOrThrow.mockResolvedValue({ ...order, order_status: 'CANCELLED' })
    mocks.paymentUpdateMany.mockResolvedValue({ count: 1 })
    mocks.paymentFindUnique.mockResolvedValue(null)
    mocks.txPaymentFindUnique.mockResolvedValue({
      id: 4,
      status: 'PENDING',
      expires_at: new Date('2026-07-19T11:59:00Z'),
    })
    mocks.productUpdate.mockResolvedValue({})
    mocks.voucherUpdateMany.mockResolvedValue({ count: 1 })
    mocks.historyCreate.mockResolvedValue({})
    mocks.userFindUnique.mockResolvedValue({ id: 7, name: 'Nguyễn An' })
    mocks.reviewCreate.mockResolvedValue({})
    mocks.transaction.mockImplementation(async (argument: unknown) => {
      if (typeof argument !== 'function') return Promise.all(argument as Promise<unknown>[])
      return argument({
        order: {
          findUnique: mocks.orderFindUnique,
          update: mocks.orderUpdate,
          updateMany: mocks.orderUpdateMany,
          findUniqueOrThrow: mocks.orderFindUniqueOrThrow,
        },
        payment: {
          findUnique: mocks.txPaymentFindUnique,
          updateMany: mocks.paymentUpdateMany,
        },
        product: { update: mocks.productUpdate },
        userVoucher: { updateMany: mocks.voucherUpdateMany },
        orderStatusHistory: { create: mocks.historyCreate },
      })
    })
  })

  it('prevents an authenticated customer from reading another customer order', async () => {
    mocks.auth.mockResolvedValue({ user: { id: '8', role: 'user' } })

    const response = await getOrder(request('/api/orders/99'), params())

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('allows the owner and a guest with a valid signed access token to read an order', async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: '7', role: 'user' } })
    expect((await getOrder(request('/api/orders/99'), params())).status).toBe(200)

    mocks.auth.mockResolvedValueOnce(null)
    mocks.verifyOrderAccessToken.mockReturnValueOnce(true)
    const guest = await getOrder(request('/api/orders/MSH-99?accessToken=signed'), params('MSH-99'))
    expect(guest.status).toBe(200)
    expect(mocks.verifyOrderAccessToken).toHaveBeenCalledWith('signed', 99, 'MSH-99')
  })

  it('rate-limits guest order lookups before accepting contact information', async () => {
    mocks.checkRateLimit.mockReturnValue({ allowed: false, retryAfter: 45 })

    const response = await getOrder(request('/api/orders/99?email=buyer@example.com'), params())

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('45')
  })

  it('requires order access before exposing payment status', async () => {
    mocks.orderFindFirst.mockResolvedValue({ ...order, payment: { id: 4, status: 'PENDING' } })

    const response = await getPaymentStatus(request('/api/orders/99/payment-status'), params())

    expect(response.status).toBe(401)
    expect(mocks.checkRateLimit).not.toHaveBeenCalled()
  })

  it('expires stale payments and releases only the voucher tied to that order', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.verifyOrderAccessToken.mockReturnValue(true)
    mocks.orderFindFirst.mockResolvedValue({
      ...order,
      order_status: 'PENDING_PAYMENT',
      inventory_reserved_at: new Date('2026-07-19T11:00:00Z'),
      payment: {
        id: 4,
        status: 'PENDING',
        expires_at: new Date('2026-07-19T11:59:00Z'),
        paid_at: null,
      },
    })
    mocks.paymentFindUnique.mockResolvedValue({
      id: 4,
      status: 'EXPIRED',
      expires_at: new Date('2026-07-19T11:59:00Z'),
      paid_at: null,
      order: { order_status: 'CANCELLED', payment_status: 'PENDING' },
    })

    const response = await getPaymentStatus(
      request('/api/orders/99/payment-status?accessToken=signed'),
      params(),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'EXPIRED', paymentStatus: 'PENDING' })
    expect(mocks.paymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 4, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })
    expect(mocks.voucherUpdateMany).toHaveBeenCalledWith({
      where: { orderId: 99, status: 'USED' },
      data: { status: 'AVAILABLE', orderId: null, usedAt: null },
    })
  })

  it('does not expire a payment after its inventory reservation was released', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.verifyOrderAccessToken.mockReturnValue(true)
    mocks.orderFindFirst.mockResolvedValue({
      ...order,
      order_status: 'PENDING_PAYMENT',
      inventory_reserved_at: null,
      payment: {
        id: 4,
        status: 'PENDING',
        expires_at: new Date('2026-07-19T11:59:00Z'),
        paid_at: null,
      },
    })

    const response = await getPaymentStatus(
      request('/api/orders/99/payment-status?accessToken=signed'),
      params(),
    )

    expect(response.status).toBe(200)
    expect(mocks.paymentUpdateMany).not.toHaveBeenCalled()
    expect(mocks.voucherUpdateMany).not.toHaveBeenCalled()
    expect(mocks.historyCreate).not.toHaveBeenCalled()
  })

  it('reports PAID when the webhook wins the expiry compare-and-set race', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.verifyOrderAccessToken.mockReturnValue(true)
    mocks.orderFindFirst.mockResolvedValue({
      ...order,
      order_status: 'PENDING_PAYMENT',
      inventory_reserved_at: new Date('2026-07-19T11:00:00Z'),
      payment: {
        id: 4,
        status: 'PENDING',
        expires_at: new Date('2026-07-19T11:59:00Z'),
        paid_at: null,
      },
    })
    mocks.paymentUpdateMany.mockResolvedValue({ count: 0 })
    mocks.paymentFindUnique.mockResolvedValue({
      id: 4,
      status: 'PAID',
      expires_at: new Date('2026-07-19T11:59:00Z'),
      paid_at: new Date('2026-07-19T12:00:00Z'),
      order: { order_status: 'PROCESSING', payment_status: 'PAID' },
    })

    const response = await getPaymentStatus(
      request('/api/orders/99/payment-status?accessToken=signed'),
      params(),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      status: 'PAID',
      orderStatus: 'PROCESSING',
      paymentStatus: 'PAID',
      paidAt: '2026-07-19T12:00:00.000Z',
    })
    expect(mocks.voucherUpdateMany).not.toHaveBeenCalled()
    // The expiry path claims the order first; the payment CAS then loses to
    // the webhook and the real database transaction rolls this claim back.
    expect(mocks.orderUpdateMany).toHaveBeenCalledTimes(1)
    expect(mocks.historyCreate).not.toHaveBeenCalled()
  })

  it('lets an admin cancel an order, release its voucher, record history, and notify the customer', async () => {
    mocks.auth.mockResolvedValue({ user: { id: '1', role: 'admin' } })

    const response = await updateOrder(
      jsonRequest('/api/orders/99', { order_status: 'CANCELLED', note: 'Khách yêu cầu hủy' }, 'PUT'),
      params(),
    )

    expect(response.status).toBe(200)
    expect(mocks.voucherUpdateMany).toHaveBeenCalledWith({
      where: { orderId: 99, status: 'USED' },
      data: { status: 'AVAILABLE', orderId: null, usedAt: null },
    })
    expect(mocks.historyCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      order_id: 99,
      old_status: 'PROCESSING',
      new_status: 'CANCELLED',
      changed_by_user_id: 1,
    }) })
    expect(mocks.sendOrderEmail).toHaveBeenCalledWith(99, 'order_cancelled')
    expect(mocks.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, entity: 'ORDER' }))
  })

  it('rejects reviews for someone else’s order or an unfinished order', async () => {
    mocks.auth.mockResolvedValue({ user: { email: 'buyer@example.com' } })
    mocks.orderFindUnique.mockResolvedValueOnce({ ...order, user_id: 8, customer_email: 'other@example.com' })
    const forbidden = await createOrderReview(
      jsonRequest('/api/orders/99/reviews', { content: 'Sản phẩm rất xinh', rating: 5 }),
      params(),
    )
    expect(forbidden.status).toBe(403)

    mocks.orderFindUnique.mockResolvedValueOnce({ ...order, order_status: 'SHIPPING' })
    const unfinished = await createOrderReview(
      jsonRequest('/api/orders/99/reviews', { content: 'Sản phẩm rất xinh', rating: 5 }),
      params(),
    )
    expect(unfinished.status).toBe(400)
    expect(mocks.reviewCreate).not.toHaveBeenCalled()
  })

  it('creates one approved review per unique product and marks a completed order reviewed', async () => {
    mocks.auth.mockResolvedValue({ user: { email: 'buyer@example.com' } })
    mocks.orderFindUnique.mockResolvedValue({
      ...order,
      order_status: 'COMPLETED',
      is_reviewed: false,
      items: [{ product_id: 10 }, { product_id: 10 }, { product_id: 11 }, { product_id: null }],
    })

    const response = await createOrderReview(
      jsonRequest('/api/orders/99/reviews', { content: 'Sản phẩm rất xinh', rating: 5 }),
      params(),
    )

    expect(response.status).toBe(201)
    expect(mocks.reviewCreate).toHaveBeenCalledTimes(2)
    expect(mocks.reviewCreate).toHaveBeenNthCalledWith(1, { data: {
      name: 'Nguyễn An', content: 'Sản phẩm rất xinh', rating: 5, product_id: 10, status: 'approved',
    } })
    expect(mocks.reviewCreate).toHaveBeenNthCalledWith(2, { data: expect.objectContaining({ product_id: 11 }) })
    expect(mocks.orderUpdate).toHaveBeenCalledWith({ where: { id: 99 }, data: { is_reviewed: true } })
  })
})

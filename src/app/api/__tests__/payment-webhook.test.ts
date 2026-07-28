import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  eventCreate: vi.fn(),
  eventFindFirst: vi.fn(),
  eventUpdate: vi.fn(),
  paymentFindFirst: vi.fn(),
  paymentUpdate: vi.fn(),
  voucherUpdateMany: vi.fn(),
  transaction: vi.fn(),
  txPaymentUpdate: vi.fn(),
  txPaymentUpdateMany: vi.fn(),
  txOrderUpdate: vi.fn(),
  txOrderFindUnique: vi.fn(),
  txOrderUpdateMany: vi.fn(),
  txHistoryCreate: vi.fn(),
  txEventUpdate: vi.fn(),
  sendOrderEmail: vi.fn(),
}))

vi.mock('@/lib/payment/factory', () => ({
  getPaymentProvider: () => ({
    providerKey: 'test-bank',
    verifyWebhookSignature: mocks.verifyWebhookSignature,
  }),
}))
vi.mock('@/lib/payment/email/sender', () => ({ sendOrderEmail: mocks.sendOrderEmail }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    paymentWebhookEvent: {
      create: mocks.eventCreate,
      findFirst: mocks.eventFindFirst,
      update: mocks.eventUpdate,
    },
    payment: { findFirst: mocks.paymentFindFirst, update: mocks.paymentUpdate },
    userVoucher: { updateMany: mocks.voucherUpdateMany },
    $transaction: mocks.transaction,
  },
}))

import { POST } from '@/app/api/webhooks/payment/route'

const verified = {
  isValid: true,
  eventId: 'evt-1',
  transactionCode: 'TX-100',
  amount: 230_000,
  transferContent: 'MUSHROOMIE-99',
  signature: 'provider-signature',
  rawPayload: { transaction: 'TX-100', token: 'secret-token', nested: { signature: 'secret-signature' } },
}

const payment = {
  id: 4,
  order_id: 99,
  amount: 230_000,
  expires_at: new Date('2026-07-19T12:05:00Z'),
  order: { id: 99, order_code: 'MUSHROOMIE-99', order_status: 'PENDING_PAYMENT' },
}

function webhookRequest() {
  return new Request('https://mushroomie.test/api/webhooks/payment', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer secret',
      'x-forwarded-for': '203.0.113.10',
      'user-agent': 'Payment Provider',
    },
    body: JSON.stringify({ event: 'payment' }),
  })
}

describe('payment webhook route', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.verifyWebhookSignature.mockResolvedValue(verified)
    mocks.eventCreate.mockResolvedValue({ id: 20 })
    mocks.eventFindFirst.mockResolvedValue(null)
    mocks.eventUpdate.mockResolvedValue({})
    mocks.paymentFindFirst.mockResolvedValue(payment)
    mocks.paymentUpdate.mockResolvedValue({})
    mocks.voucherUpdateMany.mockResolvedValue({ count: 1 })
    mocks.txPaymentUpdate.mockResolvedValue({})
    mocks.txPaymentUpdateMany.mockResolvedValue({ count: 1 })
    mocks.txOrderUpdate.mockResolvedValue({})
    mocks.txOrderFindUnique.mockResolvedValue({
      ...payment.order,
      inventory_reserved_at: null,
      items: [],
    })
    mocks.txOrderUpdateMany.mockResolvedValue({ count: 1 })
    mocks.txHistoryCreate.mockResolvedValue({})
    mocks.txEventUpdate.mockResolvedValue({})
    mocks.sendOrderEmail.mockResolvedValue(undefined)
    mocks.transaction.mockImplementation(async (argument: unknown) => {
      if (typeof argument !== 'function') return Promise.all(argument as Promise<unknown>[])
      return argument({
        payment: {
          update: mocks.txPaymentUpdate,
          updateMany: mocks.txPaymentUpdateMany,
        },
        order: {
          update: mocks.txOrderUpdate,
          findUnique: mocks.txOrderFindUnique,
          updateMany: mocks.txOrderUpdateMany,
        },
        product: { update: vi.fn() },
        userVoucher: { updateMany: mocks.voucherUpdateMany },
        orderStatusHistory: { create: mocks.txHistoryCreate },
        paymentWebhookEvent: { update: mocks.txEventUpdate },
      })
    })
  })

  it('audits an invalid signature with secrets redacted and rejects it', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({ ...verified, isValid: false })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(401)
    expect(mocks.eventCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      status: 'FAILED',
      signature: '[REDACTED]',
      sanitized_headers: expect.objectContaining({ authorization: '[REDACTED]' }),
      raw_payload: { transaction: 'TX-100', token: '[redacted]', nested: { signature: '[redacted]' } },
    }) })
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
  })

  it('acknowledges a provider event that is already stored without processing it again', async () => {
    mocks.eventCreate.mockRejectedValue({ code: 'P2002' })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('marks an underpayment failed without changing the payment or order', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({ ...verified, amount: 229_999 })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'FAILED',
        payment_id: 4,
        order_id: 99,
        error_message: 'Amount mismatch: received 229999, expected 230000',
      }),
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('expires a late payment and releases only its reserved voucher', async () => {
    mocks.paymentFindFirst.mockResolvedValue({ ...payment, expires_at: new Date('2026-07-19T11:59:00Z') })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.txPaymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 4, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })
    expect(mocks.voucherUpdateMany).toHaveBeenCalledWith({
      where: { orderId: 99, status: 'USED' },
      data: { status: 'AVAILABLE', orderId: null, usedAt: null },
    })
    expect(mocks.txEventUpdate).toHaveBeenCalledWith({ where: { id: 20 }, data: expect.objectContaining({
      status: 'FAILED', error_message: 'Payment expired', payment_id: 4, order_id: 99,
    }) })
  })

  it('atomically confirms a valid payment, advances the order, audits it, and sends email', async () => {
    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.txPaymentUpdate).toHaveBeenCalledWith({ where: { id: 4 }, data: {
      status: 'PAID', transaction_code: 'TX-100', paid_at: new Date('2026-07-19T12:00:00Z'),
    } })
    expect(mocks.txOrderUpdate).toHaveBeenCalledWith({ where: { id: 99 }, data: {
      payment_status: 'PAID', order_status: 'PROCESSING',
    } })
    expect(mocks.txHistoryCreate).toHaveBeenCalledWith({ data: expect.objectContaining({
      order_id: 99,
      old_status: 'PENDING_PAYMENT',
      new_status: 'PROCESSING',
      changed_by: 'PAYMENT_WEBHOOK',
    }) })
    expect(mocks.txEventUpdate).toHaveBeenCalledWith({ where: { id: 20 }, data: expect.objectContaining({
      status: 'PROCESSED', payment_id: 4, order_id: 99,
    }) })
    expect(mocks.sendOrderEmail).toHaveBeenCalledWith(99, 'payment_success')
  })
})

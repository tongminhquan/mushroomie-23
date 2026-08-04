import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  eventCreate: vi.fn(),
  eventFindFirst: vi.fn(),
  eventFindUnique: vi.fn(),
  eventUpdate: vi.fn(),
  eventUpdateMany: vi.fn(),
  paymentFindFirst: vi.fn(),
  paymentFindUnique: vi.fn(),
  paymentUpdate: vi.fn(),
  voucherUpdateMany: vi.fn(),
  transaction: vi.fn(),
  txPaymentUpdate: vi.fn(),
  txPaymentFindFirst: vi.fn(),
  txPaymentFindUnique: vi.fn(),
  txPaymentUpdateMany: vi.fn(),
  txOrderUpdate: vi.fn(),
  txOrderFindUnique: vi.fn(),
  txOrderUpdateMany: vi.fn(),
  txHistoryCreate: vi.fn(),
  txEventUpdate: vi.fn(),
  txEventUpdateMany: vi.fn(),
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
      findUnique: mocks.eventFindUnique,
      update: mocks.eventUpdate,
      updateMany: mocks.eventUpdateMany,
    },
    payment: {
      findFirst: mocks.paymentFindFirst,
      findUnique: mocks.paymentFindUnique,
      update: mocks.paymentUpdate,
    },
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
  receivingAccount: '123456789',
  signature: 'provider-signature',
  rawPayload: { transaction: 'TX-100', token: 'secret-token', nested: { signature: 'secret-signature' } },
}

const payment = {
  id: 4,
  order_id: 99,
  amount: 230_000,
  status: 'PENDING',
  transaction_code: null,
  expires_at: new Date('2026-07-19T12:05:00Z'),
  order: {
    id: 99,
    order_code: 'MUSHROOMIE-99',
    order_status: 'PENDING_PAYMENT',
    payment_status: 'PENDING',
    inventory_reserved_at: new Date('2026-07-19T11:55:00Z'),
  },
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
    vi.unstubAllEnvs()
    vi.stubEnv('BANK_ACCOUNT_NUMBER', '123456789')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.verifyWebhookSignature.mockResolvedValue(verified)
    mocks.eventCreate.mockResolvedValue({ id: 20 })
    mocks.eventFindFirst.mockResolvedValue(null)
    mocks.eventFindUnique.mockResolvedValue(null)
    mocks.eventUpdate.mockResolvedValue({})
    mocks.eventUpdateMany.mockResolvedValue({ count: 1 })
    mocks.paymentFindFirst.mockResolvedValue(payment)
    mocks.paymentFindUnique.mockResolvedValue(payment)
    mocks.paymentUpdate.mockResolvedValue({})
    mocks.voucherUpdateMany.mockResolvedValue({ count: 1 })
    mocks.txPaymentUpdate.mockResolvedValue({})
    mocks.txPaymentFindFirst.mockResolvedValue(null)
    mocks.txPaymentFindUnique.mockResolvedValue({
      id: payment.id,
      order_id: payment.order_id,
      provider: 'test-bank',
      amount: payment.amount,
      status: 'PENDING',
    })
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
    mocks.txEventUpdateMany.mockResolvedValue({ count: 1 })
    mocks.sendOrderEmail.mockResolvedValue(undefined)
    mocks.transaction.mockImplementation(async (argument: unknown) => {
      if (typeof argument !== 'function') return Promise.all(argument as Promise<unknown>[])
      return argument({
        payment: {
          findFirst: mocks.txPaymentFindFirst,
          findUnique: mocks.txPaymentFindUnique,
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
        paymentWebhookEvent: {
          update: mocks.txEventUpdate,
          updateMany: mocks.txEventUpdateMany,
        },
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

  it('acknowledges an already processed provider event without processing it again', async () => {
    mocks.eventCreate.mockRejectedValue({ code: 'P2002' })
    mocks.eventFindUnique.mockResolvedValue({
      id: 20,
      status: 'PROCESSED',
      processed_at: new Date('2026-07-19T11:58:00Z'),
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, ok: true })
    expect(mocks.eventFindUnique).toHaveBeenCalledWith({ where: { event_id: 'test-bank:tx:TX-100' } })
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('reclaims a failed provider event and processes the retry', async () => {
    mocks.eventCreate.mockRejectedValue({ code: 'P2002' })
    mocks.eventFindUnique.mockResolvedValue({
      id: 20,
      status: 'FAILED',
      processed_at: null,
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.txEventUpdateMany).toHaveBeenCalledWith({
      where: { id: 20, status: { in: ['RECEIVED', 'VERIFIED', 'FAILED'] } },
      data: { status: 'PROCESSING', error_message: null },
    })
    expect(mocks.paymentFindFirst).toHaveBeenCalledTimes(1)
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
  })

  it('returns a retryable response while the same event is being processed', async () => {
    mocks.eventCreate.mockRejectedValue({ code: 'P2002' })
    mocks.eventFindUnique.mockResolvedValue({ id: 20, status: 'PROCESSING' })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('5')
    expect(await response.json()).toMatchObject({ success: false })
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('marks an underpayment for reconciliation without changing the payment or order', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({ ...verified, amount: 229_999 })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        payment_id: 4,
        order_id: 99,
        error_message: 'Amount mismatch: received 229999, expected 230000',
      }),
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('marks an overpayment for reconciliation without changing the payment or order', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({ ...verified, amount: 230_001 })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        payment_id: 4,
        order_id: 99,
        error_message: 'Amount mismatch: received 230001, expected 230000',
      }),
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects an empty transfer description without querying an arbitrary pending payment', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({ ...verified, transferContent: '   ' })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, ok: true })
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        error_message: 'Missing transfer content',
      }),
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('extracts the default MSH order code and matches it exactly', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({
      ...verified,
      transferContent: 'Thanh toan MSH 99',
    })
    mocks.paymentFindFirst.mockResolvedValue({
      ...payment,
      order: { ...payment.order, order_code: 'MSH-99' },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.paymentFindFirst).toHaveBeenCalledWith({
      where: {
        provider: 'test-bank',
        OR: [
          { transfer_content: 'MSH-99' },
          { order: { order_code: 'MSH-99' } },
        ],
      },
      include: { order: true },
    })
  })

  it('does not extract an order code embedded inside another token', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({
      ...verified,
      transferContent: 'Thanh toan NOTMSH-99',
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        error_message: 'Missing or ambiguous order code',
      }),
    })
  })

  it('rejects a webhook for a different receiving bank account without exposing either account', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({
      ...verified,
      receivingAccount: '987654321',
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: {
        status: 'IGNORED',
        error_message: 'Receiving account mismatch',
      },
    })
    const auditUpdate = JSON.stringify(mocks.eventUpdate.mock.calls)
    expect(auditUpdate).not.toContain('123456789')
    expect(auditUpdate).not.toContain('987654321')
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('rejects a webhook that omits the receiving bank account when one is configured', async () => {
    mocks.verifyWebhookSignature.mockResolvedValue({
      ...verified,
      receivingAccount: '',
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: {
        status: 'IGNORED',
        error_message: 'Receiving account missing or mismatched',
      },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it('fails closed for retry when the receiving bank account is not configured', async () => {
    vi.stubEnv('BANK_ACCOUNT_NUMBER', '')

    const response = await POST(webhookRequest())

    expect(response.status).toBe(500)
    expect(mocks.paymentFindFirst).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.eventUpdateMany).toHaveBeenCalledWith({
      where: { id: 20, status: { in: ['RECEIVED', 'VERIFIED', 'FAILED'] } },
      data: expect.objectContaining({ status: 'FAILED' }),
    })
  })

  it('confirms money received after the displayed expiry while the reservation is still pending', async () => {
    mocks.paymentFindFirst.mockResolvedValue({ ...payment, expires_at: new Date('2026-07-19T11:59:00Z') })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.txPaymentUpdateMany).toHaveBeenCalledWith({
      where: { id: 4, order_id: 99, provider: 'test-bank', status: 'PENDING' },
      data: {
        status: 'PAID',
        transaction_code: 'TX-100',
        paid_at: new Date('2026-07-19T12:00:00Z'),
      },
    })
    expect(mocks.voucherUpdateMany).not.toHaveBeenCalled()
    expect(mocks.txEventUpdate).toHaveBeenCalledWith({ where: { id: 20 }, data: expect.objectContaining({
      status: 'PROCESSED', payment_id: 4, order_id: 99,
    }) })
  })

  it('does not confirm a pending order whose inventory reservation is already gone', async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...payment,
      order: { ...payment.order, inventory_reserved_at: null },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        error_message: expect.stringContaining('manual reconciliation'),
      }),
    })
  })

  it('keeps a paid but cancelled legacy row in manual reconciliation', async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...payment,
      status: 'PAID',
      transaction_code: 'TX-100',
      order: {
        ...payment.order,
        order_status: 'CANCELLED',
        payment_status: 'PAID',
        inventory_reserved_at: null,
      },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        error_message: expect.stringContaining('manual reconciliation'),
      }),
    })
  })

  it('does not resurrect an order that was already expired and cancelled', async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...payment,
      status: 'EXPIRED',
      order: {
        ...payment.order,
        order_status: 'CANCELLED',
        payment_status: 'PENDING',
      },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.transaction).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        payment_id: 4,
        order_id: 99,
        error_message: expect.stringContaining('manual reconciliation'),
      }),
    })
    expect(mocks.sendOrderEmail).not.toHaveBeenCalled()
  })

  it('does not resurrect an order when expiry wins the payment compare-and-set race', async () => {
    mocks.txOrderUpdateMany.mockResolvedValue({ count: 0 })
    mocks.paymentFindUnique.mockResolvedValue({
      ...payment,
      status: 'EXPIRED',
      order: {
        ...payment.order,
        order_status: 'CANCELLED',
        payment_status: 'PENDING',
      },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.txPaymentUpdateMany).not.toHaveBeenCalled()
    expect(mocks.txOrderUpdateMany).toHaveBeenCalledTimes(1)
    expect(mocks.txHistoryCreate).not.toHaveBeenCalled()
    expect(mocks.eventUpdate).toHaveBeenCalledWith({
      where: { id: 20 },
      data: expect.objectContaining({
        status: 'IGNORED',
        error_message: 'Payment or order state changed; manual reconciliation required',
      }),
    })
    expect(mocks.sendOrderEmail).not.toHaveBeenCalled()
  })

  it('processes every transaction in a verified provider batch', async () => {
    const secondTransaction = {
      eventId: 'evt-2',
      transactionCode: 'TX-200',
      amount: 180_000,
      transferContent: 'MSH-100',
      receivingAccount: '123456789',
    }
    const secondPayment = {
      ...payment,
      id: 5,
      order_id: 100,
      amount: 180_000,
      order: {
        ...payment.order,
        id: 100,
        order_code: 'MSH-100',
      },
    }
    mocks.verifyWebhookSignature.mockResolvedValue({
      ...verified,
      transactions: [verified, secondTransaction],
    })
    mocks.eventCreate
      .mockResolvedValueOnce({ id: 20, status: 'VERIFIED' })
      .mockResolvedValueOnce({ id: 21, status: 'VERIFIED' })
    mocks.paymentFindFirst.mockImplementation(async (query: any) => (
      query.where.OR[0].transfer_content === 'MSH-100' ? secondPayment : payment
    ))
    mocks.txPaymentFindUnique.mockImplementation(async ({ where }: { where: { id: number } }) => {
      const current = where.id === secondPayment.id ? secondPayment : payment
      return {
        id: current.id,
        order_id: current.order_id,
        provider: 'test-bank',
        amount: current.amount,
        status: current.status,
      }
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, ok: true })
    expect(mocks.eventCreate).toHaveBeenCalledTimes(2)
    expect(mocks.paymentFindFirst).toHaveBeenCalledTimes(2)
    expect(mocks.transaction).toHaveBeenCalledTimes(2)
    expect(mocks.txPaymentUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 5, order_id: 100, provider: 'test-bank', status: 'PENDING' },
      data: expect.objectContaining({ transaction_code: 'TX-200' }),
    }))
    expect(mocks.sendOrderEmail).toHaveBeenCalledWith(99, 'payment_success')
    expect(mocks.sendOrderEmail).toHaveBeenCalledWith(100, 'payment_success')
  })

  it('atomically confirms a valid payment, advances the order, audits it, and sends email', async () => {
    const response = await POST(webhookRequest())

    expect(response.status).toBe(200)
    expect(mocks.txOrderUpdateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 99,
        order_status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        inventory_reserved_at: { not: null },
      },
      data: { updated_at: new Date('2026-07-19T12:00:00Z') },
    })
    expect(mocks.txOrderUpdateMany.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.txPaymentUpdateMany.mock.invocationCallOrder[0],
    )
    expect(mocks.txPaymentFindUnique).toHaveBeenCalledWith({ where: { id: 4 } })
    expect(mocks.txPaymentUpdateMany).toHaveBeenCalledWith({ where: {
      id: 4,
      order_id: 99,
      provider: 'test-bank',
      status: 'PENDING',
    }, data: {
      status: 'PAID', transaction_code: 'TX-100', paid_at: new Date('2026-07-19T12:00:00Z'),
    } })
    expect(mocks.txPaymentFindFirst).toHaveBeenCalledWith({
      where: {
        provider: 'test-bank',
        transaction_code: 'TX-100',
        id: { not: 4 },
      },
      select: { id: true },
    })
    expect(mocks.txOrderUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: 99,
        order_status: 'PENDING_PAYMENT',
        payment_status: 'PENDING',
        inventory_reserved_at: { not: null },
      },
      data: { payment_status: 'PAID', order_status: 'PROCESSING' },
    })
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

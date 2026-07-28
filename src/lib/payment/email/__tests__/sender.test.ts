import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  orderFindUnique: vi.fn(),
  emailLogCreate: vi.fn(),
  emailLogUpdate: vi.fn(),
}))

vi.mock('nodemailer', () => ({
  default: { createTransport: mocks.createTransport },
}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: mocks.orderFindUnique },
    emailLog: { create: mocks.emailLogCreate, update: mocks.emailLogUpdate },
  },
}))

import { sendOrderEmail } from '@/lib/payment/email/sender'

const order = {
  id: 42,
  customer_name: 'Nguyễn An',
  customer_email: 'buyer@example.com',
  order_code: 'MSH-42',
  order_status: 'PROCESSING',
  subtotal: 100_000,
  shipping_fee: 30_000,
  total: 130_000,
  items: [{ product_name: 'Vòng tay', quantity: 1, total_price: 100_000 }],
  payment: null,
}

describe('order email sender', () => {
  beforeEach(() => {
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail })
    mocks.orderFindUnique.mockResolvedValue(order)
    mocks.emailLogCreate.mockResolvedValue({ id: 9 })
    mocks.sendMail.mockResolvedValue({ messageId: 'mail-1' })
  })

  it('returns without creating a log when the order does not exist', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.orderFindUnique.mockResolvedValue(null)

    await sendOrderEmail(404, 'payment_success')
    expect(mocks.emailLogCreate).not.toHaveBeenCalled()
    expect(mocks.createTransport).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith('[EMAIL] Order 404 not found')
  })

  it('records pending then sent status around SMTP delivery', async () => {
    vi.stubEnv('EMAIL_PROVIDER', 'smtp')
    vi.stubEnv('SMTP_HOST', 'smtp.test')
    vi.stubEnv('SMTP_PORT', '465')
    vi.stubEnv('SMTP_USER', 'user')
    vi.stubEnv('SMTP_PASSWORD', 'pass')
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await sendOrderEmail(42, 'payment_success')

    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: 'smtp.test', port: 465, secure: true }))
    expect(mocks.emailLogCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ order_id: 42, recipient_email: 'buyer@example.com', status: 'PENDING' }) })
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'buyer@example.com', html: expect.stringContaining('MSH-42') }))
    expect(mocks.emailLogUpdate).toHaveBeenCalledWith({ where: { id: 9 }, data: { status: 'SENT', sent_at: expect.any(Date) } })
    expect(log).toHaveBeenCalled()
  })

  it('supports Resend SMTP and records delivery failure without throwing', async () => {
    vi.stubEnv('EMAIL_PROVIDER', 'resend')
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    mocks.sendMail.mockRejectedValue(new Error('offline'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(sendOrderEmail(42, 'order_shipping')).resolves.toBeUndefined()
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.resend.com', port: 465, secure: true, auth: { user: 'resend', pass: 'test-key' },
    }))
    expect(mocks.emailLogUpdate).toHaveBeenCalledWith({
      where: { id: 9 }, data: { status: 'FAILED', error_message: 'Error: offline' },
    })
  })
})

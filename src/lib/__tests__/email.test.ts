import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createTransport: vi.fn(), sendMail: vi.fn() }))
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }))

import { createTransporter, sendPasswordResetEmail } from '@/lib/email'

describe('password reset email', () => {
  beforeEach(() => {
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail })
    mocks.sendMail.mockResolvedValue({ messageId: 'mail-1' })
  })

  it('builds secure Resend and SMTP transport configurations', () => {
    vi.stubEnv('EMAIL_PROVIDER', 'resend')
    vi.stubEnv('RESEND_API_KEY', 'test-key')
    createTransporter()
    expect(mocks.createTransport).toHaveBeenLastCalledWith(expect.objectContaining({ host: 'smtp.resend.com', secure: true }))

    vi.stubEnv('EMAIL_PROVIDER', 'smtp')
    vi.stubEnv('SMTP_PORT', '465')
    createTransporter()
    expect(mocks.createTransport).toHaveBeenLastCalledWith(expect.objectContaining({ port: 465, secure: true }))
  })

  it('sends reset URL only to the requested recipient', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await sendPasswordResetEmail('buyer@example.com', 'https://mushroomie.test/reset?token=safe')

    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'buyer@example.com',
      html: expect.stringContaining('https://mushroomie.test/reset?token=safe'),
    }))
  })

  it('hides provider errors behind a stable application error', async () => {
    mocks.sendMail.mockRejectedValue(new Error('SMTP secret host failed'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(sendPasswordResetEmail('buyer@example.com', 'https://mushroomie.test/reset'))
      .rejects.toThrow(/email|khôi phục|KhÃ´ng thá»ƒ gá»­i/)
  })
})

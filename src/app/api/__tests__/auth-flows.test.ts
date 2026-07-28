import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  userUpdateMany: vi.fn(),
  otpFindUnique: vi.fn(),
  otpUpsert: vi.fn(),
  otpDelete: vi.fn(),
  transaction: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
  sendMail: vi.fn(),
  createTransporter: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  checkRateLimit: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      findFirst: mocks.userFindFirst,
      create: mocks.userCreate,
      update: mocks.userUpdate,
      updateMany: mocks.userUpdateMany,
    },
    otp: { findUnique: mocks.otpFindUnique, upsert: mocks.otpUpsert, delete: mocks.otpDelete },
    $transaction: mocks.transaction,
  },
}))
vi.mock('bcryptjs', () => ({
  default: { hash: mocks.hash, genSalt: mocks.genSalt },
}))
vi.mock('@/lib/email', () => ({
  createTransporter: mocks.createTransporter,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
}))
vi.mock('@/lib/security', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/security')>()),
  checkRateLimit: mocks.checkRateLimit,
}))

import { POST as register } from '@/app/api/register/route'
import { POST as sendOtp } from '@/app/api/auth/send-otp/route'
import { POST as verifyAndRegister } from '@/app/api/auth/verify-and-register/route'
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route'
import { POST as resetPassword } from '@/app/api/auth/reset-password/route'

function request(path: string, body: unknown) {
  return new NextRequest(`https://mushroomie.test${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

const registration = {
  name: 'Nguyễn An',
  email: 'buyer@example.com',
  password: 'strong-password',
  phone: '0901234567',
  address: '123 Đường Nấm, Thành phố Hồ Chí Minh',
  otp: '123456',
}

describe('registration, OTP, and password recovery routes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.createTransporter.mockReturnValue({ sendMail: mocks.sendMail })
    mocks.sendMail.mockResolvedValue({ messageId: 'mail-1' })
    mocks.hash.mockResolvedValue('hashed-password')
    mocks.genSalt.mockResolvedValue('salt')
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, retryAfter: 0 })
    mocks.userFindUnique.mockResolvedValue(null)
    mocks.otpFindUnique.mockResolvedValue({
      code: registration.otp,
      expires_at: new Date('2026-07-19T12:05:00Z'),
    })
    mocks.otpDelete.mockResolvedValue({})
    mocks.userUpdateMany.mockResolvedValue({ count: 1 })
    mocks.transaction.mockImplementation((callback) => callback({
      user: {
        findUnique: mocks.userFindUnique,
        create: mocks.userCreate,
      },
      otp: {
        findUnique: mocks.otpFindUnique,
        delete: mocks.otpDelete,
      },
    }))
  })

  it('validates OTP registration and never trusts client role or password hash', async () => {
    expect((await register(request('/api/register', { ...registration, password: 'short' }))).status).toBe(400)
    expect(mocks.userFindUnique).not.toHaveBeenCalled()

    mocks.userFindUnique.mockResolvedValueOnce({ id: 1 })
    expect((await register(request('/api/register', registration))).status).toBe(409)

    mocks.userFindUnique.mockResolvedValueOnce(null)
    mocks.userCreate.mockResolvedValue({ id: 7 })
    const response = await register(request('/api/register', { ...registration, role: 'super_admin' }))
    expect(response.status).toBe(201)
    expect(mocks.hash).toHaveBeenCalledWith('strong-password', 12)
    expect(mocks.userCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ password_hash: 'hashed-password', role: 'user' }) })
  })

  it('rejects OTP requests without email or for an existing account', async () => {
    expect((await sendOtp(request('/api/auth/send-otp', {}))).status).toBe(400)
    mocks.userFindUnique.mockResolvedValue({ id: 7 })
    expect((await sendOtp(request('/api/auth/send-otp', { email: 'buyer@example.com' }))).status).toBe(400)
    expect(mocks.otpUpsert).not.toHaveBeenCalled()
  })

  it('stores a six-digit OTP for five minutes before sending it to the requested email', async () => {
    const response = await sendOtp(request('/api/auth/send-otp', { email: 'new@example.com' }))

    expect(response.status).toBe(200)
    const otpWrite = mocks.otpUpsert.mock.calls[0][0]
    expect(otpWrite).toEqual({
      where: { email: 'new@example.com' },
      update: {
        code: expect.stringMatching(/^\d{6}$/),
        expires_at: new Date('2026-07-19T12:05:00Z'),
        created_at: new Date('2026-07-19T12:00:00Z'),
      },
      create: {
        email: 'new@example.com',
        code: expect.stringMatching(/^\d{6}$/),
        expires_at: new Date('2026-07-19T12:05:00Z'),
      },
    })
    expect(otpWrite.update.code).toBe(otpWrite.create.code)
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'new@example.com',
      html: expect.stringContaining(otpWrite.create.code),
    }))
  })

  it('retires the legacy OAuth completion endpoint instead of creating users', async () => {
    const response = await verifyAndRegister()
    expect(response.status).toBe(410)
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })

  it('does not reveal whether a forgot-password email exists', async () => {
    mocks.userFindUnique.mockResolvedValue(null)
    const missing = await forgotPassword(request('/api/auth/forgot-password', { email: 'missing@example.com' }))
    expect(missing.status).toBe(200)
    expect(await missing.json()).toEqual({ message: 'OK' })
    expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('stores a one-hour reset token and emails only the generated HTTPS link', async () => {
    mocks.userFindUnique.mockResolvedValue({ id: 7, email: 'buyer@example.com' })
    const response = await forgotPassword(request('/api/auth/forgot-password', { email: 'buyer@example.com' }))

    expect(response.status).toBe(200)
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { email: 'buyer@example.com' },
      data: {
        reset_token: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        reset_token_expires: new Date('2026-07-19T13:00:00Z'),
      },
    })
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith('buyer@example.com', expect.stringMatching(/^https:\/\/mushroomie\.io\.vn\/tai-khoan\/dat-lai-mat-khau\?token=[a-f0-9]{64}$/))
  })

  it('rejects weak or expired reset requests and consumes a valid token', async () => {
    const token = 'a'.repeat(64)
    const hashedToken = 'sha256:ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb'
    expect((await resetPassword(request('/api/auth/reset-password', { token, password: 'short' }))).status).toBe(400)
    mocks.userFindFirst.mockResolvedValueOnce(null)
    expect((await resetPassword(request('/api/auth/reset-password', { token, password: 'new-password' }))).status).toBe(400)
    expect(mocks.userFindFirst).toHaveBeenLastCalledWith({
      where: {
        reset_token: { in: [hashedToken, token] },
        reset_token_expires: { gt: new Date('2026-07-19T12:00:00Z') },
      },
      select: { id: true },
    })

    mocks.userFindFirst.mockResolvedValueOnce({ id: 7 })
    const response = await resetPassword(request('/api/auth/reset-password', { token, password: 'new-password' }))
    expect(response.status).toBe(200)
    expect(mocks.hash).toHaveBeenCalledWith('new-password', 'salt')
    expect(mocks.userUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 7,
        reset_token: { in: [hashedToken, token] },
        reset_token_expires: { gt: new Date('2026-07-19T12:00:00Z') },
      },
      data: {
        password_hash: 'hashed-password',
        is_email_verified: true,
        reset_token: null,
        reset_token_expires: null,
      },
    })
  })
})

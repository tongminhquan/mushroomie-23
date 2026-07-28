import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  otpFindUnique: vi.fn(),
  otpUpsert: vi.fn(),
  otpDelete: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
  sendMail: vi.fn(),
  createTransporter: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      findFirst: mocks.userFindFirst,
      create: mocks.userCreate,
      update: mocks.userUpdate,
    },
    otp: { findUnique: mocks.otpFindUnique, upsert: mocks.otpUpsert, delete: mocks.otpDelete },
  },
}))
vi.mock('bcryptjs', () => ({
  default: { hash: mocks.hash, genSalt: mocks.genSalt },
}))
vi.mock('@/lib/email', () => ({
  createTransporter: mocks.createTransporter,
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
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
}

describe('registration, OTP, and password recovery routes', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:00:00Z'))
    mocks.createTransporter.mockReturnValue({ sendMail: mocks.sendMail })
    mocks.sendMail.mockResolvedValue({ messageId: 'mail-1' })
    mocks.hash.mockResolvedValue('hashed-password')
    mocks.genSalt.mockResolvedValue('salt')
    mocks.userFindUnique.mockResolvedValue(null)
  })

  it('validates direct registration and never trusts client role or password hash', async () => {
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
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const response = await sendOtp(request('/api/auth/send-otp', { email: 'new@example.com' }))

    expect(response.status).toBe(200)
    expect(mocks.otpUpsert).toHaveBeenCalledWith({
      where: { email: 'new@example.com' },
      update: { code: '100000', expires_at: new Date('2026-07-19T12:05:00Z'), created_at: new Date('2026-07-19T12:00:00Z') },
      create: { email: 'new@example.com', code: '100000', expires_at: new Date('2026-07-19T12:05:00Z') },
    })
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'new@example.com', html: expect.stringContaining('100000') }))
  })

  it('rejects missing, wrong, and expired OTP values without creating a user', async () => {
    expect((await verifyAndRegister(request('/api/auth/verify-and-register', { email: 'new@example.com' }))).status).toBe(400)

    mocks.otpFindUnique.mockResolvedValueOnce({ code: '100000', expires_at: new Date('2026-07-19T12:05:00Z') })
    expect((await verifyAndRegister(request('/api/auth/verify-and-register', {
      email: 'new@example.com', otp: '999999', phone: '0901234567', address: '123 Đường Nấm',
    }))).status).toBe(400)

    mocks.otpFindUnique.mockResolvedValueOnce({ code: '100000', expires_at: new Date('2026-07-19T11:59:00Z') })
    expect((await verifyAndRegister(request('/api/auth/verify-and-register', {
      email: 'new@example.com', otp: '100000', phone: '0901234567', address: '123 Đường Nấm',
    }))).status).toBe(400)
    expect(mocks.userCreate).not.toHaveBeenCalled()
  })

  it('creates an email-verified OAuth user and consumes the OTP once', async () => {
    mocks.otpFindUnique.mockResolvedValue({ code: '100000', expires_at: new Date('2026-07-19T12:05:00Z') })
    mocks.userFindUnique.mockResolvedValue(null)
    mocks.userCreate.mockResolvedValue({ id: 8 })
    const response = await verifyAndRegister(request('/api/auth/verify-and-register', {
      email: 'new@example.com', otp: '100000', phone: '0901234567', address: '123 Đường Nấm', name: 'New User', google_id: 'google-8',
    }))

    expect(response.status).toBe(200)
    expect(mocks.userCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ email: 'new@example.com', is_email_verified: true, role: 'user' }) })
    expect(mocks.otpDelete).toHaveBeenCalledWith({ where: { email: 'new@example.com' } })
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
      data: { reset_token: expect.stringMatching(/^[a-f0-9]{64}$/), reset_token_expires: new Date('2026-07-19T13:00:00Z') },
    })
    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith('buyer@example.com', expect.stringMatching(/^https:\/\/mushroomie\.io\.vn\/tai-khoan\/dat-lai-mat-khau\?token=[a-f0-9]{64}$/))
  })

  it('rejects weak or expired reset requests and consumes a valid token', async () => {
    expect((await resetPassword(request('/api/auth/reset-password', { token: 'token', password: 'short' }))).status).toBe(400)
    mocks.userFindFirst.mockResolvedValueOnce(null)
    expect((await resetPassword(request('/api/auth/reset-password', { token: 'token', password: 'new-password' }))).status).toBe(400)
    expect(mocks.userFindFirst).toHaveBeenLastCalledWith({
      where: { reset_token: 'token', reset_token_expires: { gt: new Date('2026-07-19T12:00:00Z') } },
    })

    mocks.userFindFirst.mockResolvedValueOnce({ id: 7 })
    const response = await resetPassword(request('/api/auth/reset-password', { token: 'token', password: 'new-password' }))
    expect(response.status).toBe(200)
    expect(mocks.hash).toHaveBeenCalledWith('new-password', 'salt')
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { password_hash: 'hashed-password', reset_token: null, reset_token_expires: null },
    })
  })
})

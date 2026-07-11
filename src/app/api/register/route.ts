import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, timingSafeStringEqual } from '@/lib/security'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự').max(120),
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(128),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().trim().min(10, 'Vui lòng nhập địa chỉ cụ thể').max(1000),
  otp: z.string().regex(/^\d{6}$/, 'Mã OTP phải gồm 6 chữ số'),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = registerSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase()
    const [byIp, byEmail] = await Promise.all([
      checkRateLimit(request, 'register-ip', { limit: 10, windowMs: 60 * 60 * 1000 }),
      checkRateLimit(request, 'register-email', { limit: 5, windowMs: 60 * 60 * 1000, identity: email }),
    ])
    if (!byIp.allowed || !byEmail.allowed) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(byIp.retryAfter, byEmail.retryAfter)) } },
      )
    }

    const { name, password, phone, address, otp } = parsed.data
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.$transaction(async (tx) => {
      const [existing, otpRecord] = await Promise.all([
        tx.user.findUnique({ where: { email } }),
        tx.otp.findUnique({ where: { email } }),
      ])
      if (existing) throw new Error('EMAIL_EXISTS')
      if (!otpRecord || otpRecord.expires_at <= new Date() || !timingSafeStringEqual(otpRecord.code, otp)) {
        throw new Error('INVALID_OTP')
      }

      const created = await tx.user.create({
        data: {
          name,
          email,
          password_hash: passwordHash,
          phone,
          address,
          role: 'user',
          is_email_verified: true,
        },
      })
      await tx.otp.delete({ where: { email } })
      return created
    })

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return NextResponse.json({ error: { email: ['Email này đã được sử dụng'] } }, { status: 409 })
    }
    if (error instanceof Error && error.message === 'INVALID_OTP') {
      return NextResponse.json({ error: { otp: ['Mã OTP không đúng hoặc đã hết hạn'] } }, { status: 400 })
    }
    console.error('[REGISTER]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

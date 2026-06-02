import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTransporter } from '@/lib/email'

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Thiếu email' }, { status: 400 })
    }

    // Check if email already exists in User
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email đã tồn tại trong hệ thống' }, { status: 400 })
    }

    const code = generateOTP()
    const expires_at = new Date(Date.now() + 5 * 60 * 1000) // 5 mins expiration

    // Upsert the OTP in the database
    await prisma.otp.upsert({
      where: { email },
      update: { code, expires_at, created_at: new Date() },
      create: { email, code, expires_at },
    })

    // Send email
    const transporter = createTransporter()
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center;">
        <h2 style="color: #d946ef;">Mã Xác Nhận OTP</h2>
        <p>Chào bạn,</p>
        <p>Mã xác nhận (OTP) để hoàn tất đăng ký tài khoản của bạn là:</p>
        <div style="font-size: 32px; font-weight: bold; color: #333; margin: 20px 0; letter-spacing: 4px;">
          ${code}
        </div>
        <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <p>Trân trọng,<br>Đội ngũ Mushroomie</p>
      </div>
    `

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Mushroomie <noreply@mushroomie.vn>',
      to: email,
      subject: 'Mã Xác Nhận Đăng Ký Tài Khoản - Mushroomie',
      html,
    })

    return NextResponse.json({ success: true, message: 'Đã gửi mã OTP' })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Không thể gửi OTP' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/security'
import {
  createPasswordResetToken,
  hashPasswordResetToken,
} from '@/lib/password-reset-token'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: 'Vui lòng nhập email.' }, { status: 400 })
    }

    // Chống lạm dụng gửi email reset (email bombing) theo IP và theo email
    const [byIp, byEmail] = await Promise.all([
      checkRateLimit(req, 'forgot-pw-ip', { limit: 10, windowMs: 60 * 60 * 1000 }),
      checkRateLimit(req, 'forgot-pw-email', { limit: 5, windowMs: 60 * 60 * 1000, identity: email.toLowerCase() }),
    ])
    if (!byIp.allowed || !byEmail.allowed) {
      // Vẫn trả OK để không lộ thông tin, nhưng không thực hiện gửi mail
      return NextResponse.json({ message: 'OK' }, { status: 200 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Vì lý do bảo mật, nếu không tìm thấy user, ta vẫn trả về OK để tránh dò quét email
    if (!user) {
      return NextResponse.json({ message: 'OK' }, { status: 200 })
    }

    // Sinh token ngẫu nhiên
    const resetToken = createPasswordResetToken()
    const resetTokenExpires = new Date(Date.now() + 3600000) // Hết hạn sau 1 giờ

    await prisma.user.update({
      where: { email },
      data: {
        reset_token: hashPasswordResetToken(resetToken),
        reset_token_expires: resetTokenExpires,
      },
    })

    const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'
    const resetUrl = `${domain}/tai-khoan/dat-lai-mat-khau?token=${resetToken}`

    // Gửi email
    await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ message: 'OK' }, { status: 200 })
  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error)
    return NextResponse.json({ message: 'Lỗi máy chủ nội bộ.' }, { status: 500 })
  }
}

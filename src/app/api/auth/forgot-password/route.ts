import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: 'Vui lòng nhập email.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Vì lý do bảo mật, nếu không tìm thấy user, ta vẫn trả về OK để tránh dò quét email
    if (!user) {
      return NextResponse.json({ message: 'OK' }, { status: 200 })
    }

    // Sinh token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpires = new Date(Date.now() + 3600000) // Hết hạn sau 1 giờ

    await prisma.user.update({
      where: { email },
      data: {
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      },
    })

    const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${domain}/tai-khoan/dat-lai-mat-khau?token=${resetToken}`

    // Gửi email
    await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ message: 'OK' }, { status: 200 })
  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error)
    return NextResponse.json({ message: 'Lỗi máy chủ nội bộ.' }, { status: 500 })
  }
}

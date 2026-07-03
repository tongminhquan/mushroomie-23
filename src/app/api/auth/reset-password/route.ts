import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/security'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    // Chống dò/brute-force reset token
    const rl = checkRateLimit(req, 'reset-pw-ip', { limit: 20, windowMs: 15 * 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ message: 'Thiếu thông tin bắt buộc.' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ message: 'Mật khẩu phải có ít nhất 8 ký tự.' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: {
          gt: new Date(), // Phải chưa hết hạn
        },
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'Đường dẫn không hợp lệ hoặc đã hết hạn.' }, { status: 400 })
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Cập nhật user và xóa token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
      },
    })

    return NextResponse.json({ message: 'Đổi mật khẩu thành công.' }, { status: 200 })
  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error)
    return NextResponse.json({ message: 'Lỗi máy chủ nội bộ.' }, { status: 500 })
  }
}

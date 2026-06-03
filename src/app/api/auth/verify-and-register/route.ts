import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, otp, phone, address, name, avatar, google_id } = await request.json()

    if (!email || !otp || !phone || !address) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' }, { status: 400 })
    }

    // Check OTP
    const otpRecord = await prisma.otp.findUnique({ where: { email } })
    if (!otpRecord) {
      return NextResponse.json({ error: 'Chưa có yêu cầu gửi OTP nào hoặc OTP đã bị xóa' }, { status: 400 })
    }

    if (otpRecord.code !== otp) {
      return NextResponse.json({ error: 'Mã OTP không chính xác' }, { status: 400 })
    }

    if (new Date() > otpRecord.expires_at) {
      return NextResponse.json({ error: 'Mã OTP đã hết hạn. Vui lòng gửi lại' }, { status: 400 })
    }

    // Verify successful -> Create or update user
    // Double check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } })
    
    let userId;

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          name: name || existingUser.name,
          phone,
          address,
          avatar: avatar || existingUser.avatar,
          google_id: google_id || existingUser.google_id,
          is_email_verified: true,
        }
      })
      userId = updatedUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || 'Người dùng Google',
          password_hash: '', // No password for OAuth
          phone,
          address,
          avatar: avatar || null,
          google_id: google_id || null,
          is_email_verified: true, // Verified via OTP
          role: 'user',
        }
      })
      userId = newUser.id;
    }

    // Delete OTP
    await prisma.otp.delete({ where: { email } })

    return NextResponse.json({ success: true, message: 'Đăng ký/Cập nhật thành công', userId })
  } catch (error) {
    console.error('Verify and register error:', error)
    return NextResponse.json({ error: 'Có lỗi xảy ra trong quá trình đăng ký' }, { status: 500 })
  }
}

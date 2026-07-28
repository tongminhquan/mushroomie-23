import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isSafeAvatarPath } from '@/lib/avatar'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { avatar } = await request.json()
    if (!isSafeAvatarPath(avatar)) {
      return NextResponse.json({ error: 'Thiếu đường dẫn ảnh' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { avatar },
    })

    return NextResponse.json({
      success: true,
      avatar: updatedUser.avatar
    })
  } catch (error) {
    console.error('Update avatar error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

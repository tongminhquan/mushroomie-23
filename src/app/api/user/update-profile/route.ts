import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại phải từ 9 đến 11 số'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  avatar: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, phone, address, avatar } = parsed.data

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, phone, address, ...(avatar !== undefined && { avatar }) },
    })

    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

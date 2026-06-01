import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').trim(),
  email: z.string().email('Email không hợp lệ').trim(),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và gồm 10-11 số)'),
  address: z.string().min(10, 'Vui lòng nhập địa chỉ cụ thể (ít nhất 10 ký tự)').trim(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, email, password, phone, address } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: { email: ['Email này đã được sử dụng'] } }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: { name, email, password_hash: password, phone, address, role: 'user' },
    })

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

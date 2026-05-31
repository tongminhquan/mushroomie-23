import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập họ tên'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Nội dung ít nhất 10 ký tự'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const contact = await prisma.contact.create({ data: parsed.data })
    return NextResponse.json({ success: true, id: contact.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contacts = await prisma.contact.findMany({
      where: status ? { status } : {},
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(contacts)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

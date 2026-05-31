import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const { status } = await request.json()
    const contact = await prisma.contact.update({ where: { id: Number(id) }, data: { status } })
    return NextResponse.json(contact)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await req.json()
    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent removing admin from oneself
    if (parseInt(params.id) === parseInt(session.user.id as string) && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin rights' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: { role }
    })

    return NextResponse.json({ success: true, role: user.role })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

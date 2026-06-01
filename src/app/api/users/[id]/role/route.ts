import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAdminAction } from '@/lib/admin-logger'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const userId = parseInt(resolvedParams.id)

    const { role } = await req.json()
    if (!['super_admin', 'admin', 'viewer', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent removing admin from oneself
    if (userId === parseInt(session.user.id as string) && role !== 'super_admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin rights' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role }
    })

    await logAdminAction({
      userId: Number(session.user.id),
      action: 'UPDATE',
      entity: 'USER',
      details: { id: user.id, email: user.email, new_role: role },
      ipAddress: req.headers.get('x-forwarded-for') || undefined
    })

    return NextResponse.json({ success: true, role: user.role })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { PROTECTED_SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { logAdminAction } from '@/lib/admin-logger'
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const userId = parseInt(resolvedParams.id)

    // Prevent deleting oneself
    if (userId === parseInt(session.user.id as string)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.email.toLowerCase() === PROTECTED_SUPER_ADMIN_EMAIL.toLowerCase()) {
      await logAdminAction({
        userId: Number(session.user.id),
        action: 'DELETE',
        entity: 'USER',
        details: { targetEmail: targetUser.email, reason: 'SECURITY: Attempted to delete protected super admin' },
        ipAddress: req.headers.get('x-forwarded-for') || undefined
      })
      return NextResponse.json({ error: 'Không được phép xóa tài khoản super admin gốc.' }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

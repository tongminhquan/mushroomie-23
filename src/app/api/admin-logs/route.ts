import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized. Only super_admin can view logs.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const skip = (page - 1) * limit

    const where: any = {}
    if (action) where.action = action
    if (entity) where.entity = entity

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, role: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching admin logs:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

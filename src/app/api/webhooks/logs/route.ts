import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 50)
    
    const [logs, total] = await prisma.$transaction([
      prisma.paymentWebhookEvent.findMany({
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentWebhookEvent.count(),
    ])

    return NextResponse.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[WEBHOOK_LOGS_GET]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin', 'viewer'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 20)
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const where: any = {}
    if (provider) where.provider = provider
    if (status) where.status = status
    if (search) {
      where.OR = [
        { event_id: { contains: search } },
        { transaction_code: { contains: search } },
      ]
    }

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [logs, totalFiltered, totalAll, totalProcessed, totalFailed, last24hCount] = await prisma.$transaction([
      prisma.paymentWebhookEvent.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.paymentWebhookEvent.count({ where }),
      prisma.paymentWebhookEvent.count(),
      prisma.paymentWebhookEvent.count({ where: { status: 'PROCESSED' } }),
      prisma.paymentWebhookEvent.count({ where: { status: 'FAILED' } }),
      prisma.paymentWebhookEvent.count({ where: { created_at: { gte: last24h } } }),
    ])

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, limit, total: totalFiltered, totalPages: Math.ceil(totalFiltered / limit) },
      summary: {
        total: totalAll,
        processed: totalProcessed,
        failed: totalFailed,
        last24h: last24hCount
      }
    })
  } catch (error) {
    console.error('[WEBHOOK_LOGS_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // This endpoint should ideally only be enabled in non-production environments
    // But since the user requested a safe test mechanism, we'll restrict it to admins.
    
    const body = await request.json().catch(() => ({}))
    const provider = body.provider || 'test_provider'
    const status = body.status || 'RECEIVED'

    const testEvent = await prisma.paymentWebhookEvent.create({
      data: {
        provider: provider,
        event_id: `test-evt-${Date.now()}`,
        transaction_code: `TEST-TXN-${Date.now()}`,
        amount: body.amount || 50000,
        currency: 'VND',
        raw_payload: { test: true, message: "This is a test webhook" },
        sanitized_headers: { 'user-agent': 'Mushroomie-Tester/1.0' },
        signature: '[TEST_SIGNATURE]',
        status: status,
        message: body.message || 'Generated test webhook log',
        error_message: status === 'FAILED' ? 'Test failure reason' : null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'Tester',
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Test log created successfully',
      data: testEvent
    })
  } catch (error) {
    console.error('[WEBHOOK_LOGS_TEST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const

export async function GET() {
  try {
    const snapshot = await getShippingFeeSnapshot()
    return NextResponse.json(snapshot, { headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('[SHIPPING FEE GET]', error)
    return NextResponse.json(
      { error: 'Không thể tải phí vận chuyển' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}

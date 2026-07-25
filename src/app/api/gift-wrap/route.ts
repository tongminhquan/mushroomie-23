import { NextResponse } from 'next/server'
import { getGiftWrapSnapshot } from '@/lib/gift-wrap-server'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const

/** Giá gói quà hiện hành cho client (không cache để admin đổi giá là thấy ngay). */
export async function GET() {
  try {
    const snapshot = await getGiftWrapSnapshot()
    return NextResponse.json(snapshot, { headers: NO_STORE_HEADERS })
  } catch (error) {
    console.error('[GIFT WRAP GET]', error)
    return NextResponse.json(
      { error: 'Không thể tải phí gói quà' },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}

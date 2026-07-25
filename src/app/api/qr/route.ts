import { NextRequest, NextResponse } from 'next/server'
import { parseAllowedQrUrl, readResponseBodyWithLimit } from '@/lib/qr-proxy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing URL', { status: 400 })

  let target: URL
  try {
    target = parseAllowedQrUrl(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        Accept: 'image/png,image/*',
        'User-Agent': 'Mozilla/5.0 Mushroomie QR Proxy',
      },
    })

    if (res.status >= 300 && res.status < 400) {
      throw new Error('QR provider redirect rejected')
    }
    if (!res.ok) throw new Error(`Failed to fetch QR: ${res.status}`)
    const contentType = res.headers.get('content-type') || 'image/png'
    if (!contentType.startsWith('image/')) {
      throw new Error(`QR provider returned ${contentType}`)
    }

    const buffer = await readResponseBodyWithLimit(res)
    const body = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[QR PROXY]', error)
    return new NextResponse('Error fetching QR', { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}

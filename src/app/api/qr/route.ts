import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing URL', { status: 400 })

  let target: URL
  try {
    target = new URL(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  if (target.protocol !== 'https:' || target.hostname !== 'img.vietqr.io') {
    return new NextResponse('Unsupported QR host', { status: 400 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'image/png,image/*',
        'User-Agent': 'Mozilla/5.0 Mushroomie QR Proxy',
      },
    })

    if (!res.ok) throw new Error(`Failed to fetch QR: ${res.status}`)
    const contentType = res.headers.get('content-type') || 'image/png'
    if (!contentType.startsWith('image/')) {
      throw new Error(`QR provider returned ${contentType}`)
    }

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
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

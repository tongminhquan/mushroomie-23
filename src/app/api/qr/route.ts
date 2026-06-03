import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing URL', { status: 400 })

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch QR')
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return new NextResponse('Error fetching QR', { status: 500 })
  }
}

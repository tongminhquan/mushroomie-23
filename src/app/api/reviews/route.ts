import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkRateLimit } from '@/lib/security'
import { z } from 'zod'

const reviewSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(5),
  rating: z.number().int().min(1).max(5),
  product_id: z.number().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured') === 'true'
    const status = searchParams.get('status')
    const session = await auth()
    const isAdmin = (session?.user as any)?.role === 'admin'

    const where: any = {}
    if (featured) { where.is_featured = true; where.status = 'approved' }
    else if (isAdmin && status) where.status = status
    else if (!isAdmin) where.status = 'approved'

    const reviews = await prisma.review.findMany({
      where,
      include: { product: { select: { id: true, name: true, slug: true } } },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(reviews)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Chống spam đánh giá vào hàng chờ duyệt
    const rl = await checkRateLimit(request, 'reviews-post-ip', { limit: 5, windowMs: 10 * 60 * 1000 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Bạn gửi đánh giá quá nhanh. Vui lòng thử lại sau.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      )
    }

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const review = await prisma.review.create({ data: { ...parsed.data, status: 'pending' } })
    return NextResponse.json(review, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

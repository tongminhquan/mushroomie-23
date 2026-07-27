import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidateReview } from '@/lib/review-revalidate'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const review = await prisma.review.update({
      where: { id: Number(id) },
      data: body,
      include: { product: { select: { slug: true } } },
    })
    // Duyệt / bỏ duyệt / đổi is_featured đều đổi nội dung trang chủ và trang sản phẩm.
    revalidateReview(review.product?.slug)
    return NextResponse.json(review)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    // Đọc slug trước khi xoá — sau khi xoá không còn quan hệ để lấy.
    const existing = await prisma.review.findUnique({
      where: { id: Number(id) },
      select: { product: { select: { slug: true } } },
    })
    await prisma.review.delete({ where: { id: Number(id) } })
    revalidateReview(existing?.product?.slug)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

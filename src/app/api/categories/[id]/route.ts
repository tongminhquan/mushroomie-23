import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    await prisma.category.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'Không thể xóa danh mục này, có thể đang có dữ liệu sử dụng.' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const body = await request.json()
    const { name, slug, image_url } = body

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(image_url !== undefined && { image_url }),
      }
    })
    return NextResponse.json({ category })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại, vui lòng chọn slug khác' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

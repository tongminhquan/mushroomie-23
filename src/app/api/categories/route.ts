import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const categories = await prisma.category.findMany({
      where: type ? { type } : {},
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, type, description, image_url, icon } = body
    if (!name || !slug) return NextResponse.json({ error: 'Tên và slug là bắt buộc' }, { status: 400 })
    const category = await prisma.category.create({
      data: { name, slug, type: type || 'post', description: description || null, image_url: image_url || null, icon: icon || null },
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Slug đã tồn tại, vui lòng chọn slug khác' }, { status: 409 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

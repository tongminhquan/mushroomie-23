import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'
import { logAdminAction } from '@/lib/admin-logger'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // Support both numeric id and slug
    const isNumeric = /^\d+$/.test(id)
    const product = await prisma.product.findFirst({
      where: isNumeric ? { id: Number(id) } : { slug: id },
      include: {
        category: true,
        images: { orderBy: { sort_order: 'asc' } },
        options: true,
        reviews: { where: { status: 'approved' }, take: 10 },
      },
    })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    if (body.name && !body.slug) body.slug = generateSlug(body.name)
    
    const { images, ...productData } = body
    
    const product = await prisma.product.update({ 
      where: { id: Number(id) }, 
      data: {
        ...productData,
        images: images !== undefined ? {
          deleteMany: {},
          create: images.map((url: string, index: number) => ({
            image_url: url,
            sort_order: index,
          }))
        } : undefined
      } 
    })
    
    await logAdminAction({
      userId: Number(session.user.id),
      action: 'UPDATE',
      entity: 'PRODUCT',
      details: { id: product.id, name: product.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })
    
    return NextResponse.json(product)
  } catch (error) {
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
    const deleted = await prisma.product.delete({ where: { id: Number(id) } })
    
    await logAdminAction({
      userId: Number(session.user.id),
      action: 'DELETE',
      entity: 'PRODUCT',
      details: { id: deleted.id, name: deleted.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

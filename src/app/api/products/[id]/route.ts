import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { normalizeProductSlugInput } from '@/lib/product-slug'
import { logAdminAction } from '@/lib/admin-logger'
import { sanitizeHtml } from '@/lib/sanitize'
import { revalidateProduct } from '@/lib/product-revalidate'
import { z } from 'zod'

const productUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().max(200).optional(),
  short_description: z.string().max(2000).optional().nullable(),
  description: z.string().max(200_000).optional().nullable(),
  price: z.number().positive().optional(),
  sale_price: z.number().positive().optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  is_customizable: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  featured_image: z.string().max(2000).optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  images: z.array(z.string().max(2000)).max(50).optional(),
}).strict()

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
    const parsed = productUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const body = parsed.data
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
      select: { slug: true },
    })
    if (body.slug !== undefined) {
      const slug = normalizeProductSlugInput(body.slug, undefined)
      if (!slug) {
        return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 })
      }
      body.slug = slug
    }
    
    const { images, ...productData } = body
    productData.description = productData.description ? sanitizeHtml(productData.description) : productData.description
    
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
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug hoặc SKU đã tồn tại' }, { status: 409 })
    }
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

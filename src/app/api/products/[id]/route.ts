import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { normalizeProductSlugInput } from '@/lib/product-slug'
import { logAdminAction } from '@/lib/admin-logger'
import { sanitizeHtml } from '@/lib/sanitize'
import { revalidateProduct } from '@/lib/product-revalidate'
import { createProductUpdateSchema } from '@/lib/product-validation'
import {
  recordAndRevalidatePublication,
  shouldRecordProductPublication,
} from '@/lib/seo-discovery/publication'
import { buildPublicContentUrl } from '@/lib/seo-discovery/urls'

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
    const existing = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        images: {
          select: { image_url: true, sort_order: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const parsed = createProductUpdateSchema({
      price: Number(existing.price),
      sale_price: existing.sale_price === null ? null : Number(existing.sale_price),
    }).safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const body = parsed.data
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
      },
      include: {
        images: {
          select: { image_url: true, sort_order: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    })
    
    await logAdminAction({
      userId: Number(session.user.id),
      action: 'UPDATE',
      entity: 'PRODUCT',
      details: { id: product.id, name: product.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })

    if (shouldRecordProductPublication(existing, product)) {
      const publication = {
        source: 'product' as const,
        sourceId: product.id,
        url: buildPublicContentUrl('product', product.slug),
        contentUpdatedAt: product.updated_at,
        reason: existing.status === 'active' ? 'updated' as const : 'activated' as const,
      }
      const previousUrl = existing.slug !== product.slug
        ? buildPublicContentUrl('product', existing.slug)
        : undefined

      await recordAndRevalidatePublication(
        publication,
        ...(previousUrl ? [{ previousUrl }] as const : [] as const),
      )
    } else {
      revalidateProduct(existing.slug, product.slug)
    }

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

    revalidateProduct(deleted.slug)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { normalizeProductSlugInput } from '@/lib/product-slug'
import { logAdminAction } from '@/lib/admin-logger'
import { sanitizeHtml } from '@/lib/sanitize'
import { revalidateProduct } from '@/lib/product-revalidate'
import { productCreateSchema } from '@/lib/product-validation'
import { recordAndRevalidatePublication } from '@/lib/seo-discovery/publication'
import { buildPublicContentUrl } from '@/lib/seo-discovery/urls'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 12)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const status = searchParams.get('status') || 'active'
    const featured = searchParams.get('featured')

    const where: any = {}
    if (status !== 'all') where.status = status
    if (category) where.category = { slug: category }
    if (search) where.name = { contains: search }
    if (featured === 'true') where.is_featured = true

    const orderBy: any = {}
    switch (sort) {
      case 'price_asc': orderBy.price = 'asc'; break
      case 'price_desc': orderBy.price = 'desc'; break
      case 'oldest': orderBy.created_at = 'asc'; break
      default: orderBy.created_at = 'desc'
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = productCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { images, description, short_description, ...productData } = parsed.data

    const slug = normalizeProductSlugInput(productData.slug, productData.name)
    if (!slug) {
      return NextResponse.json({ error: 'Invalid product slug' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: { 
        ...productData, 
        slug,
        description: description ? sanitizeHtml(description) : undefined,
        short_description: short_description ? sanitizeHtml(short_description) : undefined,
        images: images?.length ? {
          create: images.map((url, index) => ({
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
      action: 'CREATE',
      entity: 'PRODUCT',
      details: { id: product.id, name: product.name },
      ipAddress: request.headers.get('x-forwarded-for') || undefined
    })

    if (product.status === 'active') {
      await recordAndRevalidatePublication({
        source: 'product',
        sourceId: product.id,
        url: buildPublicContentUrl('product', product.slug),
        contentUpdatedAt: product.updated_at,
        reason: 'created',
      })
    } else {
      revalidateProduct(product.slug)
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug hoặc SKU đã tồn tại' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

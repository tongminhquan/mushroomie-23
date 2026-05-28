import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { generateSlug } from '@/lib/utils'

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  sale_price: z.number().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  is_customizable: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  featured_image: z.string().optional().nullable(),
  category_id: z.number().optional().nullable(),
})

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
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = productSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const slug = parsed.data.slug || generateSlug(parsed.data.name)
    const product = await prisma.product.create({
      data: { ...parsed.data, slug },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Slug hoặc SKU đã tồn tại' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

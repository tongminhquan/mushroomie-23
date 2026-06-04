import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const bannerSchema = z.object({
  image_url: z.string().min(1),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  button_text: z.string().optional().nullable(),
  button_link: z.string().optional().nullable(),
  secondary_button_text: z.string().optional().nullable(),
  secondary_button_link: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  text_position: z.string().default('bottom-left'),
  text_size: z.string().default('medium'),
  brightness: z.number().int().default(100),
  sort_order: z.number().int().default(0),
  status: z.string().default('active'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status) {
      where.status = status
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { sort_order: 'asc' },
    })
    return NextResponse.json(banners)
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
    const parsed = bannerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const banner = await prisma.banner.create({
      data: parsed.data,
    })
    return NextResponse.json(banner, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

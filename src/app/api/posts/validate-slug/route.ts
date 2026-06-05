import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !['super_admin', 'admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug, excludeId } = await request.json()
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const where: any = { slug }
    if (excludeId) {
      where.id = { not: Number(excludeId) }
    }

    const existing = await prisma.post.findFirst({ where })

    if (existing) {
      // Generate suggestion by appending number
      let suggestion = slug
      let counter = 2
      while (true) {
        suggestion = `${slug}-${counter}`
        const check = await prisma.post.findFirst({ where: { slug: suggestion } })
        if (!check) break
        counter++
        if (counter > 100) break
      }
      return NextResponse.json({ available: false, suggestion })
    }

    return NextResponse.json({ available: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

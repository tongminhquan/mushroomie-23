import { readFile } from 'node:fs/promises'
import fs from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeUploadPurpose, optimizeUploadImage, type CropData } from '@/lib/image-processing'

import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const uploadDir = join(process.cwd(), 'public', 'uploads')

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const data = await request.json()
    const { filename, cropData, overwrite } = data
    const purpose = normalizeUploadPurpose(data.purpose || data.kind)

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    if (filename.includes('/') || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    const inputPath = join(uploadDir, filename)
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const buffer = await readFile(inputPath)
    const result = await optimizeUploadImage({
      buffer,
      purpose,
      uploadDir,
      cropData: normalizeCropData(cropData),
    })

    if (overwrite) {
      await updateImageReferences(`/uploads/${filename}`, result.url)
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Process image error:', error)
    const message = error instanceof Error ? error.message : 'Process failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function normalizeCropData(value: unknown): CropData | null {
  if (!value || typeof value !== 'object') return null
  const crop = value as Partial<CropData>
  const x = Number(crop.x)
  const y = Number(crop.y)
  const width = Number(crop.width)
  const height = Number(crop.height)
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null
  return { x, y, width, height }
}

async function updateImageReferences(oldUrl: string, newUrl: string) {
  await Promise.all([
    prisma.product.updateMany({ where: { featured_image: oldUrl }, data: { featured_image: newUrl } }),
    prisma.productImage.updateMany({ where: { image_url: oldUrl }, data: { image_url: newUrl } }),
    prisma.category.updateMany({ where: { image_url: oldUrl }, data: { image_url: newUrl } }),
    prisma.category.updateMany({ where: { icon: oldUrl }, data: { icon: newUrl } }),
    prisma.post.updateMany({ where: { featured_image: oldUrl }, data: { featured_image: newUrl } }),
    prisma.post.updateMany({ where: { og_image: oldUrl }, data: { og_image: newUrl } }),
    prisma.post.updateMany({ where: { twitter_image: oldUrl }, data: { twitter_image: newUrl } }),
    prisma.banner.updateMany({ where: { image_url: oldUrl }, data: { image_url: newUrl } }),
    prisma.user.updateMany({ where: { avatar: oldUrl }, data: { avatar: newUrl } }),
    prisma.review.updateMany({ where: { avatar: oldUrl }, data: { avatar: newUrl } }),
  ])

  const [posts, products] = await Promise.all([
    prisma.post.findMany({ where: { content: { contains: oldUrl } }, select: { id: true, content: true } }),
    prisma.product.findMany({
      where: {
        OR: [
          { description: { contains: oldUrl } },
          { short_description: { contains: oldUrl } },
        ],
      },
      select: { id: true, description: true, short_description: true },
    }),
  ])

  await Promise.all([
    ...posts.map((post) =>
      prisma.post.update({
        where: { id: post.id },
        data: { content: post.content?.replaceAll(oldUrl, newUrl) },
      }),
    ),
    ...products.map((product) =>
      prisma.product.update({
        where: { id: product.id },
        data: {
          description: product.description?.replaceAll(oldUrl, newUrl),
          short_description: product.short_description?.replaceAll(oldUrl, newUrl),
        },
      }),
    ),
  ])
}

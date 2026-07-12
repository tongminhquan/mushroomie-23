import fs from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'

const apply = process.argv.includes('--apply')
const prisma = new PrismaClient()
const uploadDir = path.join(process.cwd(), 'public', 'uploads')
const widths = [750, 1280]

try {
  const banners = await prisma.banner.findMany({ select: { id: true, image_url: true } })
  const localBanners = banners.filter((banner) => /^\/uploads\/[a-zA-Z0-9-]+\.webp$/.test(banner.image_url || ''))

  console.log(`${apply ? 'Apply' : 'Dry-run'}: ${localBanners.length} banner(s)`)

  for (const banner of localBanners) {
    const filename = path.basename(banner.image_url)
    const sourcePath = path.join(uploadDir, filename)

    try {
      await fs.access(sourcePath)
    } catch {
      console.warn(`Skip missing source: ${banner.image_url}`)
      continue
    }

    for (const width of widths) {
      const outputPath = path.join(uploadDir, `${path.parse(filename).name}-${width}.webp`)
      console.log(`${apply ? 'Create' : 'Would create'}: ${path.basename(outputPath)}`)
      if (!apply) continue

      await sharp(sourcePath)
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 5 })
        .toFile(outputPath)
    }
  }
} finally {
  await prisma.$disconnect()
}

#!/usr/bin/env node

const fs = require('node:fs/promises')
const fsSync = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const sharp = require('sharp')
const dotenv = require('dotenv')
const { PrismaClient } = require('@prisma/client')

dotenv.config()

const prisma = new PrismaClient()
const projectRoot = process.cwd()
const uploadDir = path.join(projectRoot, 'public', 'uploads')
const mappingDir = path.join(projectRoot, 'backups', 'mappings')
const apply = process.argv.includes('--apply')
const dryRun = process.argv.includes('--dry-run') || !apply

const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i
const siteOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.PUBLIC_BASE_URL,
  'https://mushroomie.io.vn',
  'http://mushroomie.io.vn',
  'https://www.mushroomie.io.vn',
  'http://www.mushroomie.io.vn',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
].filter(Boolean)

const maxWidthByPurpose = {
  banner: 1920,
  product: 1200,
  post: 1200,
  media: 1200,
  category: 512,
  icon: 512,
  avatar: 512,
}

async function main() {
  const files = await listUploadImages()
  const references = await collectReferences()
  const mapping = []
  let totalBefore = 0
  let totalAfter = 0
  let converted = 0
  let skipped = 0

  await fs.mkdir(mappingDir, { recursive: true })

  for (const file of files) {
    const oldPath = `/uploads/${file}`
    const sourcePath = path.join(uploadDir, file)
    const stat = await fs.stat(sourcePath)
    totalBefore += stat.size

    const purposes = references.byPath.get(oldPath) || new Set(['media'])
    const purpose = pickPurpose(purposes)
    const width = maxWidthByPurpose[purpose]
    const newFilename = `${crypto.randomUUID()}.webp`
    const newPath = `/uploads/${newFilename}`
    const outputPath = path.join(uploadDir, newFilename)

    if (!apply) {
      mapping.push({ oldPath, newPath, sourceBytes: stat.size, outputBytes: null, purpose, maxWidth: width, dryRun: true })
      continue
    }

    try {
      const output = await sharp(sourcePath, { failOn: 'warning', animated: false })
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 5 })
        .toBuffer({ resolveWithObject: true })

      await fs.writeFile(outputPath, output.data)
      const outputStat = await fs.stat(outputPath)
      totalAfter += outputStat.size
      converted += 1
      mapping.push({
        oldPath,
        newPath,
        sourceBytes: stat.size,
        outputBytes: outputStat.size,
        width: output.info.width,
        height: output.info.height,
        purpose,
        maxWidth: width,
      })
    } catch (error) {
      skipped += 1
      mapping.push({ oldPath, newPath: null, sourceBytes: stat.size, outputBytes: null, purpose, maxWidth: width, error: error.message })
    }
  }

  let dbUpdates = null
  if (apply) {
    dbUpdates = await updateDatabaseReferences(mapping.filter((item) => item.newPath))
  }

  const report = {
    mode: dryRun ? 'dry-run' : 'apply',
    createdAt: new Date().toISOString(),
    uploadDir,
    filesScanned: files.length,
    converted,
    skipped,
    totalBefore,
    totalAfter,
    estimatedBefore: dryRun ? totalBefore : undefined,
    dbUpdates,
    mapping,
  }

  const reportPath = path.join(mappingDir, `upload-webp-mapping-${timestamp()}.json`)
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))

  console.log(JSON.stringify({
    mode: report.mode,
    filesScanned: report.filesScanned,
    converted: report.converted,
    skipped: report.skipped,
    totalBefore: report.totalBefore,
    totalAfter: report.totalAfter,
    savedBytes: report.totalAfter ? report.totalBefore - report.totalAfter : null,
    dbUpdates: report.dbUpdates,
    reportPath,
  }, null, 2))
}

async function listUploadImages() {
  if (!fsSync.existsSync(uploadDir)) return []
  const files = await fs.readdir(uploadDir)
  return files.filter((file) => imagePattern.test(file))
}

async function collectReferences() {
  const byPath = new Map()
  const add = (value, purpose) => {
    const normalized = normalizeUploadPath(value)
    if (!normalized) return
    if (!byPath.has(normalized)) byPath.set(normalized, new Set())
    byPath.get(normalized).add(purpose)
  }

  const [products, productImages, categories, posts, banners, users, reviews] = await Promise.all([
    prisma.product.findMany({ select: { featured_image: true, description: true, short_description: true } }),
    prisma.productImage.findMany({ select: { image_url: true } }),
    prisma.category.findMany({ select: { image_url: true, icon: true } }),
    prisma.post.findMany({ select: { featured_image: true, og_image: true, twitter_image: true, content: true } }),
    prisma.banner.findMany({ select: { image_url: true } }),
    prisma.user.findMany({ select: { avatar: true } }),
    prisma.review.findMany({ select: { avatar: true } }),
  ])

  products.forEach((item) => add(item.featured_image, 'product'))
  productImages.forEach((item) => add(item.image_url, 'product'))
  categories.forEach((item) => {
    add(item.image_url, 'category')
    add(item.icon, 'icon')
  })
  posts.forEach((item) => {
    add(item.featured_image, 'post')
    add(item.og_image, 'post')
    add(item.twitter_image, 'post')
  })
  banners.forEach((item) => add(item.image_url, 'banner'))
  users.forEach((item) => add(item.avatar, 'avatar'))
  reviews.forEach((item) => add(item.avatar, 'avatar'))

  for (const post of posts) {
    extractUploadPaths(post.content).forEach((src) => add(src, 'post'))
  }
  for (const product of products) {
    extractUploadPaths(product.description).forEach((src) => add(src, 'product'))
    extractUploadPaths(product.short_description).forEach((src) => add(src, 'product'))
  }

  return { byPath }
}

async function updateDatabaseReferences(mapping) {
  const map = new Map(mapping.map((item) => [item.oldPath, item.newPath]))
  const stats = {
    products: 0,
    productImages: 0,
    categories: 0,
    posts: 0,
    banners: 0,
    users: 0,
    reviews: 0,
    richTextRows: 0,
  }

  await updateRows('product', await prisma.product.findMany({ select: { id: true, featured_image: true } }), ['featured_image'], stats, 'products', map)
  await updateRows('productImage', await prisma.productImage.findMany({ select: { id: true, image_url: true } }), ['image_url'], stats, 'productImages', map)
  await updateRows('category', await prisma.category.findMany({ select: { id: true, image_url: true, icon: true } }), ['image_url', 'icon'], stats, 'categories', map)
  await updateRows('post', await prisma.post.findMany({ select: { id: true, featured_image: true, og_image: true, twitter_image: true } }), ['featured_image', 'og_image', 'twitter_image'], stats, 'posts', map)
  await updateRows('banner', await prisma.banner.findMany({ select: { id: true, image_url: true } }), ['image_url'], stats, 'banners', map)
  await updateRows('user', await prisma.user.findMany({ select: { id: true, avatar: true } }), ['avatar'], stats, 'users', map)
  await updateRows('review', await prisma.review.findMany({ select: { id: true, avatar: true } }), ['avatar'], stats, 'reviews', map)

  const [posts, products] = await Promise.all([
    prisma.post.findMany({ select: { id: true, content: true } }),
    prisma.product.findMany({ select: { id: true, description: true, short_description: true } }),
  ])

  for (const post of posts) {
    const content = replaceUploadPaths(post.content, map)
    if (content !== post.content) {
      await prisma.post.update({ where: { id: post.id }, data: { content } })
      stats.richTextRows += 1
    }
  }

  for (const product of products) {
    const description = replaceUploadPaths(product.description, map)
    const shortDescription = replaceUploadPaths(product.short_description, map)
    if (description !== product.description || shortDescription !== product.short_description) {
      await prisma.product.update({
        where: { id: product.id },
        data: { description, short_description: shortDescription },
      })
      stats.richTextRows += 1
    }
  }

  return stats
}

async function updateRows(modelName, rows, fields, stats, statKey, map) {
  for (const row of rows) {
    const data = {}
    for (const field of fields) {
      const normalized = normalizeUploadPath(row[field])
      if (normalized && map.has(normalized)) data[field] = map.get(normalized)
    }
    if (Object.keys(data).length > 0) {
      await prisma[modelName].update({ where: { id: row.id }, data })
      stats[statKey] += 1
    }
  }
}

function normalizeUploadPath(value) {
  if (!value || typeof value !== 'string') return null
  let src = value.trim()
  if (!src) return null

  for (const origin of siteOrigins) {
    if (src.startsWith(origin)) {
      src = src.slice(origin.length)
      break
    }
  }

  if (src.startsWith('/public/uploads/')) src = src.replace('/public', '')
  if (src.startsWith('public/uploads/')) src = `/${src.replace(/^public\//, '')}`
  if (src.startsWith('uploads/')) src = `/${src}`

  if (!src.startsWith('/uploads/')) return null
  const clean = src.split('?')[0].split('#')[0]
  return imagePattern.test(clean) ? clean : null
}

function extractUploadPaths(value) {
  if (!value || typeof value !== 'string') return []
  const results = new Set()
  const regex = /(?:https?:\/\/[^"'\s<>]+)?\/(?:public\/)?uploads\/[^"'\s<>]+\.(?:avif|gif|jpe?g|png|webp)(?:\?[^"'\s<>]*)?/gi
  for (const match of value.matchAll(regex)) {
    const normalized = normalizeUploadPath(match[0])
    if (normalized) results.add(normalized)
  }
  return Array.from(results)
}

function replaceUploadPaths(value, map) {
  if (!value || typeof value !== 'string') return value
  let next = value
  for (const [oldPath, newPath] of map.entries()) {
    for (const variant of variantsFor(oldPath)) {
      next = next.split(variant).join(newPath)
    }
  }
  return next
}

function variantsFor(uploadPath) {
  return [
    uploadPath,
    `/public${uploadPath}`,
    ...siteOrigins.map((origin) => `${origin}${uploadPath}`),
    ...siteOrigins.map((origin) => `${origin}/public${uploadPath}`),
  ]
}

function pickPurpose(purposes) {
  if (purposes.has('banner')) return 'banner'
  if (purposes.has('product')) return 'product'
  if (purposes.has('post')) return 'post'
  if (purposes.has('category')) return 'category'
  if (purposes.has('icon')) return 'icon'
  if (purposes.has('avatar')) return 'avatar'
  return 'media'
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

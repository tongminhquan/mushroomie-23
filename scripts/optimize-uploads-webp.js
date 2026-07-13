#!/usr/bin/env node

const fs = require('node:fs/promises')
const fsSync = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const sharp = require('sharp')
const dotenv = require('dotenv')
const { PrismaClient } = require('@prisma/client')

dotenv.config()
sharp.cache(false)
sharp.concurrency(1)

const prisma = new PrismaClient()
const projectRoot = process.cwd()
const uploadDir = path.join(projectRoot, 'public', 'uploads')
const backupRoot = path.join(projectRoot, 'backups')
const mappingDir = path.join(backupRoot, 'mappings')
const stagingRoot = path.join(backupRoot, 'staging')
const originalsRoot = path.join(backupRoot, 'media-originals')
const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i
const textFilePattern = /\.(?:css|html?|js|jsx|json|mjs|cjs|ts|tsx|md|csv)$/i
const MAX_WEB_IMAGE_BYTES = 500 * 1024 - 1
const QUALITY_STEPS = [85, 80, 74, 68, 62, 56]
const WIDTH_SCALES = [1, 0.85, 0.7, 0.55, 0.4]
const apply = process.argv.includes('--apply')
const manifestPath = readArgument('--manifest')

const maxWidthByPurpose = {
  banner: 1920,
  product: 1200,
  post: 1200,
  media: 1600,
  category: 512,
  icon: 512,
  avatar: 512,
  code: 1600,
}

async function main() {
  await fs.mkdir(mappingDir, { recursive: true })
  await fs.mkdir(stagingRoot, { recursive: true })
  await fs.mkdir(originalsRoot, { recursive: true })

  if (apply) {
    if (!manifestPath) throw new Error('--apply requires --manifest <dry-run-report.json>')
    await applyManifest(path.resolve(projectRoot, manifestPath))
    return
  }

  await createDryRunManifest()
}

async function createDryRunManifest() {
  const runId = timestamp()
  const stagingDir = path.join(stagingRoot, `image-optimize-${runId}`)
  await fs.mkdir(stagingDir, { recursive: true })

  const references = await collectReferences()
  await collectCodeReferences(references)
  const files = await listUploadImages()
  const candidates = []
  let totalBefore = 0
  let totalAfter = 0

  for (const [index, file] of files.entries()) {
    const sourcePath = path.join(uploadDir, file)
    const sourceStat = await fs.stat(sourcePath)
    const extension = path.extname(file).toLowerCase()
    if (extension === '.webp' && sourceStat.size <= MAX_WEB_IMAGE_BYTES) continue

    const oldPath = `/uploads/${file}`
    const purposes = [...(references.get(oldPath) || new Set())]
    const purpose = pickPurpose(new Set(purposes))
    const newFilename = extension === '.webp' ? file : `${crypto.randomUUID()}.webp`
    const stagedPath = path.join(stagingDir, newFilename)
    const output = await encodeWebpWithinLimit(sourcePath, maxWidthByPurpose[purpose])
    await fs.writeFile(stagedPath, output.data, { mode: 0o600 })

    const item = {
      oldFilename: file,
      oldPath,
      newFilename,
      newPath: `/uploads/${newFilename}`,
      sourceBytes: sourceStat.size,
      outputBytes: output.data.length,
      sourceSha256: await sha256(sourcePath),
      outputSha256: await sha256(stagedPath),
      width: output.info.width,
      height: output.info.height,
      purpose,
      references: purposes,
      referenced: purposes.length > 0,
    }
    candidates.push(item)
    totalBefore += sourceStat.size
    totalAfter += output.data.length

    if ((index + 1) % 10 === 0) console.error(`Validated ${index + 1}/${files.length} upload files...`)
  }

  const blocked = candidates.filter((item) => item.referenced)
  const report = {
    version: 2,
    mode: 'dry-run',
    success: blocked.length === 0,
    createdAt: new Date().toISOString(),
    maxOutputBytes: MAX_WEB_IMAGE_BYTES,
    uploadDir,
    stagingDir,
    filesScanned: files.length,
    candidates: candidates.length,
    blockedReferencedCandidates: blocked.map((item) => ({ oldPath: item.oldPath, references: item.references })),
    totalBefore,
    totalAfter,
    savedBytes: totalBefore - totalAfter,
    mapping: candidates,
  }
  const reportPath = path.join(mappingDir, `upload-webp-dry-run-${runId}.json`)
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 })

  console.log(JSON.stringify({
    success: report.success,
    mode: report.mode,
    filesScanned: report.filesScanned,
    candidates: report.candidates,
    blockedReferencedCandidates: blocked.length,
    totalBefore: report.totalBefore,
    totalAfter: report.totalAfter,
    savedBytes: report.savedBytes,
    reportPath,
  }, null, 2))

  if (!report.success) process.exitCode = 2
}

async function applyManifest(resolvedManifestPath) {
  const manifest = JSON.parse(await fs.readFile(resolvedManifestPath, 'utf8'))
  if (manifest.version !== 2 || manifest.mode !== 'dry-run' || manifest.success !== true) {
    throw new Error('Manifest is not an approved successful dry-run report')
  }
  if (!Array.isArray(manifest.mapping) || manifest.mapping.length !== manifest.candidates) {
    throw new Error('Manifest mapping count is invalid')
  }
  if (manifest.blockedReferencedCandidates?.length) {
    throw new Error('Manifest contains referenced candidates and cannot be applied automatically')
  }

  const runId = timestamp()
  const archiveDir = path.join(originalsRoot, `image-optimize-${runId}`)
  await fs.mkdir(archiveDir, { recursive: true, mode: 0o700 })

  for (const item of manifest.mapping) {
    validateManifestItem(item)
    const sourcePath = safeUploadPath(item.oldFilename)
    const stagedPath = safeStagingPath(manifest.stagingDir, item.newFilename)
    const sourceStat = await fs.stat(sourcePath)
    const stagedStat = await fs.stat(stagedPath)
    if (sourceStat.size !== item.sourceBytes || await sha256(sourcePath) !== item.sourceSha256) {
      throw new Error(`Source changed after dry-run: ${item.oldFilename}`)
    }
    if (stagedStat.size !== item.outputBytes || stagedStat.size > MAX_WEB_IMAGE_BYTES || await sha256(stagedPath) !== item.outputSha256) {
      throw new Error(`Staged output changed or exceeds 500 KB: ${item.newFilename}`)
    }
    const metadata = await sharp(stagedPath).metadata()
    if (metadata.format !== 'webp') throw new Error(`Staged output is not WebP: ${item.newFilename}`)
    if (item.newFilename !== item.oldFilename && fsSync.existsSync(safeUploadPath(item.newFilename))) {
      throw new Error(`Destination already exists: ${item.newFilename}`)
    }
  }

  const applied = []
  try {
    for (const item of manifest.mapping) {
      const sourcePath = safeUploadPath(item.oldFilename)
      const destinationPath = safeUploadPath(item.newFilename)
      const stagedPath = safeStagingPath(manifest.stagingDir, item.newFilename)
      const archivedPath = path.join(archiveDir, item.oldFilename)
      await fs.copyFile(sourcePath, archivedPath)
      await fs.chmod(archivedPath, 0o600)

      const temporaryPath = `${destinationPath}.tmp-${process.pid}`
      await fs.copyFile(stagedPath, temporaryPath)
      await fs.chmod(temporaryPath, 0o644)
      await fs.rename(temporaryPath, destinationPath)
      if (destinationPath !== sourcePath) await fs.rm(sourcePath)
      applied.push({ sourcePath, destinationPath, archivedPath })
    }

    const verification = await verifyUploads()
    if (verification.nonWebp.length || verification.overLimit.length) {
      throw new Error(`Verification failed: ${verification.nonWebp.length} non-WebP, ${verification.overLimit.length} over 500 KB`)
    }

    const applyReport = {
      ...manifest,
      mode: 'apply',
      appliedAt: new Date().toISOString(),
      archiveDir,
      verification,
      sourceManifest: resolvedManifestPath,
    }
    const applyReportPath = path.join(mappingDir, `upload-webp-apply-${runId}.json`)
    await fs.writeFile(applyReportPath, JSON.stringify(applyReport, null, 2), { mode: 0o600 })
    await fs.rm(manifest.stagingDir, { recursive: true, force: true })

    console.log(JSON.stringify({
      success: true,
      mode: 'apply',
      convertedOrCompressed: applied.length,
      archiveDir,
      applyReportPath,
      verification,
    }, null, 2))
  } catch (error) {
    for (const item of applied.reverse()) {
      if (item.destinationPath !== item.sourcePath) await fs.rm(item.destinationPath, { force: true })
      await fs.copyFile(item.archivedPath, item.sourcePath)
      await fs.chmod(item.sourcePath, 0o644)
    }
    throw error
  }
}

async function collectReferences() {
  const byPath = new Map()
  const add = (value, purpose) => {
    for (const uploadPath of extractUploadPaths(value)) {
      if (!byPath.has(uploadPath)) byPath.set(uploadPath, new Set())
      byPath.get(uploadPath).add(purpose)
    }
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

  products.forEach((item) => {
    add(item.featured_image, 'product')
    add(item.description, 'product')
    add(item.short_description, 'product')
  })
  productImages.forEach((item) => add(item.image_url, 'product'))
  categories.forEach((item) => {
    add(item.image_url, 'category')
    add(item.icon, 'icon')
  })
  posts.forEach((item) => {
    add(item.featured_image, 'post')
    add(item.og_image, 'post')
    add(item.twitter_image, 'post')
    add(item.content, 'post')
  })
  banners.forEach((item) => add(item.image_url, 'banner'))
  users.forEach((item) => add(item.avatar, 'avatar'))
  reviews.forEach((item) => add(item.avatar, 'avatar'))
  return byPath
}

async function collectCodeReferences(references) {
  for (const directory of ['src', 'public']) {
    const root = path.join(projectRoot, directory)
    if (!fsSync.existsSync(root)) continue
    for (const filePath of await walkFiles(root, directory === 'public' ? uploadDir : null)) {
      if (!textFilePattern.test(filePath)) continue
      const contents = await fs.readFile(filePath, 'utf8')
      for (const uploadPath of extractUploadPaths(contents)) {
        if (!references.has(uploadPath)) references.set(uploadPath, new Set())
        references.get(uploadPath).add('code')
      }
    }
  }
}

async function encodeWebpWithinLimit(sourcePath, maxWidth) {
  const metadata = await sharp(sourcePath, { failOn: 'warning', animated: false }).metadata()
  const initialWidth = Math.max(1, Math.min(metadata.width || maxWidth, maxWidth))
  const minimumWidth = Math.min(initialWidth, 320)
  const widths = [...new Set(WIDTH_SCALES.map((scale) => Math.max(minimumWidth, Math.round(initialWidth * scale))))]
  let smallestBytes = null

  for (const width of widths) {
    for (const quality of QUALITY_STEPS) {
      const output = await sharp(sourcePath, { failOn: 'warning', animated: false })
        .rotate()
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toBuffer({ resolveWithObject: true })
      if (smallestBytes === null || output.data.length < smallestBytes) smallestBytes = output.data.length
      if (output.data.length <= MAX_WEB_IMAGE_BYTES) return output
    }
  }
  throw new Error(`Unable to optimize ${path.basename(sourcePath)} below 500 KB; smallest output was ${smallestBytes || 0} bytes`)
}

async function verifyUploads() {
  const files = await listUploadImages()
  const nonWebp = []
  const overLimit = []
  let totalBytes = 0
  for (const file of files) {
    const stat = await fs.stat(path.join(uploadDir, file))
    totalBytes += stat.size
    if (!file.toLowerCase().endsWith('.webp')) nonWebp.push(file)
    if (stat.size > MAX_WEB_IMAGE_BYTES) overLimit.push({ file, bytes: stat.size })
  }
  return { totalImages: files.length, totalBytes, nonWebp, overLimit }
}

async function listUploadImages() {
  if (!fsSync.existsSync(uploadDir)) return []
  return (await fs.readdir(uploadDir)).filter((file) => imagePattern.test(file)).sort()
}

async function walkFiles(directory, excludedDirectory = null) {
  const files = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (excludedDirectory && fullPath === excludedDirectory) continue
    if (entry.isDirectory()) files.push(...await walkFiles(fullPath, excludedDirectory))
    else if (entry.isFile()) files.push(fullPath)
  }
  return files
}

function extractUploadPaths(value) {
  if (!value || typeof value !== 'string') return []
  const results = new Set()
  const regex = /(?:https?:\/\/[^"'\s<>]+)?\/(?:public\/)?uploads\/[^"'\s<>]+\.(?:avif|gif|jpe?g|png|webp)(?:\?[^"'\s<>]*)?/gi
  for (const match of value.matchAll(regex)) {
    let uploadPath = match[0].replace(/^https?:\/\/[^/]+/i, '').replace('/public/uploads/', '/uploads/')
    uploadPath = uploadPath.split('?')[0].split('#')[0]
    results.add(uploadPath)
  }
  return [...results]
}

function pickPurpose(purposes) {
  for (const purpose of ['banner', 'product', 'post', 'category', 'icon', 'avatar', 'code']) {
    if (purposes.has(purpose)) return purpose
  }
  return 'media'
}

function safeUploadPath(filename) {
  if (!filename || path.basename(filename) !== filename) throw new Error(`Unsafe upload filename: ${filename}`)
  const resolved = path.resolve(uploadDir, filename)
  if (!resolved.startsWith(`${path.resolve(uploadDir)}${path.sep}`)) throw new Error(`Unsafe upload path: ${filename}`)
  return resolved
}

function safeStagingPath(stagingDir, filename) {
  const resolvedStaging = path.resolve(stagingDir)
  const resolved = path.resolve(resolvedStaging, filename)
  if (!resolved.startsWith(`${resolvedStaging}${path.sep}`)) throw new Error(`Unsafe staging path: ${filename}`)
  return resolved
}

function validateManifestItem(item) {
  if (!item || item.referenced || item.references?.length) throw new Error(`Referenced manifest item: ${item?.oldPath}`)
  if (!item.newFilename?.toLowerCase().endsWith('.webp')) throw new Error(`Non-WebP destination: ${item?.newFilename}`)
  if (item.outputBytes > MAX_WEB_IMAGE_BYTES) throw new Error(`Oversized manifest item: ${item?.newFilename}`)
  safeUploadPath(item.oldFilename)
  safeUploadPath(item.newFilename)
}

async function sha256(filePath) {
  return crypto.createHash('sha256').update(await fs.readFile(filePath)).digest('hex')
}

function readArgument(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
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

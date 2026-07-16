import 'dotenv/config'

import { createHash, randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Post } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'

import {
  extractImageSources,
  insertArticleFigures,
  type ArticleFigure,
} from '../src/lib/post-media'

const prisma = new PrismaClient()
const projectRoot = process.cwd()
const uploadsRoot = path.join(projectRoot, 'public', 'uploads')
const backupsRoot = path.join(projectRoot, 'backups')
const logoPath = path.join(projectRoot, 'public', 'logo.webp')
const runId = new Date().toISOString().replace(/[:.]/g, '-')

const COVER_WIDTH = 1200
const COVER_HEIGHT = 675
const SQUARE_SIZE = 960
const COVER_MAX_BYTES = 200 * 1024
const SQUARE_MAX_BYTES = 120 * 1024

type PostRecord = Pick<
  Post,
  | 'id'
  | 'title'
  | 'slug'
  | 'status'
  | 'content'
  | 'featured_image'
  | 'featured_image_alt'
  | 'featured_image_caption'
  | 'featured_image_description'
  | 'og_image'
  | 'twitter_image'
  | 'focus_keyword'
  | 'author_id'
  | 'excerpt'
  | 'seo_title'
  | 'meta_description'
>

interface SourceAsset {
  name: string
  url: string
  filePath: string
}

interface ImageInspection {
  src: string | null
  filePath: string | null
  exists: boolean
  width: number | null
  height: number | null
  ratio: number | null
}

interface GeneratedAsset {
  role: 'cover' | 'square'
  slot?: 'content-1' | 'content-2'
  filename: string
  publicUrl: string
  stagedPath: string
  width: number
  height: number
  bytes: number
  quality: number
}

interface PostPlan {
  post: PostRecord
  cover: ImageInspection
  coverNeeded: boolean
  reusableSquareCover: string | null
  existingSquareSources: string[]
  squareImagesNeeded: number
  generatedCount: number
}

function parseNumberFlag(name: string, fallback: number) {
  const entry = process.argv.find((value) => value.startsWith(name + '='))
  if (!entry) return fallback
  const value = Number(entry.slice(name.length + 1))
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

const applyMode = process.argv.includes('--apply')
const previewCount = parseNumberFlag('--preview', 0)
const limit = parseNumberFlag('--limit', Number.POSITIVE_INFINITY)

if (applyMode && previewCount > 0) {
  throw new Error('Use either --apply or --preview=N, not both.')
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
}

function normalizeUploadUrl(value?: string | null) {
  if (!value) return null
  let pathname = value.trim()

  try {
    if (/^https?:\/\//i.test(pathname)) pathname = new URL(pathname).pathname
  } catch {
    return null
  }

  pathname = pathname.split(/[?#]/, 1)[0]
  pathname = pathname.replace(/^\/public\/uploads\//i, '/uploads/')
  pathname = pathname.replace(/^public\/uploads\//i, '/uploads/')
  pathname = pathname.replace(/^uploads\//i, '/uploads/')
  return pathname.startsWith('/uploads/') ? pathname : null
}

function uploadFilePath(value?: string | null) {
  const normalized = normalizeUploadUrl(value)
  return normalized ? path.join(uploadsRoot, path.basename(normalized)) : null
}

async function inspectImage(value?: string | null): Promise<ImageInspection> {
  const filePath = uploadFilePath(value)
  if (!filePath) {
    return { src: value || null, filePath: null, exists: false, width: null, height: null, ratio: null }
  }

  try {
    await fs.access(filePath)
    const metadata = await sharp(filePath, { failOn: 'none' }).metadata()
    const width = Number(metadata.width || 0) || null
    const height = Number(metadata.height || 0) || null
    return {
      src: normalizeUploadUrl(value),
      filePath,
      exists: true,
      width,
      height,
      ratio: width && height ? width / height : null,
    }
  } catch {
    return { src: normalizeUploadUrl(value), filePath, exists: false, width: null, height: null, ratio: null }
  }
}

function ratioMatches(value: number | null, target: number, tolerance = 0.035) {
  return typeof value === 'number' && Math.abs(value - target) <= tolerance
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function wrapText(value: string, maxCharacters: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? current + ' ' + word : word
    if (next.length <= maxCharacters || !current) {
      current = next
      continue
    }

    lines.push(current)
    current = word
    if (lines.length === maxLines - 1) break
  }

  if (current && lines.length < maxLines) lines.push(current)
  const consumed = lines.join(' ').split(/\s+/).length
  if (consumed < words.length && lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:!?]*$/, '') + '...'
  }
  return lines
}

function hashNumber(value: string) {
  return Number.parseInt(createHash('sha256').update(value).digest('hex').slice(0, 8), 16)
}

function pickAssets(post: PostRecord, assets: SourceAsset[], count: number) {
  const searchable = normalizeSearch(post.title + ' ' + (post.focus_keyword || ''))
  let preferred = assets

  if (searchable.includes('moc khoa')) {
    preferred = assets.filter((asset) => normalizeSearch(asset.name).includes('moc'))
  } else if (searchable.includes('day chuyen') || searchable.includes('vong co')) {
    preferred = assets.filter((asset) => normalizeSearch(asset.name).includes('day'))
  } else if (searchable.includes('vong tay') || searchable.includes('vong')) {
    preferred = assets.filter((asset) => normalizeSearch(asset.name).includes('vong'))
  }

  if (preferred.length < count) preferred = assets
  return [...preferred]
    .sort((left, right) => (
      hashNumber(post.slug + left.url) - hashNumber(post.slug + right.url)
    ))
    .slice(0, count)
}

async function roundedPhoto(filePath: string, width: number, height: number, radius: number) {
  const mask = Buffer.from(
    '<svg width="' + width + '" height="' + height + '" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="' + width + '" height="' + height + '" rx="' + radius + '" fill="#fff"/>' +
    '</svg>',
  )

  return sharp(filePath, { failOn: 'none' })
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

function coverSvg(post: PostRecord) {
  const displayTitle = (post.seo_title || post.title)
    .replace(/\s*\|\s*Mushroomie.*$/i, '')
    .trim()
  const lines = wrapText(displayTitle, 22, 3)
  const title = lines
    .map((line, index) => (
      '<text x="62" y="' + (300 + index * 66) + '" class="title">' + escapeXml(line) + '</text>'
    ))
    .join('')
  const keyword = escapeXml(post.focus_keyword || 'Phụ kiện handmade cá nhân hóa')

  return Buffer.from([
    '<svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">',
    '<rect width="1200" height="675" fill="#fff7f2"/>',
    '<circle cx="1140" cy="70" r="126" fill="#ffd6d6" opacity="0.62"/>',
    '<circle cx="620" cy="628" r="170" fill="#ffe7a3" opacity="0.58"/>',
    '<rect x="646" y="54" width="480" height="540" rx="30" fill="#ffffff" stroke="#f3c7bd" stroke-width="3"/>',
    '<rect x="902" y="330" width="242" height="250" rx="26" fill="#ffffff" stroke="#f3c7bd" stroke-width="3"/>',
    '<path d="M0 624 C180 594 360 660 560 626 C760 592 980 654 1200 614 L1200 675 L0 675 Z" fill="#e41d1d"/>',
    '<path d="M0 625 C180 595 360 661 560 627 C760 593 980 655 1200 615" fill="none" stroke="#fff7f2" stroke-width="3" stroke-dasharray="12 10"/>',
    '<g fill="#e41d1d" opacity="0.88"><path d="M80 208c-22-18-52 14-20 40l20 18 20-18c32-26 2-58-20-40z"/><path d="M550 104c-13-11-31 8-12 24l12 10 12-10c19-16 1-35-12-24z"/></g>',
    '<style>',
    '.title{font-family:"DejaVu Sans","Arial",sans-serif;font-size:52px;font-weight:900;fill:#b31313;}',
    '.eyebrow{font-family:"DejaVu Sans","Arial",sans-serif;font-size:18px;font-weight:800;letter-spacing:2px;fill:#b9794b;}',
    '.keyword{font-family:"DejaVu Sans","Arial",sans-serif;font-size:20px;font-weight:700;fill:#2b2b2b;}',
    '.small{font-family:"DejaVu Sans","Arial",sans-serif;font-size:17px;font-weight:700;fill:#fff7f2;}',
    '</style>',
    '<text x="62" y="252" class="eyebrow">MUSHROOMIE • HANDMADE WITH LOVE</text>',
    title,
    '<rect x="62" y="514" width="510" height="58" rx="22" fill="#ffd6d6" stroke="#e8998e" stroke-width="2"/>',
    '<text x="86" y="550" class="keyword">' + keyword + '</text>',
    '<text x="62" y="655" class="small">Từ từng hạt nhỏ, tạo phong cách riêng.</text>',
    '</svg>',
  ].join(''))
}

function squareSvg(post: PostRecord, slot: 1 | 2) {
  const palette = slot === 1
    ? { background: '#fff7f2', accent: '#ffd6d6', secondary: '#ffe7a3' }
    : { background: '#fffaf6', accent: '#ffe7a3', secondary: '#ffd6d6' }
  const label = slot === 1 ? 'HANDMADE WITH LOVE' : 'MIX & MATCH YOUR STYLE'
  const keyword = escapeXml(post.focus_keyword || post.title)

  return Buffer.from([
    '<svg width="960" height="960" xmlns="http://www.w3.org/2000/svg">',
    '<rect width="960" height="960" fill="' + palette.background + '"/>',
    '<circle cx="100" cy="120" r="150" fill="' + palette.accent + '" opacity="0.62"/>',
    '<circle cx="870" cy="842" r="190" fill="' + palette.secondary + '" opacity="0.68"/>',
    '<rect x="74" y="132" width="610" height="650" rx="34" fill="#ffffff" stroke="#f1c9be" stroke-width="3"/>',
    '<rect x="620" y="536" width="270" height="282" rx="28" fill="#ffffff" stroke="#f1c9be" stroke-width="3"/>',
    '<g fill="#e41d1d"><path d="M808 98c-22-18-52 14-20 40l20 18 20-18c32-26 2-58-20-40z"/><circle cx="865" cy="176" r="11"/><circle cx="835" cy="202" r="7"/></g>',
    '<path d="M84 850 C260 816 420 884 594 848 C720 822 824 830 920 812" fill="none" stroke="#e41d1d" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 13"/>',
    '<style>',
    '.label{font-family:"DejaVu Sans","Arial",sans-serif;font-size:18px;font-weight:900;letter-spacing:2px;fill:#b9794b;}',
    '.keyword{font-family:"DejaVu Sans","Arial",sans-serif;font-size:22px;font-weight:800;fill:#2b2b2b;}',
    '</style>',
    '<text x="76" y="94" class="label">' + escapeXml(label) + '</text>',
    '<text x="82" y="914" class="keyword">' + keyword + '</text>',
    '</svg>',
  ].join(''))
}

async function renderCover(post: PostRecord, assets: SourceAsset[]) {
  const selected = pickAssets(post, assets, 3)
  if (selected.length < 2) throw new Error('At least two product source images are required.')

  const primary = await roundedPhoto(selected[0].filePath, 440, 500, 26)
  const secondary = await roundedPhoto(selected[1].filePath, 214, 222, 22)
  const logo = await sharp(logoPath).resize(160, 160, { fit: 'contain' }).webp().toBuffer()

  return sharp(coverSvg(post))
    .composite([
      { input: primary, left: 666, top: 74 },
      { input: secondary, left: 916, top: 344 },
      { input: logo, left: 54, top: 42 },
    ])
    .png()
    .toBuffer()
}

async function renderSquare(post: PostRecord, assets: SourceAsset[], slot: 1 | 2) {
  const selected = pickAssets(post, assets, 4)
  if (selected.length < 2) throw new Error('At least two product source images are required.')
  const offset = slot === 1 ? 0 : Math.min(1, selected.length - 1)
  const primary = await roundedPhoto(selected[offset].filePath, 580, 620, 30)
  const secondary = await roundedPhoto(selected[(offset + 1) % selected.length].filePath, 244, 250, 23)
  const logo = await sharp(logoPath).resize(120, 120, { fit: 'contain' }).webp().toBuffer()

  return sharp(squareSvg(post, slot))
    .composite([
      { input: primary, left: 90, top: 148 },
      { input: secondary, left: 633, top: 552 },
      { input: logo, left: 804, top: 26 },
    ])
    .png()
    .toBuffer()
}

async function writeOptimizedWebp(
  source: Buffer,
  outputPath: string,
  maxBytes: number,
) {
  let lastBuffer: Buffer | null = null
  let lastQuality = 82

  for (const quality of [82, 78, 74, 70, 66, 62, 58]) {
    const output = await sharp(source)
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer()
    lastBuffer = output
    lastQuality = quality
    if (output.length <= maxBytes) break
  }

  if (!lastBuffer) throw new Error('Image compression produced no output.')
  await fs.writeFile(outputPath, lastBuffer)
  return { bytes: lastBuffer.length, quality: lastQuality }
}

async function loadSourceAssets(): Promise<SourceAsset[]> {
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    orderBy: { id: 'asc' },
    select: {
      name: true,
      featured_image: true,
      images: { orderBy: { sort_order: 'asc' }, select: { image_url: true } },
    },
  })

  const candidates = products.flatMap((product) => [
    ...(product.featured_image ? [{ name: product.name, url: product.featured_image }] : []),
    ...product.images.map((image) => ({ name: product.name, url: image.image_url })),
  ])

  const assets: SourceAsset[] = []
  const seen = new Set<string>()
  for (const candidate of candidates) {
    const url = normalizeUploadUrl(candidate.url)
    const filePath = uploadFilePath(candidate.url)
    if (!url || !filePath || seen.has(url)) continue

    try {
      await fs.access(filePath)
      const metadata = await sharp(filePath, { failOn: 'none' }).metadata()
      if (!metadata.width || !metadata.height) continue
      assets.push({ name: candidate.name, url, filePath })
      seen.add(url)
    } catch {
      // Skip missing or unreadable source media.
    }
  }
  return assets
}

async function buildPostPlan(post: PostRecord): Promise<PostPlan> {
  const cover = await inspectImage(post.featured_image)
  const coverNeeded = !cover.exists || !ratioMatches(cover.ratio, 16 / 9)
  const contentSources = extractImageSources(post.content)
  const existingSquareSources: string[] = []

  for (const source of contentSources) {
    const inspected = await inspectImage(source)
    if (inspected.exists && ratioMatches(inspected.ratio, 1)) {
      const normalized = normalizeUploadUrl(source)
      if (normalized) existingSquareSources.push(normalized)
    }
  }

  const reusableSquareCover = coverNeeded && cover.exists && ratioMatches(cover.ratio, 1)
    ? cover.src
    : null
  const availableSquares = new Set(existingSquareSources)
  if (reusableSquareCover) availableSquares.add(reusableSquareCover)
  const squareImagesNeeded = Math.max(0, 2 - availableSquares.size)

  return {
    post,
    cover,
    coverNeeded,
    reusableSquareCover,
    existingSquareSources: [...availableSquares],
    squareImagesNeeded,
    generatedCount: Number(coverNeeded) + squareImagesNeeded,
  }
}

function postImageCopy(post: PostRecord, slot: 1 | 2) {
  const keyword = (post.focus_keyword || post.title).trim()
  if (slot === 1) {
    return {
      alt: keyword + ' - phụ kiện handmade cá nhân hóa Mushroomie',
      caption: keyword + ' được phối thủ công tại Mushroomie, Đồng Nai.',
    }
  }
  return {
    alt: keyword + ' - gợi ý phối phụ kiện handmade Mushroomie',
    caption: 'Gợi ý phối ' + keyword + ' theo màu sắc và phong cách riêng.',
  }
}

function contentMetrics(content: string) {
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0
  return {
    wordCount,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
  }
}

async function generateAssetsForPlan(
  plan: PostPlan,
  sourceAssets: SourceAsset[],
  stageDir: string,
) {
  const generated: GeneratedAsset[] = []

  if (plan.coverNeeded) {
    const filename = randomUUID() + '.webp'
    const stagedPath = path.join(stageDir, filename)
    const source = await renderCover(plan.post, sourceAssets)
    const optimized = await writeOptimizedWebp(source, stagedPath, COVER_MAX_BYTES)
    generated.push({
      role: 'cover',
      filename,
      publicUrl: '/uploads/' + filename,
      stagedPath,
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
      ...optimized,
    })
  }

  const existingSquareCount = plan.existingSquareSources.length
  for (let index = 0; index < plan.squareImagesNeeded; index++) {
    const slot = Math.min(2, existingSquareCount + index + 1) as 1 | 2
    const filename = randomUUID() + '.webp'
    const stagedPath = path.join(stageDir, filename)
    const source = await renderSquare(plan.post, sourceAssets, slot)
    const optimized = await writeOptimizedWebp(source, stagedPath, SQUARE_MAX_BYTES)
    generated.push({
      role: 'square',
      slot: slot === 1 ? 'content-1' : 'content-2',
      filename,
      publicUrl: '/uploads/' + filename,
      stagedPath,
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      ...optimized,
    })
  }

  return generated
}

async function applyPostPlan(plan: PostPlan, generated: GeneratedAsset[]) {
  const copiedFiles: string[] = []
  try {
    for (const asset of generated) {
      const destination = path.join(uploadsRoot, asset.filename)
      await fs.copyFile(asset.stagedPath, destination)
      copiedFiles.push(destination)
    }

    const coverAsset = generated.find((asset) => asset.role === 'cover')
    const generatedSquares = generated.filter((asset) => asset.role === 'square')
    const squareFigures = [
      ...plan.existingSquareSources.map((src) => ({ src })),
      ...generatedSquares.map((asset) => ({
        src: asset.publicUrl,
        width: asset.width,
        height: asset.height,
      })),
    ].slice(0, 2)

    const figures: ArticleFigure[] = squareFigures.map((image, index) => {
      const slot = (index === 0 ? 'content-1' : 'content-2') as ArticleFigure['slot']
      const copy = postImageCopy(plan.post, index === 0 ? 1 : 2)
      return { slot, ...image, alt: copy.alt, caption: copy.caption }
    })
    const content = insertArticleFigures(plan.post.content, figures)
    const metrics = contentMetrics(content)
    const featuredImage = coverAsset?.publicUrl || normalizeUploadUrl(plan.post.featured_image)
    if (!featuredImage) throw new Error('Post has no usable featured image after generation.')

    const featuredAlt = (plan.post.focus_keyword || plan.post.title).trim() +
      ' - ảnh bìa bài viết Mushroomie'
    const featuredCaption = (plan.post.focus_keyword || plan.post.title).trim() +
      ' tại Mushroomie Handmade, Đồng Nai.'

    await prisma.$transaction([
      prisma.postRevision.create({
        data: {
          post_id: plan.post.id,
          title: plan.post.title,
          content: plan.post.content,
          excerpt: plan.post.excerpt,
          seo_title: plan.post.seo_title,
          meta_description: plan.post.meta_description,
          status: plan.post.status,
          author_id: plan.post.author_id,
        },
      }),
      prisma.post.update({
        where: { id: plan.post.id },
        data: {
          featured_image: featuredImage,
          featured_image_alt: featuredAlt,
          featured_image_caption: featuredCaption,
          featured_image_description:
            'Ảnh minh họa sản phẩm handmade Mushroomie tại Phường Trảng Dài, Đồng Nai.',
          og_image: coverAsset?.publicUrl || plan.post.og_image || featuredImage,
          twitter_image: coverAsset?.publicUrl || plan.post.twitter_image || featuredImage,
          content,
          word_count: metrics.wordCount,
          reading_time: metrics.readingTime,
        },
      }),
    ])
  } catch (error) {
    await Promise.all(copiedFiles.map((filePath) => fs.unlink(filePath).catch(() => undefined)))
    throw error
  }
}

async function main() {
  await fs.mkdir(uploadsRoot, { recursive: true })
  await fs.mkdir(path.join(backupsRoot, 'logs'), { recursive: true })

  const posts = await prisma.post.findMany({
    where: { deleted_at: null },
    orderBy: [{ status: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      content: true,
      featured_image: true,
      featured_image_alt: true,
      featured_image_caption: true,
      featured_image_description: true,
      og_image: true,
      twitter_image: true,
      focus_keyword: true,
      author_id: true,
      excerpt: true,
      seo_title: true,
      meta_description: true,
    },
  })

  const plans: PostPlan[] = []
  for (const post of posts) {
    const plan = await buildPostPlan(post)
    if (plan.generatedCount > 0) plans.push(plan)
  }

  const selectedPlans = plans.slice(0, Math.min(limit, plans.length))
  const manifest = {
    runId,
    mode: applyMode ? 'apply' : previewCount > 0 ? 'preview' : 'dry-run',
    totalActivePosts: posts.length,
    postsNeedingMedia: plans.length,
    selectedPosts: selectedPlans.length,
    coverImagesToGenerate: selectedPlans.filter((plan) => plan.coverNeeded).length,
    squareImagesToGenerate: selectedPlans.reduce((sum, plan) => sum + plan.squareImagesNeeded, 0),
    totalImagesToGenerate: selectedPlans.reduce((sum, plan) => sum + plan.generatedCount, 0),
    plans: selectedPlans.map((plan) => ({
      id: plan.post.id,
      slug: plan.post.slug,
      title: plan.post.title,
      status: plan.post.status,
      oldFeaturedImage: plan.post.featured_image,
      coverNeeded: plan.coverNeeded,
      reusedSquareCover: plan.reusableSquareCover,
      existingSquareSources: plan.existingSquareSources,
      squareImagesNeeded: plan.squareImagesNeeded,
      generatedCount: plan.generatedCount,
    })),
  }

  const manifestPath = path.join(backupsRoot, 'logs', 'post-media-plan-' + runId + '.json')
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ ...manifest, manifestPath, plans: undefined }, null, 2))

  if (!applyMode && previewCount === 0) return

  const sourceAssets = await loadSourceAssets()
  if (sourceAssets.length < 2) {
    throw new Error('Not enough readable local product images to generate article media.')
  }

  const stageRoot = previewCount > 0
    ? path.join(backupsRoot, 'previews', 'post-media-' + runId)
    : path.join(backupsRoot, 'generated-post-media', runId)
  await fs.mkdir(stageRoot, { recursive: true })

  const workPlans = previewCount > 0
    ? selectedPlans.slice(0, previewCount)
    : selectedPlans
  const applyLog: Array<Record<string, unknown>> = []

  for (const [index, plan] of workPlans.entries()) {
    const postStage = path.join(stageRoot, String(plan.post.id))
    await fs.mkdir(postStage, { recursive: true })
    const generated = await generateAssetsForPlan(plan, sourceAssets, postStage)

    applyLog.push({
      postId: plan.post.id,
      slug: plan.post.slug,
      oldFeaturedImage: plan.post.featured_image,
      generated: generated.map((asset) => ({
        role: asset.role,
        slot: asset.slot,
        filename: asset.filename,
        publicUrl: asset.publicUrl,
        stagedPath: asset.stagedPath,
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
        quality: asset.quality,
      })),
    })

    if (applyMode) await applyPostPlan(plan, generated)
    console.log(
      '[' + (index + 1) + '/' + workPlans.length + '] ' +
      plan.post.slug + ': ' + generated.length + ' image(s)',
    )
  }

  const applyLogPath = path.join(backupsRoot, 'logs', 'post-media-run-' + runId + '.json')
  await fs.writeFile(
    applyLogPath,
    JSON.stringify({ runId, mode: applyMode ? 'apply' : 'preview', stageRoot, posts: applyLog }, null, 2),
  )
  console.log(JSON.stringify({ stageRoot, applyLogPath, completedPosts: workPlans.length }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

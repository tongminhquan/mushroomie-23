import { randomUUID } from 'node:crypto'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export type UploadImagePurpose = 'banner' | 'product' | 'post' | 'category' | 'icon' | 'avatar' | 'media' | 'default'

export interface CropData {
  x: number
  y: number
  width: number
  height: number
}

export interface OptimizedUploadResult {
  id: number
  url: string
  filename: string
  size: number
  width?: number
  height?: number
  created_at: string
}

const WEBP_QUALITY = 85
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
const MAX_INPUT_PIXELS = 40_000_000
const sharpInputOptions = { failOn: 'warning' as const, animated: false, limitInputPixels: MAX_INPUT_PIXELS }

const maxWidthByPurpose: Record<UploadImagePurpose, number> = {
  banner: 1920,
  product: 1200,
  post: 1200,
  media: 1600,
  category: 512,
  icon: 512,
  avatar: 512,
  default: 1600,
}

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const allowedSharpFormats = new Set(['jpeg', 'png', 'webp', 'avif'])

export function normalizeUploadPurpose(value?: FormDataEntryValue | string | null): UploadImagePurpose {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (normalized === 'banner') return 'banner'
  if (normalized === 'post' || normalized === 'blog') return 'post'
  if (normalized === 'category') return 'category'
  if (normalized === 'icon') return 'icon'
  if (normalized === 'avatar' || normalized === 'user') return 'avatar'
  if (normalized === 'media') return 'media'
  return 'default'
}

export async function optimizeUploadImage({
  buffer,
  declaredMime,
  purpose,
  uploadDir,
  cropData,
}: {
  buffer: Buffer
  declaredMime?: string
  purpose: UploadImagePurpose
  uploadDir: string
  cropData?: CropData | null
}): Promise<OptimizedUploadResult> {
  await assertSafeImage(buffer, declaredMime)
  await mkdir(uploadDir, { recursive: true })

  const metadata = await sharp(buffer, sharpInputOptions).metadata()
  let pipeline = sharp(buffer, sharpInputOptions).rotate()

  if (cropData && cropData.width > 0 && cropData.height > 0 && metadata.width && metadata.height) {
    const left = Math.max(0, Math.round(cropData.x))
    const top = Math.max(0, Math.round(cropData.y))
    const width = Math.min(Math.max(1, Math.round(cropData.width)), metadata.width - left)
    const height = Math.min(Math.max(1, Math.round(cropData.height)), metadata.height - top)

    if (width > 0 && height > 0) {
      pipeline = pipeline.extract({
        left,
        top,
        width,
        height,
      })
    }
  }

  const filename = `${randomUUID()}.webp`
  const outputPath = path.join(uploadDir, filename)

  const output = await pipeline
    .resize({
      width: maxWidthByPurpose[purpose],
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toBuffer({ resolveWithObject: true })

  await writeFile(outputPath, output.data)
  const fileStat = await stat(outputPath)

  return {
    id: fileStat.mtimeMs,
    url: `/uploads/${filename}`,
    filename,
    size: fileStat.size,
    width: output.info.width,
    height: output.info.height,
    created_at: fileStat.mtime.toISOString(),
  }
}

async function assertSafeImage(buffer: Buffer, declaredMime?: string) {
  if (!buffer.length) {
    throw new Error('Image file is empty')
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('Image file exceeds the 25 MB limit')
  }

  if (declaredMime && !allowedMimeTypes.has(declaredMime)) {
    throw new Error('Invalid image MIME type')
  }

  const sniffedMime = sniffImageMime(buffer)
  if (!sniffedMime || !allowedMimeTypes.has(sniffedMime)) {
    throw new Error('Invalid image signature')
  }

  const metadata = await sharp(buffer, sharpInputOptions).metadata()
  if (!metadata.format || !allowedSharpFormats.has(metadata.format)) {
    throw new Error('Unsupported image format')
  }
}

function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12)
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
  }
  return null
}

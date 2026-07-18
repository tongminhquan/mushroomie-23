import { randomUUID } from 'node:crypto'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

// Memory hardening for the constrained (~1GB) production VPS: disable libvips'
// operation/file cache (keeps steady-state RSS low) and limit per-operation thread
// fan-out (bounds the native off-heap memory a single decode can allocate). These do
// not change image output — only how much memory/threads libvips holds at runtime.
sharp.cache(false)
sharp.concurrency(1)

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
export const MAX_WEB_IMAGE_BYTES = 500 * 1024 - 1
const WEBP_QUALITY_STEPS = [WEBP_QUALITY, 80, 74, 68, 62, 56] as const
const WEBP_WIDTH_SCALES = [1, 0.85, 0.7, 0.55, 0.4] as const
const BANNER_VARIANT_WIDTHS = [750, 1280] as const
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
// 120MP để nhận ảnh điện thoại 48/50/108MP; RAM vẫn thấp vì mọi purpose đều
// resize xuống ≤1920px nên JPEG được decode qua shrink-on-load, không decode full.
const MAX_INPUT_PIXELS = 120_000_000
// failOn 'error' vẫn chặn ảnh hỏng/cụt nhưng không chết vì warning vặt của ảnh điện thoại.
const sharpInputOptions = { failOn: 'error' as const, animated: false, limitInputPixels: MAX_INPUT_PIXELS }

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

  const preparedBuffer = await pipeline.toBuffer()
  const output = await encodeWebpWithinLimit(preparedBuffer, maxWidthByPurpose[purpose])

  await writeFile(outputPath, output.data)

  if (purpose === 'banner') {
    await Promise.all(
      BANNER_VARIANT_WIDTHS.map(async (width) => {
        const variant = await encodeWebpWithinLimit(output.data, width)
        await writeFile(path.join(uploadDir, `${path.parse(filename).name}-${width}.webp`), variant.data)
      }),
    )
  }

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

export async function encodeWebpWithinLimit(buffer: Buffer, maxWidth: number) {
  const metadata = await sharp(buffer, sharpInputOptions).metadata()
  const sourceWidth = metadata.width || maxWidth
  const initialWidth = Math.max(1, Math.min(sourceWidth, maxWidth))
  const minimumWidth = Math.min(initialWidth, 320)
  const widths = [...new Set(
    WEBP_WIDTH_SCALES.map((scale) => Math.max(minimumWidth, Math.round(initialWidth * scale))),
  )]

  let smallestBytes: number | null = null

  for (const width of widths) {
    for (const quality of WEBP_QUALITY_STEPS) {
      const output = await sharp(buffer, sharpInputOptions)
        .resize({ width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toBuffer({ resolveWithObject: true })

      if (smallestBytes === null || output.data.length < smallestBytes) smallestBytes = output.data.length
      if (output.data.length <= MAX_WEB_IMAGE_BYTES) return output
    }
  }

  throw new Error(
    `Unable to optimize image below 500 KB (smallest output: ${smallestBytes || 0} bytes)`,
  )
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

  const pixels = (metadata.width || 0) * (metadata.height || 0)
  if (pixels > MAX_INPUT_PIXELS) {
    throw new Error(
      `Ảnh ${Math.round(pixels / 1e6)}MP vượt giới hạn ${MAX_INPUT_PIXELS / 1e6}MP — hãy thu nhỏ ảnh hoặc chụp ở độ phân giải thấp hơn rồi tải lại`,
    )
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

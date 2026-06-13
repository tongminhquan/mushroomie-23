import { access } from 'node:fs/promises'
import path from 'node:path'
import { getImageFallback, normalizeImageUrl, type PublicImageKind } from '@/lib/image-url'

const UPLOAD_PREFIX = '/uploads/'
const PUBLIC_ROOT = path.join(process.cwd(), 'public')
const UPLOAD_ROOT = path.join(PUBLIC_ROOT, 'uploads')
const ARTICLE_IMAGE_PATTERN = /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi

export interface ImageRenderState {
  exists: boolean
  isFallback: boolean
  isUpload: boolean
  normalizedSrc: string
  renderSrc: string
  issue: 'invalid-url' | 'missing-file' | null
}

export async function inspectImageForRender(
  src?: string | null,
  kind: PublicImageKind = 'product',
): Promise<ImageRenderState> {
  const fallback = getImageFallback(kind)
  const normalizedSrc = normalizeImageUrl(src, kind)
  const isUpload = normalizedSrc.startsWith(UPLOAD_PREFIX)

  if (!isUpload) {
    const isFallback = normalizedSrc === fallback
    return {
      exists: !isFallback || !src,
      isFallback,
      isUpload: false,
      normalizedSrc,
      renderSrc: normalizedSrc,
      issue: isFallback && src ? 'invalid-url' : null,
    }
  }

  const uploadFilename = normalizedSrc.slice(UPLOAD_PREFIX.length)
  if (!isSafeUploadFilename(uploadFilename)) {
    return {
      exists: false,
      isFallback: true,
      isUpload: true,
      normalizedSrc,
      renderSrc: fallback,
      issue: 'invalid-url',
    }
  }

  const absolutePath = path.join(UPLOAD_ROOT, uploadFilename)
  const exists = await fileExists(absolutePath)

  return {
    exists,
    isFallback: !exists,
    isUpload: true,
    normalizedSrc,
    renderSrc: exists ? normalizedSrc : fallback,
    issue: exists ? null : 'missing-file',
  }
}

export async function resolveImageUrlForRender(
  src?: string | null,
  kind: PublicImageKind = 'product',
) {
  const result = await inspectImageForRender(src, kind)
  return result.renderSrc
}

export async function resolveArticleImagesForRender(html: string, kind: PublicImageKind = 'post') {
  if (!html) return ''

  const sources = new Set<string>()
  for (const match of html.matchAll(ARTICLE_IMAGE_PATTERN)) {
    const source = match[2]?.trim()
    if (source) sources.add(source)
  }

  if (sources.size === 0) return html

  const replacements = new Map<string, string>()
  await Promise.all(
    Array.from(sources).map(async (source) => {
      replacements.set(source, await resolveImageUrlForRender(source, kind))
    }),
  )

  return html.replace(ARTICLE_IMAGE_PATTERN, (_match, prefix: string, source: string, suffix: string) => {
    const normalizedSource = source.trim()
    const resolved = replacements.get(normalizedSource) || normalizeImageUrl(normalizedSource, kind)
    return `${prefix}${resolved}${suffix}`
  })
}

async function fileExists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

function isSafeUploadFilename(filename: string) {
  return Boolean(filename)
    && !filename.includes('/')
    && !filename.includes('\\')
    && filename !== '.'
    && filename !== '..'
}

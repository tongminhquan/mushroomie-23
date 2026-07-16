import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { getImageProps } from 'next/image'
import { getImageFallback, normalizeImageUrl, type PublicImageKind } from '@/lib/image-url'

const UPLOAD_PREFIX = '/uploads/'
const PUBLIC_ROOT = path.join(process.cwd(), 'public')
const UPLOAD_ROOT = path.join(PUBLIC_ROOT, 'uploads')
const ARTICLE_IMAGE_TAG_PATTERN = /<img\b[^>]*>/gi
const ARTICLE_IMAGE_SIZES = '(max-width: 767px) calc(100vw - 2.5rem), 480px'

export interface ImageRenderState {
  exists: boolean
  isFallback: boolean
  isUpload: boolean
  normalizedSrc: string
  renderSrc: string
  issue: 'invalid-url' | 'missing-file' | null
  width?: number
  height?: number
}

interface ImageRenderOptions {
  uploadRoot?: string
}

export async function inspectImageForRender(
  src?: string | null,
  kind: PublicImageKind = 'product',
  options: ImageRenderOptions = {},
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

  const absolutePath = path.join(options.uploadRoot || UPLOAD_ROOT, uploadFilename)
  const exists = await fileExists(absolutePath)
  const dimensions = exists ? await readImageDimensions(absolutePath) : undefined

  return {
    exists,
    isFallback: !exists,
    isUpload: true,
    normalizedSrc,
    renderSrc: exists ? normalizedSrc : fallback,
    issue: exists ? null : 'missing-file',
    ...dimensions,
  }
}

export async function resolveImageUrlForRender(
  src?: string | null,
  kind: PublicImageKind = 'product',
) {
  const result = await inspectImageForRender(src, kind)
  return result.renderSrc
}

export async function resolveResponsiveArticleImagesForRender(
  html: string,
  kind: PublicImageKind = 'post',
  options: ImageRenderOptions = {},
) {
  if (!html) return ''

  const sources = new Set<string>()
  for (const tag of html.matchAll(ARTICLE_IMAGE_TAG_PATTERN)) {
    const source = getImageAttribute(tag[0], 'src')?.trim()
    if (source) sources.add(source)
  }

  if (sources.size === 0) return html

  const replacements = new Map<string, ImageRenderState>()
  await Promise.all(
    Array.from(sources).map(async (source) => {
      replacements.set(source, await inspectImageForRender(source, kind, options))
    }),
  )

  return html.replace(ARTICLE_IMAGE_TAG_PATTERN, (tag) => {
    const source = getImageAttribute(tag, 'src')?.trim()
    if (!source) return tag

    const image = replacements.get(source)
    if (!image) return tag

    return buildResponsiveArticleImageTag(tag, image)
  })
}

export const resolveArticleImagesForRender = resolveResponsiveArticleImagesForRender

async function fileExists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function readImageDimensions(targetPath: string): Promise<Pick<ImageRenderState, 'width' | 'height'> | undefined> {
  try {
    const metadata = await sharp(await readFile(targetPath), { failOn: 'none' }).metadata()
    if (!metadata.width || !metadata.height) return undefined

    return {
      width: metadata.width,
      height: metadata.height,
    }
  } catch {
    return undefined
  }
}

function isSafeUploadFilename(filename: string) {
  return Boolean(filename)
    && !filename.includes('/')
    && !filename.includes('\\')
    && filename !== '.'
    && filename !== '..'
}

function buildResponsiveArticleImageTag(tag: string, image: ImageRenderState) {
  const cleaned = removeImageAttributes(tag, [
    'src',
    'srcset',
    'sizes',
    'width',
    'height',
    'loading',
    'decoding',
  ])

  if (!image.width || !image.height || !image.isUpload || !image.exists) {
    return appendImageAttributes(cleaned, [
      ['src', image.renderSrc],
      ['loading', 'lazy'],
      ['decoding', 'async'],
    ])
  }

  const alt = getImageAttribute(tag, 'alt') || ''
  const { props } = getImageProps({
    src: image.renderSrc,
    alt,
    width: image.width,
    height: image.height,
    sizes: ARTICLE_IMAGE_SIZES,
    loading: 'lazy',
    decoding: 'async',
    overrideSrc: image.renderSrc,
  })

  return appendImageAttributes(cleaned, [
    ['src', props.src],
    ['srcset', props.srcSet],
    ['sizes', props.sizes],
    ['width', props.width],
    ['height', props.height],
    ['loading', props.loading],
    ['decoding', props.decoding],
  ])
}

function getImageAttribute(tag: string, name: string) {
  const pattern = new RegExp(
    "\\s" + escapeRegExp(name) + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s\"'=<>`]+))",
    'i',
  )
  const match = tag.match(pattern)
  return match?.[1] ?? match?.[2] ?? match?.[3]
}

function removeImageAttributes(tag: string, names: string[]) {
  return names.reduce((result, name) => (
    result.replace(
      new RegExp(
        "\\s" + escapeRegExp(name) + "\\s*=\\s*(?:\"[^\"]*\"|'[^']*'|[^\\s\"'=<>`]+)",
        'gi',
      ),
      '',
    )
  ), tag)
}

function appendImageAttributes(
  tag: string,
  attributes: Array<[string, string | number | undefined]>,
) {
  const closing = tag.endsWith('/>') ? '/>' : '>'
  const serialized = attributes
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => ` ${name}="${escapeHtmlAttribute(String(value))}"`)
    .join('')
  return tag.slice(0, -closing.length) + serialized + closing
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

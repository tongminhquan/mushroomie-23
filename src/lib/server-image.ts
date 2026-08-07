import { access } from 'node:fs/promises'
import path from 'node:path'
import { getImageProps } from 'next/image'
import { parseFragment, serialize, type DefaultTreeAdapterTypes } from 'parse5'
import sharp from 'sharp'
import { getImageFallback, normalizeImageUrl, type PublicImageKind } from '@/lib/image-url'
import { normalizeGeneratedPostImageAlt } from '@/lib/image-alt'
import { uploadVariantLoader } from '@/lib/image-variants'

const UPLOAD_PREFIX = '/uploads/'
const PUBLIC_ROOT = path.join(process.cwd(), 'public')
const UPLOAD_ROOT = path.join(PUBLIC_ROOT, 'uploads')
const ARTICLE_IMAGE_SIZES = '(max-width: 767px) calc(100vw - 2.5rem), 480px'
const RENDERED_IMAGE_ATTRIBUTES = [
  'src',
  'srcset',
  'sizes',
  'width',
  'height',
  'loading',
  'decoding',
]

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

  const fragment = parseFragment(html)
  const images = collectImageElements(fragment)
  const sources = new Set<string>()
  for (const image of images) {
    const source = getElementAttribute(image, 'src')?.trim()
    if (source) sources.add(source)
  }

  if (sources.size === 0) return html

  const replacements = new Map<string, ImageRenderState>()
  for (const source of sources) {
    replacements.set(source, await inspectImageForRender(source, kind, options))
  }

  for (const element of images) {
    const source = getElementAttribute(element, 'src')?.trim()
    if (!source) continue
    const image = replacements.get(source)
    if (!image) continue

    applyResponsiveArticleImageAttributes(element, image)
  }

  return serialize(fragment)
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
    const metadata = await sharp(targetPath, { failOn: 'none' }).metadata()
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

function applyResponsiveArticleImageAttributes(
  element: DefaultTreeAdapterTypes.Element,
  image: ImageRenderState,
) {
  removeElementAttributes(element, RENDERED_IMAGE_ATTRIBUTES)
  const alt = normalizeGeneratedPostImageAlt(getElementAttribute(element, 'alt') || '')
  setElementAttribute(element, 'alt', alt)

  if (!image.width || !image.height || !image.isUpload || !image.exists) {
    appendElementAttributes(element, [
      ['src', image.renderSrc],
      ['loading', 'lazy'],
      ['decoding', 'async'],
    ])
    return
  }

  const { props } = getImageProps({
    src: image.renderSrc,
    loader: uploadVariantLoader,
    alt,
    width: image.width,
    height: image.height,
    sizes: ARTICLE_IMAGE_SIZES,
    loading: 'lazy',
    decoding: 'async',
    overrideSrc: image.renderSrc,
  })

  appendElementAttributes(element, [
    ['src', props.src],
    ['srcset', props.srcSet],
    ['sizes', props.sizes],
    ['width', props.width],
    ['height', props.height],
    ['loading', props.loading],
    ['decoding', props.decoding],
  ])
}

function collectImageElements(root: DefaultTreeAdapterTypes.ParentNode) {
  const images: DefaultTreeAdapterTypes.Element[] = []

  function visit(node: DefaultTreeAdapterTypes.ParentNode) {
    for (const child of node.childNodes) {
      if (!('tagName' in child)) continue
      if (child.tagName === 'img') images.push(child)
      visit(child)
    }
  }

  visit(root)
  return images
}

function getElementAttribute(element: DefaultTreeAdapterTypes.Element, name: string) {
  return element.attrs.find((attribute) => attribute.name === name)?.value
}

function setElementAttribute(
  element: DefaultTreeAdapterTypes.Element,
  name: string,
  value: string,
) {
  const attribute = element.attrs.find((candidate) => candidate.name === name)
  if (attribute) {
    attribute.value = value
    return
  }

  element.attrs.push({ name, value })
}

function removeElementAttributes(
  element: DefaultTreeAdapterTypes.Element,
  names: string[],
) {
  const removed = new Set(names)
  element.attrs = element.attrs.filter((attribute) => !removed.has(attribute.name))
}

function appendElementAttributes(
  element: DefaultTreeAdapterTypes.Element,
  attributes: Array<[string, string | number | undefined]>,
) {
  for (const [name, value] of attributes) {
    if (value !== undefined) element.attrs.push({ name, value: String(value) })
  }
}

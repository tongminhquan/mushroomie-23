import { revalidatePath } from 'next/cache'
import { Prisma, type Post, type Product } from '@prisma/client'

import { readSeoDiscoveryConfig } from './config'
import { recordPublicContentPublication } from './repository'
import type { PublicContentPublication } from './types'
import { assertProductionUrl } from './urls'

const POST_REVALIDATION_PATHS = [
  '/tin-tuc',
  '/sitemap.xml',
  '/feed.xml',
  '/',
] as const

const PRODUCT_REVALIDATION_PATHS = [
  '/san-pham',
  '/sitemap.xml',
  '/',
] as const

const MATERIAL_PUBLIC_POST_FIELDS = [
  'title',
  'slug',
  'excerpt',
  'content',
  'featured_image',
  'featured_image_alt',
  'featured_image_caption',
  'featured_image_description',
  'category_id',
  'seo_title',
  'meta_description',
  'focus_keyword',
  'published_at',
  'og_title',
  'og_description',
  'og_image',
  'twitter_title',
  'twitter_description',
  'twitter_image',
  'canonical_url',
  'robots_index',
  'robots_follow',
  'schema_type',
  'secondary_keywords',
  'reading_time',
  'word_count',
] as const satisfies readonly (keyof Post)[]

type MaterialPublicPostField = (typeof MATERIAL_PUBLIC_POST_FIELDS)[number]
type PublicPostPublicationState = Pick<Post, 'status' | MaterialPublicPostField>

const MATERIAL_PUBLIC_PRODUCT_FIELDS = [
  'name',
  'slug',
  'short_description',
  'description',
  'price',
  'sale_price',
  'sku',
  'stock',
  'is_customizable',
  'is_featured',
  'featured_image',
  'category_id',
] as const satisfies readonly (keyof Product)[]

type MaterialPublicProductField = (typeof MATERIAL_PUBLIC_PRODUCT_FIELDS)[number]

export interface PublicProductImagePublicationState {
  image_url: string
  sort_order: number
}

export type PublicProductPublicationState = Pick<
  Product,
  'status' | MaterialPublicProductField
> & {
  images: readonly PublicProductImagePublicationState[]
}

function publicationValuesEqual(existing: unknown, saved: unknown): boolean {
  if (existing instanceof Date || saved instanceof Date) {
    return existing instanceof Date
      && saved instanceof Date
      && existing.getTime() === saved.getTime()
  }

  if (Prisma.Decimal.isDecimal(existing) || Prisma.Decimal.isDecimal(saved)) {
    return Prisma.Decimal.isDecimal(existing)
      && Prisma.Decimal.isDecimal(saved)
      && existing.equals(saved)
  }

  return existing === saved
}

function productImagesEqual(
  existing: readonly PublicProductImagePublicationState[],
  saved: readonly PublicProductImagePublicationState[],
): boolean {
  return existing.length === saved.length
    && existing.every((image, index) => (
      image.image_url === saved[index]?.image_url
      && image.sort_order === saved[index]?.sort_order
    ))
}

export function shouldRecordPostPublication(
  existing: PublicPostPublicationState,
  saved: PublicPostPublicationState,
): boolean {
  if (saved.status !== 'published') return false
  if (existing.status !== 'published') return true

  // updated_at is a public version/lastmod output, but Prisma changes it on every
  // update, so it must not turn bookkeeping-only saves into discovery events.
  return MATERIAL_PUBLIC_POST_FIELDS.some((field) => (
    !publicationValuesEqual(existing[field], saved[field])
  ))
}

export function shouldRecordProductPublication(
  existing: PublicProductPublicationState,
  saved: PublicProductPublicationState,
): boolean {
  if (saved.status !== 'active') return false
  if (existing.status !== 'active') return true

  // updated_at changes for every save. Only rendered, merchandising, or SEO
  // inputs (including ordered gallery URLs) create a new discovery version.
  return MATERIAL_PUBLIC_PRODUCT_FIELDS.some((field) => (
    !publicationValuesEqual(existing[field], saved[field])
  )) || !productImagesEqual(existing.images, saved.images)
}

export interface PublicationRevalidationOptions {
  previousUrl?: string
}

function pathnameFromProductionUrl(url: string): string | null {
  try {
    return new URL(assertProductionUrl(url)).pathname
  } catch {
    return null
  }
}

function publishedContentPaths(
  event: PublicContentPublication,
  options: PublicationRevalidationOptions,
): string[] {
  const paths: string[] = []
  const currentPath = pathnameFromProductionUrl(event.url)
  const previousPath = options.previousUrl
    ? pathnameFromProductionUrl(options.previousUrl)
    : null

  if (currentPath) paths.push(currentPath)
  if (previousPath) paths.push(previousPath)

  if (event.source === 'post') {
    paths.push(...POST_REVALIDATION_PATHS)
  } else if (event.source === 'product') {
    paths.push(...PRODUCT_REVALIDATION_PATHS)
  }

  return [...new Set(paths)]
}

function revalidatePublishedContent(
  event: PublicContentPublication,
  options: PublicationRevalidationOptions,
): void {
  for (const path of publishedContentPaths(event, options)) {
    try {
      revalidatePath(path)
    } catch {
      // A cache backend failure must not skip other paths or durable recording.
    }
  }
}

export async function recordAndRevalidatePublication(
  event: PublicContentPublication,
  options: PublicationRevalidationOptions = {},
): Promise<{ recorded: boolean }> {
  try {
    revalidatePublishedContent(event, options)
  } catch {
    // Keep the queue independent from unexpected cache orchestration failures.
  }

  if (!readSeoDiscoveryConfig(process.env).discoveryEnabled) {
    return { recorded: false }
  }

  try {
    return await recordPublicContentPublication(event)
  } catch {
    return { recorded: false }
  }
}

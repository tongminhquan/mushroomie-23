import { revalidatePath } from 'next/cache'
import type { Post } from '@prisma/client'

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

function publicationValuesEqual(existing: unknown, saved: unknown): boolean {
  if (existing instanceof Date || saved instanceof Date) {
    return existing instanceof Date
      && saved instanceof Date
      && existing.getTime() === saved.getTime()
  }

  return existing === saved
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

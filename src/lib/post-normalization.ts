import { normalizeStoredImagePath } from '@/lib/image-url'
import { calculateReadingTime, calculateWordCount, normalizeArticleImages, sanitizeHtml } from '@/lib/sanitize'
import { inspectImageForRender } from '@/lib/server-image'

export function normalizePostContent(content?: string | null) {
  if (!content) return ''
  return normalizeArticleImages(sanitizeHtml(content), 'storage')
}

export function normalizeStoredPostImage(value?: string | null) {
  if (!value || typeof value !== 'string' || !value.trim()) return ''
  return normalizeStoredImagePath(value)
}

export function normalizeOptionalPostImage(value?: string | null) {
  if (!value || typeof value !== 'string' || !value.trim()) return null
  return normalizeStoredImagePath(value)
}

export function extractTagNames(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  return tags
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim()
      if (!entry || typeof entry !== 'object') return ''
      const tagName = 'tag' in entry && entry.tag && typeof entry.tag === 'object' && 'name' in entry.tag
        ? String((entry.tag as { name?: unknown }).name || '')
        : 'name' in entry
          ? String((entry as { name?: unknown }).name || '')
          : ''
      return tagName.trim()
    })
    .filter(Boolean)
}

export function serializeStringArray(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (!Array.isArray(value)) return null

  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)

  return items.length > 0 ? JSON.stringify(items) : null
}

export function buildPostContentMetrics(content?: string | null) {
  const normalizedContent = normalizePostContent(content)
  return {
    content: normalizedContent,
    readingTime: normalizedContent ? calculateReadingTime(normalizedContent) : null,
    wordCount: normalizedContent ? calculateWordCount(normalizedContent) : null,
  }
}

export async function serializePostForEditor<T extends Record<string, any>>(post: T) {
  const [featuredImageState, ogImageState, twitterImageState] = await Promise.all([
    inspectImageForRender(post.featured_image, 'post'),
    inspectImageForRender(post.og_image, 'post'),
    inspectImageForRender(post.twitter_image, 'post'),
  ])

  return {
    ...post,
    content: normalizePostContent(post.content),
    featured_image: normalizeStoredPostImage(post.featured_image),
    featured_image_exists: featuredImageState.exists,
    featured_image_issue: featuredImageState.issue,
    featured_image_preview: featuredImageState.renderSrc,
    og_image: normalizeStoredPostImage(post.og_image),
    og_image_exists: ogImageState.exists,
    og_image_issue: ogImageState.issue,
    og_image_preview: ogImageState.renderSrc,
    twitter_image: normalizeStoredPostImage(post.twitter_image),
    twitter_image_exists: twitterImageState.exists,
    twitter_image_issue: twitterImageState.issue,
    twitter_image_preview: twitterImageState.renderSrc,
    tags: extractTagNames(post.tags),
  }
}

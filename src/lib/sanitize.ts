import DOMPurify from 'isomorphic-dompurify'
import { normalizeImageUrl, normalizeStoredImagePath } from '@/lib/image-url'

/**
 * Server-side HTML sanitizer for blog post content.
 * Removes dangerous HTML elements and attributes to prevent XSS.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
}

export function normalizeArticleImages(
  html: string,
  mode: 'render' | 'storage' = 'render',
): string {
  if (!html) return ''

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (_match, prefix: string, source: string, suffix: string) => {
      const normalized = mode === 'storage'
        ? normalizeStoredImagePath(source.trim()) || source.trim()
        : normalizeImageUrl(source.trim(), 'post')
      return `${prefix}${normalized}${suffix}`
    },
  )
}

/**
 * Calculate reading time in minutes from HTML content.
 */
export function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

/**
 * Calculate word count from HTML content.
 */
export function calculateWordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.split(/\s+/).filter(w => w.length > 0).length
}

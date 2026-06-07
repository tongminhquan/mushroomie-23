/**
 * Server-side HTML sanitizer for blog post content.
 * Removes dangerous HTML elements and attributes to prevent XSS.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  let clean = html

  // Remove script tags and content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove iframe, object, embed, form tags and content
  clean = clean.replace(/<(iframe|object|embed|form)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
  // Also catch self-closing variants
  clean = clean.replace(/<(iframe|object|embed|form)\b[^>]*\/>/gi, '')

  // Remove all on* event handlers
  clean = clean.replace(/\s+on\w+\s*=\s*(["'])[^"']*\1/gi, '')
  clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')

  // Remove javascript: URLs
  clean = clean.replace(/(href|src|action)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2')

  // Remove data: URLs in src (potential XSS vector), except data:image
  clean = clean.replace(/src\s*=\s*(["'])\s*data:(?!image\/)[^"']*\1/gi, 'src=$1#$1')

  return clean
}

export function normalizeArticleImages(html: string): string {
  if (!html) return ''

  return html.replace(
    /(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
    (_match, prefix: string, source: string, suffix: string) => {
      let normalized = source.trim()

      if (
        normalized.startsWith('http://localhost') ||
        normalized.startsWith('https://localhost') ||
        normalized.startsWith('http://127.0.0.1') ||
        normalized.startsWith('https://127.0.0.1')
      ) {
        try {
          normalized = new URL(normalized).pathname
        } catch {
          normalized = '/images/product-placeholder.png'
        }
      }

      if (normalized.startsWith('/public/uploads/')) {
        normalized = normalized.replace('/public', '')
      }

      if (
        normalized.startsWith('/wp-content/uploads/') ||
        normalized.startsWith('https://mushroomie.io.vn/wp-content/uploads/')
      ) {
        normalized = '/images/product-placeholder.png'
      }

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

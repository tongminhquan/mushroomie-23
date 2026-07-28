import { describe, expect, it } from 'vitest'
import { calculateReadingTime, calculateWordCount, normalizeArticleImages, sanitizeHtml } from '@/lib/sanitize'

describe('article sanitization and metrics', () => {
  it('removes executable markup while preserving safe article content', () => {
    const result = sanitizeHtml('<p onclick="steal()">Hello <strong>friend</strong></p><script>alert(1)</script><iframe src="x"></iframe>')

    expect(result).toContain('<p>Hello <strong>friend</strong></p>')
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('<iframe')
  })

  it('normalizes every article image source for rendering and storage', () => {
    const html = '<p><img alt="one" src="public/uploads/one.jpg"><img src="two.webp"></p>'

    expect(normalizeArticleImages(html, 'storage')).toContain('src="/uploads/one.jpg"')
    expect(normalizeArticleImages(html, 'render')).toContain('src="/uploads/two.webp"')
  })

  it('calculates word count and rounds reading time up with a one-minute minimum', () => {
    expect(calculateWordCount('<p>Một hai</p><p>ba</p>')).toBe(3)
    expect(calculateReadingTime('')).toBe(1)
    expect(calculateReadingTime(`<p>${Array.from({ length: 201 }, () => 'hạt').join(' ')}</p>`)).toBe(2)
  })
})

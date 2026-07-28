import { afterEach, describe, expect, it, vi } from 'vitest'
import { cn } from '@/lib/cn'
import { formatDate, formatPrice, generateOrderCode, generateSlug, truncate } from '@/lib/utils'
import { sanitizeCallbackUrl, toAbsoluteUrl } from '@/lib/url'

describe('shared formatting and URL helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('formats prices, dates, slugs, and truncated copy for Vietnamese storefront output', () => {
    expect(formatPrice(1_250_000)).toContain('1.250.000')
    expect(formatPrice('99000')).toContain('99.000')
    expect(formatDate(new Date(2026, 6, 19, 14, 30))).toBe('19/07/2026 14:30')
    expect(generateSlug('Vòng tay Đỏ -- Cá tính!')).toBe('vong-tay-do-ca-tinh')
    expect(truncate('Mushroomie', 20)).toBe('Mushroomie')
    expect(truncate('Mushroomie handmade', 10)).toBe('Mushroomie...')
  })

  it('merges conditional Tailwind classes without keeping conflicting utilities', () => {
    expect(cn('px-2 text-red-500', false && 'hidden', 'px-4')).toBe('text-red-500 px-4')
  })

  it('generates an order code with the configured prefix and deterministic entropy', () => {
    vi.stubEnv('PAYMENT_PREFIX', 'TEST')
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    expect(generateOrderCode()).toMatch(/^TEST-[A-Z0-9]+$/)
  })

  it.each([
    [undefined, '/'],
    ['', '/'],
    ['  /gio-hang?from=header#items  ', '/gio-hang?from=header#items'],
    ['//evil.example/steal', '/'],
    ['https://evil.example/steal', '/'],
    ['javascript:alert(1)', '/'],
    ['https://mushroomie.io.vn/tai-khoan?tab=orders#latest', '/tai-khoan?tab=orders#latest'],
    ['/safe\\unsafe', '/'],
  ])('sanitizes callback URL %s', (input, expected) => {
    expect(sanitizeCallbackUrl(input)).toBe(expected)
  })

  it('keeps external image URLs absolute and prefixes local image paths with the site URL', () => {
    expect(toAbsoluteUrl('https://cdn.example.com/item.webp')).toBe('https://cdn.example.com/item.webp')
    expect(toAbsoluteUrl('/uploads/item.webp')).toBe('https://mushroomie.io.vn/uploads/item.webp')
  })
})

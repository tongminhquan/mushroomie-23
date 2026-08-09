import { describe, expect, it } from 'vitest'

import {
  assertProductionUrl,
  buildPublicContentUrl,
} from '@/lib/seo-discovery/urls'

describe('public SEO discovery URLs', () => {
  it('builds post URLs on the production origin', () => {
    expect(buildPublicContentUrl('post', 'vong tay do')).toBe(
      'https://mushroomie.io.vn/tin-tuc/vong%20tay%20do',
    )
  })

  it('builds product URLs on the production origin', () => {
    expect(buildPublicContentUrl('product', 'moc-khoa-nam')).toBe(
      'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
    )
  })

  it('encodes a slug as one path segment', () => {
    expect(buildPublicContentUrl('post', 'vong/tay do')).toBe(
      'https://mushroomie.io.vn/tin-tuc/vong%2Ftay%20do',
    )
  })

  it('normalizes equivalent production URLs and removes fragments', () => {
    expect(assertProductionUrl(
      'HTTPS://MUSHROOMIE.IO.VN:443/tin-tuc/vong tay do#preview',
    )).toBe('https://mushroomie.io.vn/tin-tuc/vong%20tay%20do')
  })

  it('removes query data from canonical discovery URLs', () => {
    expect(assertProductionUrl(
      'https://mushroomie.io.vn/tin-tuc/vong-tay?utm_source=email&token=query-redaction-sentinel#preview',
    )).toBe('https://mushroomie.io.vn/tin-tuc/vong-tay')
  })

  it.each([
    'http://mushroomie.io.vn/tin-tuc/post',
    'https://www.mushroomie.io.vn/tin-tuc/post',
    'https://mushroomie.io.vn.evil.test/tin-tuc/post',
    'https://user:credential-redaction-sentinel@mushroomie.io.vn/tin-tuc/post',
    'not a URL',
  ])('rejects non-production URL %j', (url) => {
    expect(() => assertProductionUrl(url)).toThrow('SEO_DISCOVERY_INVALID_URL')
  })
})

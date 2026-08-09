import { describe, expect, it, vi } from 'vitest'

import {
  FIXED_SITEMAP_URL,
  readFixedSitemap,
} from '@/lib/seo-discovery/sitemap-reader'

function xmlResponse(xml: BodyInit, headers: HeadersInit = {}) {
  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      ...headers,
    },
  })
}

function sitemapXml(blocks: string) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    blocks,
    '</urlset>',
  ].join('')
}

describe('readFixedSitemap', () => {
  it('fetches only the fixed sitemap with the shared 5-second manual-redirect policy', async () => {
    const signal = new AbortController().signal
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal)
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(sitemapXml(`
      <url>
        <loc>https://mushroomie.io.vn/tin-tuc/charm&amp;-hat</loc>
        <lastmod>2026-08-09T10:30:00.000Z</lastmod>
      </url>
      <url>
        <loc>https://mushroomie.io.vn/lien-he</loc>
      </url>
    `)))

    const sitemap = await readFixedSitemap({ fetch: fetchMock })

    expect(FIXED_SITEMAP_URL).toBe('https://mushroomie.io.vn/sitemap.xml')
    expect(timeoutSpy).toHaveBeenCalledOnce()
    expect(timeoutSpy).toHaveBeenCalledWith(5_000)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(FIXED_SITEMAP_URL, {
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'manual',
      signal,
    })
    expect([...sitemap.entries()]).toEqual([
      [
        'https://mushroomie.io.vn/tin-tuc/charm&-hat',
        new Date('2026-08-09T10:30:00.000Z'),
      ],
      ['https://mushroomie.io.vn/lien-he', null],
    ])
  })

  it('decodes numeric XML entities before validating a location', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(sitemapXml(`
      <url>
        <loc>https&#58;//mushroomie.io.vn/tin-tuc/vong&#45;tay</loc>
        <lastmod>2026-08-09</lastmod>
      </url>
    `)))

    await expect(readFixedSitemap({ fetch: fetchMock })).resolves.toEqual(
      new Map([
        [
          'https://mushroomie.io.vn/tin-tuc/vong-tay',
          new Date('2026-08-09T00:00:00.000Z'),
        ],
      ]),
    )
  })

  it.each([
    [
      'identical duplicate',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc></url><url><loc>https://mushroomie.io.vn/lien-he</loc></url>',
    ],
    [
      'conflicting duplicate',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc><lastmod>2026-08-01</lastmod></url><url><loc>HTTPS://MUSHROOMIE.IO.VN/lien-he</loc><lastmod>2026-08-02</lastmod></url>',
    ],
    [
      'equivalent encoded duplicate',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc></url><url><loc>https://mushroomie.io.vn/l%69en-he</loc></url>',
    ],
  ])('rejects a %s URL', async (_label, blocks) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(sitemapXml(blocks)),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject({
      code: 'SITEMAP_DUPLICATE_URL',
      message: 'SEO_DISCOVERY_SITEMAP_DUPLICATE_URL',
      retryable: false,
    })
  })

  it.each([
    ['missing loc', '<url><lastmod>2026-08-01</lastmod></url>'],
    [
      'two loc elements',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc><loc>https://mushroomie.io.vn/</loc></url>',
    ],
    [
      'invalid location',
      '<url><loc>https://evil.test/private?token=query-secret</loc></url>',
    ],
    [
      'invalid lastmod',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc><lastmod>not-a-date-query-secret</lastmod></url>',
    ],
    ['no URL entries', ''],
  ])('rejects malformed sitemap data: %s', async (_label, blocks) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(sitemapXml(blocks)),
    )

    try {
      await readFixedSitemap({ fetch: fetchMock })
      throw new Error('expected sitemap parsing to fail')
    } catch (error) {
      expect(error).toMatchObject({
        code: 'SITEMAP_INVALID_XML',
        message: 'SEO_DISCOVERY_SITEMAP_INVALID_XML',
        retryable: false,
      })
      expect(String(error)).not.toContain('query-secret')
    }
  })

  it('rejects a redirect off origin before fetching it', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://evil.test/sitemap.xml' },
      }),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject({
      code: 'SITEMAP_INVALID_REDIRECT',
      retryable: false,
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('follows a validated relative redirect without accepting a caller URL', async () => {
    const redirectedUrl = 'https://mushroomie.io.vn/generated-sitemap.xml'
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: '/generated-sitemap.xml' },
      }))
      .mockResolvedValueOnce(xmlResponse(sitemapXml(
        '<url><loc>https://mushroomie.io.vn/</loc></url>',
      )))

    await expect(readFixedSitemap({ fetch: fetchMock })).resolves.toEqual(
      new Map([['https://mushroomie.io.vn/', null]]),
    )
    expect(fetchMock.mock.calls.map(([input]) => input)).toEqual([
      FIXED_SITEMAP_URL,
      redirectedUrl,
    ])
  })

  it.each([
    [404, 'SITEMAP_HTTP_NOT_FOUND', false],
    [429, 'SITEMAP_HTTP_RETRYABLE', true],
    [500, 'SITEMAP_HTTP_RETRYABLE', true],
  ] as const)('maps HTTP %i without exposing the response body', async (status, code, retryable) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('remote query-secret body', {
        status,
        headers: { 'content-type': 'application/xml' },
      }),
    )

    try {
      await readFixedSitemap({ fetch: fetchMock })
      throw new Error('expected sitemap fetch to fail')
    } catch (error) {
      expect(error).toMatchObject({ code, retryable, httpStatus: status })
      expect(String(error)).not.toContain('query-secret')
    }
  })

  it('rejects a non-XML content type', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(sitemapXml(
        '<url><loc>https://mushroomie.io.vn/</loc></url>',
      ), { 'content-type': 'text/html' }),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject({
      code: 'SITEMAP_UNSUPPORTED_CONTENT_TYPE',
      retryable: false,
    })
  })

  it('stops consuming XML once the 2 MiB byte limit is exceeded', async () => {
    const chunk = new Uint8Array(64 * 1024).fill(97)
    const chunks = Array.from({ length: 36 }, () => chunk)
    let index = 0
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(chunks[index])
        index += 1
        if (index === chunks.length) controller.close()
      },
      cancel() {
        cancelled = true
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(body),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject({
      code: 'SITEMAP_TOO_LARGE',
      retryable: false,
    })
    expect(cancelled).toBe(true)
    expect(index).toBeLessThan(chunks.length)
  })

  it('fails safely when the shared deadline aborts fetch', async () => {
    const timeoutError = new DOMException('remote query-secret', 'TimeoutError')
    const signal = AbortSignal.abort(timeoutError)
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal)
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(timeoutError)

    try {
      await readFixedSitemap({ fetch: fetchMock })
      throw new Error('expected sitemap fetch to fail')
    } catch (error) {
      expect(timeoutSpy).toHaveBeenCalledWith(5_000)
      expect(error).toMatchObject({
        code: 'SITEMAP_FETCH_TIMEOUT',
        retryable: true,
      })
      expect(String(error)).not.toContain('query-secret')
    }
  })
})

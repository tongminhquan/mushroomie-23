import { describe, expect, it, vi } from 'vitest'

import {
  FIXED_SITEMAP_URL,
  readFixedSitemap,
} from '@/lib/seo-discovery/sitemap-reader'

const MAX_SITEMAP_BYTES = 2 * 1024 * 1024
const MAX_SITEMAP_URL_ENTRIES = 10_000

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

function invalidXmlResult() {
  return {
    code: 'SITEMAP_INVALID_XML',
    message: 'SEO_DISCOVERY_SITEMAP_INVALID_XML',
    retryable: false,
  }
}

function xmlWithExactByteLength(byteLength: number) {
  const opening = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '<url><loc>https://mushroomie.io.vn/</loc></url>',
  ].join('')
  const closing = '</urlset>'
  const paddingLength = byteLength - opening.length - closing.length
  if (paddingLength < 0) throw new Error('requested XML body is too small')
  return `${opening}${' '.repeat(paddingLength)}${closing}`
}

function unicodeExpandedUrl() {
  const url = `https://mushroomie.io.vn/${'🍄'.repeat(50)}`
  if (url.length > 512 || new URL(url).toString().length <= 512) {
    throw new Error('test URL must expand past the serialized URL limit')
  }
  return url
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

  it('accepts standard fields emitted by the installed Next sitemap serializer', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(sitemapXml(`
      <url>
        <loc>https://mushroomie.io.vn/</loc>
        <lastmod>2026-08-10T07:15:30.000Z</lastmod>
        <changefreq>daily</changefreq>
        <priority>1</priority>
      </url>
      <url>
        <loc>https://mushroomie.io.vn/lien-he</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
      </url>
    `)))

    await expect(readFixedSitemap({ fetch: fetchMock })).resolves.toEqual(
      new Map([
        [
          'https://mushroomie.io.vn/',
          new Date('2026-08-10T07:15:30.000Z'),
        ],
        ['https://mushroomie.io.vn/lien-he', null],
      ]),
    )
  })

  it.each([
    [
      'an invalid changefreq value',
      '<url><loc>https://mushroomie.io.vn/</loc><changefreq>sometimes</changefreq></url>',
    ],
    [
      'two changefreq elements',
      '<url><loc>https://mushroomie.io.vn/</loc><changefreq>daily</changefreq><changefreq>weekly</changefreq></url>',
    ],
    [
      'an out-of-range priority',
      '<url><loc>https://mushroomie.io.vn/</loc><priority>1.1</priority></url>',
    ],
    [
      'a non-decimal priority lexical form',
      '<url><loc>https://mushroomie.io.vn/</loc><priority>1e0</priority></url>',
    ],
    [
      'two priority elements',
      '<url><loc>https://mushroomie.io.vn/</loc><priority>0.8</priority><priority>0.7</priority></url>',
    ],
    [
      'a standard field wrapping a core element',
      '<url><changefreq><loc>https://mushroomie.io.vn/</loc></changefreq></url>',
    ],
  ])('rejects malformed standard sitemap data: %s', async (_label, blocks) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(sitemapXml(blocks)),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it('rejects an XML comment whose value ends with a hyphen', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(sitemapXml(
      '<url><loc>https://mushroomie.io.vn/</loc><!--invalid---></url>',
    )))

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
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
      'a commented loc instead of a direct child',
      '<url><!-- <loc>https://mushroomie.io.vn/lien-he</loc> --></url>',
    ],
    [
      'a nested loc instead of a direct child',
      '<url><wrapper><loc>https://mushroomie.io.vn/lien-he</loc></wrapper></url>',
    ],
    [
      'a nested lastmod in an unrecognized wrapper',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc><wrapper><lastmod>2026-08-01</lastmod></wrapper></url>',
    ],
    [
      'mismatched extension elements',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc><image:image xmlns:image="urn:image" xmlns:video="urn:video"></video:video></url>',
    ],
    [
      'an unbalanced extension element',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc><image:image xmlns:image="urn:image"></url>',
    ],
    [
      'an unquoted attribute',
      '<url broken=nope><loc>https://mushroomie.io.vn/lien-he</loc></url>',
    ],
    [
      'two direct-child lastmod elements',
      '<url><loc>https://mushroomie.io.vn/lien-he</loc><lastmod>2026-08-01</lastmod><lastmod>2026-08-02</lastmod></url>',
    ],
    [
      'an undefined entity reference',
      '<url><loc>https://mushroomie.io.vn/tin-tuc/&undefined;</loc></url>',
    ],
    [
      'a double-escaped entity reference',
      '<url><loc>https://mushroomie.io.vn/tin-tuc/charm&amp;amp;-hat</loc></url>',
    ],
  ])('rejects structurally invalid XML with %s', async (_label, blocks) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(sitemapXml(blocks)),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it('requires the expected sitemap urlset root namespace', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(
      '<urlset><url><loc>https://mushroomie.io.vn/</loc></url></urlset>',
    ))

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it.each([
    '<!DOCTYPE urlset [<!ENTITY internal "https://mushroomie.io.vn/">]>',
    '<!DOCTYPE urlset [<!ENTITY external SYSTEM "https://evil.test/entity">]>',
  ])('rejects DTD and entity declarations without resolving them', async (declaration) => {
    const xml = `${declaration}${sitemapXml(
      '<url><loc>https://mushroomie.io.vn/</loc></url>',
    )}`
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(xml))

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it('ignores comments and well-formed declared extension subtrees without changing core values', async () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
      ' xmlns:xhtml="http://www.w3.org/1999/xhtml">',
      '<url>',
      '<loc>https://mushroomie.io.vn/lien-he</loc>',
      '<!-- <lastmod>1999-01-01</lastmod> -->',
      '<image:image><image:loc><![CDATA[https://cdn.example/image?a&b]]></image:loc></image:image>',
      '<xhtml:link rel="alternate" hreflang="vi" href="https://mushroomie.io.vn/lien-he"/>',
      '</url>',
      '</urlset>',
    ].join('')
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(xml))

    await expect(readFixedSitemap({ fetch: fetchMock })).resolves.toEqual(
      new Map([['https://mushroomie.io.vn/lien-he', null]]),
    )
  })

  it('rejects more than the bounded number of URL entries', async () => {
    const blocks = Array.from(
      { length: MAX_SITEMAP_URL_ENTRIES + 1 },
      (_, index) => `<url><loc>https://mushroomie.io.vn/${index.toString(36)}</loc></url>`,
    ).join('')
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(sitemapXml(blocks)),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it('rejects a near-limit adversarial opening-tag document without suffix rescans', async () => {
    const opening = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ].join('')
    const closing = '</urlset>'
    const malformedOpeningTags = '<url '.repeat(
      Math.floor((MAX_SITEMAP_BYTES - opening.length - closing.length) / 5),
    )
    const xml = `${opening}${malformedOpeningTags}${closing}`
    expect(new TextEncoder().encode(xml).byteLength).toBeLessThanOrEqual(
      MAX_SITEMAP_BYTES,
    )
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(xml))

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it('rejects a sitemap loc whose normalized serialized URL exceeds 512 characters', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(sitemapXml(
      `<url><loc>${unicodeExpandedUrl()}</loc></url>`,
    )))

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it('rejects malformed UTF-8 bytes instead of accepting replacement characters', async () => {
    const prefix = new TextEncoder().encode(sitemapXml(
      '<url><loc>https://mushroomie.io.vn/tin-tuc/',
    ).replace('</urlset>', ''))
    const suffix = new TextEncoder().encode('</loc></url></urlset>')
    const bytes = new Uint8Array(prefix.length + 2 + suffix.length)
    bytes.set(prefix)
    bytes.set([0xc3, 0x28], prefix.length)
    bytes.set(suffix, prefix.length + 2)
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(xmlResponse(bytes))

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it.each([
    [
      'a non-UTF-8 XML declaration',
      sitemapXml('<url><loc>https://mushroomie.io.vn/</loc></url>')
        .replace('encoding="UTF-8"', 'encoding="UTF-16"'),
      {},
    ],
    [
      'a non-UTF-8 HTTP charset',
      sitemapXml('<url><loc>https://mushroomie.io.vn/</loc></url>'),
      { 'content-type': 'application/xml; charset=iso-8859-1' },
    ],
    [
      'contradictory XML and HTTP encodings',
      sitemapXml('<url><loc>https://mushroomie.io.vn/</loc></url>')
        .replace('encoding="UTF-8"', 'encoding="windows-1252"'),
      { 'content-type': 'application/xml; charset=utf-8' },
    ],
  ])('rejects %s', async (_label, xml, headers) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(xml, headers),
    )

    await expect(readFixedSitemap({ fetch: fetchMock })).rejects.toMatchObject(
      invalidXmlResult(),
    )
  })

  it('accepts exactly 2 MiB and rejects one byte more', async () => {
    const exactFetch = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(xmlWithExactByteLength(MAX_SITEMAP_BYTES)),
    )
    await expect(readFixedSitemap({ fetch: exactFetch })).resolves.toEqual(
      new Map([['https://mushroomie.io.vn/', null]]),
    )

    const oversizedFetch = vi.fn<typeof fetch>().mockResolvedValue(
      xmlResponse(xmlWithExactByteLength(MAX_SITEMAP_BYTES + 1)),
    )
    await expect(readFixedSitemap({ fetch: oversizedFetch })).rejects.toMatchObject({
      code: 'SITEMAP_TOO_LARGE',
      retryable: false,
    })
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

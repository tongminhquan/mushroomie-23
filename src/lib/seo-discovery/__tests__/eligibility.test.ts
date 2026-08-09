import { describe, expect, it, vi } from 'vitest'

import {
  checkPublicUrlEligibility,
  validatePublicUrl,
} from '@/lib/seo-discovery/eligibility'

const ARTICLE_URL = 'https://mushroomie.io.vn/tin-tuc/vong-tay-do'

function htmlResponse(
  canonical: string,
  options: {
    bodyPrefix?: string
    headers?: HeadersInit
    robots?: string
    status?: number
  } = {},
) {
  const robots = options.robots
    ? `<meta name="robots" content="${options.robots}">`
    : ''
  const body = [
    '<!doctype html><html><head>',
    `<link rel="canonical" href="${canonical}">`,
    robots,
    '</head><body>',
    options.bodyPrefix ?? 'Mushroomie',
    '</body></html>',
  ].join('')

  return new Response(body, {
    status: options.status ?? 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      ...options.headers,
    },
  })
}

function sitemapWith(...urls: string[]) {
  return new Map(urls.map((url) => [url, null] as const))
}

describe('validatePublicUrl', () => {
  it.each([
    ['home', 'https://mushroomie.io.vn/', 'https://mushroomie.io.vn/'],
    ['article', ARTICLE_URL, ARTICLE_URL],
    [
      'product',
      'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
      'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
    ],
    [
      'approved category',
      'https://mushroomie.io.vn/san-pham?category=vong-tay',
      'https://mushroomie.io.vn/san-pham?category=vong-tay',
    ],
    [
      'static policy',
      'https://mushroomie.io.vn/chinh-sach-bao-mat',
      'https://mushroomie.io.vn/chinh-sach-bao-mat',
    ],
    [
      'published local page',
      'https://mushroomie.io.vn/vong-tay-handmade-dong-nai',
      'https://mushroomie.io.vn/vong-tay-handmade-dong-nai',
    ],
    [
      'equivalent encoded path spelling',
      'https://mushroomie.io.vn/l%69en-he',
      'https://mushroomie.io.vn/lien-he',
    ],
    [
      'new queryless static page',
      'https://mushroomie.io.vn/trang-trien-khai-moi',
      'https://mushroomie.io.vn/trang-trien-khai-moi',
    ],
  ])('accepts the %s URL', (_label, input, expected) => {
    expect(validatePublicUrl(input)).toBe(expected)
  })

  it.each([
    ['HTTP', 'http://mushroomie.io.vn/tin-tuc/post'],
    ['other host', 'https://evil.test/tin-tuc/post'],
    ['subdomain', 'https://www.mushroomie.io.vn/tin-tuc/post'],
    ['host suffix', 'https://mushroomie.io.vn.evil.test/tin-tuc/post'],
    ['credentials', 'https://user:query-secret@mushroomie.io.vn/tin-tuc/post'],
    ['empty credentials marker', 'https://@mushroomie.io.vn/tin-tuc/post'],
    ['fragment', 'https://mushroomie.io.vn/tin-tuc/post#preview'],
    ['empty fragment', 'https://mushroomie.io.vn/tin-tuc/post#'],
    ['default explicit port', 'https://mushroomie.io.vn:443/tin-tuc/post'],
    ['padded default port', 'https://mushroomie.io.vn:0443/tin-tuc/post'],
    ['non-default explicit port', 'https://mushroomie.io.vn:444/tin-tuc/post'],
    ['unapproved query', 'https://mushroomie.io.vn/tin-tuc/post?token=query-secret'],
    ['empty query', 'https://mushroomie.io.vn/tin-tuc/post?'],
    ['extra category query', 'https://mushroomie.io.vn/san-pham?category=vong-tay&sort=price'],
    ['duplicate category query', 'https://mushroomie.io.vn/san-pham?category=vong-tay&category=charm'],
    ['unknown category', 'https://mushroomie.io.vn/san-pham?category=khong-ton-tai'],
    ['encoded category spelling', 'https://mushroomie.io.vn/san-pham?category=%76ong-tay'],
    ['literal traversal', 'https://mushroomie.io.vn/admin/../tin-tuc/post'],
    ['encoded traversal', 'https://mushroomie.io.vn/tin-tuc/%2e%2e/admin'],
    ['double-encoded traversal', 'https://mushroomie.io.vn/tin-tuc/%252e%252e%252fadmin'],
    ['encoded slash', 'https://mushroomie.io.vn/tin-tuc/post%2fadmin'],
    ['backslash', 'https://mushroomie.io.vn/tin-tuc\\post'],
    ['duplicate slash', 'https://mushroomie.io.vn/tin-tuc//post'],
    ['embedded newline', 'https://mushroomie.io.vn/tin-tuc/po\nst'],
  ])('rejects %s', (_label, input) => {
    expect(() => validatePublicUrl(input)).toThrow(
      'SEO_DISCOVERY_INVALID_PUBLIC_URL',
    )
  })

  const blockedPrefixes = [
    '/admin',
    '/api',
    '/tai-khoan',
    '/gio-hang',
    '/thanh-toan',
    '/checkout',
    '/uploads',
    '/_next',
  ]

  it.each(blockedPrefixes)('rejects the blocked prefix %s', (prefix) => {
    expect(() => validatePublicUrl(
      `https://mushroomie.io.vn${prefix}/private`,
    )).toThrow('SEO_DISCOVERY_INVALID_PUBLIC_URL')
  })

  it('does not echo rejected query or credential data', () => {
    for (const url of [
      'https://mushroomie.io.vn/tin-tuc/post?token=query-secret',
      'https://user:credential-secret@mushroomie.io.vn/tin-tuc/post',
    ]) {
      try {
        validatePublicUrl(url)
        throw new Error('expected validation to fail')
      } catch (error) {
        expect(error).toMatchObject({
          message: 'SEO_DISCOVERY_INVALID_PUBLIC_URL',
        })
        expect(String(error)).not.toContain('query-secret')
        expect(String(error)).not.toContain('credential-secret')
      }
    }
  })
})

describe('checkPublicUrlEligibility', () => {
  it('uses one 5-second signal, manual redirects, and accepts HTML charset parameters', async () => {
    const signal = new AbortController().signal
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal)
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      htmlResponse(ARTICLE_URL),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toEqual({
      eligible: true,
      retryable: false,
      code: 'ELIGIBLE',
      httpStatus: 200,
      declaredCanonical: ARTICLE_URL,
      robotsIndexable: true,
    })

    expect(timeoutSpy).toHaveBeenCalledOnce()
    expect(timeoutSpy).toHaveBeenCalledWith(5_000)
    expect(fetchMock).toHaveBeenCalledWith(ARTICLE_URL, {
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'manual',
      signal,
    })
  })

  it('never fetches an invalid input URL', async () => {
    const fetchMock = vi.fn<typeof fetch>()

    await expect(checkPublicUrlEligibility(
      'https://mushroomie.io.vn/admin?token=query-secret',
      new Map(),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: false,
      retryable: false,
      code: 'INVALID_PUBLIC_URL',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [404, 'HTTP_NOT_FOUND', false],
    [429, 'HTTP_RETRYABLE', true],
    [500, 'HTTP_RETRYABLE', true],
  ] as const)('maps HTTP %i to a stable failure', async (status, code, retryable) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('remote query-secret body', {
        status,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const result = await checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )

    expect(result).toMatchObject({
      eligible: false,
      retryable,
      code,
      httpStatus: status,
    })
    expect(JSON.stringify(result)).not.toContain('query-secret')
  })

  it('rejects a redirect off the exact production origin before fetching it', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'https://evil.test/private' },
      }),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: false,
      retryable: false,
      code: 'INVALID_REDIRECT',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('rejects raw protocol-relative traversal before URL resolution erases it', async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: {
          location: '//mushroomie.io.vn/admin/../tin-tuc/vong-tay-do',
        },
      }))
      .mockResolvedValueOnce(htmlResponse(ARTICLE_URL))

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: false,
      retryable: false,
      code: 'INVALID_REDIRECT',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it.each([null, 'http://[invalid'])('rejects redirect Location %j', async (location) => {
    const headers = new Headers()
    if (location !== null) headers.set('location', location)
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, { status: 302, headers }),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({ code: 'INVALID_REDIRECT' })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('permits five validated redirect responses and uses one deadline', async () => {
    const signal = new AbortController().signal
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal)
    const hops = [1, 2, 3, 4].map(
      (number) => `https://mushroomie.io.vn/tin-tuc/hop-${number}`,
    )
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: hops[0] } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: hops[1] } }))
      .mockResolvedValueOnce(new Response(null, { status: 307, headers: { location: hops[2] } }))
      .mockResolvedValueOnce(new Response(null, { status: 308, headers: { location: hops[3] } }))
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: ARTICLE_URL } }))
      .mockResolvedValueOnce(htmlResponse(ARTICLE_URL))

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({ eligible: true, code: 'ELIGIBLE' })

    expect(fetchMock).toHaveBeenCalledTimes(6)
    expect(timeoutSpy).toHaveBeenCalledOnce()
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toMatchObject({
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'manual',
        signal,
      })
    }
  })

  it('rejects a sixth redirect response without fetching its target', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    for (let index = 1; index <= 6; index += 1) {
      fetchMock.mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: {
          location: `https://mushroomie.io.vn/tin-tuc/hop-${index}`,
        },
      }))
    }

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: false,
      retryable: false,
      code: 'TOO_MANY_REDIRECTS',
    })
    expect(fetchMock).toHaveBeenCalledTimes(6)
  })

  it('requires an exact canonical match to the queued URL', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      htmlResponse('https://mushroomie.io.vn/tin-tuc/khac'),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toEqual({
      eligible: false,
      retryable: false,
      code: 'CANONICAL_MISMATCH',
      httpStatus: 200,
      declaredCanonical: 'https://mushroomie.io.vn/tin-tuc/khac',
      robotsIndexable: true,
    })
  })

  it('resolves a relative canonical against the validated final URL', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      htmlResponse('/tin-tuc/vong-tay-do'),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: true,
      declaredCanonical: ARTICLE_URL,
    })
  })

  it('does not expose an invalid canonical containing query secrets', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      htmlResponse(`${ARTICLE_URL}?token=query-secret`),
    )

    const result = await checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )

    expect(result).toMatchObject({
      eligible: false,
      code: 'CANONICAL_MISMATCH',
      declaredCanonical: null,
    })
    expect(JSON.stringify(result)).not.toContain('query-secret')
  })

  it.each([
    ['robots meta', {}, 'NOINDEX, nofollow'],
    ['Googlebot meta', {}, null],
    ['X-Robots-Tag', { 'x-robots-tag': 'noindex, nofollow' }, undefined],
  ] as const)('rejects noindex from %s', async (source, headers, robots) => {
    const response = source === 'Googlebot meta'
      ? new Response(
        `<html><head><link rel="canonical" href="${ARTICLE_URL}"><meta name="googlebot" content="index, noindex"></head></html>`,
        { status: 200, headers: { 'content-type': 'text/html' } },
      )
      : htmlResponse(ARTICLE_URL, { headers, robots: robots ?? undefined })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: false,
      retryable: false,
      code: 'ROBOTS_NOINDEX',
      robotsIndexable: false,
    })
  })

  it('requires sitemap membership for the queued URL', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      htmlResponse(ARTICLE_URL),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      new Map(),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: false,
      retryable: false,
      code: 'NOT_IN_SITEMAP',
    })
  })

  it('rejects non-HTML final content', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({ code: 'UNSUPPORTED_CONTENT_TYPE' })
  })

  it('stops consuming HTML once the 256 KiB byte limit is exceeded', async () => {
    const chunk = new Uint8Array(64 * 1024).fill(97)
    const chunks = [
      chunk,
      chunk,
      chunk,
      chunk,
      new Uint8Array([97]),
      chunk,
      chunk,
      chunk,
    ]
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
      new Response(body, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    await expect(checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )).resolves.toMatchObject({
      eligible: false,
      retryable: false,
      code: 'HTML_TOO_LARGE',
    })
    expect(cancelled).toBe(true)
    expect(index).toBeLessThan(chunks.length)
  })

  it('fails safely when the shared deadline aborts fetch', async () => {
    const timeoutError = new DOMException('remote query-secret', 'TimeoutError')
    const signal = AbortSignal.abort(timeoutError)
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(signal)
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      expect(init?.signal).toBe(signal)
      throw timeoutError
    })

    const result = await checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )

    expect(timeoutSpy).toHaveBeenCalledWith(5_000)
    expect(result).toMatchObject({
      eligible: false,
      retryable: true,
      code: 'FETCH_TIMEOUT',
    })
    expect(JSON.stringify(result)).not.toContain('query-secret')
  })

  it('fails safely when the HTML body stalls after response headers', async () => {
    const controller = new AbortController()
    const timeoutError = new DOMException('remote body query-secret', 'TimeoutError')
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(
      controller.signal,
    )
    let markPullStarted: (() => void) | undefined
    const pullStarted = new Promise<void>((resolve) => {
      markPullStarted = resolve
    })
    const body = new ReadableStream<Uint8Array>({
      pull() {
        markPullStarted?.()
        return new Promise<void>(() => undefined)
      },
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    )

    const resultPromise = checkPublicUrlEligibility(
      ARTICLE_URL,
      sitemapWith(ARTICLE_URL),
      { fetch: fetchMock },
    )
    await pullStarted
    controller.abort(timeoutError)

    await expect(resultPromise).resolves.toMatchObject({
      eligible: false,
      retryable: true,
      code: 'FETCH_TIMEOUT',
    })
    expect(timeoutSpy).toHaveBeenCalledWith(5_000)
  })
})

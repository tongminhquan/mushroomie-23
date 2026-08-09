import {
  BodyLimitExceededError,
  fetchWithValidatedRedirects,
  readBoundedText,
  ValidatedFetchError,
  validatePublicUrl,
  validateSameOriginFetchUrl,
} from './eligibility'

export const FIXED_SITEMAP_URL = 'https://mushroomie.io.vn/sitemap.xml'

const MAX_SITEMAP_BYTES = 2 * 1024 * 1024
const XML_MEDIA_TYPES = new Set([
  'application/xml',
  'application/sitemap+xml',
  'text/xml',
])

export type SitemapReaderErrorCode =
  | 'SITEMAP_FETCH_TIMEOUT'
  | 'SITEMAP_FETCH_FAILED'
  | 'SITEMAP_INVALID_REDIRECT'
  | 'SITEMAP_TOO_MANY_REDIRECTS'
  | 'SITEMAP_HTTP_NOT_FOUND'
  | 'SITEMAP_HTTP_RETRYABLE'
  | 'SITEMAP_HTTP_ERROR'
  | 'SITEMAP_UNSUPPORTED_CONTENT_TYPE'
  | 'SITEMAP_TOO_LARGE'
  | 'SITEMAP_INVALID_XML'
  | 'SITEMAP_DUPLICATE_URL'

export class SitemapReaderError extends Error {
  readonly code: SitemapReaderErrorCode
  readonly retryable: boolean
  readonly httpStatus: number | null

  constructor(
    code: SitemapReaderErrorCode,
    retryable: boolean,
    httpStatus: number | null = null,
  ) {
    super(`SEO_DISCOVERY_${code}`)
    this.name = 'SitemapReaderError'
    this.code = code
    this.retryable = retryable
    this.httpStatus = httpStatus
  }
}

export interface ReadFixedSitemapOptions {
  fetch?: typeof fetch
}

function sitemapError(
  code: SitemapReaderErrorCode,
  retryable = false,
  httpStatus: number | null = null,
): never {
  throw new SitemapReaderError(code, retryable, httpStatus)
}

function discardBody(response: Response): void {
  try {
    const cancellation = response.body?.cancel()
    if (cancellation) void cancellation.catch(() => undefined)
  } catch {
    // Best-effort resource release; preserve the stable public error contract.
  }
}

function normalizedMediaType(response: Response): string | null {
  const contentType = response.headers.get('content-type')
  if (!contentType) return null
  return contentType.split(';', 1)[0].trim().toLowerCase()
}

function mapFetchError(error: ValidatedFetchError): never {
  switch (error.code) {
    case 'FETCH_TIMEOUT':
      sitemapError('SITEMAP_FETCH_TIMEOUT', true)
    case 'FETCH_FAILED':
      sitemapError('SITEMAP_FETCH_FAILED', true)
    case 'INVALID_REDIRECT':
      sitemapError('SITEMAP_INVALID_REDIRECT', false, error.httpStatus)
    case 'TOO_MANY_REDIRECTS':
      sitemapError('SITEMAP_TOO_MANY_REDIRECTS', false, error.httpStatus)
  }
}

function isTimeoutLike(error: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) return true
  if (!error || typeof error !== 'object' || !('name' in error)) return false
  return error.name === 'AbortError' || error.name === 'TimeoutError'
}

function validXmlCodePoint(codePoint: number): boolean {
  return codePoint === 0x09
    || codePoint === 0x0a
    || codePoint === 0x0d
    || (codePoint >= 0x20 && codePoint <= 0xd7ff)
    || (codePoint >= 0xe000 && codePoint <= 0xfffd)
    || (codePoint >= 0x10000 && codePoint <= 0x10ffff)
}

function decodeXmlEntities(value: string): string {
  const entities: Readonly<Record<string, string>> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  }
  const entityPattern = /&(?:#(\d+)|#x([\da-fA-F]+)|(amp|apos|gt|lt|quot));/g
  let decoded = ''
  let cursor = 0

  for (const match of value.matchAll(entityPattern)) {
    const index = match.index
    const unmatched = value.slice(cursor, index)
    if (unmatched.includes('&')) sitemapError('SITEMAP_INVALID_XML')
    decoded += unmatched

    if (match[3]) {
      decoded += entities[match[3]]
    } else {
      const codePoint = Number.parseInt(match[1] ?? match[2], match[1] ? 10 : 16)
      if (!Number.isSafeInteger(codePoint) || !validXmlCodePoint(codePoint)) {
        sitemapError('SITEMAP_INVALID_XML')
      }
      decoded += String.fromCodePoint(codePoint)
    }
    cursor = index + match[0].length
  }

  const tail = value.slice(cursor)
  if (tail.includes('&')) sitemapError('SITEMAP_INVALID_XML')
  return decoded + tail
}

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

function parseLastModified(value: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  if (!dateOnly && !dateTime) sitemapError('SITEMAP_INVALID_XML')
  if (!isValidCalendarDate(value.slice(0, 10))) sitemapError('SITEMAP_INVALID_XML')

  const timestamp = Date.parse(dateOnly ? `${value}T00:00:00.000Z` : value)
  if (!Number.isFinite(timestamp)) sitemapError('SITEMAP_INVALID_XML')
  return new Date(timestamp)
}

function elementValues(block: string, elementName: 'loc' | 'lastmod'): string[] {
  const openingPattern = new RegExp(`<${elementName}(?:\\s[^>]*)?>`, 'g')
  const closingPattern = new RegExp(`</${elementName}\\s*>`, 'g')
  const valuePattern = new RegExp(
    `<${elementName}(?:\\s[^>]*)?>([^<]*)</${elementName}\\s*>`,
    'g',
  )
  const openingCount = block.match(openingPattern)?.length ?? 0
  const closingCount = block.match(closingPattern)?.length ?? 0
  const values = [...block.matchAll(valuePattern)].map((match) => match[1])

  if (openingCount !== closingCount || values.length !== openingCount) {
    sitemapError('SITEMAP_INVALID_XML')
  }
  return values
}

function stripXmlDeclaration(xml: string): string {
  return xml
    .replace(/^\uFEFF?\s*<\?xml\s[^?]*\?>/i, '')
    .trim()
}

function parseSitemapXml(xml: string): Map<string, Date | null> {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) sitemapError('SITEMAP_INVALID_XML')

  const document = stripXmlDeclaration(xml)
  const root = /^<urlset(?:\s[^>]*)?>([\s\S]*)<\/urlset\s*>$/.exec(document)
  if (!root) sitemapError('SITEMAP_INVALID_XML')

  const contents = root[1]
  const urlPattern = /<url(?:\s[^>]*)?>([\s\S]*?)<\/url\s*>/g
  const result = new Map<string, Date | null>()
  let cursor = 0

  for (const match of contents.matchAll(urlPattern)) {
    const index = match.index
    if (contents.slice(cursor, index).trim() !== '') {
      sitemapError('SITEMAP_INVALID_XML')
    }

    const block = match[1]
    const locations = elementValues(block, 'loc')
    const lastModifiedValues = elementValues(block, 'lastmod')
    if (locations.length !== 1 || lastModifiedValues.length > 1) {
      sitemapError('SITEMAP_INVALID_XML')
    }

    let url: string
    try {
      const decodedLocation = decodeXmlEntities(locations[0]).trim()
      if (!decodedLocation) sitemapError('SITEMAP_INVALID_XML')
      url = validatePublicUrl(decodedLocation)
    } catch (error) {
      if (error instanceof SitemapReaderError) throw error
      sitemapError('SITEMAP_INVALID_XML')
    }

    if (result.has(url)) sitemapError('SITEMAP_DUPLICATE_URL')

    let lastModified: Date | null = null
    if (lastModifiedValues.length === 1) {
      const decodedLastModified = decodeXmlEntities(lastModifiedValues[0]).trim()
      if (!decodedLastModified) sitemapError('SITEMAP_INVALID_XML')
      lastModified = parseLastModified(decodedLastModified)
    }

    result.set(url, lastModified)
    cursor = index + match[0].length
  }

  if (contents.slice(cursor).trim() !== '' || result.size === 0) {
    sitemapError('SITEMAP_INVALID_XML')
  }

  return result
}

export async function readFixedSitemap(
  options: ReadFixedSitemapOptions = {},
): Promise<Map<string, Date | null>> {
  let fetched
  try {
    fetched = await fetchWithValidatedRedirects(FIXED_SITEMAP_URL, {
      fetch: options.fetch ?? fetch,
      validateUrl: validateSameOriginFetchUrl,
    })
  } catch (error) {
    if (error instanceof ValidatedFetchError) mapFetchError(error)
    sitemapError('SITEMAP_FETCH_FAILED', true)
  }

  const { response, signal } = fetched
  if (response.status !== 200) {
    discardBody(response)
    if (response.status === 404) {
      sitemapError('SITEMAP_HTTP_NOT_FOUND', false, 404)
    }
    if (response.status === 429 || response.status >= 500) {
      sitemapError('SITEMAP_HTTP_RETRYABLE', true, response.status)
    }
    sitemapError('SITEMAP_HTTP_ERROR', false, response.status)
  }

  const mediaType = normalizedMediaType(response)
  if (!mediaType || !XML_MEDIA_TYPES.has(mediaType)) {
    discardBody(response)
    sitemapError('SITEMAP_UNSUPPORTED_CONTENT_TYPE')
  }

  let xml: string
  try {
    xml = await readBoundedText(response, MAX_SITEMAP_BYTES, signal)
  } catch (error) {
    if (error instanceof BodyLimitExceededError) {
      sitemapError('SITEMAP_TOO_LARGE')
    }
    sitemapError(
      isTimeoutLike(error, signal)
        ? 'SITEMAP_FETCH_TIMEOUT'
        : 'SITEMAP_FETCH_FAILED',
      true,
    )
  }

  return parseSitemapXml(xml)
}

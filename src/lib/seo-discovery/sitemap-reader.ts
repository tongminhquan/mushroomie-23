import {
  BodyLimitExceededError,
  fetchWithValidatedRedirects,
  InvalidTextEncodingError,
  readBoundedText,
  ValidatedFetchError,
  validateSameOriginFetchUrl,
} from './eligibility'
import { parseSitemapXml, SitemapXmlError } from './sitemap-xml-parser'

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

function validateXmlContentType(response: Response): void {
  const contentType = response.headers.get('content-type')
  if (!contentType) sitemapError('SITEMAP_UNSUPPORTED_CONTENT_TYPE')

  const [rawMediaType, ...rawParameters] = contentType.split(';')
  if (!XML_MEDIA_TYPES.has(rawMediaType.trim().toLowerCase())) {
    sitemapError('SITEMAP_UNSUPPORTED_CONTENT_TYPE')
  }

  let charsetSeen = false
  for (const rawParameter of rawParameters) {
    const separator = rawParameter.indexOf('=')
    if (separator < 0) continue

    const name = rawParameter.slice(0, separator).trim().toLowerCase()
    if (name !== 'charset') continue
    if (charsetSeen) sitemapError('SITEMAP_INVALID_XML')
    charsetSeen = true

    let value = rawParameter.slice(separator + 1).trim()
    if (
      value.length >= 2
      && ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    if (value.toLowerCase() !== 'utf-8') sitemapError('SITEMAP_INVALID_XML')
  }
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

  try {
    validateXmlContentType(response)
  } catch (error) {
    discardBody(response)
    throw error
  }

  let xml: string
  try {
    xml = await readBoundedText(response, MAX_SITEMAP_BYTES, signal, {
      fatalUtf8: true,
    })
  } catch (error) {
    if (error instanceof BodyLimitExceededError) {
      sitemapError('SITEMAP_TOO_LARGE')
    }
    if (error instanceof InvalidTextEncodingError) {
      sitemapError('SITEMAP_INVALID_XML')
    }
    sitemapError(
      isTimeoutLike(error, signal)
        ? 'SITEMAP_FETCH_TIMEOUT'
        : 'SITEMAP_FETCH_FAILED',
      true,
    )
  }

  try {
    return parseSitemapXml(xml)
  } catch (error) {
    if (error instanceof SitemapXmlError) sitemapError(error.code)
    sitemapError('SITEMAP_INVALID_XML')
  }
}

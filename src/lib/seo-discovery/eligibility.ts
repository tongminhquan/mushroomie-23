import { parse, type DefaultTreeAdapterTypes } from 'parse5'

import { isCatalogCategory } from '@/lib/catalog-seo'

import { PRODUCTION_ORIGIN } from './urls'

const FETCH_TIMEOUT_MS = 5_000
const MAX_REDIRECTS = 5
const MAX_PUBLIC_URL_LENGTH = 512
const MAX_HTML_BYTES = 384 * 1024
const PRODUCTION_HOSTNAME = 'mushroomie.io.vn'

const FOLLOWABLE_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const BLOCKED_PREFIXES = [
  '/admin',
  '/api',
  '/tai-khoan',
  '/gio-hang',
  '/thanh-toan',
  '/checkout',
  '/uploads',
  '/_next',
] as const

export type EligibilityCode =
  | 'ELIGIBLE'
  | 'INVALID_PUBLIC_URL'
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'INVALID_REDIRECT'
  | 'TOO_MANY_REDIRECTS'
  | 'HTTP_NOT_FOUND'
  | 'HTTP_RETRYABLE'
  | 'HTTP_ERROR'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'HTML_TOO_LARGE'
  | 'CANONICAL_MISMATCH'
  | 'ROBOTS_NOINDEX'
  | 'NOT_IN_SITEMAP'

export interface PublicUrlEligibilityResult {
  eligible: boolean
  retryable: boolean
  code: EligibilityCode
  httpStatus: number | null
  declaredCanonical: string | null
  robotsIndexable: boolean | null
}

export interface EligibilityCheckOptions {
  fetch?: typeof fetch
}

export type ValidatedFetchErrorCode =
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'INVALID_REDIRECT'
  | 'TOO_MANY_REDIRECTS'

export class ValidatedFetchError extends Error {
  readonly code: ValidatedFetchErrorCode
  readonly retryable: boolean
  readonly httpStatus: number | null

  constructor(
    code: ValidatedFetchErrorCode,
    retryable: boolean,
    httpStatus: number | null = null,
  ) {
    super(`SEO_DISCOVERY_${code}`)
    this.name = 'ValidatedFetchError'
    this.code = code
    this.retryable = retryable
    this.httpStatus = httpStatus
  }
}

export class BodyLimitExceededError extends Error {
  constructor() {
    super('SEO_DISCOVERY_BODY_TOO_LARGE')
    this.name = 'BodyLimitExceededError'
  }
}

export class InvalidTextEncodingError extends Error {
  constructor() {
    super('SEO_DISCOVERY_INVALID_TEXT_ENCODING')
    this.name = 'InvalidTextEncodingError'
  }
}

interface StrictUrlOptions {
  publicPageOnly: boolean
}

interface ParsedRawUrl {
  parsed: URL
  decodedPathname: string
  rawQuery: string | undefined
}

interface FetchValidatedOptions {
  fetch: typeof fetch
  validateUrl: (value: string) => string
}

export interface ValidatedFetchResponse {
  response: Response
  finalUrl: string
  signal: AbortSignal
}

function invalidPublicUrl(): never {
  throw new Error('SEO_DISCOVERY_INVALID_PUBLIC_URL')
}

function invalidSameOriginUrl(): never {
  throw new Error('SEO_DISCOVERY_INVALID_SAME_ORIGIN_URL')
}

function assertBasicRawValue(value: unknown, invalid: () => never): asserts value is string {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > MAX_PUBLIC_URL_LENGTH
    || value !== value.trim()
    || /[\u0000-\u001f\u007f]/.test(value)
    || value.includes('\\')
  ) {
    invalid()
  }
}

function decodeAndValidatePath(rawPathname: string, invalid: () => never): string {
  if (
    rawPathname.includes('//')
    || /%25/i.test(rawPathname)
    || /%(?:2f|5c)/i.test(rawPathname)
  ) {
    invalid()
  }

  let decodedPathname: string
  try {
    decodedPathname = decodeURIComponent(rawPathname || '/')
  } catch {
    invalid()
  }

  if (
    decodedPathname.includes('//')
    || decodedPathname.includes('\\')
    || /[\u0000-\u0020\u007f]/.test(decodedPathname)
  ) {
    invalid()
  }

  const segments = decodedPathname.split('/')
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    invalid()
  }

  return decodedPathname
}

function isBlockedPath(pathname: string): boolean {
  const lowerPathname = pathname.toLowerCase()
  return BLOCKED_PREFIXES.some((prefix) => lowerPathname.startsWith(prefix))
}

function parseStrictAbsoluteUrl(
  value: unknown,
  options: StrictUrlOptions,
): ParsedRawUrl {
  const invalid = options.publicPageOnly ? invalidPublicUrl : invalidSameOriginUrl
  assertBasicRawValue(value, invalid)

  const match = /^([a-z][a-z\d+.-]*):\/\/([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(value)
  if (!match) return invalid()

  const [, scheme, authority, rawPathname, rawQuery, rawFragment] = match
  if (
    scheme.toLowerCase() !== 'https'
    || authority.toLowerCase() !== PRODUCTION_HOSTNAME
    || rawFragment !== undefined
  ) {
    invalid()
  }

  const decodedPathname = decodeAndValidatePath(rawPathname, invalid)
  if (isBlockedPath(decodedPathname)) invalid()

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return invalid()
  }

  if (
    parsed.origin !== PRODUCTION_ORIGIN
    || parsed.hostname !== PRODUCTION_HOSTNAME
    || parsed.protocol !== 'https:'
    || parsed.username !== ''
    || parsed.password !== ''
  ) {
    invalid()
  }

  parsed.pathname = decodedPathname
  if (parsed.toString().length > MAX_PUBLIC_URL_LENGTH) invalid()

  if (!options.publicPageOnly) {
    if (rawQuery !== undefined) invalid()
    return { parsed, decodedPathname, rawQuery }
  }

  if (rawQuery !== undefined) {
    if (decodedPathname !== '/san-pham') invalid()

    const categoryValues = parsed.searchParams.getAll('category')
    const category = categoryValues[0]
    if (
      parsed.searchParams.size !== 1
      || categoryValues.length !== 1
      || !category
      || !isCatalogCategory(category)
      || rawQuery !== `?category=${encodeURIComponent(category)}`
    ) {
      invalid()
    }
  }

  return { parsed, decodedPathname, rawQuery }
}

export function validatePublicUrl(value: string): string {
  return parseStrictAbsoluteUrl(value, { publicPageOnly: true }).parsed.toString()
}

export function validateSameOriginFetchUrl(value: string): string {
  return parseStrictAbsoluteUrl(value, { publicPageOnly: false }).parsed.toString()
}

function validateRawReference(value: unknown): asserts value is string {
  assertBasicRawValue(value, invalidSameOriginUrl)

  if (value.includes('#')) invalidSameOriginUrl()

  if (value.startsWith('//')) {
    const protocolRelative = /^\/\/([^/?#]+)([^?#]*)/.exec(value)
    const authority = protocolRelative?.[1]
    if (!authority || authority.toLowerCase() !== PRODUCTION_HOSTNAME) {
      invalidSameOriginUrl()
    }
    decodeAndValidatePath(protocolRelative[2], invalidSameOriginUrl)
  }

  const absoluteScheme = /^([a-z][a-z\d+.-]*):\/\//i.exec(value)
  if (absoluteScheme) {
    const authority = /^[a-z][a-z\d+.-]*:\/\/([^/?#]+)/i.exec(value)?.[1]
    if (!authority || authority.toLowerCase() !== PRODUCTION_HOSTNAME) {
      invalidSameOriginUrl()
    }
  }

  const rawPathname = value.split(/[?#]/, 1)[0]
  if (rawPathname && !absoluteScheme && !value.startsWith('//')) {
    decodeAndValidatePath(rawPathname, invalidSameOriginUrl)
  }
}

export function resolveValidatedUrlReference(
  reference: string,
  baseUrl: string,
  validateUrl: (value: string) => string,
): string {
  validateRawReference(reference)

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(reference)) {
    return validateUrl(reference)
  }

  let resolved: string
  try {
    resolved = new URL(reference, baseUrl).toString()
  } catch {
    invalidSameOriginUrl()
  }

  return validateUrl(resolved)
}

function timeoutLike(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true
  if (!error || typeof error !== 'object' || !('name' in error)) return false
  return error.name === 'AbortError' || error.name === 'TimeoutError'
}

async function runWithSignal<T>(
  operation: () => Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) {
    throw signal.reason ?? new DOMException('Operation aborted', 'AbortError')
  }

  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(
      signal.reason ?? new DOMException('Operation aborted', 'AbortError'),
    )

    signal.addEventListener('abort', abort, { once: true })
    Promise.resolve()
      .then(operation)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort))
  })
}

function discardBody(response: Response): void {
  try {
    const cancellation = response.body?.cancel()
    if (cancellation) void cancellation.catch(() => undefined)
  } catch {
    // Cancellation is best-effort and must not replace the stable result code.
  }
}

export async function fetchWithValidatedRedirects(
  initialUrl: string,
  options: FetchValidatedOptions,
): Promise<ValidatedFetchResponse> {
  let currentUrl = options.validateUrl(initialUrl)
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  let redirectCount = 0

  while (true) {
    let response: Response
    try {
      response = await runWithSignal(
        () => options.fetch(currentUrl, {
          cache: 'no-store',
          credentials: 'omit',
          redirect: 'manual',
          signal,
        }),
        signal,
      )
    } catch (error) {
      throw new ValidatedFetchError(
        timeoutLike(error, signal) ? 'FETCH_TIMEOUT' : 'FETCH_FAILED',
        true,
      )
    }

    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: currentUrl, signal }
    }

    if (!FOLLOWABLE_REDIRECT_STATUSES.has(response.status)) {
      discardBody(response)
      throw new ValidatedFetchError('INVALID_REDIRECT', false, response.status)
    }

    if (redirectCount >= MAX_REDIRECTS) {
      discardBody(response)
      throw new ValidatedFetchError('TOO_MANY_REDIRECTS', false, response.status)
    }

    const location = response.headers.get('location')
    if (!location) {
      discardBody(response)
      throw new ValidatedFetchError('INVALID_REDIRECT', false, response.status)
    }

    let nextUrl: string
    try {
      nextUrl = resolveValidatedUrlReference(
        location,
        currentUrl,
        options.validateUrl,
      )
    } catch {
      discardBody(response)
      throw new ValidatedFetchError('INVALID_REDIRECT', false, response.status)
    }

    discardBody(response)
    redirectCount += 1
    currentUrl = nextUrl
  }
}

export async function readBoundedText(
  response: Response,
  maxBytes: number,
  signal: AbortSignal,
  options: { fatalUtf8?: boolean } = {},
): Promise<string> {
  const contentLength = response.headers.get('content-length')
  if (contentLength && /^\d+$/.test(contentLength)) {
    const declaredLength = Number(contentLength)
    if (!Number.isSafeInteger(declaredLength) || declaredLength > maxBytes) {
      discardBody(response)
      throw new BodyLimitExceededError()
    }
  }

  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', {
    fatal: options.fatalUtf8 ?? false,
  })
  let byteCount = 0
  let text = ''

  try {
    while (true) {
      const { done, value } = await runWithSignal(() => reader.read(), signal)
      if (done) break
      if (!(value instanceof Uint8Array)) {
        throw new Error('SEO_DISCOVERY_INVALID_BODY_CHUNK')
      }

      byteCount += value.byteLength
      if (byteCount > maxBytes) throw new BodyLimitExceededError()
      try {
        text += decoder.decode(value, { stream: true })
      } catch {
        throw new InvalidTextEncodingError()
      }
    }

    try {
      return text + decoder.decode()
    } catch {
      throw new InvalidTextEncodingError()
    }
  } catch (error) {
    try {
      const cancellation = reader.cancel()
      void cancellation.catch(() => undefined)
    } catch {
      // Reader cancellation is best-effort; preserve the sanitized outer code.
    }
    throw error
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // A pending read may temporarily retain the lock after an abort.
    }
  }
}

function normalizedMediaType(response: Response): string | null {
  const contentType = response.headers.get('content-type')
  if (!contentType) return null
  return contentType.split(';', 1)[0].trim().toLowerCase()
}

function elementAttribute(
  element: DefaultTreeAdapterTypes.Element,
  name: string,
): string | null {
  return element.attrs.find((attribute) => attribute.name === name)?.value ?? null
}

function elementChildren(node: DefaultTreeAdapterTypes.Node): DefaultTreeAdapterTypes.ChildNode[] {
  return 'childNodes' in node ? node.childNodes : []
}

function findHead(document: DefaultTreeAdapterTypes.Document) {
  const stack: DefaultTreeAdapterTypes.Node[] = [...document.childNodes]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) break
    if ('tagName' in node && node.tagName === 'head') return node
    stack.push(...elementChildren(node))
  }

  return null
}

interface HtmlIndexingMetadata {
  canonicalHrefs: string[]
  robotsIndexable: boolean
}

function hasNoindexDirective(value: string | null): boolean {
  if (!value) return false
  const directives = value.toLowerCase().split(/[\s,]+/).filter(Boolean)
  return directives.includes('noindex') || directives.includes('none')
}

function readHtmlIndexingMetadata(
  html: string,
  response: Response,
): HtmlIndexingMetadata {
  const document = parse(html)
  const head = findHead(document)
  const canonicalHrefs: string[] = []
  let robotsIndexable = !hasNoindexDirective(
    response.headers.get('x-robots-tag'),
  )

  if (!head) return { canonicalHrefs, robotsIndexable }

  const stack: DefaultTreeAdapterTypes.Node[] = [...head.childNodes]
  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) break

    if ('tagName' in node) {
      if (node.tagName === 'link') {
        const relTokens = (elementAttribute(node, 'rel') ?? '')
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
        if (relTokens.includes('canonical')) {
          canonicalHrefs.push(elementAttribute(node, 'href') ?? '')
        }
      }

      if (node.tagName === 'meta') {
        const name = (elementAttribute(node, 'name') ?? '').toLowerCase()
        if (
          (name === 'robots' || name === 'googlebot')
          && hasNoindexDirective(elementAttribute(node, 'content'))
        ) {
          robotsIndexable = false
        }
      }
    }

    stack.push(...elementChildren(node))
  }

  return { canonicalHrefs, robotsIndexable }
}

function eligibilityFailure(
  code: Exclude<EligibilityCode, 'ELIGIBLE'>,
  options: {
    declaredCanonical?: string | null
    httpStatus?: number | null
    retryable?: boolean
    robotsIndexable?: boolean | null
  } = {},
): PublicUrlEligibilityResult {
  return {
    eligible: false,
    retryable: options.retryable ?? false,
    code,
    httpStatus: options.httpStatus ?? null,
    declaredCanonical: options.declaredCanonical ?? null,
    robotsIndexable: options.robotsIndexable ?? null,
  }
}

export async function checkPublicUrlEligibility(
  candidateUrl: string,
  sitemapEntries: ReadonlyMap<string, Date | null>,
  options: EligibilityCheckOptions = {},
): Promise<PublicUrlEligibilityResult> {
  let validatedCandidateUrl: string
  try {
    validatedCandidateUrl = validatePublicUrl(candidateUrl)
  } catch {
    return eligibilityFailure('INVALID_PUBLIC_URL')
  }

  let fetched: ValidatedFetchResponse
  try {
    fetched = await fetchWithValidatedRedirects(validatedCandidateUrl, {
      fetch: options.fetch ?? fetch,
      validateUrl: validatePublicUrl,
    })
  } catch (error) {
    if (error instanceof ValidatedFetchError) {
      return eligibilityFailure(error.code, {
        httpStatus: error.httpStatus,
        retryable: error.retryable,
      })
    }
    return eligibilityFailure('FETCH_FAILED', { retryable: true })
  }

  const { response, finalUrl, signal } = fetched
  if (response.status !== 200) {
    discardBody(response)
    if (response.status === 404) {
      return eligibilityFailure('HTTP_NOT_FOUND', { httpStatus: 404 })
    }
    if (response.status === 429 || response.status >= 500) {
      return eligibilityFailure('HTTP_RETRYABLE', {
        httpStatus: response.status,
        retryable: true,
      })
    }
    return eligibilityFailure('HTTP_ERROR', { httpStatus: response.status })
  }

  if (normalizedMediaType(response) !== 'text/html') {
    discardBody(response)
    return eligibilityFailure('UNSUPPORTED_CONTENT_TYPE', { httpStatus: 200 })
  }

  let html: string
  try {
    html = await readBoundedText(response, MAX_HTML_BYTES, signal)
  } catch (error) {
    if (error instanceof BodyLimitExceededError) {
      return eligibilityFailure('HTML_TOO_LARGE', { httpStatus: 200 })
    }
    return eligibilityFailure(
      timeoutLike(error, signal) ? 'FETCH_TIMEOUT' : 'FETCH_FAILED',
      { httpStatus: 200, retryable: true },
    )
  }

  const metadata = readHtmlIndexingMetadata(html, response)
  let declaredCanonical: string | null = null
  if (metadata.canonicalHrefs.length === 1 && metadata.canonicalHrefs[0].trim()) {
    try {
      declaredCanonical = resolveValidatedUrlReference(
        metadata.canonicalHrefs[0].trim(),
        finalUrl,
        validatePublicUrl,
      )
    } catch {
      declaredCanonical = null
    }
  }

  if (
    metadata.canonicalHrefs.length !== 1
    || declaredCanonical !== validatedCandidateUrl
  ) {
    return eligibilityFailure('CANONICAL_MISMATCH', {
      declaredCanonical,
      httpStatus: 200,
      robotsIndexable: metadata.robotsIndexable,
    })
  }

  if (!metadata.robotsIndexable) {
    return eligibilityFailure('ROBOTS_NOINDEX', {
      declaredCanonical,
      httpStatus: 200,
      robotsIndexable: false,
    })
  }

  if (!sitemapEntries.has(validatedCandidateUrl)) {
    return eligibilityFailure('NOT_IN_SITEMAP', {
      declaredCanonical,
      httpStatus: 200,
      robotsIndexable: true,
    })
  }

  return {
    eligible: true,
    retryable: false,
    code: 'ELIGIBLE',
    httpStatus: 200,
    declaredCanonical,
    robotsIndexable: true,
  }
}

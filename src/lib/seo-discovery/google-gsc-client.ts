import 'server-only'

import {
  accessSync,
  constants,
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs'
import path from 'node:path'

import { GoogleAuth } from 'google-auth-library'

import { readSeoDiscoveryConfig } from './config'
import {
  GscClientError,
  type ConnectionStatus,
  type GoogleSearchConsoleClient,
  type GoogleSearchConsoleFullClient,
  type SearchAnalyticsDevice,
  type SearchAnalyticsRequest,
  type SearchAnalyticsRow,
  type SitemapStatus,
  type UrlInspectionResult,
} from './gsc-client'
import { assertProductionUrl } from './urls'

const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters'
const WEBMASTERS_API_ROOT = 'https://www.googleapis.com/webmasters/v3'
const URL_INSPECTION_ENDPOINT = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
const CANONICAL_SITEMAP_URL = 'https://mushroomie.io.vn/sitemap.xml'
const CANONICAL_SEARCH_ANALYTICS_PROPERTY = 'sc-domain:mushroomie.io.vn'
const CONNECTION_PROBE_URL = 'https://mushroomie.io.vn/'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_JSON_RESPONSE_BYTES = 1024 * 1024
const MAX_CREDENTIAL_FILE_BYTES = 64 * 1024
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const SEARCH_ANALYTICS_DEVICES = new Set<SearchAnalyticsDevice>([
  'DESKTOP',
  'MOBILE',
  'TABLET',
])

type GscEnvironment = Readonly<Record<string, string | undefined>>

export interface CreateGoogleSearchConsoleClientOptions {
  env?: GscEnvironment
  fetch?: typeof fetch
  repositoryRoot?: string
}

function isPathInside(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate)
  return relative === '' || (
    relative !== '..'
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  )
}

function resolveCredentialFile(
  configuredPath: string | undefined,
  repositoryRoot: string,
): string | null {
  const credentialPath = configuredPath?.trim()
  if (!credentialPath || !path.isAbsolute(credentialPath)) {
    return null
  }

  try {
    const canonicalRepositoryRoot = realpathSync(repositoryRoot)
    const canonicalPublicRoot = realpathSync(path.join(canonicalRepositoryRoot, 'public'))
    const absoluteCredentialPath = path.resolve(credentialPath)

    // Check both the configured path and its target so a symlink cannot cross
    // either protected boundary in either direction.
    if (
      isPathInside(canonicalRepositoryRoot, absoluteCredentialPath)
      || isPathInside(canonicalPublicRoot, absoluteCredentialPath)
    ) {
      return null
    }

    const canonicalCredentialPath = realpathSync(absoluteCredentialPath)
    if (
      isPathInside(canonicalRepositoryRoot, canonicalCredentialPath)
      || isPathInside(canonicalPublicRoot, canonicalCredentialPath)
    ) {
      return null
    }

    const credentialStat = statSync(canonicalCredentialPath)
    if (
      !credentialStat.isFile()
      || credentialStat.size <= 0
      || credentialStat.size > MAX_CREDENTIAL_FILE_BYTES
    ) {
      return null
    }

    accessSync(canonicalCredentialPath, constants.R_OK)
    const credentialConfig: unknown = JSON.parse(
      readFileSync(canonicalCredentialPath, 'utf8'),
    )
    if (!isRecord(credentialConfig) || credentialConfig.type !== 'service_account') {
      return null
    }

    return canonicalCredentialPath
  } catch {
    return null
  }
}

function requestTimeoutError(): GscClientError {
  return new GscClientError('GSC_REQUEST_TIMEOUT', { retryable: true })
}

function invalidResponseError(): GscClientError {
  return new GscClientError('GSC_INVALID_RESPONSE')
}

function invalidUrlError(): GscClientError {
  return new GscClientError('GSC_INVALID_URL')
}

function mapHttpError(status: number): GscClientError {
  if (status === 401) {
    return new GscClientError('GSC_UNAUTHORIZED', {
      configurationRequired: true,
      httpStatus: status,
    })
  }

  if (status === 403) {
    return new GscClientError('GSC_FORBIDDEN', {
      configurationRequired: true,
      httpStatus: status,
    })
  }

  if (status === 404) {
    return new GscClientError('GSC_NOT_FOUND', { httpStatus: status })
  }

  if (status === 429) {
    return new GscClientError('GSC_RATE_LIMITED', {
      retryable: true,
      httpStatus: status,
    })
  }

  if (status >= 500) {
    return new GscClientError('GSC_SERVER_ERROR', {
      retryable: true,
      httpStatus: status,
    })
  }

  return new GscClientError('GSC_HTTP_ERROR', { httpStatus: status })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function nullableCount(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null
  }

  if (typeof value === 'string' && !/^\d+$/.test(value)) {
    return null
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE_PATTERN.test(value)
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return (
    typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
  )
}

function isSearchAnalyticsDevice(
  value: string,
): value is SearchAnalyticsDevice {
  return SEARCH_ANALYTICS_DEVICES.has(value as SearchAnalyticsDevice)
}

async function cancelResponseBody(
  body: ReadableStream<Uint8Array> | null,
): Promise<void> {
  if (!body) {
    return
  }

  try {
    await body.cancel()
  } catch {
    // Preserve the stable adapter error if provider stream cleanup fails.
  }
}

async function cancelResponseReader(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<void> {
  try {
    await reader.cancel()
  } catch {
    // Preserve the stable adapter error if provider stream cleanup fails.
  }
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const declaredLength = response.headers.get('content-length')
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength)
    if (!Number.isFinite(parsedLength) || parsedLength > MAX_JSON_RESPONSE_BYTES) {
      await cancelResponseBody(response.body)
      throw invalidResponseError()
    }
  }

  if (!response.body) {
    throw invalidResponseError()
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    totalBytes += value.byteLength
    if (totalBytes > MAX_JSON_RESPONSE_BYTES) {
      await cancelResponseReader(reader)
      throw invalidResponseError()
    }
    chunks.push(value)
  }

  const combined = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(combined))
  } catch {
    throw invalidResponseError()
  }
}

function mapSitemaps(payload: unknown): SitemapStatus[] {
  if (!isRecord(payload)) {
    throw invalidResponseError()
  }

  if (payload.sitemap === undefined) {
    return []
  }

  if (!Array.isArray(payload.sitemap)) {
    throw invalidResponseError()
  }

  return payload.sitemap.map((entry) => {
    if (!isRecord(entry) || typeof entry.path !== 'string') {
      throw invalidResponseError()
    }

    return {
      url: entry.path,
      lastSubmitted: nullableString(entry.lastSubmitted),
      lastDownloaded: nullableString(entry.lastDownloaded),
      pending: entry.isPending === true,
      warnings: nullableCount(entry.warnings),
      errors: nullableCount(entry.errors),
    }
  })
}

function mapInspection(payload: unknown): UrlInspectionResult {
  if (!isRecord(payload) || !isRecord(payload.inspectionResult)) {
    throw invalidResponseError()
  }

  const indexStatus = payload.inspectionResult.indexStatusResult
  if (!isRecord(indexStatus)) {
    throw invalidResponseError()
  }

  return {
    verdict: nullableString(indexStatus.verdict),
    coverageState: nullableString(indexStatus.coverageState),
    robotsTxtState: nullableString(indexStatus.robotsTxtState),
    indexingState: nullableString(indexStatus.indexingState),
    pageFetchState: nullableString(indexStatus.pageFetchState),
    googleCanonical: nullableString(indexStatus.googleCanonical),
    userCanonical: nullableString(indexStatus.userCanonical),
    lastCrawlTime: nullableString(indexStatus.lastCrawlTime),
  }
}

function mapSearchAnalytics(payload: unknown): SearchAnalyticsRow[] {
  if (!isRecord(payload)) {
    throw invalidResponseError()
  }

  if (payload.rows === undefined) {
    return []
  }

  if (!Array.isArray(payload.rows)) {
    throw invalidResponseError()
  }

  return payload.rows.map((entry) => {
    if (
      !isRecord(entry)
      || !Array.isArray(entry.keys)
      || entry.keys.length !== 3
      || !entry.keys.every((key) => typeof key === 'string')
    ) {
      throw invalidResponseError()
    }

    const [query, page, device] = entry.keys as [string, string, string]
    if (
      !isSearchAnalyticsDevice(device)
      || !isFiniteNonNegativeNumber(entry.clicks)
      || !isFiniteNonNegativeNumber(entry.impressions)
      || !isFiniteNonNegativeNumber(entry.ctr)
      || entry.ctr > 1
      || !isFiniteNonNegativeNumber(entry.position)
    ) {
      throw invalidResponseError()
    }

    return {
      query,
      page,
      device,
      clicks: entry.clicks,
      impressions: entry.impressions,
      ctr: entry.ctr,
      position: entry.position,
    }
  })
}

function normalizeProductionUrl(value: string): string {
  try {
    return assertProductionUrl(value)
  } catch {
    throw invalidUrlError()
  }
}

class DisabledGoogleSearchConsoleClient implements GoogleSearchConsoleFullClient {
  async getConnectionStatus(): Promise<ConnectionStatus> {
    return { state: 'disabled', code: 'GSC_DISABLED' }
  }

  async listSitemaps(): Promise<SitemapStatus[]> {
    throw new GscClientError('GSC_DISABLED')
  }

  async submitSitemap(): Promise<void> {
    throw new GscClientError('GSC_DISABLED')
  }

  async inspectUrl(): Promise<UrlInspectionResult> {
    throw new GscClientError('GSC_DISABLED')
  }

  async querySearchAnalytics(): Promise<SearchAnalyticsRow[]> {
    throw new GscClientError('GSC_DISABLED')
  }
}

class ConfigurationRequiredGoogleSearchConsoleClient
implements GoogleSearchConsoleFullClient {
  constructor(private readonly searchAnalyticsEnabled = true) {}

  async getConnectionStatus(): Promise<ConnectionStatus> {
    return {
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    }
  }

  async listSitemaps(): Promise<SitemapStatus[]> {
    throw new GscClientError('GSC_CONFIGURATION_REQUIRED', {
      configurationRequired: true,
    })
  }

  async submitSitemap(): Promise<void> {
    throw new GscClientError('GSC_CONFIGURATION_REQUIRED', {
      configurationRequired: true,
    })
  }

  async inspectUrl(): Promise<UrlInspectionResult> {
    throw new GscClientError('GSC_CONFIGURATION_REQUIRED', {
      configurationRequired: true,
    })
  }

  async querySearchAnalytics(): Promise<SearchAnalyticsRow[]> {
    if (!this.searchAnalyticsEnabled) {
      throw new GscClientError('GSC_DISABLED')
    }

    throw new GscClientError('GSC_CONFIGURATION_REQUIRED', {
      configurationRequired: true,
    })
  }
}

class AuthenticatedGoogleSearchConsoleClient
implements GoogleSearchConsoleFullClient {
  private readonly auth: GoogleAuth

  constructor(
    private readonly property: string,
    credentialPath: string,
    private readonly fetchImplementation: typeof fetch,
    private readonly searchAnalyticsEnabled: boolean,
    private readonly inspectConnectionPermission = false,
  ) {
    this.auth = new GoogleAuth({
      keyFilename: credentialPath,
      scopes: [WEBMASTERS_SCOPE],
      clientOptions: {
        transporterOptions: {
          timeout: REQUEST_TIMEOUT_MS,
        },
      },
    })
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    await this.listSitemaps()
    if (this.inspectConnectionPermission) {
      await this.inspectUrl(CONNECTION_PROBE_URL)
    }
    return {
      state: 'connected',
      code: 'GSC_CONNECTED',
      property: this.property,
    }
  }

  async listSitemaps(): Promise<SitemapStatus[]> {
    const endpoint = `${WEBMASTERS_API_ROOT}/sites/${encodeURIComponent(this.property)}/sitemaps`
    return this.executeRequest(endpoint, { method: 'GET' }, async (response) => (
      mapSitemaps(await readBoundedJson(response))
    ))
  }

  async submitSitemap(sitemapUrl: string): Promise<void> {
    const normalizedSitemapUrl = normalizeProductionUrl(sitemapUrl)
    if (normalizedSitemapUrl !== CANONICAL_SITEMAP_URL) {
      throw invalidUrlError()
    }

    const endpoint = `${WEBMASTERS_API_ROOT}/sites/${encodeURIComponent(this.property)}/sitemaps/${encodeURIComponent(normalizedSitemapUrl)}`
    await this.executeRequest(endpoint, { method: 'PUT' }, async () => undefined)
  }

  async inspectUrl(url: string): Promise<UrlInspectionResult> {
    const inspectionUrl = normalizeProductionUrl(url)
    return this.executeRequest(
      URL_INSPECTION_ENDPOINT,
      {
        method: 'POST',
        body: JSON.stringify({
          inspectionUrl,
          siteUrl: this.property,
        }),
        headers: {
          'content-type': 'application/json',
        },
      },
      async (response) => mapInspection(await readBoundedJson(response)),
    )
  }

  async querySearchAnalytics(
    request: SearchAnalyticsRequest,
  ): Promise<SearchAnalyticsRow[]> {
    if (!this.searchAnalyticsEnabled) {
      throw new GscClientError('GSC_DISABLED')
    }

    if (this.property !== CANONICAL_SEARCH_ANALYTICS_PROPERTY) {
      throw new GscClientError('GSC_CONFIGURATION_REQUIRED', {
        configurationRequired: true,
      })
    }

    if (
      !isRecord(request)
      || !isIsoDate(request.startDate)
      || !isIsoDate(request.endDate)
      || request.startDate > request.endDate
      || typeof request.query !== 'string'
    ) {
      throw invalidResponseError()
    }

    const query = request.query.normalize('NFC').trim()
    if (!query || query.length > 4_096) {
      throw invalidResponseError()
    }

    const endpoint = `${WEBMASTERS_API_ROOT}/sites/${encodeURIComponent(this.property)}/searchAnalytics/query`
    return this.executeRequest(
      endpoint,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          startDate: request.startDate,
          endDate: request.endDate,
          type: 'web',
          dataState: 'final',
          dimensions: ['query', 'page', 'device'],
          aggregationType: 'auto',
          rowLimit: 25_000,
          dimensionFilterGroups: [{
            groupType: 'and',
            filters: [
              {
                dimension: 'country',
                operator: 'equals',
                expression: 'VNM',
              },
              {
                dimension: 'query',
                operator: 'contains',
                expression: query,
              },
            ],
          }],
        }),
      },
      async (response) => mapSearchAnalytics(await readBoundedJson(response)),
    )
  }

  private async executeRequest<T>(
    endpoint: string,
    init: RequestInit,
    mapResponse: (response: Response) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController()
    const deadline = Date.now() + REQUEST_TIMEOUT_MS
    let timedOut = false
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined

    const throwIfDeadlineExceeded = () => {
      if (
        timedOut
        || controller.signal.aborted
        || Date.now() >= deadline
      ) {
        timedOut = true
        if (!controller.signal.aborted) {
          controller.abort()
        }
        throw requestTimeoutError()
      }
    }

    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        timedOut = true
        controller.abort()
        reject(requestTimeoutError())
      }, REQUEST_TIMEOUT_MS)
    })

    const request = (async () => {
      let authenticationHeaders: Headers
      try {
        authenticationHeaders = await this.auth.getRequestHeaders(endpoint)
      } catch {
        throwIfDeadlineExceeded()
        throw new GscClientError('GSC_AUTHENTICATION_FAILED', {
          configurationRequired: true,
        })
      }

      throwIfDeadlineExceeded()

      const headers = new Headers(authenticationHeaders)
      new Headers(init.headers).forEach((value, name) => {
        headers.set(name, value)
      })
      headers.set('accept', 'application/json')

      throwIfDeadlineExceeded()

      let response: Response
      try {
        response = await this.fetchImplementation(endpoint, {
          ...init,
          headers,
          redirect: 'error',
          signal: controller.signal,
        })
      } catch {
        throwIfDeadlineExceeded()
        throw new GscClientError('GSC_NETWORK_ERROR', { retryable: true })
      }

      throwIfDeadlineExceeded()

      if (!response.ok) {
        await cancelResponseBody(response.body)
        throwIfDeadlineExceeded()
        throw mapHttpError(response.status)
      }

      let mappedResponse: T
      try {
        mappedResponse = await mapResponse(response)
      } catch (error) {
        throwIfDeadlineExceeded()
        if (error instanceof GscClientError) {
          throw error
        }
        throw invalidResponseError()
      }

      throwIfDeadlineExceeded()
      return mappedResponse
    })()

    try {
      return await Promise.race([request, timeout])
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle)
      }
    }
  }
}

function createGoogleSearchConsoleClientInternal(
  options: CreateGoogleSearchConsoleClientOptions,
  allowDisabledIntegrationProbe: boolean,
): GoogleSearchConsoleFullClient {
  const environment = options.env ?? process.env
  const config = readSeoDiscoveryConfig(environment)
  if (
    !config.discoveryEnabled
    || (!config.gscEnabled && !allowDisabledIntegrationProbe)
  ) {
    return new DisabledGoogleSearchConsoleClient()
  }

  const credentialPath = resolveCredentialFile(
    environment.GOOGLE_APPLICATION_CREDENTIALS,
    options.repositoryRoot ?? process.cwd(),
  )
  if (!credentialPath) {
    return new ConfigurationRequiredGoogleSearchConsoleClient(config.gscEnabled)
  }

  return new AuthenticatedGoogleSearchConsoleClient(
    config.property,
    credentialPath,
    options.fetch ?? globalThis.fetch,
    config.gscEnabled,
    allowDisabledIntegrationProbe,
  )
}

export function createGoogleSearchConsoleClient(
  options: CreateGoogleSearchConsoleClientOptions = {},
): GoogleSearchConsoleFullClient {
  return createGoogleSearchConsoleClientInternal(options, false)
}

/**
 * Admin-only connection probe. It may ignore only the GSC integration switch so
 * operators can validate sitemap and URL Inspection access before the worker is
 * enabled. The discovery master switch and every credential boundary remain
 * mandatory.
 */
export function createGoogleSearchConsoleProbeClient(
  options: CreateGoogleSearchConsoleClientOptions = {},
): GoogleSearchConsoleClient {
  return createGoogleSearchConsoleClientInternal(options, true)
}

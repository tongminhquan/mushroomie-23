export type ConnectionStatus =
  | { state: 'disabled'; code: 'GSC_DISABLED' }
  | {
    state: 'configuration_required'
    code: 'GSC_CONFIGURATION_REQUIRED'
  }
  | { state: 'connected'; code: 'GSC_CONNECTED'; property: string }

export interface SitemapStatus {
  url: string
  lastSubmitted: string | null
  lastDownloaded: string | null
  pending: boolean
  warnings: number | null
  errors: number | null
}

export interface UrlInspectionResult {
  verdict: string | null
  coverageState: string | null
  robotsTxtState: string | null
  indexingState: string | null
  pageFetchState: string | null
  googleCanonical: string | null
  userCanonical: string | null
  lastCrawlTime: string | null
}

export interface GoogleSearchConsoleClient {
  getConnectionStatus(): Promise<ConnectionStatus>
  listSitemaps(): Promise<SitemapStatus[]>
  submitSitemap(sitemapUrl: string): Promise<void>
  inspectUrl(url: string): Promise<UrlInspectionResult>
}

export type SearchAnalyticsDevice = 'DESKTOP' | 'MOBILE' | 'TABLET'

export interface SearchAnalyticsRequest {
  startDate: string
  endDate: string
  query: string
}

export interface SearchAnalyticsRow {
  query: string
  page: string
  device: SearchAnalyticsDevice
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GoogleSearchConsoleAnalyticsClient {
  querySearchAnalytics(
    request: SearchAnalyticsRequest,
  ): Promise<SearchAnalyticsRow[]>
}

export type GoogleSearchConsoleFullClient =
  GoogleSearchConsoleClient & GoogleSearchConsoleAnalyticsClient

export type GscClientErrorCode =
  | 'GSC_DISABLED'
  | 'GSC_CONFIGURATION_REQUIRED'
  | 'GSC_AUTHENTICATION_FAILED'
  | 'GSC_UNAUTHORIZED'
  | 'GSC_FORBIDDEN'
  | 'GSC_NOT_FOUND'
  | 'GSC_RATE_LIMITED'
  | 'GSC_SERVER_ERROR'
  | 'GSC_HTTP_ERROR'
  | 'GSC_REQUEST_TIMEOUT'
  | 'GSC_NETWORK_ERROR'
  | 'GSC_INVALID_RESPONSE'
  | 'GSC_INVALID_URL'

export interface GscClientErrorOptions {
  retryable?: boolean
  configurationRequired?: boolean
  httpStatus?: number | null
}

export class GscClientError extends Error {
  readonly code: GscClientErrorCode
  readonly retryable: boolean
  readonly configurationRequired: boolean
  readonly httpStatus: number | null

  constructor(
    code: GscClientErrorCode,
    options: GscClientErrorOptions = {},
  ) {
    super(`SEO_DISCOVERY_${code}`)
    this.name = 'GscClientError'
    this.code = code
    this.retryable = options.retryable ?? false
    this.configurationRequired = options.configurationRequired ?? false
    this.httpStatus = options.httpStatus ?? null
  }
}

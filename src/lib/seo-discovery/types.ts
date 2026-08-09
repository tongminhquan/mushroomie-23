export type SeoDiscoveryStatus =
  | 'PENDING_ELIGIBILITY'
  | 'ELIGIBLE'
  | 'INSPECTION_SCHEDULED'
  | 'INDEXED'
  | 'NOT_INDEXED'
  | 'RETRY'
  | 'SKIPPED'
  | 'CONFIGURATION_REQUIRED'
  | 'ERROR'

export interface PublicContentPublication {
  source: 'post' | 'product' | 'sitemap_sync'
  sourceId?: number
  url: string
  contentUpdatedAt: Date
  reason:
    | 'created'
    | 'published'
    | 'updated'
    | 'activated'
    | 'scheduled'
    | 'deploy_sync'
}

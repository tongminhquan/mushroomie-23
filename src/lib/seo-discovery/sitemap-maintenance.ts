import 'server-only'

import { readSeoDiscoveryConfig } from './config'
import {
  syncSitemapDiscoveryJobs,
  type SitemapSyncResult,
} from './sitemap-sync'

const RECONCILIATION_INTERVAL_MS = 60 * 60 * 1_000
const FAILURE_CODE = 'SEO_DISCOVERY_SITEMAP_SYNC_FAILED'

export type SitemapMaintenanceResult =
  | { status: 'disabled' }
  | { status: 'not_due' }
  | { status: 'completed'; summary: SitemapSyncResult }
  | { status: 'failed'; code: typeof FAILURE_CODE }

export interface SitemapMaintenanceDependencies {
  isEnabled(): boolean
  now(): number
  sync(): Promise<SitemapSyncResult>
  logFailure(): void
}

export interface SitemapMaintenanceCoordinator {
  runIfDue(): Promise<SitemapMaintenanceResult>
}

const DEFAULT_DEPENDENCIES: SitemapMaintenanceDependencies = {
  isEnabled: () => readSeoDiscoveryConfig(process.env).discoveryEnabled,
  now: () => Date.now(),
  sync: () => syncSitemapDiscoveryJobs(),
  logFailure: () => {
    console.error('[seo-discovery] automatic sitemap reconciliation failed', {
      code: FAILURE_CODE,
    })
  },
}

export function createSitemapMaintenanceCoordinator(
  dependencies: SitemapMaintenanceDependencies = DEFAULT_DEPENDENCIES,
): SitemapMaintenanceCoordinator {
  let lastSuccessfulAtMs: number | null = null
  let inFlight: Promise<SitemapMaintenanceResult> | null = null

  return {
    runIfDue() {
      if (!dependencies.isEnabled()) {
        return Promise.resolve({ status: 'disabled' })
      }
      if (inFlight) return inFlight

      const nowMs = dependencies.now()
      if (
        lastSuccessfulAtMs !== null
        && nowMs - lastSuccessfulAtMs < RECONCILIATION_INTERVAL_MS
      ) {
        return Promise.resolve({ status: 'not_due' })
      }

      const operation: Promise<SitemapMaintenanceResult> = Promise.resolve()
        .then(() => dependencies.sync())
        .then((summary) => {
          lastSuccessfulAtMs = dependencies.now()
          return { status: 'completed', summary } as const
        })
        .catch(() => {
          try {
            dependencies.logFailure()
          } catch {
            // Logging must not turn a fail-soft maintenance action into an outage.
          }
          return { status: 'failed', code: FAILURE_CODE } as const
        })
        .finally(() => {
          if (inFlight === operation) inFlight = null
        })

      inFlight = operation
      return operation
    },
  }
}

type SitemapMaintenanceGlobal = typeof globalThis & {
  __mushroomieSitemapMaintenanceCoordinator?: SitemapMaintenanceCoordinator
}

const globalStore = globalThis as SitemapMaintenanceGlobal

export function runSitemapReconciliationIfDue(): Promise<SitemapMaintenanceResult> {
  const coordinator = globalStore.__mushroomieSitemapMaintenanceCoordinator
    ?? createSitemapMaintenanceCoordinator()
  globalStore.__mushroomieSitemapMaintenanceCoordinator = coordinator
  return coordinator.runIfDue()
}

const DEFAULT_GSC_PROPERTY = 'sc-domain:mushroomie.io.vn'

type SeoDiscoveryEnvironment = Readonly<Record<string, string | undefined>>

export interface SeoDiscoveryConfig {
  discoveryEnabled: boolean
  gscEnabled: boolean
  property: string
}

export function readSeoDiscoveryConfig(
  env: SeoDiscoveryEnvironment,
): SeoDiscoveryConfig {
  const configuredProperty = env.GSC_PROPERTY?.trim()

  return {
    discoveryEnabled: env.SEO_DISCOVERY_ENABLED === 'true',
    gscEnabled: env.GSC_INTEGRATION_ENABLED === 'true',
    property: configuredProperty || DEFAULT_GSC_PROPERTY,
  }
}

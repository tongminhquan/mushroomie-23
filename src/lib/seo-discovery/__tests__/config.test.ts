import { describe, expect, it } from 'vitest'

import { readSeoDiscoveryConfig } from '@/lib/seo-discovery/config'

describe('readSeoDiscoveryConfig', () => {
  it('uses disabled flags and the domain property by default', () => {
    expect(readSeoDiscoveryConfig({})).toMatchObject({
      discoveryEnabled: false,
      gscEnabled: false,
      property: 'sc-domain:mushroomie.io.vn',
    })
  })

  it.each(['TRUE', '1', 'yes', ' true ', 'false', ''])(
    'keeps feature flags disabled for the non-literal value %j',
    (value) => {
      expect(readSeoDiscoveryConfig({
        SEO_DISCOVERY_ENABLED: value,
        GSC_INTEGRATION_ENABLED: value,
      })).toMatchObject({
        discoveryEnabled: false,
        gscEnabled: false,
      })
    },
  )

  it('enables each feature only for the literal value true', () => {
    expect(readSeoDiscoveryConfig({
      SEO_DISCOVERY_ENABLED: 'true',
      GSC_INTEGRATION_ENABLED: 'true',
    })).toMatchObject({
      discoveryEnabled: true,
      gscEnabled: true,
    })
  })

  it('uses a non-empty configured Search Console property', () => {
    expect(readSeoDiscoveryConfig({ GSC_PROPERTY: 'https://mushroomie.io.vn/' }).property)
      .toBe('https://mushroomie.io.vn/')
    expect(readSeoDiscoveryConfig({ GSC_PROPERTY: '   ' }).property)
      .toBe('sc-domain:mushroomie.io.vn')
  })
})

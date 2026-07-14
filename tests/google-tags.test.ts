import assert from 'node:assert/strict'
import test from 'node:test'
import nextConfig from '../next.config'
import {
  GOOGLE_ADS_ID,
  GOOGLE_ANALYTICS_ID,
  configureGoogleTags,
} from '../src/lib/google-tags'

test('Google tag configures GA4 and Google Ads from one shared data layer', () => {
  const calls: unknown[][] = []
  const initializedAt = new Date('2026-07-14T00:00:00.000Z')

  configureGoogleTags((...args) => calls.push(args), initializedAt)

  assert.deepEqual(calls, [
    ['js', initializedAt],
    ['config', GOOGLE_ANALYTICS_ID],
    ['config', GOOGLE_ADS_ID],
  ])
  assert.equal(GOOGLE_ANALYTICS_ID, 'G-R95TLDCP0W')
  assert.equal(GOOGLE_ADS_ID, 'AW-18206718336')
})

test('content security policy allows Google Ads measurement endpoints', async () => {
  assert.equal(typeof nextConfig.headers, 'function')

  const headers = await nextConfig.headers!()
  const globalHeaders = headers.find((entry) => entry.source === '/(.*)')
  const policy = globalHeaders?.headers.find((header) => header.key === 'Content-Security-Policy')?.value

  assert.ok(policy)
  for (const origin of [
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://pagead2.googlesyndication.com',
  ]) {
    assert.match(policy, new RegExp(origin.replaceAll('.', '\\.')))
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'
import nextConfig from '../next.config'
import {
  GOOGLE_ADS_ID,
  GOOGLE_ADS_PURCHASE_LABEL,
  GOOGLE_ADS_PURCHASE_SEND_TO,
  GOOGLE_ANALYTICS_ID,
  GOOGLE_TAG_MANAGER_ID,
  createGoogleTagManagerBootstrap,
} from '../src/lib/google-tags'

test('Google Tag Manager is the single loader for GA4 and Google Ads', () => {
  const startedAt = Date.parse('2026-07-14T00:00:00.000Z')

  assert.deepEqual(createGoogleTagManagerBootstrap(startedAt), {
    'gtm.start': startedAt,
    event: 'gtm.js',
  })
  assert.equal(GOOGLE_TAG_MANAGER_ID, 'GTM-K55B6RVG')
  assert.equal(GOOGLE_ANALYTICS_ID, 'G-R95TLDCP0W')
  assert.equal(GOOGLE_ADS_ID, 'AW-18206718336')
})

test('đích chuyển đổi "Lượt mua hàng" ghép đúng ID và nhãn từ Google Ads', () => {
  assert.equal(GOOGLE_ADS_PURCHASE_LABEL, 'OMl8CKSds9AcEIDz0elD')
  assert.equal(GOOGLE_ADS_PURCHASE_SEND_TO, `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`)
  assert.equal(GOOGLE_ADS_PURCHASE_SEND_TO, 'AW-18206718336/OMl8CKSds9AcEIDz0elD')
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

test('content security policy blocks the redundant Cloudflare Browser Insights beacon', async () => {
  assert.equal(typeof nextConfig.headers, 'function')

  const headers = await nextConfig.headers!()
  const globalHeaders = headers.find((entry) => entry.source === '/(.*)')
  const policy = globalHeaders?.headers.find((header) => header.key === 'Content-Security-Policy')?.value

  assert.ok(policy)
  assert.doesNotMatch(policy, /cloudflareinsights\.com/)
})

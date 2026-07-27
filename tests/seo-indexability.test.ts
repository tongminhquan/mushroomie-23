import assert from 'node:assert/strict'
import test from 'node:test'
import nextConfig from '../next.config'
import robots from '../src/app/robots'
import { metadata as accountMetadata } from '../src/app/(user)/tai-khoan/layout'
import { metadata as cartMetadata } from '../src/app/(user)/gio-hang/layout'
import { metadata as checkoutMetadata } from '../src/app/(user)/thanh-toan/layout'

test('canonical host redirects are permanent and preserve the requested path', async () => {
  assert.equal(typeof nextConfig.redirects, 'function')

  const redirects = await nextConfig.redirects!()
  const wwwRedirect = redirects.find((redirect) =>
    redirect.has?.some((condition) => condition.type === 'host' && condition.value === 'www.mushroomie.io.vn'),
  )
  const httpsRedirect = redirects.find((redirect) =>
    redirect.has?.some((condition) =>
      condition.type === 'header'
      && condition.key === 'x-forwarded-proto'
      && condition.value === 'http',
    ),
  )

  assert.deepEqual(wwwRedirect, {
    source: '/:path*',
    has: [{ type: 'host', value: 'www.mushroomie.io.vn' }],
    destination: 'https://mushroomie.io.vn/:path*',
    permanent: true,
  })
  assert.deepEqual(httpsRedirect, {
    source: '/:path*',
    has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
    destination: 'https://mushroomie.io.vn/:path*',
    permanent: true,
  })
})

test('legacy Search Console 404 URLs permanently redirect to canonical pages', async () => {
  assert.equal(typeof nextConfig.redirects, 'function')

  const redirects = await nextConfig.redirects!()

  assert.ok(redirects.some((redirect) => (
    redirect.source === '/category/chua-phan-loai'
    && redirect.destination === '/tin-tuc'
    && redirect.permanent === true
  )))
  assert.ok(redirects.some((redirect) => (
    redirect.source === '/tin-tuc/https\\:/mushroomie.io.vn/vong-tay-handmade-nu'
    && redirect.destination === '/tin-tuc/vong-tay-handmade-nu'
    && redirect.permanent === true
  )))
})

test('utility pages expose noindex metadata to crawlers', () => {
  for (const metadata of [accountMetadata, cartMetadata, checkoutMetadata]) {
    assert.equal(metadata.robots && typeof metadata.robots === 'object' && metadata.robots.index, false)
    assert.equal(metadata.robots && typeof metadata.robots === 'object' && metadata.robots.follow, false)
  }

  const rules = robots().rules
  assert.ok(!Array.isArray(rules) || rules.every((rule) => {
    const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]
    return !disallow.some((path) => path === '/tai-khoan' || path === '/gio-hang' || path === '/thanh-toan')
  }))
})

test('robots does not block the public session dependency with a blanket API rule', () => {
  const rules = robots().rules
  const normalizedRules = Array.isArray(rules) ? rules : [rules]
  const wildcardRule = normalizedRules.find((rule) => rule.userAgent === '*')

  assert.ok(wildcardRule)

  const disallow = Array.isArray(wildcardRule.disallow) ? wildcardRule.disallow : [wildcardRule.disallow]

  assert.ok(!disallow.some((path) => typeof path === 'string' && path.startsWith('/api')))
})

test('API responses use X-Robots-Tag instead of robots.txt for index control', async () => {
  assert.equal(typeof nextConfig.headers, 'function')

  const headers = await nextConfig.headers!()
  const apiHeaders = headers.find((entry) => entry.source === '/api/:path*')

  assert.deepEqual(apiHeaders?.headers, [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  ])
})

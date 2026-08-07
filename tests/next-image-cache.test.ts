import assert from 'node:assert/strict'
import test from 'node:test'
import nextConfig from '../next.config'

test('self-hosted image optimization avoids the poisoned Next.js disk LRU', () => {
  assert.equal(
    nextConfig.images?.maximumDiskCacheSize,
    0,
    'Next.js disk image cache must stay disabled until the zero-byte LRU initialization bug is fixed upstream',
  )
})

test('self-hosted incremental cache does not retain a duplicate in-memory copy', () => {
  assert.equal(
    nextConfig.cacheMaxMemorySize,
    0,
    'Production uses the durable cache and must not spend another 50 MiB on the default process-local cache',
  )
})

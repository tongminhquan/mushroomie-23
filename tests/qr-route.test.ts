import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { GET } from '../src/app/api/qr/route'

function requestFor(target?: string) {
  const url = new URL('https://mushroomie.io.vn/api/qr')
  if (target) url.searchParams.set('url', target)
  return new NextRequest(url)
}

test('QR proxy rejects missing, invalid and non-allowlisted URLs', async () => {
  assert.equal((await GET(requestFor())).status, 400)
  assert.equal((await GET(requestFor('not-a-url'))).status, 400)
  assert.equal((await GET(requestFor('http://img.vietqr.io/image/test.png'))).status, 400)
  assert.equal((await GET(requestFor('https://img.vietqr.io.evil.example/image/test.png'))).status, 400)
})

test('QR proxy returns image bytes with safe response headers', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response(new Uint8Array([137, 80, 78, 71]), {
    status: 200,
    headers: { 'Content-Type': 'image/png' },
  })
  try {
    const response = await GET(requestFor('https://img.vietqr.io/image/970436-test.png'))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'image/png')
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
    assert.match(response.headers.get('cache-control') || '', /max-age=300/)
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [137, 80, 78, 71])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('QR proxy rejects non-image and failed upstream responses', async (context) => {
  context.mock.method(console, 'error', () => {})
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('<html>error</html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
    assert.equal((await GET(requestFor('https://img.vietqr.io/image/test.png'))).status, 502)

    globalThis.fetch = async () => new Response('missing', { status: 404 })
    assert.equal((await GET(requestFor('https://img.vietqr.io/image/test.png'))).status, 502)
  } finally {
    globalThis.fetch = originalFetch
  }
})

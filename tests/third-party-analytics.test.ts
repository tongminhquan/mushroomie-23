import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deferThirdPartyScript } from '../src/lib/deferThirdPartyScript'

const publicLayoutSource = readFileSync(
  resolve(process.cwd(), 'src', 'app', '(user)', 'layout.tsx'),
  'utf8',
)

test('public layout uses GTM as the single analytics and marketing tag loader', () => {
  assert.match(publicLayoutSource, /<GoogleTagManagerInit\s*\/>/)
  assert.doesNotMatch(publicLayoutSource, /<ClarityInit\s*\/>/)
  assert.doesNotMatch(publicLayoutSource, /<GoogleAnalyticsInit\s*\/>/)
})

test('third-party fallback waits for the minimum delay before requesting idle time', () => {
  const originalWindow = globalThis.window
  const originalDocument = globalThis.document
  let loaded = false
  let idleRequests = 0
  let scheduledDelay: number | undefined
  let scheduledCallback: (() => void) | undefined

  const fakeWindow = {
    addEventListener() {},
    removeEventListener() {},
    setTimeout(callback: () => void, delay: number) {
      scheduledCallback = callback
      scheduledDelay = delay
      return 1
    },
    clearTimeout() {},
    requestIdleCallback() {
      idleRequests += 1
      return 2
    },
    cancelIdleCallback() {},
  } as unknown as Window & typeof globalThis

  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { readyState: 'complete' },
  })

  try {
    const cleanup = (deferThirdPartyScript as Function)(
      () => {
        loaded = true
      },
      { minimumDelayMs: 10_000 },
    )

    assert.equal(idleRequests, 0)
    assert.equal(loaded, false)
    assert.equal(scheduledDelay, 10_000)

    scheduledCallback?.()
    assert.equal(idleRequests, 1)
    assert.equal(loaded, false)
    cleanup()
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
    Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument })
  }
})

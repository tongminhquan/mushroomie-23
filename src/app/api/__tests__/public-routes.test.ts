import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: mocks.queryRaw } }))

import { GET as health } from '@/app/api/health/route'
import { GET as qrProxy } from '@/app/api/qr/route'

describe('public health and QR proxy routes', () => {
  beforeEach(() => {
    mocks.queryRaw.mockResolvedValue([{ ok: 1 }])
  })

  it('reports database health without exposing connection details', async () => {
    const response = await health()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ok', service: 'mushroomie', database: 'ok' })

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.queryRaw.mockRejectedValue(new Error('mysql://secret@host/database'))
    const failed = await health()
    expect(failed.status).toBe(503)
    const body = await failed.text()
    expect(body).not.toContain('mysql://')
    expect(errorSpy).toHaveBeenCalled()
  })

  it.each([
    ['https://mushroomie.test/api/qr', 400],
    ['https://mushroomie.test/api/qr?url=not-a-url', 400],
    ['https://mushroomie.test/api/qr?url=https%3A%2F%2Fevil.example%2Fqr.png', 400],
    ['https://mushroomie.test/api/qr?url=http%3A%2F%2Fimg.vietqr.io%2Fqr.png', 400],
  ])('rejects unsafe QR target %s', async (url, status) => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await qrProxy(new NextRequest(url))).status).toBe(status)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('proxies only image responses from the VietQR HTTPS host with safe headers', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(bytes, { status: 200, headers: { 'content-type': 'image/png' } })))
    const target = encodeURIComponent('https://img.vietqr.io/image/970436-account.png')
    const response = await qrProxy(new NextRequest(`https://mushroomie.test/api/qr?url=${target}`))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes)
  })

  it('rejects non-image upstream content', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>bad</html>', { status: 200, headers: { 'content-type': 'text/html' } })))
    const target = encodeURIComponent('https://img.vietqr.io/image/qr.png')
    const response = await qrProxy(new NextRequest(`https://mushroomie.test/api/qr?url=${target}`))

    expect(response.status).toBe(502)
    expect(errorSpy).toHaveBeenCalled()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVoucherStore } from '@/store/voucher'

describe('voucher wallet store', () => {
  beforeEach(() => {
    useVoucherStore.setState({ vouchers: [], loading: false, loaded: false })
  })

  it('loads voucher data once and exposes the completed state', async () => {
    const vouchers = [{ id: 1, code: 'WELCOME10' }]
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: vouchers }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await useVoucherStore.getState().fetchVouchers()
    await useVoucherStore.getState().fetchVouchers()

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith('/api/vouchers/my-wallet')
    expect(useVoucherStore.getState()).toMatchObject({ vouchers, loading: false, loaded: true })
  })

  it('deduplicates concurrent requests while a wallet request is in flight', async () => {
    let resolveResponse!: (response: Response) => void
    const responsePromise = new Promise<Response>((resolve) => { resolveResponse = resolve })
    const fetchMock = vi.fn().mockReturnValue(responsePromise)
    vi.stubGlobal('fetch', fetchMock)

    const first = useVoucherStore.getState().fetchVouchers()
    const second = useVoucherStore.getState().fetchVouchers()
    expect(fetchMock).toHaveBeenCalledOnce()

    resolveResponse(new Response(JSON.stringify({ data: [] }), { status: 200 }))
    await Promise.all([first, second])
    expect(useVoucherStore.getState()).toMatchObject({ loading: false, loaded: true })
  })

  it('falls back to an empty loaded wallet for HTTP and network failures', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    await useVoucherStore.getState().fetchVouchers()
    expect(useVoucherStore.getState()).toMatchObject({ vouchers: [], loading: false, loaded: true })

    useVoucherStore.setState({ vouchers: [], loading: false, loaded: false })
    await useVoucherStore.getState().fetchVouchers()
    expect(useVoucherStore.getState()).toMatchObject({ vouchers: [], loading: false, loaded: true })
  })
})

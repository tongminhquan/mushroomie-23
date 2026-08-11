// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import SeoDiscoveryDashboard from '@/components/admin/SeoDiscoveryDashboard'

const job = {
  id: 41,
  url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-nam',
  sourceType: 'post',
  sourceId: 7,
  contentUpdatedAt: '2026-08-10T07:00:00.000Z',
  status: 'NOT_INDEXED',
  eligibilityStatus: 'ELIGIBLE',
  httpStatus: 200,
  declaredCanonical: 'https://mushroomie.io.vn/tin-tuc/vong-tay-nam',
  robotsIndexable: true,
  gscVerdict: 'NEUTRAL',
  coverageState: 'Discovered - currently not indexed',
  pageFetchState: 'SUCCESSFUL',
  googleCanonical: null,
  lastCrawlAt: '2026-08-11T05:00:00.000Z',
  lastInspectedAt: '2026-08-11T06:00:00.000Z',
  nextAttemptAt: '2026-08-12T06:00:00.000Z',
  attemptCount: 0,
  lastErrorCode: null,
  createdAt: '2026-08-10T07:00:00.000Z',
  updatedAt: '2026-08-11T07:30:00.000Z',
  canRetry: true,
}

const overview = {
  summary: {
    total: 13,
    pending: 2,
    indexed: 3,
    notIndexed: 4,
    retrying: 1,
    skipped: 0,
    errors: 1,
    configurationRequired: 2,
  },
  connection: {
    state: 'connected',
    code: 'GSC_CONNECTED',
    property: 'sc-domain:mushroomie.io.vn',
  },
  sitemap: {
    url: 'https://mushroomie.io.vn/sitemap.xml',
    registered: true,
    lastSubmitted: '2026-08-10T06:00:00.000Z',
    lastDownloaded: '2026-08-11T06:00:00.000Z',
    pending: false,
    warnings: 0,
    errors: 0,
  },
  jobs: [job],
  pagination: {
    page: 1,
    pageSize: 25,
    total: 13,
    totalPages: 1,
  },
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('SeoDiscoveryDashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a loading state then the configured summary and policy disclosure', async () => {
    const pending = deferred<ReturnType<typeof response>>()
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending.promise))

    render(<SeoDiscoveryDashboard />)
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải trạng thái')

    pending.resolve(response(overview))

    expect(await screen.findByText('Search Console đã kết nối')).toBeInTheDocument()
    expect(screen.getAllByText('Đã lập chỉ mục').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Chưa lập chỉ mục').length).toBeGreaterThan(0)
    expect(screen.getByText(/Google quyết định thời điểm và khả năng lập chỉ mục/)).toBeInTheDocument()
    expect(screen.getByText('sc-domain:mushroomie.io.vn')).toBeInTheDocument()
  })

  it('renders a useful empty state without hiding the operational controls', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      ...overview,
      summary: { ...overview.summary, total: 0 },
      jobs: [],
      pagination: { ...overview.pagination, total: 0 },
    })))

    render(<SeoDiscoveryDashboard />)

    expect(await screen.findByText('Chưa có URL trong hàng đợi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đồng bộ sitemap' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kiểm tra kết nối' })).toBeInTheDocument()
  })

  it.each([
    [
      { state: 'disabled', code: 'GSC_DISABLED' },
      'Tích hợp Google đang tắt',
    ],
    [
      { state: 'configuration_required', code: 'GSC_CONFIGURATION_REQUIRED' },
      'Cần cấu hình Search Console',
    ],
    [
      { state: 'error', code: 'GSC_STATUS_UNAVAILABLE' },
      'Không tải được trạng thái Search Console',
    ],
  ])('shows the %s connection state while preserving job evidence', async (connection, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      ...overview,
      connection,
      sitemap: { ...overview.sitemap, registered: false, lastSubmitted: null },
    })))

    render(<SeoDiscoveryDashboard />)

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getAllByText('Chưa lập chỉ mục').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Gửi sitemap cho Google' })).toBeDisabled()
  })

  it('keeps a partial API error readable and supports retrying the data load', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ error: 'Không thể tải dữ liệu' }, 500))
      .mockResolvedValueOnce(response(overview))
    vi.stubGlobal('fetch', fetchMock)

    render(<SeoDiscoveryDashboard />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải dữ liệu')
    await userEvent.click(screen.getByRole('button', { name: 'Tải lại dữ liệu' }))
    expect(await screen.findByText('Search Console đã kết nối')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps existing evidence visible and announces a failed refresh', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        ...overview,
        pagination: { ...overview.pagination, totalPages: 3 },
      }))
      .mockResolvedValueOnce(response({ error: 'Không thể làm mới dữ liệu' }, 500))
    vi.stubGlobal('fetch', fetchMock)

    render(<SeoDiscoveryDashboard />)
    await screen.findByText('Search Console đã kết nối')

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể làm mới dữ liệu')
    expect(screen.getAllByText(overview.jobs[0].url).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Tải lại trạng thái' })).toHaveClass('min-h-11')
  })

  it('submits bounded status/source/URL filters and renders Vietnamese status labels', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(overview))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<SeoDiscoveryDashboard />)
    await screen.findByText('Search Console đã kết nối')

    await user.selectOptions(screen.getByLabelText('Trạng thái công việc'), 'NOT_INDEXED')
    await user.selectOptions(screen.getByLabelText('Nguồn nội dung'), 'post')
    await user.type(screen.getByLabelText('Tìm URL hoặc nguồn'), 'vong tay')
    await user.click(screen.getByRole('button', { name: 'Áp dụng bộ lọc' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/admin/seo-discovery?page=1&pageSize=25&status=NOT_INDEXED&source=post&search=vong+tay',
    )
    expect(screen.getAllByText('Chưa lập chỉ mục').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bài viết').length).toBeGreaterThan(0)
  })

  it('loads the requested page while keeping 44px accessible pagination controls', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        ...overview,
        pagination: { ...overview.pagination, totalPages: 3 },
      }))
      .mockResolvedValueOnce(response({
        ...overview,
        pagination: { ...overview.pagination, page: 2, totalPages: 3 },
      }))
    vi.stubGlobal('fetch', fetchMock)

    render(<SeoDiscoveryDashboard />)
    const next = await screen.findByRole('button', { name: 'Trang sau' })
    expect(next).toHaveClass('min-h-11')

    fireEvent.click(next)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[1][0]).toContain('page=2&pageSize=25')
    expect((await screen.findAllByText('Trang 2 / 3')).length).toBeGreaterThan(0)
  })

  it('aborts the previous load and ignores reversed stale GET responses', async () => {
    const stale = deferred<ReturnType<typeof response>>()
    const latest = deferred<ReturnType<typeof response>>()
    const staleUrl = 'https://mushroomie.io.vn/tin-tuc/phan-hoi-cu'
    const latestUrl = 'https://mushroomie.io.vn/tin-tuc/phan-hoi-moi'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(overview))
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(latest.promise)
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<SeoDiscoveryDashboard />)
    await screen.findByText('Search Console đã kết nối')

    const search = screen.getByLabelText('Tìm URL hoặc nguồn')
    await user.type(search, 'cu')
    await user.click(screen.getByRole('button', { name: 'Áp dụng bộ lọc' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    await user.clear(search)
    await user.type(search, 'moi')
    await user.click(screen.getByRole('button', { name: 'Áp dụng bộ lọc' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))

    const staleSignal = fetchMock.mock.calls[1][1]?.signal as AbortSignal
    expect(staleSignal.aborted).toBe(true)

    latest.resolve(response({
      ...overview,
      jobs: [{ ...job, id: 43, url: latestUrl }],
    }))
    expect((await screen.findAllByText(latestUrl)).length).toBeGreaterThan(0)

    stale.resolve(response({
      ...overview,
      jobs: [{ ...job, id: 42, url: staleUrl }],
    }))
    await waitFor(() => expect(screen.queryAllByText(staleUrl)).toHaveLength(0))
    expect(screen.getAllByText(latestUrl).length).toBeGreaterThan(0)
  })

  it('refreshes the current query after an action instead of its captured query', async () => {
    const action = deferred<ReturnType<typeof response>>()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(overview))
      .mockReturnValueOnce(action.promise)
      .mockResolvedValueOnce(response(overview))
      .mockResolvedValueOnce(response(overview))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<SeoDiscoveryDashboard />)
    await screen.findByText('Search Console đã kết nối')

    await user.click(screen.getByRole('button', { name: 'Đồng bộ sitemap' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    await user.type(screen.getByLabelText('Tìm URL hoặc nguồn'), 'moi')
    await user.click(screen.getByRole('button', { name: 'Áp dụng bộ lọc' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))

    action.resolve(response({
      ok: true,
      action: 'sync_sitemap',
      result: {
        observedCount: 1,
        createdCount: 0,
        resetCount: 0,
        unchangedCount: 1,
        removedCount: 0,
      },
    }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))

    expect(fetchMock.mock.calls[3][0]).toContain('search=moi')
  })

  it('requires retry confirmation, sends only selected IDs, and disables actions while pending', async () => {
    const action = deferred<ReturnType<typeof response>>()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(overview))
      .mockReturnValueOnce(action.promise)
      .mockResolvedValueOnce(response(overview))
    vi.stubGlobal('fetch', fetchMock)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const user = userEvent.setup()

    render(<SeoDiscoveryDashboard />)
    const checkboxes = await screen.findAllByRole('checkbox', {
      name: 'Chọn công việc 41 để thử lại',
    })
    await user.click(checkboxes[0])
    const retry = screen.getByRole('button', { name: 'Thử lại 1 công việc' })

    await user.click(retry)
    expect(confirm).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await user.click(retry)
    expect(confirm).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(retry).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Kiểm tra kết nối' })).toBeDisabled()
    expect(fetchMock.mock.calls[1]).toEqual([
      '/api/admin/seo-discovery/actions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', ids: [41] }),
      }),
    ])

    action.resolve(response({
      ok: true,
      action: 'retry',
      requestedCount: 1,
      retriedCount: 1,
      skippedCount: 0,
    }))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã đưa 1 công việc vào hàng đợi thử lại')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })

  it('uses a real 44 by 44 checkbox label target on desktop and mobile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(overview)))
    const user = userEvent.setup()

    render(<SeoDiscoveryDashboard />)

    const checkboxes = await screen.findAllByRole('checkbox', {
      name: 'Chọn công việc 41 để thử lại',
    })
    expect(checkboxes).toHaveLength(2)
    for (const checkbox of checkboxes) {
      const target = checkbox.closest('label')
      expect(target).not.toBeNull()
      expect(target).toHaveClass('h-11', 'w-11')
    }

    await user.click(checkboxes[0].closest('label') as HTMLLabelElement)
    expect(screen.getByRole('button', { name: 'Thử lại 1 công việc' })).toBeEnabled()
  })

  it('shows the latest Google crawl timestamp in desktop and mobile evidence views', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(overview)))
    const expectedCrawl = new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(job.lastCrawlAt))

    render(<SeoDiscoveryDashboard />)

    const table = await screen.findByRole('table', {
      name: 'Các URL đang được theo dõi lập chỉ mục',
    })
    expect(within(table).getByText(`Google crawl: ${expectedCrawl}`)).toBeInTheDocument()

    const mobileCard = screen.getAllByRole('article')[0]
    expect(within(mobileCard).getByText('Google crawl')).toBeInTheDocument()
    expect(within(mobileCard).getByText(expectedCrawl)).toBeInTheDocument()
  })

  it('gives every filter and operational action an accessible name and 44px target', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(overview)))

    render(<SeoDiscoveryDashboard />)
    await screen.findByText('Search Console đã kết nối')

    for (const name of [
      'Kiểm tra kết nối',
      'Đồng bộ sitemap',
      'Gửi sitemap cho Google',
      'Áp dụng bộ lọc',
    ]) {
      expect(screen.getByRole('button', { name })).toHaveClass('min-h-11')
    }
    expect(screen.getByLabelText('Trạng thái công việc')).toHaveClass('min-h-11')
    expect(screen.getByLabelText('Nguồn nội dung')).toHaveClass('min-h-11')
    expect(screen.getByLabelText('Tìm URL hoặc nguồn')).toHaveClass('min-h-11')
  })
})

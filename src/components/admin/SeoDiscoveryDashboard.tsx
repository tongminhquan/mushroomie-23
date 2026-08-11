'use client'

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Waypoints,
  XCircle,
} from 'lucide-react'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import {
  AdminCard,
  AdminEmptyState,
  AdminStatusBadge,
} from '@/components/admin/AdminUI'
import { cn } from '@/lib/cn'

type ConnectionState = {
  state: 'disabled' | 'configuration_required' | 'connected' | 'error'
  code: string
  property?: string
}

interface DiscoveryJob {
  id: number
  url: string | null
  sourceType: string
  sourceId: number | null
  contentUpdatedAt: string
  status: string
  eligibilityStatus: string | null
  httpStatus: number | null
  declaredCanonical: string | null
  robotsIndexable: boolean | null
  gscVerdict: string | null
  coverageState: string | null
  pageFetchState: string | null
  googleCanonical: string | null
  lastCrawlAt: string | null
  lastInspectedAt: string | null
  nextAttemptAt: string
  attemptCount: number
  lastErrorCode: string | null
  createdAt: string
  updatedAt: string
  canRetry: boolean
}

interface DiscoveryOverview {
  summary: {
    total: number
    pending: number
    indexed: number
    notIndexed: number
    retrying: number
    skipped: number
    errors: number
    configurationRequired: number
  }
  connection: ConnectionState
  sitemap: {
    url: string
    registered: boolean
    lastSubmitted: string | null
    lastDownloaded: string | null
    pending: boolean | null
    warnings: number | null
    errors: number | null
  }
  jobs: DiscoveryJob[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface AppliedFilters {
  status: string
  source: string
  search: string
}

type DashboardAction =
  | { action: 'retry'; ids: number[] }
  | { action: 'sync_sitemap' }
  | { action: 'test_connection' }
  | { action: 'submit_sitemap' }

type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const PAGE_SIZE = 25
const EMPTY_FILTERS: AppliedFilters = { status: '', source: '', search: '' }
const SEARCH_CONSOLE_URL = 'https://search.google.com/search-console?resource_id=sc-domain%3Amushroomie.io.vn'

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const STATUS_LABELS: Record<string, string> = {
  PENDING_ELIGIBILITY: 'Chờ kiểm tra điều kiện',
  ELIGIBLE: 'Đủ điều kiện khám phá',
  INSPECTION_SCHEDULED: 'Chờ Google kiểm tra',
  INDEXED: 'Đã lập chỉ mục',
  NOT_INDEXED: 'Google chưa lập chỉ mục',
  RETRY: 'Đang chờ thử lại',
  SKIPPED: 'Đã bỏ qua',
  CONFIGURATION_REQUIRED: 'Cần cấu hình',
  ERROR: 'Lỗi xử lý',
}

const STATUS_TONES: Record<string, StatusTone> = {
  PENDING_ELIGIBILITY: 'neutral',
  ELIGIBLE: 'info',
  INSPECTION_SCHEDULED: 'info',
  INDEXED: 'success',
  NOT_INDEXED: 'warning',
  RETRY: 'warning',
  SKIPPED: 'neutral',
  CONFIGURATION_REQUIRED: 'danger',
  ERROR: 'danger',
}

const SOURCE_LABELS: Record<string, string> = {
  post: 'Bài viết',
  product: 'Sản phẩm',
  sitemap_sync: 'Trang từ sitemap',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOverview(value: unknown): value is DiscoveryOverview {
  if (!isRecord(value)) return false
  return isRecord(value.summary)
    && isRecord(value.connection)
    && isRecord(value.sitemap)
    && Array.isArray(value.jobs)
    && isRecord(value.pagination)
}

function boundedMessage(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim()
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180)
    : fallback
}

function displayDate(value: string | null): string {
  if (!value) return 'Chưa có'
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? dateTimeFormatter.format(date) : 'Chưa có'
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? 'Trạng thái chưa xác định'
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? 'Nguồn khác'
}

function JobStatus({ status }: { status: string }) {
  return (
    <AdminStatusBadge tone={STATUS_TONES[status] ?? 'neutral'}>
      {statusLabel(status)}
    </AdminStatusBadge>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  hint: string
  icon: typeof FileSearch
  tone: 'red' | 'green' | 'amber' | 'kraft'
}) {
  const toneClasses = {
    red: 'bg-red-50 text-primary ring-red-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    kraft: 'bg-theme-subtle text-accent-kraft ring-theme-border',
  }

  return (
    <AdminCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-theme-muted">{label}</p>
          <p className="mt-2 font-heading text-3xl text-theme-primary">{value.toLocaleString('vi-VN')}</p>
          <p className="mt-1 text-xs leading-5 text-theme-secondary">{hint}</p>
        </div>
        <span className={cn('grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl ring-1', toneClasses[tone])} aria-hidden>
          <Icon size={20} />
        </span>
      </div>
    </AdminCard>
  )
}

function ConnectionPanel({ connection, sitemap }: Pick<DiscoveryOverview, 'connection' | 'sitemap'>) {
  if (connection.state === 'connected') {
    return (
      <AdminCard className="border-emerald-200 bg-emerald-50/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 flex-shrink-0 text-emerald-700" size={22} aria-hidden />
            <div>
              <h2 className="font-bold text-emerald-900">Search Console đã kết nối</h2>
              <p className="mt-1 text-sm text-emerald-800">
                Property: <span className="font-mono text-xs font-bold">{connection.property ?? 'Đã xác thực'}</span>
              </p>
            </div>
          </div>
          <div className="grid gap-1 text-xs text-emerald-900 sm:grid-cols-2 sm:gap-x-6">
            <p>Sitemap: <strong>{sitemap.registered ? 'Đã đăng ký' : 'Chưa đăng ký'}</strong></p>
            <p>Gửi gần nhất: <strong>{displayDate(sitemap.lastSubmitted)}</strong></p>
            <p>Đang xử lý: <strong>{sitemap.pending ? 'Có' : 'Không'}</strong></p>
            <p>Cảnh báo / lỗi: <strong>{sitemap.warnings ?? 0} / {sitemap.errors ?? 0}</strong></p>
          </div>
        </div>
      </AdminCard>
    )
  }

  const configurationRequired = connection.state === 'configuration_required'
  const disabled = connection.state === 'disabled'
  return (
    <AdminCard className={cn(
      'p-4 sm:p-5',
      disabled ? 'border-amber-200 bg-amber-50/70' : 'border-red-200 bg-red-50/70',
    )}>
      <div className="flex gap-3">
        {disabled ? (
          <Info className="mt-0.5 flex-shrink-0 text-amber-700" size={22} aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 flex-shrink-0 text-red-700" size={22} aria-hidden />
        )}
        <div>
          <h2 className={cn('font-bold', disabled ? 'text-amber-900' : 'text-red-900')}>
            {disabled
              ? 'Tích hợp Google đang tắt'
              : configurationRequired
                ? 'Cần cấu hình Search Console'
                : 'Không tải được trạng thái Search Console'}
          </h2>
          <p className={cn('mt-1 text-sm leading-6', disabled ? 'text-amber-800' : 'text-red-800')}>
            {disabled
              ? 'Hàng đợi khám phá vẫn hoạt động. Bật đủ hai cờ cấu hình trên máy chủ sau khi đã cấp quyền service account.'
              : configurationRequired
                ? 'Kiểm tra tệp service account và quyền của property, sau đó dùng “Kiểm tra kết nối”. Không cần đăng lại nội dung.'
                : 'Dữ liệu công việc bên dưới vẫn được hiển thị; trạng thái Google sẽ được thử lại khi kết nối ổn định.'}
          </p>
          <p className="mt-2 font-mono text-xs text-theme-muted">Mã: {connection.code}</p>
        </div>
      </div>
    </AdminCard>
  )
}

function JobCheckbox({
  job,
  checked,
  onChange,
}: {
  job: DiscoveryJob
  checked: boolean
  onChange: (jobId: number, checked: boolean) => void
}) {
  return (
    <input
      type="checkbox"
      className="h-5 w-5 rounded border-theme-border accent-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
      aria-label={`Chọn công việc ${job.id} để thử lại`}
      checked={checked}
      disabled={!job.canRetry}
      onChange={(event) => onChange(job.id, event.currentTarget.checked)}
    />
  )
}

function PublicUrl({ job }: { job: DiscoveryJob }) {
  if (!job.url) return <span className="text-red-700">URL không hợp lệ</span>
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noreferrer"
      className="break-all font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
    >
      {job.url}
      <ExternalLink className="ml-1 inline" size={13} aria-hidden />
    </a>
  )
}

function DesktopJobTable({
  jobs,
  selected,
  onSelection,
}: {
  jobs: DiscoveryJob[]
  selected: ReadonlySet<number>
  onSelection: (jobId: number, checked: boolean) => void
}) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[1180px] text-left text-sm" aria-label="Các URL đang được theo dõi lập chỉ mục">
        <thead className="border-b border-theme-border bg-theme-subtle text-[11px] font-extrabold uppercase tracking-[0.08em] text-theme-muted">
          <tr>
            <th className="w-14 px-4 py-3"><span className="sr-only">Chọn</span></th>
            <th className="px-4 py-3">URL / nguồn</th>
            <th className="px-4 py-3">Quy trình</th>
            <th className="px-4 py-3">Điều kiện công khai</th>
            <th className="px-4 py-3">Bằng chứng Google</th>
            <th className="px-4 py-3">Canonical</th>
            <th className="px-4 py-3">Mốc thời gian</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-border">
          {jobs.map((job) => (
            <tr key={job.id} className="align-top transition-colors hover:bg-theme-subtle/70 motion-reduce:transition-none">
              <td className="px-4 py-4">
                <JobCheckbox job={job} checked={selected.has(job.id)} onChange={onSelection} />
              </td>
              <td className="max-w-[310px] px-4 py-4">
                <PublicUrl job={job} />
                <p className="mt-2 text-xs font-semibold text-theme-secondary">
                  {sourceLabel(job.sourceType)}{job.sourceId ? ` · #${job.sourceId}` : ''}
                </p>
              </td>
              <td className="px-4 py-4">
                <JobStatus status={job.status} />
                {job.lastErrorCode && <p className="mt-2 max-w-[180px] break-all font-mono text-[11px] text-red-700">{job.lastErrorCode}</p>}
              </td>
              <td className="px-4 py-4 text-xs leading-6 text-theme-secondary">
                <p>{job.eligibilityStatus ?? 'Chưa kiểm tra'}</p>
                <p>HTTP: {job.httpStatus ?? '—'} · Robots: {job.robotsIndexable === null ? '—' : job.robotsIndexable ? 'index' : 'noindex'}</p>
              </td>
              <td className="max-w-[230px] px-4 py-4 text-xs leading-5 text-theme-secondary">
                <p className="font-bold text-theme-primary">{job.gscVerdict ?? 'Chưa có verdict'}</p>
                <p className="mt-1">{job.coverageState ?? 'Chưa có coverage state'}</p>
                <p className="mt-1">Fetch: {job.pageFetchState ?? '—'}</p>
              </td>
              <td className="max-w-[220px] px-4 py-4 text-[11px] leading-5 text-theme-secondary">
                <p className="break-all"><strong>Trang:</strong> {job.declaredCanonical ?? '—'}</p>
                <p className="mt-1 break-all"><strong>Google:</strong> {job.googleCanonical ?? '—'}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-xs leading-6 text-theme-secondary">
                <p>Cập nhật: {displayDate(job.contentUpdatedAt)}</p>
                <p>Kiểm tra: {displayDate(job.lastInspectedAt)}</p>
                <p>Lần tới: {displayDate(job.nextAttemptAt)}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MobileJobCards({
  jobs,
  selected,
  onSelection,
}: {
  jobs: DiscoveryJob[]
  selected: ReadonlySet<number>
  onSelection: (jobId: number, checked: boolean) => void
}) {
  return (
    <div className="divide-y divide-theme-border md:hidden">
      {jobs.map((job) => (
        <article key={job.id} className="space-y-4 p-4">
          <div className="flex items-start gap-3">
            <div className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-theme-border bg-theme-subtle">
              <JobCheckbox job={job} checked={selected.has(job.id)} onChange={onSelection} />
            </div>
            <div className="min-w-0 flex-1">
              <PublicUrl job={job} />
              <p className="mt-2 text-xs font-semibold text-theme-secondary">
                {sourceLabel(job.sourceType)}{job.sourceId ? ` · #${job.sourceId}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <JobStatus status={job.status} />
            <AdminStatusBadge tone={job.robotsIndexable === false ? 'danger' : 'neutral'}>
              {job.eligibilityStatus ?? 'Chưa kiểm tra'}
            </AdminStatusBadge>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs leading-5 text-theme-secondary">
            <div><dt className="font-bold text-theme-primary">Google verdict</dt><dd>{job.gscVerdict ?? 'Chưa có'}</dd></div>
            <div><dt className="font-bold text-theme-primary">HTTP</dt><dd>{job.httpStatus ?? '—'}</dd></div>
            <div><dt className="font-bold text-theme-primary">Kiểm tra gần nhất</dt><dd>{displayDate(job.lastInspectedAt)}</dd></div>
            <div><dt className="font-bold text-theme-primary">Lần tiếp theo</dt><dd>{displayDate(job.nextAttemptAt)}</dd></div>
          </dl>
          {(job.coverageState || job.lastErrorCode) && (
            <p className="rounded-xl bg-theme-subtle px-3 py-2 text-xs leading-5 text-theme-secondary">
              {job.lastErrorCode ?? job.coverageState}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

function LoadingPanel() {
  return (
    <AdminCard className="p-10 text-center">
      <div role="status" className="inline-flex items-center gap-3 text-sm font-semibold text-theme-secondary">
        <Loader2 className="animate-spin motion-reduce:animate-none" size={20} aria-hidden />
        Đang tải trạng thái lập chỉ mục…
      </div>
    </AdminCard>
  )
}

export default function SeoDiscoveryDashboard() {
  const [overview, setOverview] = useState<DiscoveryOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState<AppliedFilters>(EMPTY_FILTERS)
  const [filters, setFilters] = useState<AppliedFilters>(EMPTY_FILTERS)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [pendingAction, setPendingAction] = useState<DashboardAction['action'] | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useMemo(() => {
    const parameters = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    })
    if (filters.status) parameters.set('status', filters.status)
    if (filters.source) parameters.set('source', filters.source)
    if (filters.search) parameters.set('search', filters.search)
    return parameters.toString()
  }, [filters, page])

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/seo-discovery?${query}`, {
        cache: 'no-store',
        signal,
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(boundedMessage(
          isRecord(payload) ? payload.error : null,
          'Không thể tải trạng thái lập chỉ mục',
        ))
      }
      if (!isOverview(payload)) {
        throw new Error('Phản hồi trạng thái không hợp lệ')
      }
      setOverview(payload)
      setSelected((current) => {
        const selectableIds = new Set(payload.jobs.filter((item) => item.canRetry).map((item) => item.id))
        return new Set([...current].filter((id) => selectableIds.has(id)))
      })
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return
      setError(boundedMessage(
        loadError instanceof Error ? loadError.message : null,
        'Không thể tải trạng thái lập chỉ mục',
      ))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    void loadData(controller.signal)
    return () => controller.abort()
  }, [loadData])

  const updateSelection = useCallback((jobId: number, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(jobId)
      else next.delete(jobId)
      return next
    })
  }, [])

  const performAction = useCallback(async (action: DashboardAction) => {
    if (pendingAction) return
    if (
      action.action === 'retry'
      && !window.confirm(`Đưa ${action.ids.length} công việc đã chọn vào hàng đợi thử lại?`)
    ) {
      return
    }

    setPendingAction(action.action)
    setActionMessage(null)
    setActionError(null)
    try {
      const response = await fetch('/api/admin/seo-discovery/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(boundedMessage(
          isRecord(payload) ? payload.error : null,
          'Không thể hoàn tất thao tác',
        ))
      }

      if (action.action === 'retry') {
        const retriedCount = isRecord(payload) && typeof payload.retriedCount === 'number'
          ? payload.retriedCount
          : 0
        setActionMessage(`Đã đưa ${retriedCount} công việc vào hàng đợi thử lại.`)
        setSelected(new Set())
      } else if (action.action === 'sync_sitemap') {
        setActionMessage('Đã đồng bộ các URL từ sitemap vào hàng đợi.')
      } else if (action.action === 'test_connection') {
        const recoveredCount = isRecord(payload) && typeof payload.recoveredCount === 'number'
          ? payload.recoveredCount
          : 0
        setActionMessage(`Đã kiểm tra kết nối. Khôi phục ${recoveredCount} công việc cần cấu hình.`)
      } else {
        setActionMessage('Đã gửi sitemap chuẩn cho Google Search Console.')
      }
      await loadData()
    } catch (actionFailure) {
      setActionError(boundedMessage(
        actionFailure instanceof Error ? actionFailure.message : null,
        'Không thể hoàn tất thao tác',
      ))
    } finally {
      setPendingAction(null)
    }
  }, [loadData, pendingAction])

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setFilters({
      status: draftFilters.status,
      source: draftFilters.source,
      search: draftFilters.search.trim().slice(0, 128),
    })
  }

  if (loading && overview === null) return <LoadingPanel />

  if (error && overview === null) {
    return (
      <AdminCard className="border-red-200 bg-red-50/70 p-6 text-center">
        <div role="alert" className="font-semibold text-red-800">{error}</div>
        <button
          type="button"
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          onClick={() => void loadData()}
        >
          <RefreshCw size={17} aria-hidden />
          Tải lại dữ liệu
        </button>
      </AdminCard>
    )
  }

  if (!overview) return null

  const selectedCount = selected.size
  const actionPending = pendingAction !== null

  return (
    <div className="space-y-5" aria-busy={loading || actionPending}>
      <AdminCard className="border-sky-200 bg-sky-50/70 p-4">
        <div className="flex gap-3 text-sm leading-6 text-sky-900">
          <ShieldCheck className="mt-0.5 flex-shrink-0 text-sky-700" size={21} aria-hidden />
          <p>
            <strong>Minh bạch trạng thái:</strong> Google quyết định thời điểm và khả năng lập chỉ mục; hệ thống này chỉ hỗ trợ khám phá và theo dõi.
          </p>
        </div>
      </AdminCard>

      <ConnectionPanel connection={overview.connection} sitemap={overview.sitemap} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Đang chờ" value={overview.summary.pending + overview.summary.retrying} hint="Kiểm tra điều kiện, chờ inspection hoặc thử lại." icon={Waypoints} tone="kraft" />
        <SummaryCard label="Đã lập chỉ mục" value={overview.summary.indexed} hint="Google báo verdict PASS ở lần kiểm tra gần nhất." icon={CheckCircle2} tone="green" />
        <SummaryCard label="Chưa lập chỉ mục" value={overview.summary.notIndexed} hint="Trạng thái hợp lệ, chưa phải lỗi hệ thống." icon={FileSearch} tone="amber" />
        <SummaryCard label="Lỗi / cấu hình" value={overview.summary.errors + overview.summary.configurationRequired} hint="Cần xử lý lỗi ổn định hoặc cấu hình Google." icon={XCircle} tone="red" />
      </div>

      <AdminCard className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form onSubmit={applyFilters} className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(240px,1.6fr)_auto]">
            <div>
              <label htmlFor="seo-status-filter" className="mb-1.5 block text-xs font-bold text-theme-secondary">Trạng thái công việc</label>
              <select
                id="seo-status-filter"
                value={draftFilters.status}
                onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-theme-border bg-theme-card px-3 text-sm text-theme-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="seo-source-filter" className="mb-1.5 block text-xs font-bold text-theme-secondary">Nguồn nội dung</label>
              <select
                id="seo-source-filter"
                value={draftFilters.source}
                onChange={(event) => setDraftFilters((current) => ({ ...current, source: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-theme-border bg-theme-card px-3 text-sm text-theme-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <option value="">Tất cả nguồn</option>
                {Object.entries(SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="seo-search-filter" className="mb-1.5 block text-xs font-bold text-theme-secondary">Tìm URL hoặc nguồn</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" size={17} aria-hidden />
                <input
                  id="seo-search-filter"
                  type="search"
                  maxLength={128}
                  value={draftFilters.search}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                  className="min-h-11 w-full rounded-xl border border-theme-border bg-theme-card pl-10 pr-3 text-sm text-theme-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  placeholder="mushroomie.io.vn/tin-tuc/..."
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 motion-reduce:transition-none"
            >
              Áp dụng bộ lọc
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-card px-4 text-sm font-bold text-theme-secondary transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              disabled={actionPending}
              onClick={() => void performAction({ action: 'test_connection' })}
            >
              {pendingAction === 'test_connection' ? <Loader2 className="animate-spin motion-reduce:animate-none" size={17} aria-hidden /> : <ShieldCheck size={17} aria-hidden />}
              Kiểm tra kết nối
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-card px-4 text-sm font-bold text-theme-secondary transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              disabled={actionPending}
              onClick={() => void performAction({ action: 'sync_sitemap' })}
            >
              {pendingAction === 'sync_sitemap' ? <Loader2 className="animate-spin motion-reduce:animate-none" size={17} aria-hidden /> : <RefreshCw size={17} aria-hidden />}
              Đồng bộ sitemap
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              disabled={actionPending || overview.connection.state !== 'connected'}
              aria-describedby={overview.connection.state === 'connected' ? undefined : 'submit-sitemap-help'}
              onClick={() => void performAction({ action: 'submit_sitemap' })}
            >
              {pendingAction === 'submit_sitemap' ? <Loader2 className="animate-spin motion-reduce:animate-none" size={17} aria-hidden /> : <Send size={17} aria-hidden />}
              Gửi sitemap cho Google
            </button>
            {overview.connection.state !== 'connected' && (
              <span id="submit-sitemap-help" className="sr-only">Cần kết nối Search Console trước khi gửi sitemap.</span>
            )}
          </div>
        </div>
      </AdminCard>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}. Dữ liệu đang hiển thị có thể chưa phải trạng thái mới nhất.</span>
          <button
            type="button"
            className="inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 text-sm font-bold text-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            onClick={() => void loadData()}
          >
            <RefreshCw size={17} aria-hidden />
            Tải lại trạng thái
          </button>
        </div>
      )}

      {(actionMessage || actionError) && (
        <div
          role={actionError ? 'alert' : 'status'}
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold',
            actionError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {actionError ?? actionMessage}
        </div>
      )}

      <AdminCard className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-theme-border bg-theme-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-heading text-xl text-theme-primary">URL đang theo dõi</h2>
            <p className="mt-1 text-xs text-theme-secondary">{overview.pagination.total.toLocaleString('vi-VN')} kết quả theo bộ lọc hiện tại.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedCount === 0 || actionPending}
              onClick={() => void performAction({ action: 'retry', ids: [...selected] })}
            >
              {pendingAction === 'retry' ? <Loader2 className="animate-spin motion-reduce:animate-none" size={17} aria-hidden /> : <RefreshCw size={17} aria-hidden />}
              Thử lại {selectedCount} công việc
            </button>
            <a
              href={SEARCH_CONSOLE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-card px-4 text-sm font-bold text-theme-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              aria-label="Mở Google Search Console trong tab mới"
            >
              Search Console
              <ExternalLink size={16} aria-hidden />
            </a>
          </div>
        </div>

        {overview.jobs.length === 0 ? (
          <AdminEmptyState
            emoji="🔎"
            title="Chưa có URL trong hàng đợi"
            hint="Đăng một nội dung đủ điều kiện hoặc dùng Đồng bộ sitemap để phát hiện trang công khai."
          />
        ) : (
          <>
            <DesktopJobTable jobs={overview.jobs} selected={selected} onSelection={updateSelection} />
            <MobileJobCards jobs={overview.jobs} selected={selected} onSelection={updateSelection} />
          </>
        )}
      </AdminCard>

      <nav aria-label="Phân trang công việc lập chỉ mục" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm font-semibold text-theme-secondary">Trang {overview.pagination.page} / {overview.pagination.totalPages}</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Trang trước"
            className="min-h-11 rounded-xl border border-theme-border bg-theme-card px-4 text-sm font-bold text-theme-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trước
          </button>
          <span className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-bold text-white" aria-live="polite">
            Trang {overview.pagination.page} / {overview.pagination.totalPages}
          </span>
          <button
            type="button"
            aria-label="Trang sau"
            className="min-h-11 rounded-xl border border-theme-border bg-theme-card px-4 text-sm font-bold text-theme-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={page >= overview.pagination.totalPages || loading}
            onClick={() => setPage((current) => Math.min(overview.pagination.totalPages, current + 1))}
          >
            Sau
          </button>
        </div>
      </nav>
    </div>
  )
}

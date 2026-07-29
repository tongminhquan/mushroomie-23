'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { ArrowLeft, BarChart3, Music, Music2, RotateCcw, Ticket, Trophy } from 'lucide-react'
import GameErrorBoundary from '@/components/minigame/GameErrorBoundary'
import { useGameAudio } from '@/components/minigame/useGameAudio'
import {
  GAME_DEFINITIONS,
  type GameKey,
  type GameOverPayload,
  type LeaderboardPeriod,
} from '@/lib/game-config'

const gameLoading = () => (
  <div className="flex min-h-[420px] w-full items-center justify-center rounded-2xl border border-theme-border bg-theme-subtle text-sm font-bold text-theme-secondary">
    Đang tải game...
  </div>
)

const TetrisGame = dynamic(() => import('@/components/minigame/TetrisGame'), {
  ssr: false,
  loading: gameLoading,
})

const BlockBlastGame = dynamic(() => import('@/components/minigame/BlockBlastGame'), {
  ssr: false,
  loading: gameLoading,
})

interface LeaderboardItem {
  rank: number
  userId: number
  name: string
  score: number
  lines: number
  combo: number
  level: number
  durationSec: number
  createdAt: string
  isCurrentUser?: boolean
}

interface SubmitState {
  status: 'idle' | 'saving' | 'saved' | 'guest' | 'error'
  message?: string
  voucher?: { code: string; discount_percent: number } | null
}

export default function GamePageClient({ game }: { game: GameKey }) {
  const config = GAME_DEFINITIONS[game]
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [phase, setPhase] = useState<'ready' | 'playing' | 'result'>('ready')
  const [starting, setStarting] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [token, setToken] = useState('')
  const [runId, setRunId] = useState(0)
  const [lastResult, setLastResult] = useState<GameOverPayload | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const [period, setPeriod] = useState<LeaderboardPeriod>('today')
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [leaderboardError, setLeaderboardError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const resultHandledRef = useRef(false)
  const startingRef = useRef(false)

  useGameAudio({
    game,
    active: phase === 'playing',
    enabled: soundEnabled,
    volume: 0.12,
  })

  useEffect(() => {
    const stored = window.localStorage.getItem('mushroomie_game_sound_enabled')
    if (stored === '0') setSoundEnabled(false)
  }, [])

  const persistSound = (enabled: boolean) => {
    setSoundEnabled(enabled)
    window.localStorage.setItem('mushroomie_game_sound_enabled', enabled ? '1' : '0')
  }

  const loadLeaderboard = useCallback(async (signal?: AbortSignal) => {
    setLeaderboardLoading(true)
    setLeaderboardError('')
    try {
      const response = await fetch(`/api/game/leaderboard?game=${game}&period=${period}`, { signal })
      if (!response.ok) throw new Error('Không tải được bảng xếp hạng')
      const data = await response.json()
      setLeaderboard(data.items ?? [])
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setLeaderboardError(error.message)
      }
    } finally {
      if (!signal?.aborted) setLeaderboardLoading(false)
    }
  }, [game, period])

  useEffect(() => {
    const controller = new AbortController()
    void loadLeaderboard(controller.signal)
    const timer = window.setInterval(() => void loadLeaderboard(), 8000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [loadLeaderboard, refreshTick])

  const startGame = useCallback(async () => {
    if (startingRef.current) return
    startingRef.current = true
    setStarting(true)
    setSubmitState({ status: 'idle' })
    setLastResult(null)

    try {
      let nextToken = ''
      if (userId) {
        const response = await fetch('/api/game/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game }),
        })
        const data = await response.json()
        if (response.ok && data.token) nextToken = data.token
        else setSubmitState({ status: 'error', message: 'Không tạo được phiên lưu điểm. Bạn vẫn có thể chơi.' })
      }

      resultHandledRef.current = false
      setToken(nextToken)
      setRunId((value) => value + 1)
      setPhase('playing')
    } catch {
      resultHandledRef.current = false
      setToken('')
      setSubmitState({ status: 'error', message: 'Không tạo được phiên lưu điểm. Bạn vẫn có thể chơi.' })
      setRunId((value) => value + 1)
      setPhase('playing')
    } finally {
      startingRef.current = false
      setStarting(false)
    }
  }, [game, userId])

  const submitScore = useCallback(async (result: GameOverPayload) => {
    if (!userId) {
      setSubmitState({ status: 'guest', message: 'Đăng nhập để lưu điểm và nhận voucher.' })
      return
    }

    if (!token) {
      setSubmitState({ status: 'error', message: 'Phiên lưu điểm không hợp lệ. Hãy chơi lại một lượt mới.' })
      return
    }

    setSubmitState({ status: 'saving', message: 'Đang lưu điểm...' })
    try {
      const response = await fetch('/api/game/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game,
          score: result.score,
          lines: result.lines ?? 0,
          combo: result.combo ?? 0,
          level: result.level ?? 1,
          durationSec: result.durationSec ?? 0,
          token,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Không lưu được điểm')
      }

      setSubmitState({
        status: 'saved',
        message: 'Đã lưu điểm và cập nhật bảng xếp hạng.',
        voucher: data.voucher ?? null,
      })
      setRefreshTick((value) => value + 1)
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Không lưu được điểm',
      })
    } finally {
      setToken('')
    }
  }, [game, token, userId])

  const handleGameOver = useCallback((payload: GameOverPayload | number) => {
    if (resultHandledRef.current) return
    resultHandledRef.current = true

    const result = typeof payload === 'number'
      ? { game, score: payload, durationSec: 0 }
      : { ...payload, game }

    setLastResult(result)
    setPhase('result')
    void submitScore(result)
  }, [game, submitScore])

  const GameComponent = useMemo(() => (game === 'tetris' ? TetrisGame : BlockBlastGame), [game])

  return (
    <div className="min-h-[100dvh] bg-theme-page text-theme-primary">
      <section className="border-b border-theme-border bg-theme-section">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 md:px-6 md:py-9">
          <Link href="/mini-game" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-bold text-theme-secondary hover:text-primary">
            <ArrowLeft size={16} />
            Về trang chọn game
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#ff6b6b]">
                {game === 'tetris' ? 'Game chính' : 'Thử thách thêm'}
              </p>
              <h1 className="mt-2 font-body text-4xl font-extrabold leading-tight tracking-normal md:text-5xl">
                {config.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-theme-secondary md:text-base">
                {config.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => persistSound(!soundEnabled)}
              className="theme-transition inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-theme-border bg-theme-card px-4 text-sm font-extrabold text-theme-secondary hover:bg-theme-subtle"
            >
              {soundEnabled ? <Music2 size={17} /> : <Music size={17} />}
              {soundEnabled ? 'Âm thanh bật' : 'Âm thanh tắt'}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <section className="rounded-2xl border border-theme-border bg-theme-card p-3 shadow-card sm:p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-theme-muted">
                  {config.controlMode}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-normal text-theme-primary md:text-3xl">
                  {config.title}
                </h2>
              </div>
            </div>
            <GameErrorBoundary resetKey={`${game}-${runId}`}>
              <GameComponent
                key={`${game}-${runId}`}
                ready={phase === 'ready'}
                starting={starting}
                signedIn={!!userId}
                onStart={startGame}
                onGameOver={handleGameOver}
                onRestart={startGame}
                restartDisabled={submitState.status === 'saving'}
                soundEnabled={soundEnabled}
                onSoundToggle={persistSound}
              />
            </GameErrorBoundary>
          </section>
        </div>

        <aside className="space-y-5">
          <ResultPanel
            result={lastResult}
            state={submitState}
            onRestart={startGame}
            restartDisabled={submitState.status === 'saving'}
            signedIn={!!userId}
          />
          <VoucherTierPanel game={game} />
          <LeaderboardPanel
            items={leaderboard}
            period={period}
            loading={leaderboardLoading}
            error={leaderboardError}
            onPeriodChange={setPeriod}
          />
        </aside>
      </section>
    </div>
  )
}

function VoucherTierPanel({ game }: { game: GameKey }) {
  const config = GAME_DEFINITIONS[game]

  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5" id="game-voucher">
      <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-theme-muted">
        <Ticket size={15} />
        Mốc voucher
      </div>
      <div className="space-y-3">
        {config.voucherTiers.map((tier) => (
          <div key={tier.percent} className="flex items-center justify-between rounded-xl border border-theme-border bg-theme-subtle px-4 py-3">
            <span className="text-sm font-bold text-theme-secondary">{tier.score.toLocaleString('vi-VN')} điểm</span>
            <span className="rounded-full bg-[#e41d1d]/15 px-3 py-1 text-sm font-black text-[#ff6b6b]">
              Giảm {tier.percent}%
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ResultPanel({
  result,
  state,
  onRestart,
  restartDisabled,
  signedIn,
}: {
  result: GameOverPayload | null
  state: SubmitState
  onRestart: () => void
  restartDisabled: boolean
  signedIn: boolean
}) {
  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5">
      <div className="mb-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-theme-muted">
        <Trophy size={15} />
        Kết quả
      </div>
      {result ? (
        <div>
          <div className="text-4xl font-black text-[var(--game-score)]">{result.score.toLocaleString('vi-VN')}</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-theme-secondary">
            <div className="rounded-xl bg-theme-subtle p-2">Hàng<br />{result.lines ?? 0}</div>
            <div className="rounded-xl bg-theme-subtle p-2">Combo<br />{result.combo ?? 0}</div>
            <div className="rounded-xl bg-theme-subtle p-2">Giây<br />{result.durationSec ?? 0}</div>
          </div>
          {state.message && (
            <div className={`mt-4 rounded-xl border px-3 py-2 text-sm font-semibold ${
              state.status === 'error'
                ? 'border-red-400/20 bg-red-400/10 text-red-100'
                : 'border-theme-border bg-theme-subtle text-theme-secondary'
            }`}>
              {state.message}
            </div>
          )}
          {state.voucher && (
            <div className="mt-3 rounded-xl border border-[#e41d1d]/25 bg-[#e41d1d]/10 px-3 py-2">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff8a8a]">Voucher mới</div>
              <div className="mt-1 font-mono text-sm font-black text-theme-primary">{state.voucher.code}</div>
              <Link href="/thanh-toan" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#e41d1d] text-sm font-extrabold text-white">
                Dùng voucher ngay
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={onRestart}
            disabled={restartDisabled}
            className="theme-transition mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-subtle text-sm font-extrabold text-theme-secondary hover:bg-theme-elevated disabled:cursor-wait disabled:opacity-50"
          >
            <RotateCcw size={16} />
            {restartDisabled ? 'Đang lưu điểm...' : 'Chơi lại'}
          </button>
        </div>
      ) : (
        <p className="text-sm font-medium leading-6 text-theme-secondary">
          {signedIn ? 'Kết quả lượt chơi sẽ hiển thị tại đây.' : 'Bạn có thể chơi khách, nhưng cần đăng nhập để lưu điểm.'}
        </p>
      )}
    </section>
  )
}

function LeaderboardPanel({
  items,
  period,
  loading,
  error,
  onPeriodChange,
}: {
  items: LeaderboardItem[]
  period: LeaderboardPeriod
  loading: boolean
  error: string
  onPeriodChange: (period: LeaderboardPeriod) => void
}) {
  const labels: Record<LeaderboardPeriod, string> = {
    today: 'Hôm nay',
    week: 'Tuần này',
    all: 'Tất cả',
  }

  return (
    <section id="game-leaderboard" className="rounded-2xl border border-theme-border bg-theme-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-theme-muted">
          <BarChart3 size={15} />
          Bảng xếp hạng
        </div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        {(['today', 'week', 'all'] as LeaderboardPeriod[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPeriodChange(value)}
            className={`rounded-lg px-2 py-2 text-xs font-extrabold ${
              period === value
                ? 'bg-[#e41d1d] text-white'
                : 'border border-theme-border bg-theme-subtle text-theme-secondary hover:bg-theme-elevated'
            }`}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-xl bg-theme-subtle" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-100">
          {error}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.slice(0, 10).map((item) => (
            <div
              key={`${item.rank}-${item.userId}-${item.score}`}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                item.isCurrentUser
                  ? 'border-[#e41d1d]/35 bg-[#e41d1d]/12'
                  : 'border-theme-border bg-theme-subtle'
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-theme-primary">#{item.rank} {item.name}</div>
                <div className="text-xs font-semibold text-theme-muted">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
              <div className="text-right text-lg font-black text-[var(--game-score)]">{item.score.toLocaleString('vi-VN')}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-theme-border bg-theme-subtle px-3 py-4 text-sm font-medium text-theme-muted">
          Chưa có điểm cho bộ lọc này.
        </p>
      )}
    </section>
  )
}

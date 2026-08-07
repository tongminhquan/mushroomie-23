'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Ticket, Trophy } from 'lucide-react'
import { GAME_DEFINITIONS, GAME_KEYS, type GameKey } from '@/lib/game-config'

interface PlayerSummary {
  authenticated: boolean
  points?: number
  vouchers?: Array<{ id: number; code: string; discount_percent: number; status: string }>
  games?: Record<GameKey, { bestScore: number; lastPlayedAt: string | null }>
}

interface LeaderboardPreviewItem {
  rank: number
  name: string
  score: number
}

export default function MiniGameHub() {
  const [summary, setSummary] = useState<PlayerSummary | null>(null)
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardPreviewItem[]>>({})

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const [summaryRes, ...leaderboardResponses] = await Promise.all([
          fetch('/api/minigame/player-summary', { signal: controller.signal }),
          ...GAME_KEYS.map((game) =>
            fetch(`/api/game/leaderboard?game=${game}&period=today`, { signal: controller.signal }),
          ),
        ])

        if (!controller.signal.aborted && summaryRes.ok) {
          setSummary(await summaryRes.json())
        }

        const nextLeaderboards: Record<string, LeaderboardPreviewItem[]> = {}
        for (let i = 0; i < leaderboardResponses.length; i += 1) {
          const response = leaderboardResponses[i]
          if (response.ok) {
            const data = await response.json()
            nextLeaderboards[GAME_KEYS[i]] = data.items?.slice(0, 3) ?? []
          }
        }
        if (!controller.signal.aborted) setLeaderboards(nextLeaderboards)
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') console.error(error)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-8 md:grid-cols-2 md:px-6">
        {GAME_KEYS.map((game) => {
          const config = GAME_DEFINITIONS[game]
          const bestScore = summary?.games?.[game]?.bestScore ?? 0
          const preview = leaderboards[game] ?? []

          return (
            <article
              key={game}
              className="theme-transition flex min-h-[390px] flex-col rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-theme-muted">
                    {config.controlMode}
                  </p>
                  <h2 className="mt-2 font-body text-3xl font-extrabold tracking-normal text-theme-primary">
                    {config.title}
                  </h2>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e41d1d]/15 text-[#ff6b6b]">
                  <Sparkles size={20} />
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-6 text-theme-secondary">{config.startHint}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-theme-border bg-theme-subtle p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">
                    <Trophy size={14} />
                    Điểm cao của bạn
                  </div>
                  <div className="mt-3 text-3xl font-black text-theme-primary">{bestScore.toLocaleString('vi-VN')}</div>
                </div>
                <div className="rounded-2xl border border-theme-border bg-theme-subtle p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-theme-muted">
                    <Ticket size={14} />
                    Voucher
                  </div>
                  <div className="mt-3 text-3xl font-black text-theme-primary">
                    {config.voucherTiers.at(-1)?.percent ?? 0}%
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-theme-border bg-theme-subtle p-4">
                <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-theme-muted">
                  Top hôm nay
                </div>
                <div className="space-y-2">
                  {preview.length > 0 ? preview.map((item) => (
                    <div key={`${game}-${item.rank}-${item.name}`} className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-theme-secondary">#{item.rank} {item.name}</span>
                      <span className="font-black text-[#00e5ff]">{item.score.toLocaleString('vi-VN')}</span>
                    </div>
                  )) : (
                    <p className="text-sm font-medium text-theme-muted">Chưa có điểm trong hôm nay.</p>
                  )}
                </div>
              </div>

              <Link
                href={config.route}
                className="mt-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#e41d1d] px-5 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(228,29,29,0.28)] transition hover:bg-[#c91515]"
              >
                Chơi ngay
                <ArrowRight size={17} />
              </Link>
            </article>
          )
        })}
      </section>

      {summary?.vouchers && summary.vouchers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12 md:px-6">
          <div className="rounded-2xl border border-theme-border bg-theme-card p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-theme-muted">
              <Ticket size={16} />
              Voucher đang có
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {summary.vouchers.slice(0, 6).map((voucher) => (
                <div key={voucher.id} className="rounded-xl border border-theme-border bg-theme-subtle p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-theme-muted">
                    Giảm {voucher.discount_percent}%
                  </div>
                  <div className="mt-2 font-mono text-sm font-black text-[#00e5ff]">{voucher.code}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

import { Play } from 'lucide-react'
import { GAME_DEFINITIONS, type GameKey } from '@/lib/game-config'

export interface GameStartStateProps {
  ready: boolean
  starting: boolean
  signedIn: boolean
  onStart: () => void
}

interface GameReadyOverlayProps {
  game: GameKey
  starting: boolean
  signedIn: boolean
  onStart: () => void
}

export default function GameReadyOverlay({
  game,
  starting,
  signedIn,
  onStart,
}: GameReadyOverlayProps) {
  const config = GAME_DEFINITIONS[game]
  const titleId = `${game}-ready-title`

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      data-game-ready-overlay={game}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto rounded-2xl bg-[#070711]/92 p-4 py-6 backdrop-blur-md sm:p-6"
    >
      <div className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#11111f]/95 p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,.55)] sm:p-7">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#ff6b6b]">
          Sẵn sàng chơi
        </p>
        <h3 id={titleId} className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
          {config.title}
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-white/72">
          {config.startHint}
        </p>
        <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
          {config.instructions.slice(0, 4).map((instruction) => (
            <div
              key={instruction}
              className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-semibold leading-5 text-white/68"
            >
              {instruction}
            </div>
          ))}
        </div>
        {!signedIn && (
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-semibold text-amber-100">
            Đăng nhập để lưu điểm và nhận voucher.
          </p>
        )}
        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e41d1d] px-5 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(228,29,29,.32)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#c91515] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60 disabled:transform-none"
        >
          <Play size={18} aria-hidden="true" />
          {starting ? 'Đang chuẩn bị...' : 'Bắt đầu trò chơi'}
        </button>
      </div>
    </section>
  )
}

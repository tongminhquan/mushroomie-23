import Link from 'next/link'
import { ArrowRight, Gamepad2, Gift } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'

const games = [
  { emoji: '🧩', name: 'Tetris Mushroomie', desc: 'Xếp khối nấm — ghi điểm cao', href: '/mini-game' },
  { emoji: '🟦', name: 'Block Blast 8×8', desc: 'Phá khối — combo càng lớn càng vui', href: '/mini-game' },
]

const milestones = [
  { points: '5.000đ', reward: '10K', desc: 'giảm trực tiếp' },
  { points: '10.000đ', reward: '30K', desc: 'giảm trực tiếp' },
]

export default function HomeMiniGameCTA() {
  return (
    <section className="bg-theme-page py-16 text-theme-primary md:py-24">
      <BrandContainer>
        <div className="overflow-hidden rounded-[28px] border-[1.5px] border-theme-border bg-theme-card shadow-card">
          <div className="grid gap-0 md:grid-cols-2">
            {/* Left — info */}
            <div className="p-8 md:p-10">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-primary">🎮 Chơi & Nhận quà</p>
              <h2 className="mb-4 font-heading text-2xl leading-tight text-theme-primary md:text-3xl">
                Chơi mini game cùng Mushroomie
              </h2>
              <p className="mb-6 text-sm leading-7 text-theme-secondary">
                Ghi điểm đạt mốc để đổi voucher xinh — áp dụng ngay khi thanh toán. Càng chơi càng nhiều ưu đãi!
              </p>
              <div className="space-y-3">
                {games.map((game) => (
                  <Link
                    key={game.name}
                    href={game.href}
                    className="theme-transition flex items-center gap-3 rounded-2xl border-[1.5px] border-theme-border bg-theme-subtle px-4 py-3 hover:border-primary hover:shadow-card"
                  >
                    <span className="text-2xl">{game.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-extrabold text-theme-primary">{game.name}</p>
                      <p className="text-xs text-theme-muted">{game.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-neutral-400" />
                  </Link>
                ))}
              </div>
              <Link
                href="/mini-game"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(228,29,29,0.25)] transition hover:bg-primary-dark"
              >
                <Gamepad2 size={16} /> Chơi ngay
              </Link>
            </div>

            {/* Right — milestones */}
            <div
              className="flex flex-col justify-center p-8 md:p-10"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #ff6b6b 100%)' }}
            >
              <div className="mb-6 flex items-center gap-2">
                <Gift size={20} className="text-white/80" />
                <p className="text-sm font-extrabold uppercase tracking-wider text-white/80">Mốc đổi voucher</p>
              </div>
              <div className="space-y-4">
                {milestones.map((m) => (
                  <div key={m.reward} className="flex items-center justify-between rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-sm">
                    <div>
                      <p className="text-xs font-bold text-white/70">Đạt {m.points}</p>
                      <p className="text-xs text-white/60">→ nhận ngay</p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-3xl text-white">{m.reward}</p>
                      <p className="text-xs text-white/70">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-white/60">Điểm tích lũy theo mỗi ván chơi. Voucher dùng được trong 30 ngày.</p>
            </div>
          </div>
        </div>
      </BrandContainer>
    </section>
  )
}

import { Gamepad2 } from 'lucide-react'
import MiniGameLoginNotice from '@/components/minigame/MiniGameLoginNotice'

export default function MiniGameHero() {
  return (
    <section className="min-h-[480px] border-b border-theme-border bg-theme-section md:min-h-[360px]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:px-6 md:py-16">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#e41d1d]/30 bg-[#e41d1d]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#ff6b6b]">
          <Gamepad2 size={15} />
          Mini Game Mushroomie
        </div>
        <div className="max-w-3xl">
          <h1 className="font-body text-4xl font-extrabold leading-tight tracking-normal md:text-6xl">
            Chọn game, ghi điểm và nhận voucher
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-theme-secondary md:text-lg">
            Mỗi game có màn hình bắt đầu riêng, bảng xếp hạng riêng và voucher tính theo điểm của một lượt chơi.
          </p>
        </div>
        <div data-testid="mini-game-login-slot" className="min-h-[66px]">
          <MiniGameLoginNotice />
        </div>
      </div>
    </section>
  )
}

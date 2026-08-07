import type { Metadata } from 'next'
import MiniGameHero from '@/components/minigame/MiniGameHero'
import MiniGameHub from '@/components/minigame/MiniGameHub'

export const metadata: Metadata = {
  title: 'Mini Game Mushroomie',
  description: 'Chon Tetris Mushroomie hoac Block Blast 8x8, ghi diem va nhan voucher.',
}

export default function MiniGamePage() {
  return (
    <div className="min-h-[100dvh] bg-theme-page text-theme-primary">
      <MiniGameHero />
      <MiniGameHub />
    </div>
  )
}

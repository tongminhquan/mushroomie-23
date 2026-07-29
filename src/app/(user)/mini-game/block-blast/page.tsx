import type { Metadata } from 'next'
import GamePageClient from '@/components/minigame/GamePageClient'

export const metadata: Metadata = {
  title: 'Block Blast 8x8 | Mini Game Mushroomie',
  description: 'Keo tha khoi vao bang 8x8, tao combo va ghi diem de nhan voucher.',
}

export default function BlockBlastMiniGamePage() {
  return (
    <div className="mini-game-theme-scope">
      <GamePageClient game="block-blast" />
    </div>
  )
}

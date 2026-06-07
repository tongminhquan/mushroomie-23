import type { Metadata } from 'next'
import GamePageClient from '@/components/minigame/GamePageClient'

export const metadata: Metadata = {
  title: 'Tetris Mushroomie | Mini Game',
  description: 'Xep khoi, xoa hang va ghi diem de nhan voucher Mushroomie.',
}

export default function TetrisMiniGamePage() {
  return <GamePageClient game="tetris" />
}

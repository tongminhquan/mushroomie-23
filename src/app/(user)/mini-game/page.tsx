import type { Metadata } from 'next'
import MiniGameHub from '@/components/minigame/MiniGameHub'

export const metadata: Metadata = {
  title: 'Mini Game Mushroomie',
  description: 'Chon Tetris Mushroomie hoac Block Blast 8x8, ghi diem va nhan voucher.',
}

export default function MiniGamePage() {
  return <MiniGameHub />
}

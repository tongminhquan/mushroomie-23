export const GAME_KEYS = ['tetris', 'block-blast'] as const

export type GameKey = (typeof GAME_KEYS)[number]
export type LeaderboardPeriod = 'today' | 'week' | 'all'

export interface GameDefinition {
  key: GameKey
  title: string
  shortTitle: string
  description: string
  route: string
  controlMode: string
  startHint: string
  instructions: string[]
  voucherTiers: Array<{ score: number; percent: number }>
  accent: string
}

export interface GameOverPayload {
  game: GameKey
  score: number
  lines?: number
  combo?: number
  level?: number
  durationSec?: number
}

export const GAME_DEFINITIONS: Record<GameKey, GameDefinition> = {
  tetris: {
    key: 'tetris',
    title: 'Tetris Mushroomie',
    shortTitle: 'Tetris',
    description: 'Xếp khối, xóa hàng và tích điểm đổi voucher.',
    route: '/mini-game/tetris',
    controlMode: 'Phím + cảm ứng',
    startHint: 'Xếp khối liên tục, giữ board thông thoáng và săn mốc điểm để nhận voucher.',
    instructions: [
      'Mũi tên trái/phải: Di chuyển',
      'Mũi tên lên: Xoay khối',
      'Mũi tên xuống: Rơi nhanh',
      'Space: Rơi liền',
      'P: Tạm dừng',
      'M: Bật/tắt âm thanh',
      'R: Chơi lại',
    ],
    voucherTiers: [
      { score: 500, percent: 5 },
      { score: 1500, percent: 10 },
      { score: 3000, percent: 15 },
    ],
    accent: '#e41d1d',
  },
  'block-blast': {
    key: 'block-blast',
    title: 'Block Blast 8x8',
    shortTitle: 'Block Blast',
    description: 'Kéo thả khối vào bảng 8x8, xóa hàng/cột để ghi điểm.',
    route: '/mini-game/block-blast',
    controlMode: 'Kéo thả khối',
    startHint: 'Đặt khối gọn, tạo combo và tránh làm đầy bảng quá sớm.',
    instructions: [
      'Kéo thả khối vào bảng.',
      'Xóa hàng hoặc cột để ghi điểm.',
      'Combo càng cao, điểm càng lớn.',
      'Hết chỗ đặt khối thì game over.',
    ],
    voucherTiers: [
      { score: 300, percent: 5 },
      { score: 1000, percent: 10 },
      { score: 2000, percent: 15 },
    ],
    accent: '#00e5ff',
  },
}

export function isGameKey(value: string | null | undefined): value is GameKey {
  return GAME_KEYS.includes(value as GameKey)
}

export function getVoucherPercentForScore(game: GameKey, score: number) {
  const tiers = GAME_DEFINITIONS[game].voucherTiers
  return [...tiers]
    .sort((a, b) => b.score - a.score)
    .find((tier) => score >= tier.score)?.percent ?? 0
}

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/minigame/MiniGameLoginNotice', () => ({
  default: () => <div data-testid="login-notice">Login notice</div>,
}))

import MiniGameHero from '@/components/minigame/MiniGameHero'

describe('MiniGameHero', () => {
  it('server renders stable above-the-fold content and reserves the login slot', () => {
    const { container } = render(<MiniGameHero />)

    expect(screen.getByText('Mini Game Mushroomie')).toBeInTheDocument()
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Chọn game, ghi điểm và nhận voucher',
    })).toBeInTheDocument()
    expect(screen.getByText(/Mỗi game có màn hình bắt đầu riêng/)).toBeInTheDocument()
    expect(screen.getByTestId('mini-game-login-slot')).toHaveClass('min-h-[66px]')
    expect(container.querySelector('section')).toHaveClass('min-h-[480px]', 'md:min-h-[360px]')
  })
})

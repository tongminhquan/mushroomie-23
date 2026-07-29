// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ThemeToggle from '@/components/theme/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light'
    document.documentElement.style.colorScheme = 'light'
    document.cookie = 'mushroomie_theme=light; Path=/'
  })

  it('switches the icon control to dark and persists the rolling cookie', () => {
    render(<ThemeToggle variant="icon" />)
    fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(document.cookie).toContain('mushroomie_theme=dark')
    expect(screen.getByRole('button', { name: 'Chuyển sang giao diện sáng' })).toBeInTheDocument()
  })

  it('supports explicit segmented selection', () => {
    render(<ThemeToggle variant="segmented" />)
    fireEvent.click(screen.getByRole('button', { name: 'Dùng giao diện tối' }))

    expect(screen.getByRole('button', { name: 'Dùng giao diện tối' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dùng giao diện sáng' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('synchronizes multiple mounted controls', () => {
    render(
      <>
        <ThemeToggle variant="icon" />
        <ThemeToggle variant="segmented" />
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' }))
    expect(screen.getByRole('button', { name: 'Dùng giao diện tối' })).toHaveAttribute('aria-pressed', 'true')
  })
})

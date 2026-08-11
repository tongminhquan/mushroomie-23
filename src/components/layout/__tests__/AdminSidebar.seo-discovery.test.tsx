// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
  useSession: mocks.useSession,
}))

vi.mock('@/components/theme/ThemeToggle', () => ({
  default: () => <button type="button">Đổi giao diện</button>,
}))

vi.mock('@/components/ui/BrandLogo', () => ({
  default: () => <span>Mushroomie</span>,
}))

import AdminSidebar from '@/components/layout/AdminSidebar'

describe('AdminSidebar SEO discovery visibility', () => {
  beforeEach(() => {
    mocks.useSession.mockReset()
  })

  it('hides the protected discovery monitor from viewer sessions', () => {
    mocks.useSession.mockReturnValue({
      data: { user: { role: 'viewer' } },
    })

    render(<AdminSidebar />)

    expect(screen.queryByRole('link', { name: 'Lập chỉ mục' })).not.toBeInTheDocument()
  })

  it.each(['admin', 'super_admin'])(
    'keeps the discovery monitor visible to %s sessions',
    (role) => {
      mocks.useSession.mockReturnValue({
        data: { user: { role } },
      })

      render(<AdminSidebar />)

      expect(screen.getByRole('link', { name: 'Lập chỉ mục' })).toHaveAttribute(
        'href',
        '/admin/seo/lap-chi-muc',
      )
    },
  )
})

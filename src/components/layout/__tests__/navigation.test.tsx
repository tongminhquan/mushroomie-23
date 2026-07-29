// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/store/cart'

const navigationMocks = vi.hoisted(() => ({ pathname: vi.fn(), session: vi.fn() }))
vi.mock('next/navigation', () => ({ usePathname: navigationMocks.pathname }))
vi.mock('next-auth/react', () => ({ useSession: navigationMocks.session }))

import Breadcrumb from '@/components/layout/Breadcrumb'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import ThemeToggle from '@/components/theme/ThemeToggle'

describe('navigation components', () => {
  beforeEach(() => {
    navigationMocks.pathname.mockReturnValue('/san-pham')
    navigationMocks.session.mockReturnValue({ data: null })
    useCartStore.setState({ items: [], isOpen: false })
  })

  it('links anonymous mobile users correctly and opens cart with quantity badge', () => {
    useCartStore.getState().addItem({ productId: 42, name: 'Vòng tay', price: 1, image: '/x.webp', quantity: 2 })
    render(<MobileBottomNav />)

    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/', '/san-pham', '/tai-khoan/dang-nhap'])
    expect(screen.getByText('2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('links an authenticated mobile user to account overview', () => {
    navigationMocks.session.mockReturnValue({ data: { user: { id: '7' } } })
    render(<MobileBottomNav />)
    expect(screen.getAllByRole('link').at(-1)).toHaveAttribute('href', '/tai-khoan')
  })

  it('renders breadcrumb navigation and escapes JSON-LD injection characters', () => {
    const { container } = render(<Breadcrumb items={[
      { label: 'Sản phẩm', href: '/san-pham' },
      { label: '</script><script>alert(1)</script>' },
    ]} />)

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sản phẩm' })).toHaveAttribute('href', '/san-pham')
    const jsonLd = container.querySelector('script[type="application/ld+json"]')!
    expect(jsonLd.textContent).not.toContain('</script>')
    expect(jsonLd.textContent).toContain('\\u003c')
  })

  it('exposes an accessible theme control', () => {
    document.documentElement.dataset.theme = 'light'
    render(<ThemeToggle variant="icon" />)
    expect(screen.getByRole('button', { name: 'Chuyển sang giao diện tối' })).toHaveClass('h-11', 'w-11')
  })
})

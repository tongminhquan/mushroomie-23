// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/store/cart'

vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    default: (props: Record<string, unknown>) => {
      const { fill, ...imageProps } = props
      void fill
      return React.createElement('img', { ...imageProps, alt: String(imageProps.alt ?? '') })
    },
  }
})

import CartDrawer from '@/components/cart/CartDrawer'

describe('CartDrawer', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false })
  })

  it('does not render when closed and shows an accessible empty dialog when opened', () => {
    const { rerender } = render(<CartDrawer />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    useCartStore.getState().openCart()
    rerender(<CartDrawer />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('link')).toHaveAttribute('href', '/san-pham')
  })

  it('shows item details, total, checkout link, and supports quantity/removal controls', () => {
    useCartStore.getState().addItem({
      productId: 42,
      name: 'Vòng tay nấm',
      price: 100_000,
      image: '/uploads/item.webp',
      quantity: 1,
      selectedOptions: { Màu: 'Đỏ' },
    })
    useCartStore.getState().openCart()
    render(<CartDrawer />)
    const dialog = screen.getByRole('dialog')

    expect(within(dialog).getByRole('img', { name: 'Vòng tay nấm' })).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Màu: Đỏ')
    expect(screen.getByRole('link', { name: /thanh toán/i })).toHaveAttribute('href', '/thanh-toan')

    const iconButtons = Array.from(dialog.querySelectorAll('button')).filter((button) => button.querySelector('svg'))
    fireEvent.click(iconButtons[2])
    expect(useCartStore.getState().items[0].quantity).toBe(2)
    fireEvent.click(iconButtons[3])
    expect(useCartStore.getState().items).toEqual([])
  })
})

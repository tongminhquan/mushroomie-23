// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/store/cart'
import { useVoucherStore } from '@/store/voucher'

const sessionMock = vi.hoisted(() => vi.fn())

vi.mock('next-auth/react', () => ({ useSession: sessionMock }))
vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    default: (props: Record<string, unknown>) => {
      const { fill, priority, unoptimized, ...imageProps } = props
      void fill
      void priority
      void unoptimized
      return React.createElement('img', { ...imageProps, alt: String(imageProps.alt ?? '') })
    },
  }
})

import ProductCard from '@/components/product/ProductCard'

const product = {
  id: 42,
  name: 'Vòng tay nấm',
  slug: 'vong-tay-nam',
  price: 125_000,
  sale_price: 100_000,
  featured_image: '/uploads/vong-tay.webp',
  stock: 5,
  category: { name: 'Vòng tay', slug: 'vong-tay' },
}

describe('ProductCard', () => {
  beforeEach(() => {
    sessionMock.mockReturnValue({ data: null })
    useCartStore.setState({ items: [], isOpen: false })
    useVoucherStore.setState({ vouchers: [], loading: false, loaded: true })
  })

  it('keeps the required 3:4 image ratio and links the image and title to product detail', () => {
    const { container } = render(<ProductCard product={product} />)
    const image = screen.getByRole('img', { name: 'Vòng tay nấm' })
    const frame = image.closest('a')

    expect(frame).toHaveClass('aspect-[3/4]')
    expect(frame).toHaveAttribute('href', '/san-pham/vong-tay-nam')
    expect(screen.getAllByRole('link').filter((link) => link.getAttribute('href') === '/san-pham/vong-tay-nam')).toHaveLength(2)
    expect(container).toHaveTextContent('Vòng tay')
    expect(screen.getByText(/100\.000/)).toBeInTheDocument()
    expect(screen.getByText(/125\.000/)).toHaveClass('line-through')
  })

  it('adds the sale-price item, shows feedback, and opens the cart after the delay', () => {
    vi.useFakeTimers()
    render(<ProductCard product={product} />)
    const button = screen.getByRole('button')

    fireEvent.click(button)
    expect(useCartStore.getState().items[0]).toMatchObject({ productId: 42, price: 100_000, quantity: 1 })
    expect(useCartStore.getState().isOpen).toBe(false)

    act(() => { vi.advanceTimersByTime(600) })
    expect(useCartStore.getState().isOpen).toBe(true)
  })

  it('disables cart action for an out-of-stock product', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />)
    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toBeDisabled()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('shows the best eligible wallet discount for a signed-in user', () => {
    sessionMock.mockReturnValue({ data: { user: { id: '7' } } })
    useVoucherStore.setState({
      loaded: true,
      loading: false,
      vouchers: [
        { status: 'AVAILABLE', voucher: { discountType: 'PERCENT', discountValue: 10, maxDiscount: null, minOrderValue: 0 } },
        { status: 'AVAILABLE', voucher: { discountType: 'FIXED', discountValue: 5_000, minOrderValue: 0 } },
      ],
    })

    render(<ProductCard product={product} />)
    expect(screen.getByText(/10%/)).toBeInTheDocument()
  })
})

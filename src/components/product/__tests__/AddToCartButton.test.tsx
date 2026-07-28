// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCartStore } from '@/store/cart'

const routerPush = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: routerPush }) }))

import AddToCartButton from '@/components/product/AddToCartButton'

const product = {
  id: 42,
  name: 'Vòng tay custom',
  price: 125_000,
  sale_price: 100_000,
  featured_image: '/uploads/custom.webp',
  is_customizable: true,
  stock: 2,
  options: [{ id: 1, option_name: 'Màu', option_type: 'select', option_values: '["Đỏ","Vàng"]' }],
}

describe('AddToCartButton', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isOpen: false })
  })

  it('captures selected option, custom note, bounded quantity, and sale price', async () => {
    const user = userEvent.setup()
    const { container } = render(<AddToCartButton product={product} />)

    await user.click(screen.getByRole('button', { name: 'Đỏ' }))
    await user.type(screen.getByRole('textbox'), 'Khắc tên An')
    const buttons = Array.from(container.querySelectorAll('button'))
    const increaseButton = buttons.find((button) => button.querySelector('.lucide-plus'))!
    await user.click(increaseButton)
    await user.click(increaseButton)
    const actionButtons = Array.from(container.querySelectorAll('.grid.grid-cols-1 button'))
    await user.click(actionButtons[0])

    expect(useCartStore.getState().items[0]).toMatchObject({
      productId: 42,
      price: 100_000,
      quantity: 2,
      selectedOptions: { Màu: 'Đỏ' },
      customNote: 'Khắc tên An',
    })
  })

  it('buy now adds the configured item and navigates to checkout', () => {
    const { container } = render(<AddToCartButton product={product} />)
    const actionButtons = Array.from(container.querySelectorAll('.grid.grid-cols-1 button'))

    fireEvent.click(actionButtons[actionButtons.length - 1])
    expect(useCartStore.getState().items).toHaveLength(1)
    expect(routerPush).toHaveBeenCalledWith('/thanh-toan')
  })

  it('does not expose purchase actions that can mutate cart when out of stock', () => {
    const { container } = render(<AddToCartButton product={{ ...product, stock: 0 }} />)
    const actionButtons = Array.from(container.querySelectorAll('.grid.grid-cols-1 button'))

    expect(actionButtons).toHaveLength(1)
    expect(actionButtons[0]).toBeDisabled()
    fireEvent.click(actionButtons[0])
    expect(useCartStore.getState().items).toEqual([])
    expect(routerPush).not.toHaveBeenCalled()
  })
})

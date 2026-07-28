// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore, type CartItem } from '@/store/cart'

const baseItem: Omit<CartItem, 'id'> = {
  productId: 42,
  name: 'Vòng tay nấm',
  price: 125_000,
  image: '/uploads/vong-tay.webp',
  quantity: 1,
  selectedOptions: { color: 'đỏ' },
}

describe('cart store', () => {
  beforeEach(() => {
    localStorage.clear()
    useCartStore.setState({ items: [], isOpen: false })
  })

  it('adds new variants and merges quantities for the same product options', () => {
    useCartStore.getState().addItem(baseItem)
    useCartStore.getState().addItem({ ...baseItem, quantity: 2 })
    useCartStore.getState().addItem({ ...baseItem, selectedOptions: { color: 'vàng' } })

    const state = useCartStore.getState()
    expect(state.items).toHaveLength(2)
    expect(state.items[0].quantity).toBe(3)
    expect(state.getTotalItems()).toBe(4)
    expect(state.getTotalPrice()).toBe(500_000)
  })

  it('updates note and quantity while enforcing a minimum quantity of one', () => {
    useCartStore.getState().addItem(baseItem)
    const id = useCartStore.getState().items[0].id

    useCartStore.getState().updateQuantity(id, 0)
    useCartStore.getState().updateNote(id, 'Khắc tên An')

    expect(useCartStore.getState().items[0]).toMatchObject({ quantity: 1, customNote: 'Khắc tên An' })
  })

  it('removes and clears items without changing cart visibility unexpectedly', () => {
    useCartStore.getState().addItem(baseItem)
    const id = useCartStore.getState().items[0].id
    useCartStore.getState().openCart()
    useCartStore.getState().removeItem(id)

    expect(useCartStore.getState()).toMatchObject({ items: [], isOpen: true })
    useCartStore.getState().addItem(baseItem)
    useCartStore.getState().clearCart()
    expect(useCartStore.getState().items).toEqual([])
  })

  it('opens, closes, and toggles the cart drawer', () => {
    useCartStore.getState().openCart()
    expect(useCartStore.getState().isOpen).toBe(true)
    useCartStore.getState().toggleCart()
    expect(useCartStore.getState().isOpen).toBe(false)
    useCartStore.getState().closeCart()
    expect(useCartStore.getState().isOpen).toBe(false)
  })
})

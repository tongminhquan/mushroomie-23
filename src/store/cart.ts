import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  productId: number
  name: string
  price: number
  image: string
  quantity: number
  selectedOptions?: Record<string, string>
  customNote?: string
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  /** Gói quà tính một lần cho cả đơn nên là state cấp giỏ hàng, không nằm trong từng item. */
  giftWrap: boolean
  /** Nội dung thư tay (miễn phí, đi kèm gói quà). */
  giftMessage: string
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateNote: (id: string, note: string) => void
  setGiftWrap: (giftWrap: boolean) => void
  setGiftMessage: (message: string) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      giftWrap: false,
      giftMessage: '',

      addItem: (item) => {
        const id = `${item.productId}-${JSON.stringify(item.selectedOptions)}-${Date.now()}`
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, id }] }
        })
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      updateNote: (id, note) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, customNote: note } : i)),
        })),

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'mushroomie-cart',
    }
  )
)

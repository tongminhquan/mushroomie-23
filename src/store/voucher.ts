import { create } from 'zustand'

interface VoucherState {
  vouchers: any[]
  loading: boolean
  loaded: boolean
  fetchVouchers: () => Promise<void>
}

let fetchPromise: Promise<any> | null = null

export const useVoucherStore = create<VoucherState>((set, get) => ({
  vouchers: [],
  loading: false,
  loaded: false,
  fetchVouchers: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    
    if (!fetchPromise) {
      fetchPromise = fetch('/api/vouchers/my-wallet')
        .then(res => res.ok ? res.json() : { data: [] })
        .catch(() => ({ data: [] }))
    }

    try {
      const json = await fetchPromise
      set({ vouchers: json.data || [], loaded: true })
    } catch (error) {
      console.error(error)
    } finally {
      set({ loading: false })
      fetchPromise = null
    }
  }
}))

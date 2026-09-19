// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { parseGiftFilters } from '@/lib/gift-finder'
import type { GiftFinderData } from '@/lib/gift-finder-server'

vi.mock('@/components/product/ProductCard', () => ({
  default: ({ product }: { product: { name: string } }) => <article>{product.name}</article>,
}))

import GiftFinder from '@/components/product/GiftFinder'

const empty: GiftFinderData = {
  status: 'ready', categories: [{ id: 1, name: 'Vòng tay', slug: 'vong-tay' }], products: [], total: 0, page: 1,
}

describe('GiftFinder', () => {
  it('submits budget, category and personalization in a native GET form, resetting pagination', () => {
    render(<GiftFinder filters={parseGiftFilters({ budget: '100000', category: 'vong-tay', custom: '1', page: '2' })} data={empty} />)
    const form = screen.getByRole('form', { name: 'Tìm quà theo ý bạn' }) as HTMLFormElement
    expect(form).toHaveAttribute('method', 'get')
    expect(form).toHaveAttribute('action', '/chon-qua#ket-qua')
    expect(screen.getByRole('combobox', { name: 'Ngân sách cho một món' })).toHaveValue('100000')
    expect(screen.getByRole('combobox', { name: 'Bạn muốn tặng gì?' })).toHaveValue('vong-tay')
    expect(screen.getByRole('checkbox', { name: /Chỉ xem mẫu có thể cá nhân hóa/ })).toBeChecked()
    fireEvent.change(screen.getByRole('combobox', { name: 'Ngân sách cho một món' }), { target: { value: '200000' } })
    expect(Object.fromEntries(new FormData(form).entries())).toEqual({ budget: '200000', category: 'vong-tay', custom: '1' })
    expect(screen.getByRole('link', { name: 'Đặt lại lựa chọn' })).toHaveAttribute('href', '/chon-qua')
  })

  it('preserves selections in next/previous links and explains the current budget', () => {
    const data: GiftFinderData = { ...empty, total: 30, page: 2, products: [{
      id: 1, name: 'Vòng tay nấm', slug: 'nam', price: 90000, sale_price: null, stock: 1,
      is_featured: false, is_customizable: true, featured_image: null, category: null, images: [],
    }] }
    render(<GiftFinder filters={parseGiftFilters({ budget: '100000', category: 'vong-tay', custom: '1', page: '2' })} data={data} />)
    expect(screen.getByRole('link', { name: /Trang sau/ })).toHaveAttribute('href', '/chon-qua?budget=100000&category=vong-tay&custom=1&page=3#ket-qua')
    expect(screen.getByRole('link', { name: /Trang trước/ })).toHaveAttribute('href', '/chon-qua?budget=100000&category=vong-tay&custom=1#ket-qua')
    expect(screen.getByText('Vòng tay nấm')).toBeInTheDocument()
    expect(screen.getByText(/Chưa gồm phí vận chuyển, gói quà/)).toBeInTheDocument()
  })

  it('offers filter adjustment without relaxing an empty result', () => {
    render(<GiftFinder filters={parseGiftFilters({ budget: '100000' })} data={empty} />)
    expect(screen.getByText('Chưa có món quà khớp lựa chọn')).toBeInTheDocument()
    expect(screen.queryByText('Chưa tải được gợi ý quà')).not.toBeInTheDocument()
  })

  it('reports unavailable data separately and retries the same selection', () => {
    render(<GiftFinder filters={parseGiftFilters({ budget: '100000' })} data={{ ...empty, status: 'unavailable' }} />)
    expect(screen.getByText('Chưa tải được gợi ý quà')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Thử lại' })).toHaveAttribute('href', '/chon-qua?budget=100000')
    expect(screen.queryByText(/0 món quà/)).not.toBeInTheDocument()
  })

  it('keeps an unknown category visible rather than showing all as the selected choice', () => {
    render(<GiftFinder filters={parseGiftFilters({ category: 'old-category' })} data={empty} />)
    expect(screen.getByRole('combobox', { name: 'Bạn muốn tặng gì?' })).toHaveValue('old-category')
  })
})

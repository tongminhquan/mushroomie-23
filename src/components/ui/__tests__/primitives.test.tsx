// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Button from '@/components/ui/Button'
import BrandBadge from '@/components/ui/BrandBadge'
import EmptyState from '@/components/ui/EmptyState'
import PriceText from '@/components/ui/PriceText'

describe('UI primitives', () => {
  it('forwards button behavior, class overrides, and disabled loading state', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick} variant="outline" size="lg" className="custom">Mua ngay</Button>)
    const button = screen.getByRole('button', { name: 'Mua ngay' })

    expect(button).toHaveClass('border-primary', 'bg-theme-card', 'theme-transition', 'min-h-12', 'custom')
    button.click()
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<Button isLoading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).not.toHaveTextContent('Save')
  })

  it('renders semantic price, discount, badges, and empty state content', () => {
    const { container } = render(
      <>
        <PriceText price={100_000} originalPrice={125_000} />
        <BrandBadge tone="red">Sale</BrandBadge>
        <BrandBadge tone="yellow">Custom</BrandBadge>
        <EmptyState title="Chưa có sản phẩm" description="Quay lại sau" action={<button>Khám phá</button>} />
      </>,
    )

    expect(screen.getByText(/100\.000/)).toBeInTheDocument()
    expect(screen.getByText(/125\.000/)).toHaveClass('line-through')
    expect(screen.getByText('Sale')).toHaveClass('bg-primary')
    expect(screen.getByText('Custom')).toHaveClass('bg-yellow')
    expect(screen.getByRole('heading', { name: 'Chưa có sản phẩm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Khám phá' })).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(container.querySelector('.bg-theme-card')).toBeInTheDocument()
  })
})

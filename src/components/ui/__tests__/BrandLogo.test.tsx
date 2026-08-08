// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandLogo from '@/components/ui/BrandLogo'

function expectOptimizedSource(image: HTMLElement, source: string) {
  expect(decodeURIComponent(image.getAttribute('src') || '')).toContain(`url=${source}`)
}

describe('BrandLogo', () => {
  it('renders colour and white assets that CSS can switch for the app theme', () => {
    render(
      <div className="relative h-12 w-36">
        <BrandLogo alt="Mushroomie" fill sizes="144px" />
      </div>,
    )

    const logos = screen.getAllByRole('img', { name: 'Mushroomie' })
    expect(logos).toHaveLength(2)
    expectOptimizedSource(logos[0], '/logo.webp')
    expect(logos[0]).toHaveClass('brand-logo__default')
    expectOptimizedSource(logos[1], '/brand/logo-white.webp')
    expect(logos[1]).toHaveClass('brand-logo__white')
  })

  it('renders only the supplied white asset for permanent dark surfaces', () => {
    render(<BrandLogo alt="Mushroomie footer" variant="white" width={144} height={52} />)

    const logos = screen.getAllByRole('img', { name: 'Mushroomie footer' })
    expect(logos).toHaveLength(1)
    expectOptimizedSource(logos[0], '/brand/logo-white.webp')
  })
})

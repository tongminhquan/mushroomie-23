import { describe, expect, it } from 'vitest'

describe('test infrastructure', () => {
  it('resolves the application path alias', async () => {
    const { formatPrice } = await import('@/lib/utils')

    expect(formatPrice(125_000)).toContain('125.000')
  })
})

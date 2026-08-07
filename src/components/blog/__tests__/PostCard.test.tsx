// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/server-image', () => ({
  resolveImageUrlForRender: vi.fn(async () => '/uploads/post.webp'),
}))

vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    default: (props: Record<string, unknown>) => {
      const {
        fill,
        priority,
        quality,
        fetchPriority,
        unoptimized,
        ...imageProps
      } = props
      void fill
      void unoptimized
      return React.createElement('img', {
        ...imageProps,
        alt: String(imageProps.alt ?? ''),
        'data-priority': String(Boolean(priority)),
        'data-quality': String(quality ?? ''),
        'data-fetch-priority': String(fetchPriority ?? ''),
      })
    },
  }
})

import PostCard from '@/components/blog/PostCard'

const post = {
  id: 7,
  title: 'Bài viết đầu tiên',
  slug: 'bai-viet-dau-tien',
  excerpt: 'Câu chuyện handmade',
  featured_image: '/uploads/post.webp',
  published_at: new Date('2026-08-08T00:00:00Z'),
  category: { name: 'Cảm hứng', slug: 'cam-hung' },
}

const expectedSizes = '(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 36px), 33vw'

describe('PostCard image priority', () => {
  it('marks the first above-fold article image as the LCP candidate', async () => {
    render(await PostCard({ post, priority: true }))

    const image = screen.getByRole('img', { name: post.title })
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('data-priority', 'false')
    expect(image).toHaveAttribute('data-fetch-priority', 'high')
    expect(image).toHaveAttribute('data-quality', '70')
    expect(image).toHaveAttribute('sizes', expectedSizes)
  })

  it('keeps non-LCP article images lazy and low contention', async () => {
    render(await PostCard({ post }))

    const image = screen.getByRole('img', { name: post.title })
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute('data-priority', 'false')
    expect(image).toHaveAttribute('data-fetch-priority', 'auto')
    expect(image).toHaveAttribute('sizes', expectedSizes)
  })
})

import type { Post } from '@prisma/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PublicContentPublication } from '@/lib/seo-discovery/types'

const mocks = vi.hoisted(() => ({
  recordPublicContentPublication: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}))

vi.mock('@/lib/seo-discovery/repository', () => ({
  recordPublicContentPublication: mocks.recordPublicContentPublication,
}))

import {
  recordAndRevalidatePublication,
  shouldRecordPostPublication,
} from '@/lib/seo-discovery/publication'

const postPublication: PublicContentPublication = {
  source: 'post',
  sourceId: 42,
  url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-do',
  contentUpdatedAt: new Date('2026-08-10T07:00:00.000Z'),
  reason: 'updated',
}

const productPublication: PublicContentPublication = {
  source: 'product',
  sourceId: 24,
  url: 'https://mushroomie.io.vn/san-pham/moc-khoa-nam',
  contentUpdatedAt: new Date('2026-08-10T07:05:00.000Z'),
  reason: 'activated',
}

const publishedPost: Post = {
  id: 42,
  title: 'Vòng tay đỏ',
  slug: 'vong-tay-do',
  excerpt: 'Một đoạn giới thiệu',
  content: '<p>Nội dung công khai</p>',
  featured_image: '/uploads/vong-tay-do.webp',
  featured_image_alt: 'Vòng tay đỏ handmade',
  featured_image_caption: 'Vòng tay đỏ',
  featured_image_description: 'Ảnh sản phẩm vòng tay đỏ',
  status: 'published',
  category_id: 3,
  seo_title: 'Vòng tay đỏ handmade',
  meta_description: 'Khám phá vòng tay đỏ handmade.',
  focus_keyword: 'vòng tay đỏ',
  author_id: 7,
  published_at: new Date('2026-08-09T07:00:00.000Z'),
  created_at: new Date('2026-08-08T07:00:00.000Z'),
  updated_at: new Date('2026-08-10T07:00:00.000Z'),
  og_title: 'Vòng tay đỏ trên Facebook',
  og_description: 'Mô tả Open Graph',
  og_image: '/uploads/vong-tay-do-og.webp',
  twitter_title: 'Vòng tay đỏ trên X',
  twitter_description: 'Mô tả Twitter',
  twitter_image: '/uploads/vong-tay-do-twitter.webp',
  canonical_url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-do',
  robots_index: true,
  robots_follow: true,
  schema_type: 'BlogPosting',
  secondary_keywords: 'vòng tay handmade, charm đỏ',
  reading_time: 4,
  word_count: 620,
  deleted_at: null,
  status_before_trash: null,
}

const materialChanges = {
  title: 'Vòng tay đỏ phiên bản mới',
  slug: 'vong-tay-do-moi',
  excerpt: 'Đoạn giới thiệu mới',
  content: '<p>Nội dung công khai mới</p>',
  featured_image: '/uploads/vong-tay-do-moi.webp',
  featured_image_alt: 'Alt mới',
  featured_image_caption: 'Caption mới',
  featured_image_description: 'Mô tả ảnh mới',
  category_id: 4,
  seo_title: 'SEO title mới',
  meta_description: 'Meta description mới',
  focus_keyword: 'từ khóa mới',
  published_at: new Date('2026-08-10T08:00:00.000Z'),
  og_title: 'Open Graph title mới',
  og_description: 'Open Graph description mới',
  og_image: '/uploads/og-moi.webp',
  twitter_title: 'Twitter title mới',
  twitter_description: 'Twitter description mới',
  twitter_image: '/uploads/twitter-moi.webp',
  canonical_url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-do-moi',
  robots_index: false,
  robots_follow: false,
  schema_type: 'Article',
  secondary_keywords: 'từ khóa phụ mới',
  reading_time: 5,
  word_count: 700,
} satisfies Partial<Post>

function revalidatedPaths(): string[] {
  return mocks.revalidatePath.mock.calls.map(([path]) => path as string)
}

describe('shouldRecordPostPublication', () => {
  it('does not record an unchanged published row', () => {
    expect(shouldRecordPostPublication(
      publishedPost,
      { ...publishedPost },
    )).toBe(false)
  })

  it.each(Object.entries(materialChanges))(
    'records a published row when %s changes',
    (field, value) => {
      expect(shouldRecordPostPublication(
        publishedPost,
        { ...publishedPost, [field]: value },
      )).toBe(true)
    },
  )

  it('compares publication dates by milliseconds rather than object identity', () => {
    expect(shouldRecordPostPublication(publishedPost, {
      ...publishedPost,
      published_at: new Date(publishedPost.published_at!.getTime()),
    })).toBe(false)
  })

  it('treats publication date changes to and from null as material', () => {
    const withoutPublishedAt = { ...publishedPost, published_at: null }

    expect(shouldRecordPostPublication(publishedPost, withoutPublishedAt)).toBe(true)
    expect(shouldRecordPostPublication(withoutPublishedAt, publishedPost)).toBe(true)
  })

  it('uses conservative exact equality for nullable strings', () => {
    const withoutExcerpt = { ...publishedPost, excerpt: null }

    expect(shouldRecordPostPublication(
      withoutExcerpt,
      { ...withoutExcerpt, excerpt: '' },
    )).toBe(true)
  })

  it.each(['draft', 'scheduled', 'private', 'hidden', 'trash'])(
    'always records a %s to published transition',
    (status) => {
      expect(shouldRecordPostPublication(
        { ...publishedPost, status },
        publishedPost,
      )).toBe(true)
    },
  )

  it.each(['draft', 'scheduled', 'private', 'hidden', 'trash'])(
    'never records when the saved row becomes %s',
    (status) => {
      expect(shouldRecordPostPublication(
        publishedPost,
        { ...publishedPost, status, title: 'A material title change' },
      )).toBe(false)
    },
  )

  it('ignores tags and non-trigger bookkeeping fields', () => {
    const existing = { ...publishedPost, tags: [{ id: 1 }] }
    const saved = {
      ...publishedPost,
      id: 99,
      author_id: 8,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-08-11T00:00:00.000Z'),
      deleted_at: new Date('2026-08-11T00:00:00.000Z'),
      status_before_trash: 'draft',
      tags: [{ id: 2 }],
    }

    expect(shouldRecordPostPublication(existing, saved)).toBe(false)
  })
})

describe('recordAndRevalidatePublication', () => {
  beforeEach(() => {
    mocks.revalidatePath.mockReset()
    mocks.recordPublicContentPublication.mockReset()
    mocks.recordPublicContentPublication.mockResolvedValue({ recorded: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('revalidates every post consumer even while durable discovery is disabled', async () => {
    vi.stubEnv('SEO_DISCOVERY_ENABLED', 'false')

    await expect(recordAndRevalidatePublication(postPublication))
      .resolves.toEqual({ recorded: false })

    expect(revalidatedPaths()).toEqual([
      '/tin-tuc/vong-tay-do',
      '/tin-tuc',
      '/sitemap.xml',
      '/feed.xml',
      '/',
    ])
    expect(mocks.recordPublicContentPublication).not.toHaveBeenCalled()
  })

  it('revalidates product consumers and records the exact event when enabled', async () => {
    vi.stubEnv('SEO_DISCOVERY_ENABLED', 'true')

    await expect(recordAndRevalidatePublication(productPublication))
      .resolves.toEqual({ recorded: true })

    expect(revalidatedPaths()).toEqual([
      '/san-pham/moc-khoa-nam',
      '/san-pham',
      '/sitemap.xml',
      '/',
    ])
    expect(mocks.recordPublicContentPublication).toHaveBeenCalledOnce()
    expect(mocks.recordPublicContentPublication).toHaveBeenCalledWith(productPublication)
  })

  it('attempts every required path and still records when one cache invalidation throws', async () => {
    vi.stubEnv('SEO_DISCOVERY_ENABLED', 'true')
    mocks.revalidatePath.mockImplementation((path: string) => {
      if (path === '/tin-tuc') throw new Error('cache failure with sensitive detail')
    })

    await expect(recordAndRevalidatePublication(postPublication))
      .resolves.toEqual({ recorded: true })

    expect(revalidatedPaths()).toEqual([
      '/tin-tuc/vong-tay-do',
      '/tin-tuc',
      '/sitemap.xml',
      '/feed.xml',
      '/',
    ])
    expect(mocks.recordPublicContentPublication).toHaveBeenCalledWith(postPublication)
  })

  it('returns a fail-soft result when the repository unexpectedly rejects', async () => {
    vi.stubEnv('SEO_DISCOVERY_ENABLED', 'true')
    mocks.recordPublicContentPublication.mockRejectedValue(
      new Error('database failure with sensitive detail'),
    )

    await expect(recordAndRevalidatePublication(postPublication))
      .resolves.toEqual({ recorded: false })

    expect(revalidatedPaths()).toEqual([
      '/tin-tuc/vong-tay-do',
      '/tin-tuc',
      '/sitemap.xml',
      '/feed.xml',
      '/',
    ])
    expect(mocks.recordPublicContentPublication).toHaveBeenCalledWith(postPublication)
  })

  it('revalidates an old slug without ever recording its former URL', async () => {
    vi.stubEnv('SEO_DISCOVERY_ENABLED', 'true')
    const publication = {
      ...postPublication,
      url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-moi',
    }

    await expect(recordAndRevalidatePublication(publication, {
      previousUrl: 'https://mushroomie.io.vn/tin-tuc/vong-tay-cu',
    })).resolves.toEqual({ recorded: true })

    expect(revalidatedPaths()).toEqual([
      '/tin-tuc/vong-tay-moi',
      '/tin-tuc/vong-tay-cu',
      '/tin-tuc',
      '/sitemap.xml',
      '/feed.xml',
      '/',
    ])
    expect(mocks.recordPublicContentPublication).toHaveBeenCalledOnce()
    expect(mocks.recordPublicContentPublication).toHaveBeenCalledWith(publication)
    expect(JSON.stringify(mocks.recordPublicContentPublication.mock.calls))
      .not.toContain('vong-tay-cu')
  })
})

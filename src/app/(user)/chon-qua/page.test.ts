import { describe, expect, it } from 'vitest'
import { generateMetadata } from './page'
import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo-assets'

describe('gift finder metadata', () => {
  it('provides a branded share preview and indexes only the base route', async () => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve({}) })
    expect(metadata.robots).toEqual({ index: true, follow: true })
    expect(metadata.alternates?.canonical).toBe('https://mushroomie.io.vn/chon-qua')
    expect(metadata.openGraph).toMatchObject({
      type: 'website', locale: 'vi_VN', siteName: 'Mushroomie',
      images: [{ url: `https://mushroomie.io.vn${DEFAULT_SOCIAL_IMAGE.path}`, alt: DEFAULT_SOCIAL_IMAGE.alt }],
    })
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: metadata.title })
  })

  it.each([{ budget: '100000' }, { category: '' }, { unknown: 'x' }])('noindexes query URLs including empty filters (%j)', async (params) => {
    const metadata = await generateMetadata({ searchParams: Promise.resolve(params) })
    expect(metadata.robots).toEqual({ index: false, follow: true })
  })
})

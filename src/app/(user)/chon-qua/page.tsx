import type { Metadata } from 'next'
import Breadcrumb from '@/components/layout/Breadcrumb'
import BrandContainer from '@/components/ui/BrandContainer'
import GiftFinder from '@/components/product/GiftFinder'
import { parseGiftFilters, type GiftSearchParams } from '@/lib/gift-finder'
import { getGiftFinderData } from '@/lib/gift-finder-server'
import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo-assets'

export const revalidate = 0

export async function generateMetadata({ searchParams }: { searchParams: Promise<GiftSearchParams> }): Promise<Metadata> {
  const params = await searchParams
  const filtered = Object.keys(params).length > 0
  const title = 'Tìm quà hợp ý theo ngân sách'
  const description = 'Chọn quà handmade theo ngân sách, loại phụ kiện và khả năng cá nhân hóa. Khám phá những mẫu còn hàng tại Mushroomie để gửi một chút thương đến người bạn quý.'
  return {
    title, description,
    alternates: { canonical: 'https://mushroomie.io.vn/chon-qua' },
    robots: { index: !filtered, follow: true },
    openGraph: {
      title, description, url: 'https://mushroomie.io.vn/chon-qua',
      type: 'website', locale: 'vi_VN', siteName: 'Mushroomie',
      images: [{
        url: `https://mushroomie.io.vn${DEFAULT_SOCIAL_IMAGE.path}`,
        width: DEFAULT_SOCIAL_IMAGE.width, height: DEFAULT_SOCIAL_IMAGE.height,
        alt: DEFAULT_SOCIAL_IMAGE.alt,
      }],
    },
    twitter: {
      card: 'summary_large_image', title, description,
      images: [`https://mushroomie.io.vn${DEFAULT_SOCIAL_IMAGE.path}`],
    },
  }
}

export default async function GiftFinderPage({ searchParams }: { searchParams: Promise<GiftSearchParams> }) {
  const filters = parseGiftFilters(await searchParams)
  const data = await getGiftFinderData(filters)
  return (
    <div className="min-h-screen bg-theme-page pb-16">
      <section className="border-b border-theme-border bg-theme-section">
        <BrandContainer className="py-6 md:py-10">
          <Breadcrumb items={[{ label: 'Sản phẩm', href: '/san-pham' }, { label: 'Tìm quà hợp ý' }]} />
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Từ từng hạt nhỏ, gửi một chút thương</p>
          <h1 className="font-heading text-3xl leading-tight text-theme-primary md:text-5xl">Tìm quà hợp ý</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-theme-secondary md:text-base">Một món quà nhỏ cũng đủ làm ai đó vui cả ngày. Chọn mức chi và kiểu phụ kiện, Mushroomie giúp bạn tìm những mẫu đang còn hàng.</p>
        </BrandContainer>
      </section>
      <BrandContainer className="pt-8 md:pt-10"><GiftFinder filters={filters} data={data} /></BrandContainer>
    </div>
  )
}

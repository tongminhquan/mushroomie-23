import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductCard from '@/components/product/ProductCard'
import AddToCartButton from '@/components/product/AddToCartButton'
import ProductGallery from '@/components/product/ProductGallery'
import { toAbsoluteUrl } from '@/lib/url'
import { getPublicImageUrl } from '@/lib/utils'
import type { Metadata } from 'next'
import Link from 'next/link'
import BrandContainer from '@/components/ui/BrandContainer'
import PriceText from '@/components/ui/PriceText'
import SectionHeader from '@/components/ui/SectionHeader'
import { sanitizeHtml } from '@/lib/sanitize'
import { safeJsonLd } from '@/lib/security'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const product = await prisma.product.findFirst({ 
    where: { 
      OR: [
        { slug: decodedSlug },
        { slug: slug }
      ]
    } 
  })
  if (!product) return { title: 'Sản phẩm không tồn tại' }
  return {
    title: `${product.name} | Mushroomie Handmade`,
    description: product.short_description || `Mua ${product.name} handmade cá nhân hóa tại Mushroomie.`,
    openGraph: {
      title: `${product.name} | Mushroomie Handmade`,
      description: product.short_description || `Mua ${product.name} handmade cá nhân hóa tại Mushroomie.`,
      url: toAbsoluteUrl(`/san-pham/${product.slug}`),
      siteName: 'Mushroomie Handmade',
      images: product.featured_image ? [
        {
          url: getPublicImageUrl(product.featured_image),
          width: 800,
          height: 600,
          alt: product.name,
        }
      ] : [{ url: getPublicImageUrl(null), width: 800, height: 600, alt: 'Mushroomie Default OG' }],
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Mushroomie Handmade`,
      description: product.short_description || `Mua ${product.name} handmade cá nhân hóa tại Mushroomie.`,
      images: product.featured_image ? [getPublicImageUrl(product.featured_image)] : [getPublicImageUrl(null)],
    }
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  
  const productRaw = await prisma.product.findFirst({
    where: { 
      OR: [
        { slug: decodedSlug },
        { slug: slug }
      ]
    },
    include: {
      category: true,
      images: { orderBy: { sort_order: 'asc' } },
      options: true,
      reviews: { where: { status: 'approved' }, take: 5 },
    },
  })
  if (!productRaw) notFound()
  const product = {
    ...productRaw,
    price: Number(productRaw.price),
    sale_price: productRaw.sale_price ? Number(productRaw.sale_price) : null
  }

  const relatedProducts = await prisma.product.findMany({
    where: { category_id: product.category_id, status: 'active', id: { not: product.id } },
    include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
    take: 4,
  }).then((products: any[]) => products.map((p: any) => ({
    ...p,
    price: Number(p.price),
    sale_price: p.sale_price ? Number(p.sale_price) : null
  }))).catch(() => [])

  const allImages = [
    ...(product.featured_image ? [getPublicImageUrl(product.featured_image)] : []),
    ...product.images.map((i: any) => getPublicImageUrl(i.image_url)),
  ].filter(Boolean)

  const price = Number(product.price)
  const salePrice = product.sale_price ? Number(product.sale_price) : null
  const displayPrice = salePrice || price
  const isOnSale = !!salePrice && salePrice < price

  const defaultImage = `/logo.webp`

  // Product Schema JSON-LD
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: allImages,
    description: product.short_description || product.name,
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      url: toAbsoluteUrl(`/san-pham/${product.slug}`),
      priceCurrency: 'VND',
      price: displayPrice,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.reviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: (product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / product.reviews.length).toFixed(1),
        reviewCount: product.reviews.length,
      }
    })
  }

  return (
    <div className="min-h-screen bg-secondary py-5 md:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }} />
      <BrandContainer>
        <Breadcrumb items={[
          { label: 'Sản phẩm', href: '/san-pham' },
          ...(product.category ? [{ label: product.category.name, href: `/san-pham?category=${product.category.slug}` }] : []),
          { label: product.name },
        ]} />

        <div className="mt-5 grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:gap-10">
          {/* Gallery */}
          <div className="h-full">
            <ProductGallery
              images={allImages.length > 0 ? allImages : [defaultImage]}
              productName={product.name}
              isCustomizable={product.is_customizable}
              isOnSale={isOnSale}
            />
          </div>

          {/* Product info */}
          <div className="flex h-full flex-col rounded-[24px] border-[1.5px] border-[#f0e0d6] bg-white p-6 shadow-card sm:p-8">
            <div className="space-y-5">
              {product.category && (
                <Link href={`/san-pham?category=${product.category.slug}`} className="brand-kicker">{product.category.name}</Link>
              )}
              <h1 className="text-balance font-heading text-3xl leading-[1.08] text-text md:text-5xl">{product.name}</h1>

              <PriceText price={displayPrice} originalPrice={isOnSale ? price : null} className="[&_strong]:text-3xl" />

              {product.short_description && (
                <p className="max-w-xl text-sm leading-7 text-neutral-600 md:text-base">{product.short_description}</p>
              )}
            </div>

            <div className="mt-8 space-y-3 rounded-2xl border-[1.5px] border-[#f0e0d6] bg-[#fffaf6] p-4 text-sm text-text">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">✓</span>
                <p><strong>Handmade 100%:</strong> Tỉ mỉ từng chi tiết</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">✓</span>
                <p><strong>Custom theo yêu cầu:</strong> Nhắn tin để thiết kế riêng</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">✓</span>
                <p><strong>Giao hàng toàn quốc:</strong> Đóng gói cẩn thận làm quà tặng</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#f0e0d6]">
              <AddToCartButton product={product} />
            </div>
            {product.description && (
              <section className="mt-6 rounded-[18px] border border-neutral-200 bg-white p-6">
                <h2 className="mb-4 font-heading text-xl text-text">Mô tả chi tiết</h2>
                <div
                  className="prose prose-sm max-w-none text-neutral-600 prose-headings:font-heading prose-headings:text-text prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
                />
              </section>
            )}

            <div className="mt-4 flex items-start gap-3 rounded-[16px] border-[1.5px] border-dashed border-[#d9b89e] bg-secondary p-4">
              <span aria-hidden className="text-xl">🤍</span>
              <p className="m-0 text-[13px] leading-relaxed text-neutral-600">
                Sản phẩm được làm thủ công nên mỗi mẫu có thể hơi khác nhau — đó là <strong className="text-accent-kraft">dấu ấn riêng</strong> của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Description and Reviews */}
        {(product.description || product.reviews.length > 0) && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:gap-10">
            {/* Empty left column on desktop to align with right info column, or let it span full? The user suggested it can span full if it's a block below. Let's make it span full for better reading. */}
            <div className="lg:col-span-2">
              <div className="space-y-8">
                {product.description && (
                  <section className="rounded-[24px] border-[1.5px] border-[#f0e0d6] bg-white p-6 shadow-card sm:p-8">
                    <h2 className="mb-6 font-heading text-2xl text-text">Mô tả chi tiết</h2>
                    <div className="prose prose-sm max-w-none text-neutral-600 prose-headings:font-heading prose-headings:text-text prose-a:text-primary" dangerouslySetInnerHTML={{ __html: product.description }} />
                  </section>
                )}

                {product.reviews.length > 0 && (
                  <section className="rounded-[24px] border-[1.5px] border-[#f0e0d6] bg-white p-6 shadow-card sm:p-8">
                    <h2 className="mb-6 font-heading text-2xl text-text">Đánh giá ({product.reviews.length})</h2>
                    <div className="space-y-5">
                      {product.reviews.map((review: any) => (
                        <div key={review.id} className="border-b border-neutral-100 pb-5 last:border-0">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-semibold text-text">{review.name}</span>
                            <div className="flex text-xs text-yellow">{'★'.repeat(review.rating)}</div>
                          </div>
                          <p className="text-sm leading-6 text-neutral-600">{review.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Related */}
        {relatedProducts.length > 0 && (
            <section className="mt-16 border-t border-[#f0e0d6] pt-12">
              <SectionHeader eyebrow="Có thể bạn sẽ thích" title="Sản phẩm liên quan" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
        )}
      </BrandContainer>
    </div>
  )
}

import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { cache } from 'react'
import { CheckCircle2, MessageCircleHeart, PackageCheck, Star, Truck } from 'lucide-react'
import AddToCartButton from '@/components/product/AddToCartButton'
import GiftWrapOption from '@/components/product/GiftWrapOption'
import Breadcrumb from '@/components/layout/Breadcrumb'
import BrandContainer from '@/components/ui/BrandContainer'
import PriceText from '@/components/ui/PriceText'
import ProductCard from '@/components/product/ProductCard'
import ProductGallery from '@/components/product/ProductGallery'
import ProductViewTracker from '@/components/product/ProductViewTracker'
import ReviewForm from '@/components/product/ReviewForm'
import SectionHeader from '@/components/ui/SectionHeader'
import { getPublicImageUrl } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { safeJsonLd } from '@/lib/security'
import { sanitizeHtml } from '@/lib/sanitize'
import { toAbsoluteUrl } from '@/lib/url'
import { geoImageGraph } from '@/lib/geo-image-schema'
import { brandEntityRef } from '@/lib/local-seo'
import {
  merchantReturnPolicySchema,
  offerShippingDetailsSchema,
  priceValidUntil,
} from '@/lib/merchant-schema'
import { getShippingFeeSnapshot } from '@/lib/shipping-fee-server'
import { DEFAULT_SHIPPING_FEE } from '@/lib/shipping-fee'
import { buildProductMetadataText } from '@/lib/product-metadata'
import { inspectImageForRender } from '@/lib/server-image'
import { resolveDisplayPrice } from '@/lib/product-price'
import {
  decodeProductSlug,
  getProductSlugLookupCandidates,
} from '@/lib/product-slug'

const SITE_NAME = 'Mushroomie'

/** Lưới an toàn cho các thay đổi không đi qua /api/products (sửa thẳng DB, seed, import). */
export const revalidate = 3600

type RelatedProductRecord = Prisma.ProductGetPayload<{
  include: { category: true; images: true }
}>

type RelatedProductItem = Omit<RelatedProductRecord, 'price' | 'sale_price'> & {
  price: number
  sale_price: number | null
}

const getProductBySlug = cache(async (slug: string) => {
  const candidates = getProductSlugLookupCandidates(slug)

  for (const candidate of candidates) {
    const product = await prisma.product.findUnique({
      where: { slug: candidate },
      include: {
        category: true,
        images: { orderBy: { sort_order: 'asc' } },
        options: true,
        reviews: { where: { status: 'approved' }, take: 20, orderBy: { created_at: 'desc' } },
      },
    })
    if (product) return product
  }

  return null
})

export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      select: { slug: true },
      take: 200,
    })

    return products.map((product) => ({ slug: product.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    return { title: 'Sản phẩm không tồn tại', robots: { index: false, follow: true } }
  }

  const { title, description } = buildProductMetadataText(product.name, {
    sku: product.sku,
    isCustomizable: product.is_customizable,
  })
  const image = await inspectImageForRender(product.featured_image, 'product')
  const absoluteImageUrl = toAbsoluteUrl(image.renderSrc)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: toAbsoluteUrl(`/san-pham/${product.slug}`) },
    openGraph: {
      title,
      description,
      url: toAbsoluteUrl(`/san-pham/${product.slug}`),
      siteName: SITE_NAME,
      images: [
        {
          url: absoluteImageUrl,
          ...(image.width && image.height
            ? { width: image.width, height: image.height }
            : {}),
          alt: product.name,
        },
      ],
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteImageUrl],
    },
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const productRaw = await getProductBySlug(slug)

  if (!productRaw) {
    notFound()
  }

  if (decodeProductSlug(slug) !== productRaw.slug) {
    permanentRedirect(`/san-pham/${encodeURIComponent(productRaw.slug)}`)
  }

  const product = {
    ...productRaw,
    price: Number(productRaw.price),
    sale_price: productRaw.sale_price ? Number(productRaw.sale_price) : null,
  }

  // Phí ship dùng cho shippingDetails trong Product schema; lỗi settings không được
  // làm hỏng trang sản phẩm nên fallback về mức mặc định.
  const { shippingFee } = await getShippingFeeSnapshot().catch(() => ({
    shippingFee: DEFAULT_SHIPPING_FEE,
  }))

  const relatedProducts = await prisma.product
    .findMany({
      where: { category_id: product.category_id, status: 'active', id: { not: product.id } },
      include: { category: true, images: { orderBy: { sort_order: 'asc' }, take: 1 } },
      take: 4,
    })
    .then((products): RelatedProductItem[] =>
      products.map((item) => ({
        ...item,
        price: Number(item.price),
        sale_price: item.sale_price ? Number(item.sale_price) : null,
      })),
    )
    .catch(() => [])

  const allImages = Array.from(
    new Set(
      [product.featured_image, ...product.images.map((image) => image.image_url)]
        .filter(Boolean)
        .map((image) => getPublicImageUrl(image, 'product')),
    ),
  )
  const galleryImages = allImages.length > 0 ? allImages : [getPublicImageUrl(null, 'product')]

  const price = Number(product.price)
  const { price: displayPrice, originalPrice, isOnSale } = resolveDisplayPrice(
    price,
    product.sale_price === null ? null : Number(product.sale_price),
  )
  const reviewCount = product.reviews.length
  const reviewAverage = reviewCount
    ? Number(
        (
          product.reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviewCount
        ).toFixed(1),
      )
    : null

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: 'Mushroomie' },
    image: galleryImages.map((image) => toAbsoluteUrl(image)),
    description: product.short_description || product.name,
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      url: toAbsoluteUrl(`/san-pham/${product.slug}`),
      priceCurrency: 'VND',
      price: displayPrice,
      priceValidUntil: priceValidUntil(),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: brandEntityRef(),
      hasMerchantReturnPolicy: merchantReturnPolicySchema(),
      shippingDetails: offerShippingDetailsSchema(shippingFee),
    },
    ...(reviewAverage
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewAverage,
            reviewCount,
          },
        }
      : {}),
  }
  const productGeoImages = geoImageGraph(
    galleryImages.map((image, index) => ({
      url: toAbsoluteUrl(image),
      name: product.name + ' - ảnh sản phẩm ' + (index + 1),
      caption: product.name + ' handmade tại Mushroomie, Đồng Nai.',
    })),
  )

  return (
    <div className="min-h-screen bg-secondary py-5 md:py-8">
      <ProductViewTracker
        product={{
          id: product.id,
          name: product.name,
          category: product.category?.name,
          price: displayPrice,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productGeoImages) }}
      />

      <BrandContainer>
        <Breadcrumb
          items={[
            { label: 'Sản phẩm', href: '/san-pham' },
            ...(product.category
              ? [{ label: product.category.name, href: `/san-pham?category=${product.category.slug}` }]
              : []),
            { label: product.name },
          ]}
        />

        <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:gap-10">
          <ProductGallery
            images={galleryImages}
            productName={product.name}
            isCustomizable={product.is_customizable}
            isOnSale={isOnSale}
          />

          <div className="flex h-full flex-col rounded-[28px] border border-warm-border bg-white p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <Link
                  href={`/san-pham?category=${product.category.slug}`}
                  className="rounded-full bg-primary-light px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  {product.category.name}
                </Link>
              )}
              <span
                className={`rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] ${
                  product.stock > 0
                    ? 'bg-[#eef9f0] text-[#1f7a34]'
                    : 'bg-[#fff0f0] text-primary'
                }`}
              >
                {product.stock > 0 ? 'Sẵn sàng làm cho bạn' : 'Tạm hết hàng'}
              </span>
              {product.is_customizable && (
                <span className="rounded-full bg-[#fff3dc] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#9a6400]">
                  Có thể cá nhân hóa
                </span>
              )}
            </div>

            <h1 className="mt-4 text-balance font-heading text-3xl leading-[1.08] text-text md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PriceText
                price={displayPrice}
                originalPrice={originalPrice}
                className="[&_strong]:text-3xl md:[&_strong]:text-4xl [&_span]:text-sm"
              />

              {reviewAverage && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-warm-border bg-white px-3 py-2 text-sm font-semibold text-neutral-600">
                  <Star size={15} className="fill-[#ffe7a3] text-[#d4a100]" />
                  {reviewAverage}/5
                  <span className="text-neutral-400">({reviewCount} đánh giá)</span>
                </span>
              )}
            </div>

            {product.short_description && (
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 md:text-base">
                {product.short_description}
              </p>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-warm-border bg-secondary px-4 py-4">
                <CheckCircle2 size={18} className="text-primary" />
                <p className="mt-3 text-sm font-semibold text-neutral-800">Làm thủ công tỉ mỉ</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Mỗi chi tiết được hoàn thiện thủ công theo đúng tinh thần Mushroomie.
                </p>
              </div>
              <div className="rounded-[22px] border border-warm-border bg-secondary px-4 py-4">
                <MessageCircleHeart size={18} className="text-primary" />
                <p className="mt-3 text-sm font-semibold text-neutral-800">Tùy chỉnh theo ý bạn</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Dễ thêm tên, charm hoặc lời nhắn riêng khi sản phẩm hỗ trợ cá nhân hóa.
                </p>
              </div>
              <div className="rounded-[22px] border border-warm-border bg-secondary px-4 py-4">
                <Truck size={18} className="text-primary" />
                <p className="mt-3 text-sm font-semibold text-neutral-800">Đóng gói sẵn để tặng</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Phù hợp cho quà sinh nhật, dịp đặc biệt hoặc một món quà nhỏ cho chính mình.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-warm-border bg-[#fffaf6] p-5">
              <AddToCartButton product={product} />
            </div>

            {/* Gói quà áp dụng cho mọi sản phẩm; phí tính một lần cho cả đơn hàng. */}
            <GiftWrapOption className="mt-4" />

            <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-dashed border-[#d9b89e] bg-secondary p-4">
              <PackageCheck size={20} className="mt-0.5 shrink-0 text-primary" />
              <p className="m-0 text-[13px] leading-relaxed text-neutral-600">
                Sản phẩm handmade có thể khác nhau một chút giữa từng lần hoàn thiện. Điều đó
                giúp mỗi món quà giữ được cảm giác riêng và tự nhiên hơn.
              </p>
            </div>
          </div>
        </div>

        <div className={`mt-8 grid gap-8 ${product.description ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : ''}`}>
          {product.description && (
            <section data-reveal className="rounded-[28px] border border-warm-border bg-white p-6 shadow-card sm:p-8">
              <SectionHeader
                eyebrow="Chi tiết sản phẩm"
                title="Mô tả đầy đủ"
                description="Thông tin chất liệu, cảm hứng thiết kế và gợi ý sử dụng cho sản phẩm bạn đang xem."
                className="mb-6"
              />
              <div
                className="prose prose-sm max-w-none text-neutral-700 prose-headings:font-heading prose-headings:text-text prose-a:text-primary prose-img:rounded-[22px]"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
            </section>
          )}

          <section data-reveal className="rounded-[28px] border border-warm-border bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-heading text-2xl text-text">Đánh giá</h2>

            {reviewCount > 0 ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <Star size={18} className="fill-[#ffe7a3] text-[#d4a100]" />
                  <span className="text-lg font-bold text-neutral-900">{reviewAverage}</span>
                  <span className="text-sm text-neutral-500">trên 5 điểm từ {reviewCount} đánh giá</span>
                </div>

                <div className="mt-6 space-y-5">
                  {product.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-warm-border pb-5 last:border-0 last:pb-0"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-text">{review.name}</span>
                        <div className="flex items-center gap-1 text-[#d4a100]">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              size={14}
                              className={index < review.rating ? 'fill-[#ffe7a3]' : 'text-neutral-300'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-neutral-600">{review.content}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm này.
              </p>
            )}

            <div className="mt-8 border-t border-warm-border pt-6">
              <h3 className="mb-4 text-sm font-semibold text-text">Viết đánh giá của bạn</h3>
              <ReviewForm productId={product.id} productName={product.name} />
            </div>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16 border-t border-warm-border pt-12">
            <SectionHeader
              eyebrow="Bạn có thể thích"
              title="Sản phẩm liên quan"
              description="Những thiết kế cùng tinh thần hoặc cùng danh mục để bạn chọn thêm."
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </BrandContainer>
    </div>
  )
}

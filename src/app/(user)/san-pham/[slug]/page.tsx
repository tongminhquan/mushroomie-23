import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductCard from '@/components/product/ProductCard'
import AddToCartButton from '@/components/product/AddToCartButton'
import ProductGallery from '@/components/product/ProductGallery'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'
import { formatPrice } from '@/lib/utils'
import { toAbsoluteUrl } from '@/lib/url'
import type { Metadata } from 'next'

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
          url: toAbsoluteUrl(product.featured_image),
          width: 800,
          height: 600,
          alt: product.name,
        }
      ] : [{ url: toAbsoluteUrl(), width: 800, height: 600, alt: 'Mushroomie Default OG' }],
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Mushroomie Handmade`,
      description: product.short_description || `Mua ${product.name} handmade cá nhân hóa tại Mushroomie.`,
      images: product.featured_image ? [toAbsoluteUrl(product.featured_image)] : [toAbsoluteUrl()],
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
  }).then(products => products.map(p => ({
    ...p,
    price: Number(p.price),
    sale_price: p.sale_price ? Number(p.sale_price) : null
  }))).catch(() => [])

  const allImages = [
    ...(product.featured_image ? [product.featured_image] : []),
    ...product.images.map((i) => i.image_url),
  ]

  const price = Number(product.price)
  const salePrice = product.sale_price ? Number(product.sale_price) : null
  const displayPrice = salePrice || price
  const isOnSale = !!salePrice && salePrice < price

  const defaultImage = `/logo.png`

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
        ratingValue: (product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length).toFixed(1),
        reviewCount: product.reviews.length,
      }
    })
  }

  return (
    <div className="min-h-screen bg-secondary">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[
          { label: 'Sản phẩm', href: '/san-pham' },
          ...(product.category ? [{ label: product.category.name, href: `/san-pham?category=${product.category.slug}` }] : []),
          { label: product.name },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-4">
          {/* Gallery */}
          <AnimateOnScroll animation="fade-right">
            <ProductGallery
              images={allImages.length > 0 ? allImages : [defaultImage]}
              productName={product.name}
              isCustomizable={true}
              isOnSale={isOnSale}
            />
          </AnimateOnScroll>

          {/* Product info */}
          <AnimateOnScroll animation="fade-left">
            <div className="space-y-6">
              {product.category && (
                <p className="text-primary text-sm font-semibold">{product.category.name}</p>
              )}
              <h1 className="font-heading text-3xl font-bold text-neutral-900">{product.name}</h1>

              <div className="flex items-center gap-3">
                <span className="font-bold text-3xl text-primary">{formatPrice(displayPrice)}</span>
                {isOnSale && (
                  <span className="text-lg text-neutral-400 line-through">{formatPrice(price)}</span>
                )}
              </div>

              {product.short_description && (
                <p className="text-neutral-600 leading-relaxed">{product.short_description}</p>
              )}

              <AddToCartButton product={product as any} />

              <AnimateOnScroll animation="fade-up">
                {product.description && (
                  <div className="bg-white rounded-2xl p-6 shadow-card">
                    <h2 className="font-heading font-bold text-lg mb-3">Mô tả chi tiết</h2>
                    <div className="prose prose-sm text-neutral-600 max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                  </div>
                )}
              </AnimateOnScroll>

              {product.reviews.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-card">
                  <h2 className="font-heading font-bold text-lg mb-4">Đánh giá ({product.reviews.length})</h2>
                  <div className="space-y-4">
                    {product.reviews.map((review) => (
                      <div key={review.id} className="border-b border-neutral-100 pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{review.name}</span>
                          <div className="flex text-yellow-400 text-xs">{'★'.repeat(review.rating)}</div>
                        </div>
                        <p className="text-sm text-neutral-600">{review.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimateOnScroll>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <AnimateOnScroll animation="fade-up">
            <section className="mt-16">
              <h2 className="font-heading text-2xl font-bold text-neutral-900 mb-6">Sản phẩm liên quan</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((p) => <ProductCard key={p.id} product={p as any} />)}
              </div>
            </section>
          </AnimateOnScroll>
        )}
      </div>
    </div>
  )
}

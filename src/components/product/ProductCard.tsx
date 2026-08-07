import { Eye } from 'lucide-react'
import ProductCardActions from '@/components/product/ProductCardActions'
import ProductCardLink from '@/components/product/ProductCardLink'
import SafeImage from '@/components/ui/SafeImage'
import { resolveDisplayPrice } from '@/lib/product-price'
import { formatPrice, getPublicImageUrl } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: number
    name: string
    slug: string
    price: number
    sale_price?: number | null
    featured_image?: string | null
    is_customizable?: boolean
    is_featured?: boolean
    stock?: number
    category?: { name: string; slug: string } | null
    images?: { image_url: string }[]
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getPublicImageUrl(
    product.featured_image || product.images?.[0]?.image_url,
    'product',
  )
  const isOutOfStock = product.stock !== undefined && product.stock <= 0
  const { price: displayPrice, originalPrice, isOnSale: hasSale } = resolveDisplayPrice(
    product.price,
    product.sale_price,
  )
  const productHref = `/san-pham/${product.slug}`
  const analyticsProps = {
    href: productHref,
    itemId: product.id,
    itemName: product.name,
    categoryName: product.category?.name,
    price: displayPrice,
  }

  // m-card: nâng thẻ + phóng ảnh bằng transform (chạy trên compositor).
  // m-glow: đổ bóng bằng opacity của lớp ::before thay vì animate box-shadow —
  // box-shadow buộc trình duyệt repaint mỗi khung hình và gây giật trên mobile.
  return (
    <article className="theme-transition m-card m-glow group relative flex h-full flex-col overflow-hidden rounded-[24px] border-[1.5px] border-theme-border bg-theme-card hover:border-pink">
      <ProductCardLink
        {...analyticsProps}
        className="m-card-media relative block aspect-[3/4] w-full shrink-0 overflow-hidden bg-theme-subtle"
      >
        <SafeImage
          src={imageUrl}
          alt={product.name}
          imageKind="product"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-3"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-theme-elevated/95 px-3.5 py-1.5 text-xs font-extrabold text-theme-primary shadow-card backdrop-blur-sm">
            <Eye aria-hidden="true" size={14} />
            Xem nhanh
          </span>
        </div>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.is_customizable && (
            <span className="inline-flex min-h-7 items-center rounded-lg bg-yellow px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-brand-ink">
              Cá nhân hóa
            </span>
          )}
          {!product.is_customizable && !isOutOfStock && (
            <span className="inline-flex min-h-7 items-center rounded-lg bg-pink px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-brand-ink">
              Handmade
            </span>
          )}
          {hasSale && (
            <span className="inline-flex min-h-7 items-center rounded-lg bg-primary px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-white">
              -{Math.round((1 - displayPrice / product.price) * 100)}%
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex min-h-7 items-center rounded-lg border border-theme-border bg-theme-elevated px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-theme-primary">
              Hết hàng
            </span>
          )}
        </div>
      </ProductCardLink>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {product.category && (
          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-theme-kraft">
            {product.category.name}
          </p>
        )}
        <ProductCardLink {...analyticsProps} className="mb-3 block flex-1">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-theme-primary transition-colors group-hover:text-theme-accent sm:text-[15px]">
            {product.name}
          </h3>
        </ProductCardLink>

        <div className="mt-auto flex flex-col gap-1">
          <ProductCardActions
            productId={product.id}
            productName={product.name}
            categoryName={product.category?.name}
            displayPrice={displayPrice}
            imageUrl={imageUrl}
            isOutOfStock={isOutOfStock}
          >
            <div className="flex flex-wrap items-baseline gap-2 tabular-nums">
              <strong className="text-xl text-theme-accent">{formatPrice(displayPrice)}</strong>
              {originalPrice && originalPrice > displayPrice && (
                <span className="text-xs text-theme-muted line-through">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </ProductCardActions>
        </div>
      </div>
    </article>
  )
}

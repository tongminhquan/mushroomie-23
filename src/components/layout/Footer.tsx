import Link from 'next/link'
import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import SafeEmail from '@/components/ui/SafeEmail'
import SafeImage from '@/components/ui/SafeImage'
import { BRAND } from '@/lib/local-seo'

const footerLinkClass = 'm-underline inline-flex min-h-11 items-center hover:text-white lg:min-h-10'

export default function Footer({ categories }: { categories: Array<{ id: number; name: string; slug: string }> }) {

  return (
    <footer className="theme-transition border-t border-theme-border bg-black text-white">
      <div className="brand-container py-12 md:py-16">
        {/* 5 cột hiện lần lượt khi cuộn tới. Dùng data-batch-reveal (ScrollMotion gom
            chung một stagger) thay vì data-reveal cho từng cột — cùng cách lưới sản
            phẩm ngoài trang chủ đang làm. */}
        <div
          data-batch-reveal
          className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.7fr_0.75fr_0.75fr_1fr]"
        >
          <div>
            <Link href="/" prefetch={false} className="m-press relative mb-5 block h-14 w-36">
              <SafeImage
                src="/logo.webp"
                fallbackSrc="/logo.webp"
                alt={BRAND.name}
                width={144}
                height={56}
                className="h-full w-full object-contain object-left"
              />
            </Link>
            <p className="max-w-sm text-sm leading-7 text-white/65">
              Phụ kiện handmade được làm chậm, làm kỹ và cá nhân hóa theo câu chuyện riêng của bạn.
            </p>
            <p className="mt-5 inline-flex rounded-lg bg-white/8 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-yellow">
              <span className="m-slogan-shimmer">Làm bằng tay, trao bằng tim</span>
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-extrabold text-white">Danh mục</h2>
            <ul className="text-sm text-white/60">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/san-pham?category=${category.slug}`} prefetch={false} className={footerLinkClass}>
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/san-pham" prefetch={false} className={`${footerLinkClass} font-bold text-white hover:text-yellow`}>
                  Xem tất cả
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-extrabold text-white">{BRAND.name}</h2>
            <ul className="text-sm text-white/60">
              <li><Link href="/gioi-thieu" prefetch={false} className={footerLinkClass}>Câu chuyện thương hiệu</Link></li>
              <li><Link href="/tin-tuc" prefetch={false} className={footerLinkClass}>Tin tức</Link></li>
              <li><Link href="/voucher" prefetch={false} className={footerLinkClass}>Voucher</Link></li>
              <li><Link href="/mini-game" prefetch={false} className={footerLinkClass}>Mini game</Link></li>
              <li><Link href="/lien-he" prefetch={false} className={footerLinkClass}>Liên hệ</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-extrabold text-white">Chính sách</h2>
            <ul className="text-sm text-white/60">
              <li><Link href="/chinh-sach-doi-tra" prefetch={false} className={footerLinkClass}>Giao hàng & đổi trả</Link></li>
              <li><Link href="/chinh-sach-bao-mat" prefetch={false} className={footerLinkClass}>Bảo mật</Link></li>
              <li><Link href="/dieu-khoan-dich-vu" prefetch={false} className={footerLinkClass}>Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-extrabold text-white">Liên hệ</h2>
            <ul className="space-y-4 text-sm leading-6 text-white/60">
              <li className="flex gap-3">
                <MapPin size={17} className="mt-1 shrink-0 text-coral" />
                {BRAND.formattedAddress}
              </li>
              <li className="flex items-center gap-3">
                <Phone size={17} className="shrink-0 text-coral" />
                <a href={`tel:${BRAND.phoneE164}`} className={footerLinkClass}>{BRAND.phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={17} className="shrink-0 text-coral" />
                <SafeEmail email={BRAND.email} className={footerLinkClass} />
              </li>
              <li className="flex items-center gap-3">
                <Globe size={17} className="shrink-0 text-coral" />
                <a href="https://mushroomie.io.vn" className={footerLinkClass}>mushroomie.io.vn</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            <a href={BRAND.socials.facebook.url} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>Facebook</a>
            <a href={BRAND.socials.instagram.url} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>Instagram</a>
            <a href={BRAND.socials.tiktok.url} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>TikTok</a>
            <a href={BRAND.socials.shopee.url} target="_blank" rel="noopener noreferrer" className={footerLinkClass}>Shopee</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

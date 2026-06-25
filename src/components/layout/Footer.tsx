import Link from 'next/link'
import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import SafeImage from '@/components/ui/SafeImage'
import SafeEmail from '@/components/ui/SafeEmail'

export default async function Footer() {
  const categories = await prisma.category.findMany({
    where: { type: 'product' },
    take: 5,
    orderBy: { created_at: 'asc' },
  }).catch(() => [])

  return (
    <footer className="border-t border-neutral-200 bg-text text-white">
      <div className="brand-container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1fr]">
          <div>
            <Link href="/" className="relative mb-5 block h-14 w-36">
              <SafeImage src="/logo.webp" fallbackSrc="/logo.webp" alt="Mushroomie" fill sizes="144px" className="object-contain object-left" />
            </Link>
            <p className="max-w-sm text-sm leading-7 text-white/65">
              Phụ kiện handmade được làm chậm, làm kỹ và cá nhân hóa theo câu chuyện riêng của bạn.
            </p>
            <p className="mt-5 inline-flex rounded-lg bg-white/8 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-yellow">
              Làm bằng tay, Trao bằng tim
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-extrabold text-white">Danh mục</h2>
            <ul className="space-y-3 text-sm text-white/60">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/san-pham?category=${category.slug}`} className="hover:text-white">{category.name}</Link>
                </li>
              ))}
              <li><Link href="/san-pham" className="font-bold text-white hover:text-yellow">Xem tất cả</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-extrabold text-white">Mushroomie</h2>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link href="/gioi-thieu" className="hover:text-white">Câu chuyện thương hiệu</Link></li>
              <li><Link href="/tin-tuc" className="hover:text-white">Tin tức</Link></li>
              <li><Link href="/mini-game" className="hover:text-white">Mini game</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className="hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link href="/dieu-khoan-dich-vu" className="hover:text-white">Điều khoản dịch vụ</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-extrabold text-white">Liên hệ</h2>
            <ul className="space-y-4 text-sm leading-6 text-white/60">
              <li className="flex gap-3"><MapPin size={17} className="mt-1 shrink-0 text-coral" />Hẻm 2 tổ 11, Phường Trảng Dài, Đồng Nai</li>
              <li className="flex items-center gap-3"><Phone size={17} className="shrink-0 text-coral" /><a href="tel:+84848744060" className="hover:text-white">0848 744 060</a></li>
              <li className="flex items-center gap-3"><Mail size={17} className="shrink-0 text-coral" /><SafeEmail email="cskh@mushroomie.io.vn" className="hover:text-white" /></li>
              <li className="flex items-center gap-3"><Globe size={17} className="shrink-0 text-coral" /><a href="https://mushroomie.io.vn" className="hover:text-white">mushroomie.io.vn</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mushroomie. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="https://www.facebook.com/mushr00mie" target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>
            <a href="https://www.instagram.com/mushr00mie._/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>
            <a href="https://shopee.vn/shop/475544379" target="_blank" rel="noopener noreferrer" className="hover:text-white">Shopee</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

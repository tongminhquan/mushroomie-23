import Link from 'next/link'
import { Facebook, Instagram, ShoppingBag, MapPin, Phone, Mail, Globe } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand & Social */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center mb-6 bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl w-fit border border-white/10">
              <img src="/logo.png" alt="Mushroomie Logo" className="h-10 w-auto object-contain brightness-0 invert" />
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8 pr-4">
              Phụ kiện handmade cá nhân hóa dành cho giới trẻ — nơi mỗi sản phẩm là một câu chuyện riêng của bạn 💛
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="https://www.facebook.com/mushr00mie" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-[#1877F2] hover:text-white transition-all duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/mushr00mie._/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-[#E4405F] hover:text-white transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@mushr00mie._?lang=vi-VN" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-black hover:text-white transition-all duration-300">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://shopee.vn/shop/475544379" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-[#EE4D2D] hover:text-white transition-all duration-300" title="Shopee">
                <ShoppingBag className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links: Danh muc */}
          <div className="lg:col-span-2">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-6 text-neutral-200">Danh mục</h3>
            <ul className="space-y-4">
              <li><Link href="/san-pham?category=vong-tay" className="text-neutral-400 text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Vòng tay</Link></li>
              <li><Link href="/san-pham?category=moc-khoa" className="text-neutral-400 text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Móc khóa</Link></li>
              <li><Link href="/san-pham?category=charm" className="text-neutral-400 text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Charm</Link></li>
            </ul>
          </div>

          {/* Links: Thong tin */}
          <div className="lg:col-span-2">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-6 text-neutral-200">Thông tin</h3>
            <ul className="space-y-4">
              <li><Link href="/gioi-thieu" className="text-neutral-400 text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Về Mushroomie</Link></li>
              <li><Link href="/tin-tuc" className="text-neutral-400 text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Tin tức</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className="text-neutral-400 text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Chính sách & Bảo mật</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-4">
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-6 text-neutral-200">Liên hệ</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-neutral-400 text-sm">
                <MapPin className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed hover:text-white transition-colors cursor-default">
                  Hẻm 2 tổ 11, phường Trảng Dài, thành phố Đồng Nai
                </span>
              </li>
              <li className="flex items-center gap-3 text-neutral-400 text-sm">
                <Phone className="w-5 h-5 text-neutral-500 shrink-0" />
                <a href="tel:+84848744060" className="hover:text-white transition-colors">
                  +84 84 874 4060
                </a>
              </li>
              <li className="flex items-center gap-3 text-neutral-400 text-sm">
                <Mail className="w-5 h-5 text-neutral-500 shrink-0" />
                <a href="mailto:mushroomie.vn@gmail.com" className="hover:text-white transition-colors">
                  mushroomie.vn@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-neutral-400 text-sm">
                <Globe className="w-5 h-5 text-neutral-500 shrink-0" />
                <a href="https://mushroomie.io.vn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  mushroomie.io.vn
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-neutral-800/60 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} Mushroomie. All rights reserved.
          </p>
          <div className="text-neutral-500 text-sm flex items-center gap-1">
            Made with <span className="text-red-500 animate-pulse">❤️</span> by Mushroomie Team
          </div>
        </div>
      </div>
    </footer>
  )
}

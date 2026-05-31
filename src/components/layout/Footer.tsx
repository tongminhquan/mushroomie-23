import Link from 'next/link'
import { MapPin, Phone, Mail, Globe } from 'lucide-react'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export default function Footer() {
  return (
    <footer>
      <AnimateOnScroll animation="fade-up">
        {/* Main Footer */}
        <div className="gradient-primary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
              {/* Brand */}
              <div className="lg:col-span-4">
                <Link href="/" className="inline-block mb-4">
                  <img src="/logo.png" alt="Mushroomie" className="h-14 brightness-0 invert" />
                </Link>
                <p className="text-white/80 text-sm leading-relaxed mb-5 max-w-xs">
                  Phụ kiện handmade cá nhân hóa dành cho giới trẻ. Mỗi sản phẩm là một câu chuyện, một kỷ niệm, một phần của bạn.
                </p>
                <div className="flex gap-3">
                  <a href="https://www.facebook.com/mushr00mie" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/20 hover:bg-white hover:text-primary rounded-full flex items-center justify-center transition-all backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://www.instagram.com/mushr00mie._/" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/20 hover:bg-white hover:text-primary rounded-full flex items-center justify-center transition-all backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="https://www.tiktok.com/@mushr00mie._?lang=vi-VN" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/20 hover:bg-white hover:text-primary rounded-full flex items-center justify-center transition-all backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  </a>
                  <a href="https://shopee.vn/shop/475544379" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 bg-white/20 hover:bg-white hover:text-[#EE4D2D] rounded-full flex items-center justify-center transition-all backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.525 4.563c1.4 0 2.537 1.262 2.537 2.819 0 .357-.057.7-.162 1.022h1.2c.675 0 1.225.602 1.225 1.344l-.525 6.312c-.075.675-.6 1.2-1.275 1.2H9.525c-.675 0-1.2-.525-1.275-1.2L7.725 9.748c0-.742.55-1.344 1.225-1.344h1.2a3.04 3.04 0 01-.163-1.022c0-1.557 1.138-2.82 2.538-2.82zm0 1.125c-.788 0-1.425.76-1.425 1.694 0 .358.088.696.244 1.022h2.362c.156-.326.244-.664.244-1.022 0-.935-.638-1.694-1.425-1.694z"/></svg>
                  </a>
                </div>
              </div>

              {/* Danh mục */}
              <div className="lg:col-span-2">
                <h4 className="font-heading font-bold text-base mb-4">Danh mục</h4>
                <ul className="space-y-2.5">
                  <li><Link href="/san-pham?category=vong-tay" className="text-white/75 hover:text-white text-sm transition-colors">Vòng tay</Link></li>
                  <li><Link href="/san-pham?category=moc-khoa" className="text-white/75 hover:text-white text-sm transition-colors">Móc khóa</Link></li>
                  <li><Link href="/san-pham?category=charm" className="text-white/75 hover:text-white text-sm transition-colors">Charm</Link></li>
                  <li><Link href="/san-pham" className="text-white/75 hover:text-white text-sm transition-colors">Tất cả sản phẩm</Link></li>
                </ul>
              </div>

              {/* Thông tin */}
              <div className="lg:col-span-2">
                <h4 className="font-heading font-bold text-base mb-4">Thông tin</h4>
                <ul className="space-y-2.5">
                  <li><Link href="/gioi-thieu" className="text-white/75 hover:text-white text-sm transition-colors">Về Mushroomie</Link></li>
                  <li><Link href="/tin-tuc" className="text-white/75 hover:text-white text-sm transition-colors">Tin tức</Link></li>
                  <li><Link href="/chinh-sach-bao-mat" className="text-white/75 hover:text-white text-sm transition-colors">Chính sách & Bảo mật</Link></li>
                  <li><Link href="/lien-he" className="text-white/75 hover:text-white text-sm transition-colors">Liên hệ</Link></li>
                </ul>
              </div>

              {/* Liên hệ */}
              <div className="lg:col-span-4">
                <h4 className="font-heading font-bold text-base mb-4">Liên hệ</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/80">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-yellow-300" />
                    Hẻm 2 tổ 11, phường Trảng Dài, thành phố Biên Hòa, tỉnh Đồng Nai
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <Phone size={16} className="shrink-0 text-yellow-300" />
                    <a href="tel:+84848744060" className="hover:text-white transition-colors">+84 848 744 060</a>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <Mail size={16} className="shrink-0 text-yellow-300" />
                    <a href="mailto:cskh@mushroomie.io.vn" className="hover:text-white transition-colors">cskh@mushroomie.io.vn</a>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <Globe size={16} className="shrink-0 text-yellow-300" />
                    <a href="https://mushroomie.io.vn" className="hover:text-white transition-colors">mushroomie.io.vn</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#a01515] text-white/70 text-xs py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} Mushroomie. Tất cả quyền được bảo lưu.</p>
            <p>Made with ❤️ by Mushroomie Team</p>
          </div>
        </div>
      </AnimateOnScroll>
    </footer>
  )
}

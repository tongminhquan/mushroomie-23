import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-4 bg-white/10 p-2 rounded-xl w-fit">
              <img src="/logo.png" alt="Mushroomie Logo" className="h-10 w-auto object-contain brightness-0 invert" />
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">Phu kien handmade ca nhan hoa danh cho gioi tre — noi moi san pham la mot cau chuyen rieng cua ban 💛</p>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-neutral-300">Danh muc</h3>
            <ul className="space-y-2">
              <li><Link href="/san-pham?category=vong-tay" className="text-neutral-400 text-sm hover:text-white transition-colors">Vong tay</Link></li>
              <li><Link href="/san-pham?category=moc-khoa" className="text-neutral-400 text-sm hover:text-white transition-colors">Moc khoa</Link></li>
              <li><Link href="/san-pham?category=charm" className="text-neutral-400 text-sm hover:text-white transition-colors">Charm</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-wider mb-4 text-neutral-300">Thong tin</h3>
            <ul className="space-y-2">
              <li><Link href="/gioi-thieu" className="text-neutral-400 text-sm hover:text-white transition-colors">Ve Mushroomie</Link></li>
              <li><Link href="/tin-tuc" className="text-neutral-400 text-sm hover:text-white transition-colors">Tin tuc</Link></li>
              <li><Link href="/lien-he" className="text-neutral-400 text-sm hover:text-white transition-colors">Lien he</Link></li>
              <li><Link href="/chinh-sach-bao-mat" className="text-neutral-400 text-sm hover:text-white transition-colors">Chinh sach & Bao mat</Link></li>
            </ul>
            <div className="mt-4">
              <p className="text-neutral-400 text-xs">📧 mushroomie.vn@gmail.com</p>
              <p className="text-neutral-400 text-xs mt-1">📞 0900 000 000</p>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-800 mt-8 pt-6 text-center">
          <p className="text-neutral-500 text-xs">© 2024 Mushroomie. Made with ❤️</p>
        </div>
      </div>
    </footer>
  )
}

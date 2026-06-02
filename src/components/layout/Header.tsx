'use client'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { ShoppingBag, Menu, X, User, Phone, Mail, Search, MapPin, ChevronDown, ChevronRight, ClipboardList } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import SafeEmail from '@/components/ui/SafeEmail'

export default function Header() {
  const { getTotalItems, toggleCart } = useCartStore()
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const categoryMenuRef = useRef<HTMLLIElement>(null)

  useEffect(() => { setMounted(true) }, [])
  const totalItems = mounted ? getTotalItems() : 0

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/san-pham?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowSearch(false)
    }
  }

  const [productCategories, setProductCategories] = useState<{ href: string, label: string, icon: string, image_url: string }[]>([
    { href: '/san-pham', label: 'Tất cả sản phẩm', icon: '', image_url: '' }
  ])

  useEffect(() => {
    fetch('/api/categories?type=product')
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          const cats = data.categories.map((c: any) => ({
            href: `/san-pham?category=${c.slug}`,
            label: c.name,
            icon: c.icon || '',
            image_url: c.image_url || ''
          }))
          setProductCategories([{ href: '/san-pham', label: 'Tất cả sản phẩm', icon: '', image_url: '' }, ...cats])
        }
      })
      .catch(err => console.error(err))
  }, [])

  const navLinks = [
    { href: '/', label: 'TRANG CHỦ' },
    { href: '/gioi-thieu', label: 'GIỚI THIỆU' },
    { href: '/tin-tuc', label: 'TIN TỨC' },
    { href: '/chinh-sach-tra-gop', label: 'TRẢ GÓP' },
    { href: '/lien-he', label: 'LIÊN HỆ' },
  ]

  return (
    <header className="w-full font-body">
      {/* 1. TOP BAR (Light Gray) */}
      <div className={`bg-neutral-100 text-neutral-600 text-xs hidden md:block border-b border-neutral-200 transition-all duration-300 ${isScrolled ? 'hidden' : 'block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="tel:+84848744060" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone size={12} /> Hotline: 0848 744 060
            </a>
            <SafeEmail email="cskh@mushroomie.io.vn" showIcon={true} className="flex items-center gap-1.5 hover:text-primary transition-colors" />
            <span className="flex items-center gap-1.5">
              <MapPin size={12} /> Hệ thống cửa hàng Mushroomie
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/chinh-sach-tra-gop" className="hover:text-primary transition-colors">Chính sách trả góp</Link>
            <Link href="/chinh-sach-doi-tra" className="hover:text-primary transition-colors">Bảo hành & Đổi trả</Link>
            <span className="text-neutral-300">|</span>
            <a href="https://www.facebook.com/mushr00mie" target="_blank" rel="noopener noreferrer" className="hover:text-[#1877F2]">Facebook</a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (White, Sticky) */}
      <div className={`bg-white sticky top-0 z-50 transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-neutral-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center justify-center relative h-12 w-32 md:h-16 md:w-40">
            <Image src="/logo.png" alt="Mushroomie Logo" fill className="object-contain" priority />
          </Link>

          {/* Search Bar (Center, huge) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <div className="flex w-full">
              <input
                type="text"
                name="search"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder=""
                className="w-full px-5 py-3 bg-white border-2 border-primary rounded-l-md text-sm focus:outline-none placeholder:text-neutral-400 font-medium"
              />
              <button type="submit" className="bg-primary hover:bg-primary-dark transition-colors px-6 text-white rounded-r-md flex items-center justify-center">
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Right Action Icons (Account, Cart) */}
          <div className="flex items-center gap-2 md:gap-6 shrink-0">
            {/* Mobile Search Toggle */}
            <button onClick={() => setShowSearch(!showSearch)} className="md:hidden p-2 text-neutral-700">
              <Search size={24} />
            </button>

            {/* Tracking Block */}
            <Link href="/tai-khoan/don-hang" className="hidden md:flex items-center gap-3 cursor-pointer group pr-4 md:border-r md:border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-primary group-hover:bg-primary-light transition-colors">
                <ClipboardList size={20} />
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-neutral-500 text-xs">Tra cứu</span>
                <span className="font-bold text-neutral-800 group-hover:text-primary transition-colors">Đơn hàng</span>
              </div>
            </Link>

            {/* Account Block */}
            <div className="hidden md:flex items-center gap-3 relative group cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-primary group-hover:bg-primary-light transition-colors">
                <User size={20} />
              </div>
              <div className="flex flex-col text-sm">
                <span className="text-neutral-500 text-xs">Tài khoản</span>
                <div className="font-bold text-neutral-800 flex items-center gap-1 group-hover:text-primary transition-colors">
                  {session ? session.user?.name?.split(' ')[0] : 'Đăng nhập'} <ChevronDown size={14} />
                </div>
              </div>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full pt-4 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-md shadow-xl border border-neutral-100 py-2">
                  {session ? (
                    <>
                      <Link href="/tai-khoan" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary">Tài khoản của tôi</Link>
                      <Link href="/tai-khoan/don-hang" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary">Đơn hàng của tôi</Link>
                      {['super_admin', 'admin', 'viewer'].includes((session.user as any)?.role) && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary font-bold">Quản trị viên</Link>
                      )}
                      <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 mt-1 border-t border-neutral-100 pt-2">Đăng xuất</button>
                    </>
                  ) : (
                    <>
                      <Link href="/tai-khoan/dang-nhap" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary">Đăng nhập</Link>
                      <Link href="/tai-khoan/dang-ky" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary">Đăng ký tài khoản</Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Cart Block */}
            <button type="button" onClick={toggleCart} className="flex items-center gap-3 cursor-pointer group bg-transparent border-none outline-none text-left">
              <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white group-hover:bg-primary-dark transition-colors">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FFB347] text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-sm">
                <span className="text-neutral-500 text-xs">Giỏ hàng</span>
                <span className="font-bold text-neutral-800 group-hover:text-primary transition-colors">Sản phẩm</span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expand */}
        {showSearch && (
          <div className="md:hidden px-4 pb-4 border-t border-neutral-100 bg-white">
            <form onSubmit={handleSearch} className="flex mt-3">
              <div className="flex w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-l-md text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button type="submit" className="bg-primary px-4 text-white rounded-r-md flex items-center justify-center">
                  <Search size={18} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 3. NAVIGATION BAR (Solid Red, Sticky) */}
      <nav className={`hidden md:block w-full bg-primary sticky top-[96px] z-40 shadow-sm transition-transform ${isScrolled ? '-translate-y-8' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center">
          <ul className="flex items-center h-full w-full justify-start gap-1">
            <li 
              ref={categoryMenuRef}
              className="h-full relative shrink-0"
            >
              <button 
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="h-full flex items-center gap-2 bg-primary-dark px-4 mr-2 text-white font-bold text-sm tracking-wide whitespace-nowrap"
              >
                <Menu size={20} /> DANH MỤC SẢN PHẨM
              </button>
              
              {/* Dropdown Menu */}
              <div className={`absolute top-full left-0 w-56 bg-white shadow-xl border border-neutral-100 transition-all duration-200 z-50 rounded-b-md overflow-hidden ${isCategoryOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <ul className="flex flex-col py-1">
                  {productCategories.map((cat, idx) => (
                    <li key={idx}>
                      <Link 
                        href={cat.href}
                        className="group flex items-center justify-between px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary transition-all duration-300 border-b border-neutral-50 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          {cat.image_url ? (
                            <div className="w-5 h-5 relative">
                              <Image src={cat.image_url} alt={cat.label} fill className="rounded object-cover" sizes="20px" />
                            </div>
                          ) : cat.icon ? (
                            <span>{cat.icon}</span>
                          ) : (
                            <div className="w-5 h-5 bg-neutral-100 rounded"></div>
                          )}
                          {cat.label}
                        </div>
                        <ChevronRight size={16} className="opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
            {navLinks.map((link) => (
              <li key={link.href} className="h-full">
                <Link 
                  href={link.href} 
                  className="h-full px-4 lg:px-6 flex items-center text-white text-sm font-bold tracking-wide hover:bg-primary-dark transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div className="w-[280px] h-full bg-white flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600">
                  <User size={20} />
                </div>
                {session ? (
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{session.user?.name}</span>
                    <button onClick={() => signOut()} className="text-xs text-red-500 text-left">Đăng xuất</button>
                  </div>
                ) : (
                  <Link href="/tai-khoan/dang-nhap" className="font-bold text-sm text-primary" onClick={() => setIsMenuOpen(false)}>
                    Đăng nhập / Đăng ký
                  </Link>
                )}
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white rounded-full border border-neutral-200 text-neutral-500"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className="block px-6 py-3.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 hover:text-primary transition-colors border-b border-neutral-50" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

'use client'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { ShoppingBag, Menu, X, User, Phone, Mail, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { getTotalItems, toggleCart } = useCartStore()
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const totalItems = getTotalItems()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/san-pham?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setShowSearch(false)
    }
  }

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/san-pham', label: 'Sản phẩm' },
    { href: '/tin-tuc', label: 'Tin tức' },
    { href: '/gioi-thieu', label: 'Giới thiệu' },
    { href: '/lien-he', label: 'Liên hệ' },
  ]

  return (
    <>
      {/* TOP BAR */}
      <div className={`gradient-primary text-white text-xs transition-all duration-300 overflow-hidden ${
        isScrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <a href="tel:+84848744060" className="flex items-center gap-1.5 hover:text-yellow-200 transition-colors">
              <Phone size={12} /> 0848 744 060
            </a>
            <a href="mailto:cskh@mushroomie.io.vn" className="hidden sm:flex items-center gap-1.5 hover:text-yellow-200 transition-colors">
              <Mail size={12} /> cskh@mushroomie.io.vn
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com/mushr00mie" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-200 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/mushr00mie._/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-200 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@mushr00mie._?lang=vi-VN" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-200 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo + Search + Icons row */}
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="flex items-center group shrink-0">
              <img src="/logo.png" alt="Mushroomie Logo" className="h-12 w-auto object-contain transition-transform group-hover:scale-105" />
            </Link>

            {/* Search bar - desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-auto">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-4 pr-12 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light placeholder:text-neutral-400"
                />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 gradient-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                  <Search size={14} className="text-white" />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2">
              {/* Search icon - mobile */}
              <button onClick={() => setShowSearch(!showSearch)} className="md:hidden p-2 rounded-full hover:bg-primary-light transition-colors" aria-label="Tìm kiếm">
                <Search size={20} className="text-neutral-700" />
              </button>
              <button onClick={toggleCart} className="relative p-2 rounded-full hover:bg-primary-light transition-colors" aria-label="Giỏ hàng">
                <ShoppingBag size={20} className="text-neutral-700" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 gradient-primary text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">{totalItems}</span>
                )}
              </button>
              {session ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-2 rounded-full hover:bg-primary-light transition-colors">
                    <User size={20} className="text-neutral-700" />
                    <span className="hidden lg:block text-sm font-semibold text-neutral-700">{session.user?.name?.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-2">
                      <Link href="/tai-khoan" className="block px-4 py-2 text-sm rounded-xl hover:bg-primary-light hover:text-primary transition-colors">Tài khoản của tôi</Link>
                      <Link href="/tai-khoan/don-hang" className="block px-4 py-2 text-sm rounded-xl hover:bg-primary-light hover:text-primary transition-colors">Đơn hàng</Link>
                      {(session.user as any)?.role === 'admin' && (
                        <Link href="/admin" className="block px-4 py-2 text-sm rounded-xl hover:bg-primary-light hover:text-primary transition-colors">Quản trị</Link>
                      )}
                      <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-2 text-sm rounded-xl hover:bg-red-50 hover:text-primary transition-colors mt-1 border-t border-neutral-100 pt-2">Đăng xuất</button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href="/tai-khoan/dang-nhap" className="hidden md:flex items-center gap-2 gradient-btn px-5 py-2 rounded-full text-sm font-semibold">
                  <User size={14} />Đăng nhập
                </Link>
              )}
              <button className="md:hidden p-2 rounded-full hover:bg-primary-light transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Bottom nav - Desktop */}
          <nav className={`hidden md:flex items-center justify-center gap-1 transition-all duration-300 ${
            isScrolled ? 'h-0 opacity-0 overflow-hidden' : 'h-11 opacity-100 border-t border-neutral-100'
          }`}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-4 py-2 text-sm font-bold text-neutral-700 hover:text-primary transition-colors relative group">
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 gradient-primary rounded-full group-hover:w-3/4 transition-all duration-300" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile search */}
        {showSearch && (
          <div className="md:hidden px-4 pb-3 border-t border-neutral-100">
            <form onSubmit={handleSearch} className="flex mt-3">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-4 pr-12 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                  <Search size={14} className="text-white" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-neutral-100 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block px-4 py-3 text-sm font-bold rounded-xl hover:bg-primary-light hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>{link.label}</Link>
              ))}
              {!session && (
                <Link href="/tai-khoan/dang-nhap" className="block px-4 py-3 text-sm font-bold text-primary rounded-xl bg-primary-light text-center mt-2" onClick={() => setIsMenuOpen(false)}>Đăng nhập</Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}

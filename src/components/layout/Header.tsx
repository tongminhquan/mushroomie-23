'use client'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { ShoppingBag, Menu, X, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { getTotalItems, toggleCart } = useCartStore()
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const totalItems = getTotalItems()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/san-pham', label: 'Sản phẩm' },
    { href: '/tin-tuc', label: 'Tin tức' },
    { href: '/gioi-thieu', label: 'Giới thiệu' },
    { href: '/lien-he', label: 'Liên hệ' },
  ]

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group">
            <img src="/logo.png" alt="Mushroomie Logo" className="h-14 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-semibold text-neutral-700 hover:text-primary transition-colors relative group">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleCart} className="relative p-2 rounded-full hover:bg-primary-light transition-colors" aria-label="Giỏ hàng">
              <ShoppingBag size={20} className="text-neutral-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{totalItems}</span>
              )}
            </button>
            {session ? (
              <div className="relative group">
                <button className="flex items-center gap-2 p-2 rounded-full hover:bg-primary-light transition-colors">
                  <User size={20} className="text-neutral-700" />
                  <span className="hidden md:block text-sm font-semibold text-neutral-700">{session.user?.name?.split(' ')[0]}</span>
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
              <Link href="/tai-khoan/dang-nhap" className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary-dark transition-colors">
                <User size={16} />Đăng nhập
              </Link>
            )}
            <button className="md:hidden p-2 rounded-full hover:bg-primary-light transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block px-4 py-3 text-sm font-semibold rounded-xl hover:bg-primary-light hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>{link.label}</Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

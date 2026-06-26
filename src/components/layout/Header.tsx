'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'
import SafeImage from '@/components/ui/SafeImage'

interface CategoryLink {
  href: string
  label: string
}

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/san-pham', label: 'Danh mục' },
  { href: '/gioi-thieu', label: 'Câu chuyện' },
  { href: '/mini-game', label: 'Mini game' },
  { href: '/voucher', label: 'Voucher' },
  { href: '/tin-tuc', label: 'Tin tức' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { getTotalItems, toggleCart } = useCartStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<CategoryLink[]>([])

  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/categories?type=product', { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data.categories)) return
        setCategories(data.categories.map((category: { slug: string; name: string }) => ({
          href: `/san-pham?category=${category.slug}`,
          label: category.name,
        })))
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== 'AbortError') console.error(error)
      })
    return () => controller.abort()
  }, [])

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    router.push(`/san-pham?search=${encodeURIComponent(query)}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const role = (session?.user as { role?: string } | undefined)?.role
  const isAdmin = role && ['super_admin', 'admin', 'viewer'].includes(role)
  const totalItems = hydrated ? getTotalItems() : 0

  return (
    <header className="relative z-50">
      <div className="sticky top-0 border-b border-[#ece0d6] bg-secondary/95 backdrop-blur-md">
        <div className="brand-container flex h-[68px] items-center gap-4 md:h-[72px]">

          {/* Mobile: hamburger */}
          <button
            type="button"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#ece0d6] text-text md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link href="/" className="relative h-10 w-28 shrink-0 md:h-11 md:w-32" aria-label="Mushroomie - Trang chủ">
            <SafeImage src="/logo.webp" fallbackSrc="/logo.webp" alt="Mushroomie" fill priority sizes="128px" className="object-contain" />
          </Link>

          {/* Desktop nav — centered */}
          <nav aria-label="Điều hướng chính" className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
            {navLinks.map((link) => {
              const isCategory = link.href === '/san-pham'
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
              if (isCategory) {
                return (
                  <div key={link.href} className="group relative">
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-10 items-center gap-1 rounded-xl px-3.5 text-sm font-bold transition ${
                        active ? 'text-primary' : 'text-text/80 hover:text-primary'
                      }`}
                    >
                      {link.label}
                      <ChevronDown size={14} className="transition group-hover:rotate-180" />
                    </Link>
                    {active && <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-full bg-primary" />}
                    {categories.length > 0 && (
                      <div className="invisible absolute left-0 top-full w-56 translate-y-2 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="rounded-2xl border border-[#ece0d6] bg-white p-2 shadow-hover">
                          <Link href="/san-pham" className="block rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-secondary">Tất cả sản phẩm</Link>
                          {categories.map((cat) => (
                            <Link key={cat.href} href={cat.href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-secondary hover:text-primary">
                              {cat.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-10 items-center rounded-xl px-3.5 text-sm font-bold transition ${
                    active ? 'text-primary' : 'text-text/80 hover:text-primary'
                  }`}
                >
                  {link.label}
                  {active && <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 rounded-full bg-primary" />}
                </Link>
              )
            })}
          </nav>

          {/* Right icons */}
          <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-1.5">
            {/* Search icon */}
            <button
              type="button"
              aria-label="Mở tìm kiếm"
              onClick={() => setSearchOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl text-text hover:bg-neutral-100"
            >
              <Search size={20} />
            </button>

            {/* User dropdown (desktop) */}
            <div className="group relative hidden md:block">
              <Link
                href={session ? '/tai-khoan' : '/tai-khoan/dang-nhap'}
                className="grid h-10 w-10 place-items-center rounded-xl text-text hover:bg-neutral-100"
                aria-label={session?.user?.name || 'Tài khoản'}
              >
                <User size={20} />
              </Link>
              <div className="invisible absolute right-0 top-full w-52 translate-y-2 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-2xl border border-[#ece0d6] bg-white p-2 shadow-hover">
                  {session ? (
                    <>
                      <p className="truncate px-3 py-2 text-xs font-extrabold text-kraft">{session.user?.name}</p>
                      <Link href="/tai-khoan" className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary">Hồ sơ của tôi</Link>
                      <Link href="/tai-khoan/don-hang" className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary">Đơn hàng của tôi</Link>
                      <Link href="/tai-khoan/voucher" className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary">Voucher của tôi</Link>
                      {isAdmin && <Link href="/admin" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-primary hover:bg-pink/40">Trang quản trị</Link>}
                      <div className="mt-1 border-t border-neutral-100 pt-1">
                        <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50">Đăng xuất</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link href="/tai-khoan/dang-nhap" className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary">Đăng nhập</Link>
                      <Link href="/tai-khoan/dang-ky" className="block rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-secondary">Tạo tài khoản</Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Cart */}
            <button
              type="button"
              onClick={toggleCart}
              aria-label={`Giỏ hàng, ${totalItems} sản phẩm`}
              className="relative grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-[0_4px_12px_rgba(228,29,29,0.25)] hover:bg-primary-dark transition"
            >
              <ShoppingBag size={19} />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-md bg-yellow px-1 text-[10px] font-black text-text ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable search bar */}
        {searchOpen && (
          <form onSubmit={submitSearch} className="brand-container pb-3">
            <div className="flex gap-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm vòng tay, móc khóa, charm..."
                className="h-11 flex-1 rounded-xl border border-[#ece0d6] bg-white px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button type="submit" className="rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark">
                Tìm
              </button>
              <button type="button" onClick={() => setSearchOpen(false)} className="grid h-11 w-11 place-items-center rounded-xl border border-[#ece0d6]">
                <X size={18} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[120] bg-black/35 md:hidden" onClick={() => setMenuOpen(false)}>
          <nav className="flex h-full w-[84%] max-w-sm flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#ece0d6] px-5 py-4">
              <SafeImage src="/logo.webp" fallbackSrc="/logo.webp" width={120} height={48} alt="Mushroomie" className="h-auto w-28" />
              <button aria-label="Đóng menu" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-0.5">
                {navLinks.map((link) => {
                  const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block rounded-xl px-4 py-3 text-sm font-extrabold transition ${active ? 'bg-pink/50 text-primary' : 'text-text hover:bg-secondary'}`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
              <div className="my-4 border-t border-neutral-100" />
              <div className="space-y-0.5">
                <Link href={session ? '/tai-khoan' : '/tai-khoan/dang-nhap'} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-text hover:bg-secondary">
                  {session ? `Xin chào, ${session.user?.name?.split(' ')[0]}` : 'Đăng nhập / Đăng ký'}
                </Link>
                <Link href="/tai-khoan/don-hang" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-text hover:bg-secondary">Tra cứu đơn hàng</Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-primary hover:bg-pink/40">Trang quản trị</Link>
                )}
                {session && (
                  <button onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }} className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50">
                    Đăng xuất
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

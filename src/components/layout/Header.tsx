'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  ChevronDown,
  ClipboardList,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { useCartStore } from '@/store/cart'

interface CategoryLink {
  href: string
  label: string
}

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/gioi-thieu', label: 'Câu chuyện' },
  { href: '/tin-tuc', label: 'Góc handmade' },
  { href: '/mini-game', label: 'Mini game' },
  { href: '/lien-he', label: 'Liên hệ' },
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
    <header className="relative z-50 border-b border-neutral-200/80 bg-white">
      <div className="hidden bg-text text-white md:block">
        <div className="brand-container flex h-9 items-center justify-between text-[11px] font-semibold">
          <p>Từ từng hạt nhỏ, tạo phong cách riêng.</p>
          <div className="flex items-center gap-5 text-white/70">
            <a href="tel:+84848744060" className="hover:text-white">0848 744 060</a>
            <Link href="/chinh-sach-doi-tra" className="hover:text-white">Đổi trả & bảo hành</Link>
          </div>
        </div>
      </div>

      <div className="sticky top-0 border-b border-neutral-100 bg-white/95 backdrop-blur-md">
        <div className="brand-container flex h-[74px] items-center gap-3 md:h-[82px] md:gap-6">
          <button
            type="button"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMenuOpen((value) => !value)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-neutral-200 text-text md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="relative h-11 w-28 shrink-0 md:h-14 md:w-36" aria-label="Mushroomie - Trang chủ">
            <Image src="/logo.png" alt="Mushroomie" fill priority sizes="144px" className="object-contain" />
          </Link>

          <form onSubmit={submitSearch} className="hidden flex-1 md:block">
            <div className="relative mx-auto max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Tìm sản phẩm"
                placeholder="Tìm vòng tay, móc khóa, charm..."
                className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-100/60 pl-11 pr-24 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              <button className="absolute right-1.5 top-1.5 h-8 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-dark">
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              aria-label="Mở tìm kiếm"
              onClick={() => setSearchOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-xl text-text hover:bg-neutral-100 md:hidden"
            >
              <Search size={20} />
            </button>
            <Link
              href="/tai-khoan/don-hang"
              aria-label="Đơn hàng"
              className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-text hover:bg-neutral-100 lg:flex"
            >
              <ClipboardList size={19} className="text-primary" />
              Đơn hàng
            </Link>
            <div className="group relative hidden md:block">
              <Link
                href={session ? '/tai-khoan' : '/tai-khoan/dang-nhap'}
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-text hover:bg-neutral-100"
              >
                <User size={19} className="text-primary" />
                <span className="max-w-24 truncate">{session?.user?.name?.split(' ')[0] || 'Tài khoản'}</span>
                <ChevronDown size={14} />
              </Link>
              <div className="invisible absolute right-0 top-full w-52 translate-y-2 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-xl border border-neutral-200 bg-white p-2 shadow-strong">
                  {session ? (
                    <>
                      <Link href="/tai-khoan" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-neutral-100">Hồ sơ của tôi</Link>
                      <Link href="/tai-khoan/don-hang" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-neutral-100">Đơn hàng của tôi</Link>
                      {isAdmin && <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-light">Trang quản trị</Link>}
                      <button onClick={() => signOut({ callbackUrl: '/' })} className="mt-1 w-full border-t border-neutral-100 px-3 pt-3 text-left text-sm font-semibold text-red-600">Đăng xuất</button>
                    </>
                  ) : (
                    <>
                      <Link href="/tai-khoan/dang-nhap" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-neutral-100">Đăng nhập</Link>
                      <Link href="/tai-khoan/dang-ky" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-neutral-100">Tạo tài khoản</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleCart}
              aria-label={`Giỏ hàng, ${totalItems} sản phẩm`}
              className="relative grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-[0_7px_16px_rgba(228,29,29,0.2)] hover:bg-primary-dark"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-md bg-yellow px-1 text-[10px] font-black text-text ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} className="brand-container pb-3 md:hidden">
            <div className="flex gap-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Tìm sản phẩm..."
                className="h-11 flex-1 rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-primary"
              />
              <button className="rounded-xl bg-primary px-4 font-bold text-white" aria-label="Tìm kiếm"><Search size={18} /></button>
            </div>
          </form>
        )}
      </div>

      <nav aria-label="Điều hướng chính" className="hidden bg-white md:block">
        <div className="brand-container flex h-12 items-center gap-1">
          <div className="group relative mr-2 h-full">
            <Link href="/san-pham" className="flex h-full items-center gap-2 border-b-2 border-primary px-3 text-sm font-extrabold text-primary">
              <Menu size={17} />
              Danh mục
            </Link>
            {categories.length > 0 && (
              <div className="invisible absolute left-0 top-full w-60 translate-y-2 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-xl border border-neutral-200 bg-white p-2 shadow-strong">
                  <Link href="/san-pham" className="block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-neutral-100">Tất cả sản phẩm</Link>
                  {categories.map((category) => (
                    <Link key={category.href} href={category.href} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-primary-light hover:text-primary">
                      {category.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {navLinks.filter((link) => link.href !== '/san-pham').map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full items-center border-b-2 px-3 text-sm font-bold transition ${
                  active ? 'border-primary text-primary' : 'border-transparent text-neutral-700 hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[120] bg-black/35 md:hidden" onClick={() => setMenuOpen(false)}>
          <nav className="h-full w-[84%] max-w-sm bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <Image src="/logo.png" width={128} height={52} alt="Mushroomie" className="h-auto w-28" />
              <button aria-label="Đóng menu" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-100"><X size={20} /></button>
            </div>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-extrabold text-text hover:bg-primary-light hover:text-primary">
                  {link.label}
                </Link>
              ))}
              <div className="my-3 border-t border-neutral-200" />
              <Link href={session ? '/tai-khoan' : '/tai-khoan/dang-nhap'} className="block rounded-xl px-4 py-3 text-sm font-bold">
                {session ? 'Tài khoản của tôi' : 'Đăng nhập / Đăng ký'}
              </Link>
              <Link href="/tai-khoan/don-hang" className="block rounded-xl px-4 py-3 text-sm font-bold">Tra cứu đơn hàng</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

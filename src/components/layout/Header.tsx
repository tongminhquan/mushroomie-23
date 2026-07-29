'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'
import {
  ChevronDown,
  ClipboardList,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import ThemeToggle from '@/components/theme/ThemeToggle'
import SafeImage from '@/components/ui/SafeImage'
import { useCartStore } from '@/store/cart'

interface CategoryLink {
  href: string
  label: string
}

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/gioi-thieu', label: 'Câu chuyện' },
  { href: '/tin-tuc', label: 'Tin tức' },
  { href: '/voucher', label: 'Voucher' },
  { href: '/mini-game', label: 'Mini game' },
  { href: '/lien-he', label: 'Liên hệ' },
]

export default function Header({ categories }: { categories: CategoryLink[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { getTotalItems, toggleCart } = useCartStore()
  const [menuOpen, setMenuOpen] = useState(false)
  // Giữ menu trong DOM hết hiệu ứng đóng — xem useDrawerTransition.
  const menu = useDrawerTransition(menuOpen)
  const [searchOpen, setSearchOpen] = useState(false)
  // Thanh tìm kiếm mobile: fade ngắn 150ms, không trượt cả chiều cao (xem .m-drawer-top).
  const search = useDrawerTransition(searchOpen, 150)
  const [searchQuery, setSearchQuery] = useState('')

  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )

  useEffect(() => {
    if (!menuOpen && !searchOpen) return

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      setSearchOpen(false)
    }

    if (menuOpen) document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen, searchOpen])

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query) return

    router.push(`/san-pham?search=${encodeURIComponent(query)}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const role = (session?.user as { role?: string } | undefined)?.role
  const isAdmin = Boolean(role && ['super_admin', 'admin', 'viewer'].includes(role))
  const totalItems = hydrated ? getTotalItems() : 0

  /**
   * Nhịp phản hồi khi giỏ hàng tăng.
   *
   * Khách bấm "Thêm vào giỏ" ở giữa trang, còn giỏ hàng nằm trên header — nếu không có
   * gì nối hai chỗ đó, thao tác quan trọng nhất của trang bán hàng trôi qua không dấu vết.
   *
   * Đếm số lần tăng rồi truyền vào `key` để React mount lại phần tử: CSS animation chỉ
   * chạy khi phần tử vừa xuất hiện hoặc vừa được gán class lần đầu, nên thêm thêm class
   * vào phần tử đang có sẵn class đó sẽ không chạy lại lần thứ hai.
   *
   * `previousItems` khởi tạo null để bỏ qua bước hydrate: giỏ hàng đọc từ localStorage
   * làm số nhảy 0 → N ngay khi tải trang, đó không phải hành động của người dùng và
   * không được nảy.
   */
  const [cartBump, setCartBump] = useState(0)
  const previousItems = useRef<number | null>(null)

  useEffect(() => {
    if (!hydrated) return
    if (previousItems.current === null) {
      previousItems.current = totalItems
      return
    }
    if (totalItems > previousItems.current) setCartBump((count) => count + 1)
    previousItems.current = totalItems
  }, [hydrated, totalItems])

  return (
    <header className="theme-transition relative z-50 border-b border-theme-border bg-theme-page text-theme-primary">
      <div className="hidden bg-text text-white md:block">
        <div className="brand-container flex h-9 items-center justify-between text-[11px] font-semibold">
          <p className="m-slogan-shimmer">Làm bằng tay, trao bằng tim</p>
          <div className="flex items-center gap-5 text-white/70">
            <a href="tel:+84947192590" className="hover:text-white">0947 192 590</a>
            <Link href="/chinh-sach-doi-tra" className="hover:text-white">Đổi trả & bảo hành</Link>
          </div>
        </div>
      </div>

      <div className="theme-transition border-b border-theme-border bg-theme-page/90 backdrop-blur-md">
        <div className="brand-container flex h-[74px] items-center gap-3 md:h-[82px] md:gap-6">
          <button
            type="button"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-main-navigation"
            onClick={() => setMenuOpen((value) => !value)}
            className="m-press grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-theme-border bg-theme-card text-theme-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 md:hidden"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="m-press relative h-11 w-28 shrink-0 md:h-14 md:w-36" aria-label="Mushroomie - Trang chủ">
            <SafeImage
              src="/logo.webp"
              fallbackSrc="/logo.webp"
              alt="Mushroomie"
              fill
              loading="eager"
              fetchPriority="low"
              sizes="144px"
              className="object-contain"
            />
          </Link>

          <form onSubmit={submitSearch} className="hidden flex-1 md:block">
            <div className="relative mx-auto max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                id="product-search-desktop"
                name="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Tìm sản phẩm"
                placeholder="Tìm vòng tay, móc khóa, charm..."
                className="theme-transition h-11 w-full rounded-xl border border-theme-border bg-theme-input pl-11 pr-24 text-sm text-theme-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <button
                className="absolute right-1.5 top-1.5 h-8 rounded-lg bg-primary px-4 text-xs font-bold text-white hover:bg-primary-dark"
                type="submit"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              aria-label="Mở tìm kiếm"
              aria-expanded={searchOpen}
              aria-controls="mobile-product-search"
              onClick={() => setSearchOpen((value) => !value)}
              className="m-press grid h-11 w-11 place-items-center rounded-xl text-theme-primary hover:bg-theme-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 md:hidden"
            >
              <Search size={20} />
            </button>
            <Link
              href="/tai-khoan/don-hang"
              aria-label="Đơn hàng"
              className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-theme-primary hover:bg-theme-subtle lg:flex"
            >
              <ClipboardList size={19} className="text-primary" />
              Đơn hàng
            </Link>
            <ThemeToggle variant="icon" className="hidden md:grid" />
            <div className="group relative hidden md:block">
              <Link
                href={session ? '/tai-khoan' : '/tai-khoan/dang-nhap'}
                aria-haspopup="menu"
                className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-theme-primary hover:bg-theme-subtle"
              >
                <User size={19} className="text-primary" />
                <span className="max-w-24 truncate">{session?.user?.name?.split(' ')[0] || 'Tài khoản'}</span>
                <ChevronDown size={14} />
              </Link>
              <div className="invisible absolute right-0 top-full w-52 translate-y-2 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="theme-transition rounded-xl border border-theme-border bg-theme-card p-2 text-theme-primary shadow-[var(--shadow-overlay-theme)]">
                  {session ? (
                    <>
                      <Link href="/tai-khoan" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-theme-subtle">Hồ sơ của tôi</Link>
                      <Link href="/tai-khoan/don-hang" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-theme-subtle">Đơn hàng của tôi</Link>
                      <Link href="/tai-khoan/voucher" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-theme-subtle">Voucher của tôi</Link>
                      {isAdmin && (
                        <Link href="/admin" className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-light">
                          Trang quản trị
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="mt-1 w-full border-t border-theme-border px-3 pt-3 text-left text-sm font-semibold text-red-500"
                        type="button"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/tai-khoan/dang-nhap" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-theme-subtle">Đăng nhập</Link>
                      <Link href="/tai-khoan/dang-ky" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-theme-subtle">Tạo tài khoản</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleCart}
              aria-label={`Giỏ hàng, ${totalItems} sản phẩm`}
              className="m-press relative grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-[0_7px_16px_rgba(228,29,29,0.2)] transition hover:bg-primary-dark"
            >
              <span key={`cart-${cartBump}`} className={cartBump > 0 ? 'm-cart-bounce' : undefined}>
                <ShoppingBag size={20} />
              </span>
              {totalItems > 0 && (
                <span
                  key={`badge-${cartBump}`}
                  className={`absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-md bg-yellow px-1 text-[10px] font-black text-text ring-2 ring-white${
                    cartBump > 0 ? ' m-badge-pop' : ''
                  }`}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {search.mounted && (
          <form
            id="mobile-product-search"
            onSubmit={submitSearch}
            data-drawer-state={search.state}
            className="m-drawer-top brand-container pb-3 md:hidden"
          >
            <div className="flex gap-2">
              <input
                id="product-search-mobile"
                name="search"
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Tìm sản phẩm"
                placeholder="Tìm sản phẩm..."
                className="theme-transition h-11 flex-1 rounded-xl border border-theme-border bg-theme-input px-4 text-sm text-theme-primary outline-none focus:border-primary"
              />
              <button className="rounded-xl bg-primary px-4 font-bold text-white" aria-label="Tìm kiếm" type="submit">
                <Search size={18} />
              </button>
            </div>
          </form>
        )}
      </div>

      <nav aria-label="Điều hướng chính" className="theme-transition hidden bg-theme-page md:block">
        <div className="brand-container flex h-12 items-center gap-1">
          <div className="group relative mr-2 h-full">
            <Link href="/san-pham" className="flex h-full items-center gap-2 border-b-2 border-primary px-3 text-sm font-extrabold text-primary">
              <Menu size={17} />
              Danh mục
            </Link>
            {categories.length > 0 && (
              <div className="invisible absolute left-0 top-full z-30 w-60 translate-y-2 pt-2 opacity-0 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div className="theme-transition rounded-xl border border-theme-border bg-theme-card p-2 text-theme-primary shadow-[var(--shadow-overlay-theme)]">
                  <Link href="/san-pham" className="block rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-theme-subtle">Tất cả sản phẩm</Link>
                  {categories.map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-theme-secondary hover:bg-primary-light hover:text-primary"
                    >
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
                aria-current={active ? 'page' : undefined}
                /* m-underline chỉ gắn cho mục KHÔNG active: mục đang mở đã có sẵn
                   border-bottom màu đỏ, thêm gạch chân chạy vào nữa sẽ thành hai vạch
                   chồng lên nhau. */
                className={`flex h-full items-center border-b-2 px-3 text-sm font-bold transition ${
                  active
                    ? 'border-primary text-primary'
                    : 'm-underline border-transparent text-theme-secondary hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {menu.mounted && (
        <div
          data-drawer-state={menu.state}
          className="m-backdrop fixed inset-0 z-[120] bg-black/35 md:hidden"
          onClick={() => setMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
        >
          <nav
            id="mobile-main-navigation"
            data-drawer-state={menu.state}
            className="theme-transition m-drawer m-drawer-left h-[100dvh] w-[84%] max-w-sm overflow-y-auto bg-theme-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-theme-primary shadow-[var(--shadow-overlay-theme)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <SafeImage src="/logo.webp" fallbackSrc="/logo.webp" width={128} height={52} alt="Mushroomie" className="h-auto w-28" />
              <button
                aria-label="Đóng menu"
                onClick={() => setMenuOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-xl bg-theme-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1">
              {navLinks.map((link) => {
                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-sm font-extrabold transition ${
                      active ? 'bg-primary-light text-primary' : 'text-theme-primary hover:bg-primary-light hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              <div className="my-3 border-t border-theme-border" />
              <ThemeToggle variant="segmented" className="rounded-xl bg-theme-subtle p-3" />
              <div className="my-3 border-t border-theme-border" />
              <Link
                href={session ? '/tai-khoan' : '/tai-khoan/dang-nhap'}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-bold"
              >
                {session ? 'Tài khoản của tôi' : 'Đăng nhập / Đăng ký'}
              </Link>
              <Link href="/tai-khoan/don-hang" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold">
                Tra cứu đơn hàng
              </Link>
              <Link href="/tai-khoan/voucher" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold">
                Voucher của tôi
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-primary">
                  Trang quản trị
                </Link>
              )}
              {session && (
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="block w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-600"
                  type="button"
                >
                  Đăng xuất
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

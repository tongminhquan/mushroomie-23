'use client'

import { useEffect, useState, type FormEventHandler } from 'react'
import Link from 'next/link'
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import ThemeToggle from '@/components/theme/ThemeToggle'
import BrandLogo from '@/components/ui/BrandLogo'

interface CompactHeaderProps {
  visible: boolean
  pathname: string
  searchQuery: string
  totalItems: number
  cartBump: number
  accountHref: string
  accountLabel: string
  menuOpen: boolean
  onMenuToggle: () => void
  onSearchQueryChange: (value: string) => void
  onSubmitSearch: FormEventHandler<HTMLFormElement>
  onCartToggle: () => void
}

const compactNavLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/tin-tuc', label: 'Tin tức' },
  { href: '/mini-game', label: 'Mini game' },
  { href: '/lien-he', label: 'Liên hệ' },
]

export default function CompactHeader({
  visible,
  pathname,
  searchQuery,
  totalItems,
  cartBump,
  accountHref,
  accountLabel,
  menuOpen,
  onMenuToggle,
  onSearchQueryChange,
  onSubmitSearch,
  onCartToggle,
}: CompactHeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const submitMobileSearch: FormEventHandler<HTMLFormElement> = (event) => {
    onSubmitSearch(event)
    setMobileSearchOpen(false)
  }

  useEffect(() => {
    if (!visible) setMobileSearchOpen(false)
  }, [visible])

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      data-compact-header={visible ? 'visible' : 'hidden'}
      className={`fixed inset-x-0 top-0 z-40 border-b border-theme-border bg-theme-page pt-[env(safe-area-inset-top)] text-theme-primary shadow-[var(--shadow-card-theme)] transition-[transform,opacity] duration-200 motion-reduce:transition-none ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-full opacity-0'
      }`}
    >
      <div className="brand-container flex h-16 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-main-navigation"
          onClick={onMenuToggle}
          className="m-press grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-theme-border bg-theme-card text-theme-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 md:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link
          href="/"
          aria-label="Mushroomie - Trang chủ"
          className="m-press relative h-10 w-[4.5rem] shrink-0 sm:w-24"
        >
          <BrandLogo
            alt="Mushroomie"
            fill
            sizes="96px"
            className="object-contain"
          />
        </Link>

        <nav
          aria-label="Điều hướng nhanh"
          className="ml-2 hidden h-full shrink-0 items-center xl:flex"
        >
          <Link
            href="/san-pham"
            aria-current={pathname.startsWith('/san-pham') ? 'page' : undefined}
            className={`flex h-full items-center gap-2 border-b-2 px-3 text-sm font-extrabold ${
              pathname.startsWith('/san-pham')
                ? 'border-primary text-primary'
                : 'border-transparent text-theme-secondary hover:text-primary'
            }`}
          >
            <Menu size={17} />
            Danh mục
          </Link>
          {compactNavLinks.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full items-center border-b-2 px-2.5 text-sm font-bold ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-theme-secondary hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/san-pham"
          className="ml-2 hidden h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-theme-primary hover:bg-theme-subtle md:flex xl:hidden"
        >
          <Menu size={17} className="text-primary" />
          Danh mục
        </Link>

        <form onSubmit={onSubmitSearch} className="mx-auto hidden min-w-0 max-w-sm flex-1 md:block">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted"
              size={17}
            />
            <input
              id="product-search-compact"
              name="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              aria-label="Tìm sản phẩm"
              placeholder="Tìm vòng tay, móc khóa, charm..."
              className="theme-transition h-10 w-full rounded-xl border border-theme-border bg-theme-input pl-10 pr-11 text-sm text-theme-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-lg bg-primary text-white hover:bg-primary-dark"
            >
              <Search size={16} />
            </button>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            aria-label={mobileSearchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
            aria-expanded={mobileSearchOpen}
            aria-controls="compact-mobile-product-search"
            onClick={() => setMobileSearchOpen((open) => !open)}
            className="m-press grid h-11 w-11 place-items-center rounded-xl text-theme-primary hover:bg-theme-subtle md:hidden"
          >
            <Search size={20} />
          </button>

          <ThemeToggle variant="icon" />

          <Link
            href={accountHref}
            aria-label="Tài khoản"
            className="m-press flex h-11 items-center gap-2 rounded-xl px-3 text-theme-primary hover:bg-theme-subtle"
          >
            <User size={19} className="text-primary" />
            <span className="hidden max-w-24 truncate text-sm font-bold lg:block">{accountLabel}</span>
          </Link>

          <button
            type="button"
            onClick={onCartToggle}
            aria-label={`Giỏ hàng, ${totalItems} sản phẩm`}
            className="m-press relative grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-[0_7px_16px_rgba(228,29,29,0.2)] hover:bg-primary-dark"
          >
            <span key={`compact-cart-${cartBump}`} className={cartBump > 0 ? 'm-cart-bounce' : undefined}>
              <ShoppingBag size={20} />
            </span>
            {totalItems > 0 && (
              <span
                key={`compact-badge-${cartBump}`}
                className={`absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-md bg-yellow px-1 text-[10px] font-black text-text ring-2 ring-theme-page${
                  cartBump > 0 ? ' m-badge-pop' : ''
                }`}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <form
          id="compact-mobile-product-search"
          onSubmit={submitMobileSearch}
          className="theme-transition border-t border-theme-border bg-theme-page px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-lg gap-2">
            <input
              name="search"
              autoFocus
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              aria-label="Tìm sản phẩm"
              placeholder="Tìm sản phẩm..."
              className="theme-transition h-11 min-w-0 flex-1 rounded-xl border border-theme-border bg-theme-input px-4 text-sm text-theme-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white hover:bg-primary-dark"
            >
              <Search size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

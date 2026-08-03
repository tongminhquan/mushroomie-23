'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useSession } from 'next-auth/react'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { items, isOpen: cartOpen, openCart } = useCartStore()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const { data: session } = useSession()

  const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Sản phẩm', href: '/san-pham', icon: Search },
    { name: 'Giỏ hàng', href: '#', icon: ShoppingBag, onClick: openCart, badge: totalItems },
    { name: 'Tài khoản', href: session ? '/tai-khoan' : '/tai-khoan/dang-nhap', icon: User },
  ]

  const isRouteActive = (href: string) =>
    href === '/' ? pathname === '/' : href !== '#' && (pathname === href || pathname.startsWith(`${href}/`))

  return (
    <nav
      aria-label="Điều hướng nhanh trên di động"
      className="theme-transition fixed bottom-0 left-0 right-0 z-50 border-t border-theme-border bg-theme-page/90 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-card-theme)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center justify-between">
        {navItems.map((item, index) => {
          const isActive = item.onClick ? cartOpen : isRouteActive(item.href)
          const Icon = item.icon

          if (item.onClick) {
            return (
              <button
                key={index}
                onClick={(event) => {
                  event.preventDefault()
                  item.onClick()
                }}
                aria-expanded={cartOpen}
                aria-label={`${item.name}${item.badge ? `, ${item.badge} sản phẩm` : ''}`}
                className="m-press group relative flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <div className={`rounded-xl p-1.5 transition duration-200 ${isActive ? 'bg-primary-light text-theme-accent' : 'text-theme-muted group-hover:bg-theme-card group-hover:text-theme-accent'}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-bold transition-colors ${isActive ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-accent'}`}>{item.name}</span>
              </button>
            )
          }

          return (
            <Link
              key={index}
              href={item.href}
              prefetch={false}
              aria-current={isActive ? 'page' : undefined}
              className="m-press group flex min-h-14 min-w-16 flex-col items-center justify-center gap-0.5 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <div className={`rounded-xl p-1.5 transition duration-200 ${isActive ? 'bg-primary-light text-theme-accent' : 'text-theme-muted group-hover:bg-theme-card group-hover:text-theme-accent'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[11px] font-bold transition-colors ${isActive ? 'text-theme-accent' : 'text-theme-muted group-hover:text-theme-accent'}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

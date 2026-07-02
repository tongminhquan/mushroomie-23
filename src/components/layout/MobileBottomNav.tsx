'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useSession } from 'next-auth/react'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { items, openCart } = useCartStore()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const { data: session } = useSession()

  const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Sản phẩm', href: '/san-pham', icon: Search },
    { name: 'Giỏ hàng', href: '#', icon: ShoppingBag, onClick: openCart, badge: totalItems },
    { name: 'Tài khoản', href: session ? '/tai-khoan' : '/tai-khoan/dang-nhap', icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-border bg-secondary/88 px-6 py-3 shadow-[0_-4px_20px_rgba(91,48,35,0.07)] backdrop-blur-md md:hidden">
      <div className="flex items-center justify-between">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          if (item.onClick) {
            return (
              <button
                key={index}
                onClick={(event) => {
                  event.preventDefault()
                  item.onClick()
                }}
                className="group relative flex flex-col items-center gap-1"
              >
                <div className={`rounded-xl p-2 transition-all duration-300 ${isActive ? 'scale-110 bg-primary-light text-primary' : 'text-neutral-500 group-hover:bg-white group-hover:text-primary'}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-primary' : 'text-neutral-500 group-hover:text-primary'}`}>{item.name}</span>
              </button>
            )
          }

          return (
            <Link key={index} href={item.href} className="group flex flex-col items-center gap-1">
              <div className={`rounded-xl p-2 transition-all duration-300 ${isActive ? 'scale-110 bg-primary-light text-primary' : 'text-neutral-500 group-hover:bg-white group-hover:text-primary'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-primary' : 'text-neutral-500 group-hover:text-primary'}`}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

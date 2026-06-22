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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary/85 backdrop-blur-md border-t border-[#f0e0d6] z-50 px-6 py-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          if (item.onClick) {
            return (
              <button key={index} onClick={(e) => { e.preventDefault(); item.onClick(); }} className="flex flex-col items-center gap-1 relative group">
                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-light text-primary scale-110' : 'text-neutral-500 group-hover:bg-neutral-50 group-hover:text-primary'}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm animate-pulse-glow">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-primary' : 'text-neutral-500 group-hover:text-primary'}`}>{item.name}</span>
              </button>
            )
          }

          return (
            <Link key={index} href={item.href} className="flex flex-col items-center gap-1 group">
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-light text-primary scale-110' : 'text-neutral-500 group-hover:bg-neutral-50 group-hover:text-primary'}`}>
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

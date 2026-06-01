'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Package, FileText, ShoppingCart,
  MessageSquare, Star, LogOut, ChevronRight, ExternalLink,
  CreditCard, Activity, Settings, Image, Users, ClipboardList
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/san-pham', icon: Package, label: 'Sản phẩm' },
  { href: '/admin/bai-viet', icon: FileText, label: 'Bài viết' },
  { href: '/admin/don-hang', icon: ShoppingCart, label: 'Đơn hàng' },
  { href: '/admin/thanh-toan', icon: CreditCard, label: 'Thanh toán', exact: true },
  { href: '/admin/thanh-toan/webhook-logs', icon: Activity, label: 'Webhook Logs' },
  { href: '/admin/lien-he', icon: MessageSquare, label: 'Liên hệ' },
  { href: '/admin/danh-gia', icon: Star, label: 'Đánh giá' },
  { href: '/admin/banner', icon: Image, label: 'Banners' },
  { href: '/admin/tai-khoan', icon: Users, label: 'Tài khoản' },
  { href: '/admin/nhat-ky', icon: ClipboardList, label: 'Nhật ký HĐ' },
  { href: '/admin/cai-dat', icon: Settings, label: 'Cài đặt' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const filteredNavItems = navItems.filter(item => {
    if ((item.href === '/admin/tai-khoan' || item.href === '/admin/nhat-ky') && role !== 'super_admin') {
      return false
    }
    return true
  })

  // Đóng menu khi chuyển trang trên mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* Nút Hamburger cho Mobile */}
      <button 
        className="md:hidden fixed top-3 left-4 z-40 bg-white text-neutral-900 p-2 rounded-xl shadow-md border border-neutral-200"
        onClick={() => setIsOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      {/* Backdrop (Lớp phủ nền đen khi mở sidebar) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar chính */}
      <aside className={cn(
        "w-64 bg-neutral-900 min-h-screen flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl flex items-center justify-center">
              <img src="/logo.png" alt="Mushroomie Logo" className="h-7 w-auto object-contain" />
            </div>
            <div className="text-neutral-500 text-xs font-semibold uppercase tracking-wider">Admin Panel</div>
          </Link>
          <button className="md:hidden text-neutral-400 p-1" onClick={() => setIsOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
              isActive(item.href, item.exact)
                ? 'bg-primary text-white shadow-sm'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            )}
          >
            <item.icon size={18} />
            <span className="text-sm font-medium flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800 space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all text-sm">
          <ExternalLink size={18} />
          Xem website
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:bg-red-900/30 hover:text-red-400 transition-all text-sm"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
    </>
  )
}

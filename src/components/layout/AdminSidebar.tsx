'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  LayoutDashboard, Package, FileText, ShoppingCart,
  MessageSquare, Star, LogOut, ChevronRight, ExternalLink,
  CreditCard, Activity, Settings, ImageIcon, Users, ClipboardList, FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/san-pham', icon: Package, label: 'Sản phẩm' },
  { href: '/admin/bai-viet', icon: FileText, label: 'Bài viết' },
  { href: '/admin/don-hang', icon: ShoppingCart, label: 'Đơn hàng' },
  { href: '/admin/thanh-toan', icon: CreditCard, label: 'Thanh toán', exact: true },
  { href: '/admin/thanh-toan/webhook-logs', icon: Activity, label: 'Webhook Logs' },
  { href: '/admin/lien-he', icon: MessageSquare, label: 'Liên hệ' },
  { href: '/admin/danh-gia', icon: Star, label: 'Đánh giá' },
  { href: '/admin/banner', icon: ImageIcon, label: 'Banners' },
  { href: '/admin/thu-vien', icon: FolderOpen, label: 'Thư viện' },
  { href: '/admin/tai-khoan', icon: Users, label: 'Tài khoản' },
  { href: '/admin/nhat-ky', icon: ClipboardList, label: 'Nhật ký HĐ' },
  { href: '/admin/cai-dat', icon: Settings, label: 'Cài đặt' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

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
        "h-screen flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none overflow-hidden border-r border-neutral-200 bg-white",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Logo */}
        <div className={cn("flex h-[77px] items-center border-b border-neutral-200 transition-all duration-300", isCollapsed ? "justify-center" : "justify-between px-5")}>
          <Link href="/admin" className={cn("flex items-center gap-3 overflow-hidden", isCollapsed ? "hidden" : "flex")}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
              <Image src="/logo.png" alt="Mushroomie" width={40} height={40} className="h-9 w-9 object-contain" />
            </div>
            <div className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.1em] text-primary">
              Quản trị
            </div>
          </Link>
          <button 
            className="hidden p-2 text-neutral-400 hover:text-primary md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <svg className={cn("w-5 h-5 transition-transform duration-300", isCollapsed ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button className="md:hidden text-neutral-400 p-1 mr-4" onClick={() => setIsOpen(false)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

      {/* Nav */}
      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            title={item.label}
            className={cn(
              'flex items-center gap-3 py-3 rounded-xl transition-all group',
              isCollapsed ? 'justify-center px-3' : 'px-4',
              isActive(item.href, item.exact)
                ? 'bg-primary-light text-primary'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            )}
          >
            <item.icon size={isCollapsed ? 22 : 18} className="flex-shrink-0 transition-all duration-300" />
            <span className={cn("text-sm font-medium whitespace-nowrap transition-all duration-300", isCollapsed ? "w-0 opacity-0 overflow-hidden" : "flex-1 opacity-100")}>
              {item.label}
            </span>
            <ChevronRight size={14} className={cn("transition-all duration-300 flex-shrink-0", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-0 group-hover:opacity-100")} />
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-neutral-200 p-3">
        <Link href="/" target="_blank" title="Xem website" className={cn("flex items-center gap-3 py-3 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-all text-sm", isCollapsed ? "justify-center px-3" : "px-4")}>
          <ExternalLink size={isCollapsed ? 22 : 18} className="flex-shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Xem website</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          title="Đăng xuất"
          className={cn("w-full flex items-center gap-3 py-3 rounded-xl text-neutral-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm", isCollapsed ? "justify-center px-3" : "px-4")}
        >
          <LogOut size={isCollapsed ? 22 : 18} className="flex-shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
        </button>
      </div>
    </aside>
    </>
  )
}

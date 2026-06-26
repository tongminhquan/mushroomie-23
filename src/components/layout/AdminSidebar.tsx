'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  Activity,
  ChevronRight,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileText,
  FolderOpen,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Star,
  TicketPercent,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const navGroups = [
  {
    label: 'TỔNG QUAN',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { href: '/admin/don-hang', icon: ShoppingCart, label: 'Đơn hàng' },
      { href: '/admin/thanh-toan', icon: CreditCard, label: 'Thanh toán', exact: true },
    ],
  },
  {
    label: 'CỬA HÀNG',
    items: [
      { href: '/admin/san-pham', icon: Package, label: 'Sản phẩm' },
      { href: '/admin/banner', icon: ImageIcon, label: 'Banner' },
      { href: '/admin/voucher', icon: TicketPercent, label: 'Voucher' },
      { href: '/admin/voucher-history', icon: Activity, label: 'Lịch sử voucher' },
      { href: '/admin/thanh-toan/webhook-logs', icon: Activity, label: 'Webhook Logs' },
    ],
  },
  {
    label: 'NỘI DUNG & HỆ THỐNG',
    items: [
      { href: '/admin/bai-viet', icon: FileText, label: 'Bài viết' },
      { href: '/admin/thu-vien', icon: FolderOpen, label: 'Media' },
      { href: '/admin/danh-gia', icon: Star, label: 'Đánh giá' },
      { href: '/admin/lien-he', icon: MessageSquare, label: 'Liên hệ' },
      { href: '/admin/tai-khoan', icon: Users, label: 'Người dùng', superAdminOnly: true },
      { href: '/admin/nhat-ky', icon: ClipboardList, label: 'Nhật ký HĐ', superAdminOnly: true },
      { href: '/admin/cai-dat', icon: Settings, label: 'Cài đặt' },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)

  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if ((item as any).superAdminOnly && role !== 'super_admin') return false
      return true
    }),
  })).filter((group) => group.items.length > 0)

  return (
    <>
      <button
        className="fixed left-4 top-3 z-40 rounded-xl border-[1.5px] border-[#f0e0d6] bg-white p-2 text-neutral-900 shadow-card md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Mở menu admin"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-shrink-0 transform flex-col overflow-hidden border-r-[1.5px] border-[#f0e0d6] bg-white shadow-card transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-64',
        )}
      >
        <div className={cn('flex h-[77px] flex-shrink-0 items-center border-b-[1.5px] border-[#f0e0d6]', isCollapsed ? 'justify-center' : 'justify-between px-5')}>
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
              <Image src="/logo.webp" alt="Mushroomie" width={40} height={40} className="h-9 w-9 object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-heading text-[15px] text-primary">Mushroomie</span>
                <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.12em] text-neutral-400">Quản trị</span>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <button
              className="hidden rounded-lg p-2 text-neutral-400 transition-colors hover:bg-secondary hover:text-primary md:flex"
              onClick={() => setIsCollapsed(true)}
              aria-label="Thu gọn menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button className="mr-4 rounded-lg p-1 text-neutral-400 transition-colors hover:text-primary md:hidden" onClick={() => setIsOpen(false)} aria-label="Đóng menu admin">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-3">
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              title="Mở rộng menu"
              aria-label="Mở rộng menu"
              className="hidden w-full items-center justify-center rounded-xl px-3 py-3 text-neutral-400 transition-all hover:bg-secondary hover:text-primary md:flex"
            >
              <ChevronRight size={20} className="flex-shrink-0" />
            </button>
          )}
          {filteredGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!isCollapsed && (
                <p className="mb-1 px-4 text-[10px] font-extrabold uppercase tracking-[0.1em] text-neutral-400">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    title={item.label}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl py-2.5 transition-all',
                      isCollapsed ? 'justify-center px-3' : 'px-4',
                      isActive(item.href, (item as { exact?: boolean }).exact)
                        ? 'bg-primary text-white shadow-card'
                        : 'text-neutral-600 hover:bg-secondary hover:text-primary',
                    )}
                  >
                    <item.icon size={isCollapsed ? 20 : 17} className="flex-shrink-0 transition-all duration-300" />
                    <span className={cn('whitespace-nowrap text-sm font-medium transition-all duration-300', isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'flex-1 opacity-100')}>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t-[1.5px] border-[#f0e0d6] p-3">
          <Link href="/" target="_blank" title="Xem website" className={cn('flex items-center gap-3 rounded-xl py-3 text-sm text-neutral-500 transition-all hover:bg-secondary hover:text-primary', isCollapsed ? 'justify-center px-3' : 'px-4')}>
            <ExternalLink size={isCollapsed ? 22 : 18} className="flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Xem website</span>}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            title="Đăng xuất"
            className={cn('flex w-full items-center gap-3 rounded-xl py-3 text-sm text-neutral-500 transition-all hover:bg-[#ffece6] hover:text-primary', isCollapsed ? 'justify-center px-3' : 'px-4')}
          >
            <LogOut size={isCollapsed ? 22 : 18} className="flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

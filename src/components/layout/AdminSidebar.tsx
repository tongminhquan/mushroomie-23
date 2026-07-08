'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
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

interface AdminNavItem {
  href: string
  icon: LucideIcon
  label: string
  exact?: boolean
  superAdminOnly?: boolean
}

interface AdminNavGroup {
  label: string
  items: AdminNavItem[]
}

const sidebarSurface =
  'bg-[radial-gradient(circle_at_15%_0%,rgba(255,214,214,0.75),transparent_28%),linear-gradient(180deg,#fffaf6_0%,#fff7f2_52%,#fff_100%)]'

const navGroups: AdminNavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
      { href: '/admin/don-hang', icon: ShoppingCart, label: 'Đơn hàng' },
      { href: '/admin/thanh-toan', icon: CreditCard, label: 'Thanh toán', exact: true },
    ],
  },
  {
    label: 'Cửa hàng',
    items: [
      { href: '/admin/san-pham', icon: Package, label: 'Sản phẩm' },
      { href: '/admin/banner', icon: ImageIcon, label: 'Banner' },
      { href: '/admin/voucher', icon: TicketPercent, label: 'Voucher' },
      { href: '/admin/voucher-history', icon: Activity, label: 'Lịch sử voucher' },
      { href: '/admin/thanh-toan/webhook-logs', icon: Activity, label: 'Webhook logs' },
    ],
  },
  {
    label: 'Nội dung & hệ thống',
    items: [
      { href: '/admin/bai-viet', icon: FileText, label: 'Bài viết' },
      { href: '/admin/thu-vien', icon: FolderOpen, label: 'Thư viện' },
      { href: '/admin/danh-gia', icon: Star, label: 'Đánh giá' },
      { href: '/admin/lien-he', icon: MessageSquare, label: 'Liên hệ' },
      { href: '/admin/tai-khoan', icon: Users, label: 'Người dùng', superAdminOnly: true },
      { href: '/admin/nhat-ky', icon: ClipboardList, label: 'Nhật ký hoạt động', superAdminOnly: true },
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

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.superAdminOnly || role === 'super_admin'),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <button
        className="fixed left-4 top-3 z-40 grid h-11 w-11 place-items-center rounded-2xl border border-warm-border bg-white text-neutral-900 shadow-[0_12px_28px_rgba(91,48,35,0.12)] transition active:scale-95 md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Mở menu admin"
        type="button"
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
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-shrink-0 transform flex-col overflow-visible border-r border-[#ead8cd] shadow-[16px_0_40px_rgba(91,48,35,0.10)] transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none',
          sidebarSurface,
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[78px]' : 'w-[274px]',
        )}
      >
        <div
          className={cn(
            'relative flex h-[86px] flex-shrink-0 items-center border-b border-[#f0dfd4]',
            isCollapsed ? 'justify-center' : 'justify-between px-4',
          )}
        >
          <Link
            href="/admin"
            className={cn(
              'group flex min-w-0 items-center rounded-[22px] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
              isCollapsed ? 'justify-center' : 'gap-3 px-2 py-2',
            )}
          >
            <div className="relative grid h-12 w-12 flex-shrink-0 place-items-center rounded-[18px] border border-white bg-white shadow-[0_12px_26px_rgba(185,121,75,0.16)] transition group-hover:-translate-y-0.5">
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-primary" aria-hidden />
              <Image src="/logo.webp" alt="Mushroomie" width={44} height={44} className="h-10 w-10 object-contain" priority />
            </div>
            {!isCollapsed && (
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-heading text-[18px] leading-none text-primary">Mushroomie</span>
                <span className="mt-1 truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-kraft">
                  Admin studio
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button
              className="hidden h-9 w-9 items-center justify-center rounded-2xl border border-warm-border bg-white text-accent-kraft shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 md:flex"
              onClick={() => setIsCollapsed(true)}
              aria-label="Thu gọn menu"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <button
            className="mr-2 rounded-xl p-2 text-neutral-500 transition-colors hover:bg-white hover:text-primary md:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="Đóng menu admin"
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto overflow-x-visible px-3 py-4">
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              title="Mở rộng menu"
              aria-label="Mở rộng menu"
              className="mb-3 hidden h-11 w-full items-center justify-center rounded-2xl border border-[#ead8cd] bg-white/88 text-accent-kraft shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 md:flex"
              type="button"
            >
              <ChevronRight size={20} className="flex-shrink-0" />
            </button>
          )}

          {filteredGroups.map((group) => (
            <div key={group.label} className={cn('relative', isCollapsed ? 'mb-3' : 'mb-5')}>
              {!isCollapsed && (
                <div className="mb-2 flex items-center gap-2 px-3">
                  <span className="h-px flex-1 bg-[#ead8cd]" />
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-kraft/80">
                    {group.label}
                  </p>
                  <span className="h-px flex-1 bg-[#ead8cd]" />
                </div>
              )}
              <div className={cn('space-y-1.5', isCollapsed && 'flex flex-col items-center')}>
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      title={item.label}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 overflow-visible rounded-[18px] py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
                        isCollapsed ? 'h-11 w-11 justify-center px-0' : 'px-3.5',
                        active
                          ? 'bg-primary text-white shadow-[0_14px_30px_rgba(228,29,29,0.24)]'
                          : 'text-neutral-600 hover:-translate-y-0.5 hover:bg-white/90 hover:text-primary hover:shadow-[0_10px_24px_rgba(91,48,35,0.08)]',
                      )}
                    >
                      {active && !isCollapsed && (
                        <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-white/85" aria-hidden />
                      )}
                      <span
                        className={cn(
                          'grid h-8 w-8 flex-shrink-0 place-items-center rounded-[14px] transition-all duration-200',
                          active
                            ? 'bg-white/18 text-white'
                            : 'bg-white text-accent-kraft shadow-[inset_0_0_0_1px_rgba(236,224,214,0.9)] group-hover:text-primary',
                        )}
                      >
                        <item.icon size={isCollapsed ? 21 : 17} strokeWidth={2.2} />
                      </span>
                      <span
                        className={cn(
                          'min-w-0 whitespace-nowrap transition-all duration-200',
                          isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'flex-1 truncate opacity-100',
                        )}
                      >
                        {item.label}
                      </span>
                      <ChevronRight
                        size={15}
                        className={cn(
                          'flex-shrink-0 transition-all duration-200',
                          isCollapsed ? 'hidden' : active ? 'opacity-80' : 'opacity-0 group-hover:translate-x-0.5 group-hover:opacity-80',
                        )}
                      />
                      {isCollapsed && (
                        <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-xl border border-warm-border bg-white px-3 py-2 text-xs font-bold text-neutral-700 opacity-0 shadow-[0_12px_28px_rgba(91,48,35,0.14)] transition group-hover:opacity-100 group-focus-visible:opacity-100">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#ead8cd] bg-white/80 p-3 backdrop-blur">
          {!isCollapsed && (
            <div className="mb-3 rounded-[20px] border border-[#f0dfd4] bg-[#fff7f2] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary">Studio Mushroomie</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-500">Quản lý cửa hàng thủ công, đơn hàng và nội dung.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Link
              href="/"
              target="_blank"
              title="Xem website"
              className={cn(
                'group relative flex items-center gap-3 rounded-[18px] py-2.5 text-sm font-semibold text-neutral-500 transition-all hover:bg-white hover:text-primary hover:shadow-[0_10px_24px_rgba(91,48,35,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
                isCollapsed ? 'h-11 justify-center px-0' : 'px-3.5',
              )}
            >
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[14px] bg-white text-accent-kraft shadow-[inset_0_0_0_1px_rgba(236,224,214,0.9)] group-hover:text-primary">
                <ExternalLink size={isCollapsed ? 21 : 17} strokeWidth={2.2} />
              </span>
              {!isCollapsed && <span className="whitespace-nowrap">Xem website</span>}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              title="Đăng xuất"
              className={cn(
                'group flex w-full items-center gap-3 rounded-[18px] py-2.5 text-sm font-semibold text-neutral-500 transition-all hover:bg-[#fff0ed] hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
                isCollapsed ? 'h-11 justify-center px-0' : 'px-3.5',
              )}
              type="button"
            >
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[14px] bg-white text-accent-kraft shadow-[inset_0_0_0_1px_rgba(236,224,214,0.9)] group-hover:text-primary">
                <LogOut size={isCollapsed ? 21 : 17} strokeWidth={2.2} />
              </span>
              {!isCollapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

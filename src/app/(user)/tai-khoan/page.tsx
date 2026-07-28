import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, User as UserIcon, Settings, Shield } from 'lucide-react'
import { SignOutButton } from '@/components/layout/SignOutButton'
import { EditProfileForm } from '@/components/account/EditProfileForm'
import { AvatarUpload } from '@/components/account/AvatarUpload'
import AnimateOnScroll from '@/components/ui/AnimateOnScroll'

export const metadata = {
  title: 'Tài khoản của tôi | Mushroomie',
}

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/tai-khoan/dang-nhap')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      _count: {
        select: { orders: true }
      }
    }
  })

  if (!user) {
    redirect('/tai-khoan/dang-nhap')
  }

  return (
    <div className="bg-secondary min-h-[70vh]">
      {/* Cream hero */}
      <section
        className="relative overflow-hidden border-b border-[#f0e0d6]"
        style={{ background: 'radial-gradient(120% 130% at 85% 0%, #ffeee6, var(--color-secondary))' }}
      >
        <span className="animate-float-soft pointer-events-none absolute right-[12%] top-[28%] text-2xl text-primary" aria-hidden>
          🍄
        </span>
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <AnimateOnScroll animation="fade-down">
            <p className="text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2">
              Tài khoản thành viên
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl text-neutral-800 mb-2">Tài khoản của tôi</h1>
            <p className="text-neutral-500 text-sm sm:text-base">
              Chào, {user.name} ♡ — quản lý thông tin và đơn hàng của bạn tại Nhà Nấm nhỏ.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="col-span-1">
            <AnimateOnScroll animation="fade-right">
              <div
                className="sticky top-24 overflow-hidden rounded-[20px] border-[1.5px] bg-white p-4 shadow-card sm:p-6"
                style={{ borderColor: '#f0e0d6' }}
              >
                <div className="mb-5 flex min-w-0 items-center gap-3 sm:mb-6 sm:gap-4">
                  <div className="shrink-0">
                    <AvatarUpload
                      initialAvatar={(user as any).avatar || null}
                      userName={user.name}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="flex min-w-0 items-center gap-1.5 font-heading text-base leading-5 text-neutral-800">
                      <span className="truncate" title={user.name}>{user.name}</span>
                    {(user as any).google_id && (
                      <span title="Tài khoản liên kết Google" className="flex shrink-0 items-center justify-center rounded-full border border-[#f0e0d6] bg-white p-0.5">
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </span>
                    )}
                    </h2>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-neutral-500">
                      <span className="truncate" title={user.email}>{user.email}</span>
                      {(user as any).is_email_verified && <span title="Email đã xác minh" className="shrink-0 text-green-500"><Shield size={12} /></span>}
                    </div>
                  </div>
              </div>

              <nav className="space-y-1.5">
                <Link href="/tai-khoan" className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl bg-[#fdeceb] px-3 py-2.5 text-[13px] font-bold text-primary transition-colors sm:gap-3 sm:px-4 sm:text-base">
                  <UserIcon className="shrink-0" size={20} />
                  Thông tin cá nhân
                </Link>
                <Link href="/tai-khoan/don-hang" className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-[#fff7f2] sm:gap-3 sm:px-4 sm:text-base">
                  <Package className="shrink-0" size={20} />
                  Đơn hàng của tôi
                  <span className="ml-auto shrink-0 rounded-full bg-[#ffece6] px-2 py-0.5 text-xs font-bold text-accent-kraft">
                    {user._count.orders}
                  </span>
                </Link>
                {['super_admin', 'admin', 'viewer'].includes(user.role) && (
                  <Link href="/admin" className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-[#fff7f2] sm:gap-3 sm:px-4 sm:text-base">
                    <Settings className="shrink-0" size={20} />
                    Quản trị viên
                  </Link>
                )}
                <div className="mt-3 border-t border-[#f0e0d6] pt-3 sm:mt-4 sm:pt-4">
                  <SignOutButton className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold text-primary transition-colors hover:bg-[#fdeceb] sm:gap-3 sm:px-4 sm:text-base" />
                </div>
              </nav>
            </div>
            </AnimateOnScroll>
          </div>

          {/* Main Content */}
          <div className="col-span-1 md:col-span-2">
            <AnimateOnScroll animation="fade-up" delay={200}>
              <div
                className="bg-white rounded-[22px] shadow-card border-[1.5px] p-6 sm:p-8"
                style={{ borderColor: '#f0e0d6' }}
              >
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl text-lg" style={{ background: '#ffd6d6' }} aria-hidden>
                  👤
                </span>
                <h2 className="font-heading text-xl text-neutral-800">Thông tin cá nhân</h2>
              </div>

              <EditProfileForm
                initialName={user.name}
                initialEmail={user.email}
                initialPhone={user.phone || ''}
                initialAddress={(user as any).address || ''}
              />
            </div>
            </AnimateOnScroll>
          </div>
        </div>
      </div>
    </div>
  )
}

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, User as UserIcon, Settings, Shield } from 'lucide-react'
import { SignOutButton } from '@/components/layout/SignOutButton'
import { EditProfileForm } from '@/components/account/EditProfileForm'
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
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[70vh]">
      <AnimateOnScroll animation="fade-down">
        <h1 className="text-3xl font-heading font-bold text-primary mb-8">Tài khoản của tôi</h1>
      </AnimateOnScroll>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="col-span-1">
          <AnimateOnScroll animation="fade-right">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 overflow-hidden sticky top-24">
            <div className="flex items-center gap-4 mb-6">
              {(user as any).avatar ? (
                <img src={(user as any).avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-stone-200 shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <h2 className="font-bold text-primary truncate flex items-center gap-2">
                  {user.name}
                  {(user as any).google_id && (
                    <span title="Tài khoản liên kết Google" className="flex items-center justify-center bg-white border border-stone-200 rounded-full p-0.5">
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5 text-sm text-stone-500 truncate">
                  {user.email}
                  {(user as any).is_email_verified && <span title="Email đã xác minh" className="text-green-500"><Shield size={12} /></span>}
                </div>
              </div>
            </div>
            
            <nav className="space-y-2">
              <Link href="/tai-khoan" className="flex items-center gap-3 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-xl font-medium transition-colors">
                <UserIcon size={20} />
                Thông tin cá nhân
              </Link>
              <Link href="/tai-khoan/don-hang" className="flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-xl font-medium transition-colors">
                <Package size={20} />
                Đơn hàng của tôi
                <span className="ml-auto bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {user._count.orders}
                </span>
              </Link>
              {['super_admin', 'admin', 'viewer'].includes(user.role) && (
                <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-stone-600 hover:bg-stone-50 rounded-xl font-medium transition-colors">
                  <Settings size={20} />
                  Quản trị viên
                </Link>
              )}
              <div className="pt-4 mt-4 border-t border-stone-100">
                <SignOutButton className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors" />
              </div>
            </nav>
          </div>
          </AnimateOnScroll>
        </div>
        
        {/* Main Content */}
        <div className="col-span-1 md:col-span-2">
          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-primary mb-6">Thông tin cá nhân</h2>
            
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
  )
}

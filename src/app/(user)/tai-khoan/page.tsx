import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, User as UserIcon, Settings } from 'lucide-react'
import { SignOutButton } from '@/components/layout/SignOutButton'
import { EditProfileForm } from '@/components/account/EditProfileForm'

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
      <h1 className="text-3xl font-heading font-bold text-primary mb-8">Tài khoản của tôi</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 overflow-hidden sticky top-24">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-primary truncate">{user.name}</h2>
                <p className="text-sm text-stone-500 truncate">{user.email}</p>
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
              {user.role === 'admin' && (
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
        </div>
        
        {/* Main Content */}
        <div className="col-span-1 md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-primary mb-6">Thông tin cá nhân</h2>
            
            <EditProfileForm
              initialName={user.name}
              initialEmail={user.email}
              initialPhone={user.phone || ''}
              initialAddress={(user as any).address || ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

import AdminSidebar from '@/components/layout/AdminSidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import ProfileCompletionGuard from '@/components/layout/ProfileCompletionGuard'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  const allowedAdminRoles = ['super_admin', 'admin', 'viewer']
  if (!session || !role || !allowedAdminRoles.includes(role)) {
    redirect('/tai-khoan/dang-nhap')
  }

  return (
    <SessionProvider session={session}>
      <ProfileCompletionGuard>
        <div className="flex h-screen overflow-hidden bg-[#f7f7f6]">
          <AdminSidebar />
          <main id="main-content" className="flex-1 overflow-auto pt-16 md:pt-0">
            {children}
          </main>
        </div>
      </ProfileCompletionGuard>
    </SessionProvider>
  )
}

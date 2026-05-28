import AdminSidebar from '@/components/layout/AdminSidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/tai-khoan/dang-nhap')
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-neutral-100">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}

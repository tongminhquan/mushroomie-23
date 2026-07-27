import AdminSidebar from '@/components/layout/AdminSidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import ProfileCompletionGuard from '@/components/layout/ProfileCompletionGuard'
import ScrollMotion from '@/components/ui/ScrollMotion'

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
        <div className="flex h-[100dvh] overflow-hidden bg-admin-bg">
          <AdminSidebar />
          <main
            id="main-content"
            className="flex-1 overflow-auto pt-16 md:pt-0 bg-[radial-gradient(circle_at_88%_-8%,rgba(255,214,214,0.55),transparent_38%),radial-gradient(circle_at_-6%_30%,rgba(255,231,163,0.32),transparent_30%)]"
          >
            {/* Admin cuộn trong chính <main> này, không phải window — phải chỉ rõ
                scroller, nếu không ScrollTrigger bám viewport và im lặng không chạy. */}
            <ScrollMotion scroller="#main-content" />
            {children}
          </main>
        </div>
      </ProfileCompletionGuard>
    </SessionProvider>
  )
}

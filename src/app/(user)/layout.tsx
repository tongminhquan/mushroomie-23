import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import FloatingWidgets from '@/components/layout/FloatingWidgets'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <Header />
      <main className="pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav />
      <CartDrawer />
      <FloatingWidgets />
    </SessionProvider>
  )
}

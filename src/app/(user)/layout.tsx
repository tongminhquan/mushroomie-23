import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import ZaloButton from '@/components/layout/ZaloButton'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/lib/auth'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <ZaloButton />
    </SessionProvider>
  )
}

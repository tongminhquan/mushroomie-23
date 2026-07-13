import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thanh toán',
  description: 'Hoàn tất đơn hàng và theo dõi trạng thái thanh toán tại Mushroomie.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}

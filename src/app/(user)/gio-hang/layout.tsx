import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Giỏ hàng',
  description: 'Kiểm tra các sản phẩm Mushroomie đã chọn trước khi thanh toán.',
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

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}

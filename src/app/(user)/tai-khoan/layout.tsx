import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tài khoản',
  description: 'Đăng nhập và quản lý thông tin tài khoản Mushroomie.',
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

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}

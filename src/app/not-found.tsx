import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  description: 'Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.',
}

export default function NotFound() {
  return (
    <main className="paper-surface grid min-h-screen place-items-center bg-secondary p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[18px] border border-neutral-200 bg-white shadow-strong md:grid-cols-[0.8fr_1.2fr]">
        <div className="relative min-h-64 bg-pink">
          <Image src="/logo.png" alt="Mushroomie" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-contain p-12" />
        </div>
        <div className="flex flex-col justify-center p-8 md:p-12">
          <p className="brand-kicker mb-4">Lạc đường một chút</p>
          <p className="font-heading text-7xl leading-none text-primary">404</p>
          <h1 className="mt-4 font-heading text-3xl leading-tight text-text">Trang này không còn ở đây</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">
            Đường dẫn có thể đã thay đổi. Bạn có thể quay về trang chủ hoặc tiếp tục xem bộ sưu tập Mushroomie.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/" className="rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-dark">Về trang chủ</Link>
            <Link href="/san-pham" className="rounded-xl border border-primary px-6 py-3 text-sm font-extrabold text-primary hover:bg-primary hover:text-white">Xem sản phẩm</Link>
          </div>
        </div>
      </div>
    </main>
  )
}

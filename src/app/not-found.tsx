import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Không tìm thấy trang | Mushroomie',
  description: 'Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Mushroom emoji decoration */}
        <div className="text-8xl mb-6 animate-float">🍄</div>
        
        {/* Error code */}
        <h1 className="font-heading text-6xl md:text-8xl font-bold text-primary mb-4">404</h1>
        
        {/* Message */}
        <h2 className="font-heading text-xl md:text-2xl font-bold text-neutral-900 mb-3">
          Oops! Trang không tồn tại
        </h2>
        <p className="text-neutral-500 text-sm md:text-base mb-8 leading-relaxed">
          Trang bạn đang tìm có thể đã bị xóa, đổi tên hoặc tạm thời không truy cập được.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/" 
            className="bg-primary text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-primary-dark transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            Về trang chủ
          </Link>
          <Link 
            href="/san-pham" 
            className="border-2 border-primary text-primary px-8 py-3 rounded-full font-bold text-sm hover:bg-primary hover:text-white transition-all"
          >
            Xem sản phẩm
          </Link>
        </div>

        {/* Brand tagline */}
        <p className="mt-10 text-xs text-neutral-400 font-medium">
          ✨ Từ từng hạt nhỏ, tạo phong cách riêng ✨
        </p>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import BrandSticker from './BrandSticker'
import AnimatedDoodle from './AnimatedDoodle'

export default function HomeCustomCTA() {
  return (
    <section className="brand-container my-8 lg:my-12">
      <div className="relative overflow-hidden rounded-[32px] bg-[#fff7f2] border border-pink px-6 py-8 shadow-sm sm:px-10 sm:py-12">
        <AnimatedDoodle icon="sparkle" className="right-[7%] top-5 h-8 w-8 rotate-12 text-yellow" />
        <AnimatedDoodle icon="heart" className="bottom-6 right-[19%] hidden h-7 w-7 -rotate-12 text-pink sm:block" />
        <div className="relative z-10 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-4xl">
            <BrandSticker tone="pink">Made for you</BrandSticker>
            <h2 className="mt-5 max-w-4xl text-balance font-heading text-3xl leading-[1.1] text-text sm:text-4xl lg:text-[2.75rem]">
              Từ từng hạt nhỏ,<br className="sm:hidden" /> tạo phong cách riêng
            </h2>
            <p className="mt-4 max-w-2xl font-body text-base leading-7 text-neutral-600 sm:text-lg">
              Phụ kiện handmade cá nhân hóa từ hạt, charm và màu bạn yêu. Nhắn ngay cho Mushroomie để thiết kế mẫu độc nhất vô nhị.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/san-pham"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-extrabold text-white shadow-card hover:-translate-y-0.5 hover:bg-text sm:min-h-[56px] sm:text-base transition-all"
            >
              Khám phá sản phẩm <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/lien-he"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-white px-6 text-sm font-extrabold text-primary hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 sm:min-h-[56px] sm:text-base transition-all"
            >
              <MessageCircle size={18} /> Custom món riêng
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

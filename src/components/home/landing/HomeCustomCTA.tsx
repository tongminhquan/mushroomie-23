'use client'

import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import BrandSticker from './BrandSticker'
import AnimatedDoodle from './AnimatedDoodle'

export default function HomeCustomCTA() {
  return (
    <section className="brand-container my-12 lg:my-20">
      <div
        className="relative overflow-hidden rounded-[32px] px-6 py-12 text-center text-white shadow-[0_22px_50px_rgba(201,20,20,0.3)] sm:px-10 sm:py-16"
        style={{ background: 'radial-gradient(120% 140% at 15% 20%, #ff6b6b, var(--color-primary))' }}
      >
        <AnimatedDoodle icon="heart" className="left-[8%] top-[24%] h-7 w-7 rotate-6 text-white/50" />
        <AnimatedDoodle icon="sparkle" className="bottom-[22%] right-[10%] hidden h-8 w-8 -rotate-12 text-white/50 sm:block" />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
          <BrandSticker tone="white">Made for you</BrandSticker>
          <h2 className="mt-5 text-balance font-heading text-3xl leading-[1.1] sm:text-4xl lg:text-[2.75rem]">
            Từ từng hạt nhỏ,<br className="sm:hidden" /> tạo phong cách riêng
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/95 sm:text-lg">
            Phụ kiện handmade cá nhân hóa từ hạt, charm và màu bạn yêu. Nhắn ngay cho Mushroomie để thiết kế mẫu độc nhất vô nhị.
          </p>
          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/san-pham"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-bold text-primary shadow-card hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(0,0,0,0.18)] sm:min-h-[56px] sm:text-base transition-all"
            >
              Khám phá sản phẩm <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/lien-he"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-white/60 bg-white/15 px-7 text-sm font-bold text-white hover:-translate-y-0.5 hover:bg-white/25 sm:min-h-[56px] sm:text-base transition-all"
            >
              <MessageCircle size={18} /> Custom món riêng
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

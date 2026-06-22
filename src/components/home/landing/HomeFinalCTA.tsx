import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import AnimatedDoodle from './AnimatedDoodle'
import BrandSticker from './BrandSticker'

export default function HomeFinalCTA() {
  return (
    <section className="relative overflow-hidden bg-yellow py-16 md:py-20">
      <AnimatedDoodle icon="flower" className="-left-4 top-5 h-20 w-20 rotate-12 text-primary/16" />
      <AnimatedDoodle icon="heart" className="bottom-5 right-[8%] h-16 w-16 -rotate-12 text-primary/16" />
      <BrandContainer className="relative z-10">
        <div className="max-w-4xl">
          <BrandSticker tone="red">Món riêng của bạn</BrandSticker>
          <h2 className="mt-5 text-balance font-heading text-3xl leading-[1.1] text-text sm:text-4xl md:text-6xl">
            Bạn muốn một món phụ kiện mang đúng cá tính của mình?
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-neutral-700 md:text-base">
            Khám phá bộ sưu tập có sẵn hoặc kể Mushroomie nghe ý tưởng để tụi mình cùng làm thành một phiên bản riêng.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/san-pham"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)] hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              Khám phá sản phẩm <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/lien-he"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-text px-6 text-sm font-extrabold text-text hover:-translate-y-0.5 hover:bg-white"
            >
              <MessageCircle size={17} /> Custom món riêng
            </Link>
          </div>
        </div>
      </BrandContainer>
    </section>
  )
}

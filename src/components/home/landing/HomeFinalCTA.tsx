import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'

export default function HomeFinalCTA() {
  return (
    <section className="relative overflow-hidden bg-theme-page py-20 text-theme-primary md:py-28">
      {/* soft decorative hearts */}
      <span aria-hidden className="animate-float-soft pointer-events-none absolute left-[8%] top-10 text-3xl opacity-60 select-none">❤</span>
      <span aria-hidden className="animate-float-soft pointer-events-none absolute right-[10%] bottom-10 text-2xl opacity-50 delay-500 select-none">✨</span>

      <BrandContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-theme-accent">Món riêng của bạn</p>
          <h2 className="mb-5 font-heading text-3xl leading-tight text-theme-primary sm:text-4xl md:text-5xl">
            Tạo món phụ kiện của riêng bạn ngay hôm nay
          </h2>
          <p className="mb-9 text-sm leading-7 text-theme-secondary md:text-base">
            Làm bằng tay, trao bằng tim — mỗi món là một câu chuyện chỉ thuộc về bạn.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/san-pham"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-extrabold text-white shadow-[0_6px_20px_rgba(228,29,29,0.28)] transition hover:bg-primary-dark hover:-translate-y-0.5"
            >
              Khám phá sản phẩm <ArrowRight size={16} />
            </Link>
            <Link
              href="/san-pham?customizable=true"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-primary px-7 text-sm font-extrabold text-theme-accent transition hover:bg-pink/50"
            >
              ✨ Custom món riêng
            </Link>
          </div>
        </div>
      </BrandContainer>
    </section>
  )
}

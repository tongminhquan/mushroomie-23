import Link from 'next/link'
import { ArrowRight, Check, Gem, Palette, WandSparkles } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'
import BrandSticker from './BrandSticker'
import type { HomeProduct } from './types'

const steps = [
  {
    icon: Palette,
    title: 'Chọn màu',
    text: 'Bắt đầu từ bảng màu đúng mood của bạn.',
  },
  {
    icon: Gem,
    title: 'Chọn charm',
    text: 'Ghép biểu tượng, hạt và chi tiết bạn yêu thích.',
  },
  {
    icon: WandSparkles,
    title: 'Làm riêng cho bạn',
    text: 'Mushroomie phối, hoàn thiện và kiểm tra từng chi tiết.',
  },
]

export default function HomeCustomProcess({ products }: { products: HomeProduct[] }) {
  const image = getPublicImageUrl(
    products.find((product) => product.is_customizable)?.featured_image
      || products[1]?.featured_image
      || products[0]?.featured_image,
    'product',
  )

  return (
    <section className="bg-text py-16 text-white md:py-24">
      <BrandContainer>
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <BrandSticker tone="red">Custom theo mood</BrandSticker>
            <h2 className="mt-5 max-w-3xl text-balance font-heading text-3xl leading-[1.1] sm:text-4xl md:text-5xl">
              Chọn hạt, chọn màu, chọn charm
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              Bạn mang đến ý tưởng. Mushroomie giúp biến ý tưởng ấy thành món phụ kiện riêng, đủ khác biệt để không bị trùng với bất kỳ ai.
            </p>

            <ol className="mt-9 grid gap-3 md:grid-cols-3">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <li key={title} className="relative rounded-[16px] border border-white/12 bg-white/[0.06] p-5 hover-lift">
                  <span className="absolute right-4 top-4 font-heading text-3xl text-white/10">0{index + 1}</span>
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-yellow text-text">
                    <Icon size={21} />
                  </div>
                  <h3 className="mt-5 text-base font-extrabold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/60">{text}</p>
                </li>
              ))}
            </ol>

            <Link
              href="/lien-he"
              className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-white transition-colors hover:-translate-y-0.5 hover:bg-white hover:text-primary"
            >
              Custom ngay <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative aspect-square overflow-hidden rounded-[18px] border border-white/15 bg-secondary">
              <SafeImage
                src={image}
                alt="Mẫu phụ kiện có thể cá nhân hóa tại Mushroomie"
                fill
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-contain p-7 sm:p-10"
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 flex items-center gap-3 rounded-[14px] bg-white p-4 text-text shadow-strong sm:left-8 sm:right-8">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-light text-primary">
                <Check size={20} />
              </span>
              <p className="text-xs font-bold leading-5 sm:text-sm">
                Ghi chú màu, charm và lời nhắn ngay khi gửi yêu cầu.
              </p>
            </div>
          </div>
        </div>
      </BrandContainer>
    </section>
  )
}

import Link from 'next/link'
import { ArrowRight, Lightbulb, PackageCheck, PencilRuler, Sprout } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'
import BrandSticker from './BrandSticker'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeProduct } from './types'

const milestones = [
  { icon: Sprout, label: 'Bắt đầu từ niềm yêu thích handmade' },
  { icon: Lightbulb, label: 'Nhận ra phụ kiện cần cá nhân hơn' },
  { icon: PencilRuler, label: 'Biến ý tưởng tuổi 18 thành Mushroomie' },
  { icon: PackageCheck, label: 'Gửi từng dấu ấn riêng đến khách hàng' },
]

const storyChips = ['Thủ công', 'Cá nhân hóa', 'Cảm xúc']

export default function HomeBrandStory({ products }: { products: HomeProduct[] }) {
  const storyImage = getPublicImageUrl(
    products[0]?.featured_image || products[0]?.images?.[0]?.image_url,
    'product',
  )

  return (
    <section className="bg-theme-page py-16 text-theme-primary md:py-24">
      <BrandContainer>
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="order-2 relative lg:order-1">
            <div
              className="relative aspect-[5/4] overflow-hidden rounded-[24px] border-[1.5px] border-theme-border shadow-card"
              style={{
                background: 'repeating-linear-gradient(45deg, var(--surface-muted), var(--surface-muted) 13px, var(--surface-card) 13px, var(--surface-card) 26px)',
              }}
            >
              <SafeImage
                src={storyImage}
                alt="Phụ kiện handmade được phối hạt và charm tại Mushroomie"
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-contain p-6 sm:p-10"
              />
              <BrandSticker tone="yellow" className="absolute left-4 top-4 rotate-[-5deg] animate-float-soft">
                Bắt đầu ở tuổi 18
              </BrandSticker>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-[0.12em] text-theme-kraft">
                ảnh hậu trường handmade · packaging
              </span>
            </div>

            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {milestones.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  className="theme-transition flex min-h-24 items-start gap-3 rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-4 shadow-card hover-lift"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-pink text-primary">
                    <Icon size={18} />
                  </span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-theme-kraft">
                      Chặng {index + 1}
                    </span>
                    <p className="mt-1 text-xs font-bold leading-5 text-theme-primary sm:text-sm">{label}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="order-1 lg:order-2">
            <LandingSectionHeader
              eyebrow="Câu chuyện Mushroomie"
              title="Tụi mình bắt đầu từ một mong muốn rất nhỏ"
              description="Tạo ra những món phụ kiện đủ cá nhân để không bị trùng lặp, đủ gần gũi để người đeo thấy một phần của mình trong đó."
            />
            <div className="space-y-4 text-sm leading-7 text-theme-secondary md:text-base">
              <p>
                Mushroomie được xây dựng bởi những người trẻ 18 tuổi, từ niềm yêu thích các món handmade nhỏ xinh và mong muốn biến sự sáng tạo thành sản phẩm thật.
              </p>
              <p>
                Mỗi vòng tay, vòng cổ, charm hay móc khóa không chỉ là phụ kiện. Đó là một phiên bản thu nhỏ của người sở hữu, được ghép từ màu sắc, sở thích và câu chuyện riêng.
              </p>
            </div>

            <ul className="mt-6 flex flex-wrap gap-3">
              {storyChips.map((chip) => (
                <li
                  key={chip}
                  className="theme-transition rounded-full border-[1.5px] border-theme-border bg-theme-card px-4 py-2 text-[13px] font-bold text-theme-kraft"
                >
                  {chip}
                </li>
              ))}
            </ul>

            <Link
              href="/gioi-thieu"
              className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              Đọc câu chuyện thương hiệu <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </BrandContainer>
    </section>
  )
}

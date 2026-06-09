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

export default function HomeBrandStory({ products }: { products: HomeProduct[] }) {
  const storyImage = getPublicImageUrl(
    products[0]?.featured_image || products[0]?.images?.[0]?.image_url,
    'product',
  )

  return (
    <section className="bg-white py-16 md:py-24">
      <BrandContainer>
        <div className="grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <div>
            <LandingSectionHeader
              eyebrow="Câu chuyện Mushroomie"
              title="Tụi mình bắt đầu từ một mong muốn rất nhỏ"
              description="Tạo ra những món phụ kiện đủ cá nhân để không bị trùng lặp, đủ gần gũi để người đeo thấy một phần của mình trong đó."
            />
            <div className="space-y-4 text-sm leading-7 text-neutral-600 md:text-base">
              <p>
                Mushroomie được xây dựng bởi những người trẻ 18 tuổi, từ niềm yêu thích các món handmade nhỏ xinh và mong muốn biến sự sáng tạo thành sản phẩm thật.
              </p>
              <p>
                Mỗi vòng tay, vòng cổ, charm hay móc khóa không chỉ là phụ kiện. Đó là một phiên bản thu nhỏ của người sở hữu, được ghép từ màu sắc, sở thích và câu chuyện riêng.
              </p>
            </div>
            <Link
              href="/gioi-thieu"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-extrabold text-primary hover:bg-primary hover:text-white"
            >
              Đọc câu chuyện thương hiệu <ArrowRight size={17} />
            </Link>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] border border-neutral-200 bg-secondary shadow-card">
              <SafeImage
                src={storyImage}
                alt="Phụ kiện handmade được phối hạt và charm tại Mushroomie"
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-contain p-5 sm:p-8"
              />
              <BrandSticker tone="yellow" className="absolute left-4 top-4 rotate-[-2deg]">
                Bắt đầu ở tuổi 18
              </BrandSticker>
            </div>

            <ol className="mt-5 grid gap-2 sm:grid-cols-2">
              {milestones.map(({ icon: Icon, label }, index) => (
                <li
                  key={label}
                  className="flex min-h-24 items-start gap-3 rounded-[14px] border border-neutral-200 bg-secondary p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary shadow-sm">
                    <Icon size={18} />
                  </span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-kraft">
                      Chặng {index + 1}
                    </span>
                    <p className="mt-1 text-xs font-bold leading-5 text-text sm:text-sm">{label}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </BrandContainer>
    </section>
  )
}

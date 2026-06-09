import { Boxes, PackageCheck, Palette, Unplug } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import SafeImage from '@/components/ui/SafeImage'
import { getPublicImageUrl } from '@/lib/utils'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeProduct } from './types'

const processSteps = [
  { icon: Boxes, label: 'Chọn hạt', detail: 'Lọc màu, chất liệu và kích thước phù hợp.' },
  { icon: Unplug, label: 'Xỏ dây', detail: 'Cân độ dài và hoàn thiện từng nút nối.' },
  { icon: Palette, label: 'Phối charm', detail: 'Sắp xếp điểm nhấn theo mood đã chọn.' },
  { icon: PackageCheck, label: 'Đóng gói', detail: 'Kiểm tra, làm sạch và gói quà chỉn chu.' },
]

export default function HomeHandmadeBehindScenes({ products }: { products: HomeProduct[] }) {
  return (
    <section className="paper-surface py-16 md:py-24">
      <BrandContainer>
        <LandingSectionHeader
          eyebrow="Hậu trường handmade"
          title="Một món nhỏ đi qua nhiều đôi tay cẩn thận"
          description="Từ lúc chọn hạt đến khi đóng gói, mỗi bước đều được làm chậm và kiểm tra để thành phẩm giữ đúng tinh thần bạn đã chọn."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map(({ icon: Icon, label, detail }, index) => {
            const product = products[index % Math.max(products.length, 1)]
            const image = getPublicImageUrl(
              product?.featured_image || product?.images?.[0]?.image_url,
              'product',
            )

            return (
              <article
                key={label}
                className={`group overflow-hidden rounded-[18px] border border-neutral-200 bg-white ${
                  index === 1 || index === 3 ? 'lg:translate-y-7' : ''
                }`}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                  <SafeImage
                    src={image}
                    alt={`${label} trong quy trình làm phụ kiện Mushroomie`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.035]"
                  />
                  <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-extrabold text-white shadow-card">
                    {index + 1}
                  </span>
                </div>
                <div className="p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-light text-primary">
                    <Icon size={19} />
                  </div>
                  <h3 className="mt-4 font-heading text-xl text-text">{label}</h3>
                  <p className="mt-2 text-xs leading-5 text-neutral-500">{detail}</p>
                </div>
              </article>
            )
          })}
        </div>
      </BrandContainer>
    </section>
  )
}

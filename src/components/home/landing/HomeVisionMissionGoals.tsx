import { Binoculars, Flag, HandHeart } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import LandingSectionHeader from './LandingSectionHeader'

const directions = [
  {
    icon: Binoculars,
    title: 'Tầm nhìn',
    text: 'Trở thành thương hiệu phụ kiện handmade cá nhân hóa được giới trẻ Việt Nam yêu thích, đồng thời mở ra một cộng đồng sáng tạo có gu riêng.',
    accent: 'bg-pink',
  },
  {
    icon: HandHeart,
    title: 'Sứ mệnh',
    text: 'Mang đến phụ kiện nhỏ xinh, giúp mỗi người thể hiện phong cách hằng ngày và trao đi những món quà có cảm xúc.',
    accent: 'bg-yellow',
  },
  {
    icon: Flag,
    title: 'Mục tiêu',
    text: 'Phát triển sản phẩm hợp xu hướng, xây dựng hình ảnh trẻ trung và đưa trải nghiệm custom đến gần hơn qua website cùng nội dung sáng tạo.',
    accent: 'bg-primary-light',
  },
]

export default function HomeVisionMissionGoals() {
  return (
    <section className="paper-surface py-16 md:py-24">
      <BrandContainer>
        <LandingSectionHeader
          eyebrow="Hướng đi của tụi mình"
          title="Không chỉ bán phụ kiện, Mushroomie muốn tạo một không gian sáng tạo"
          description="Nơi người trẻ chọn điều mình thích, biến nó thành món đồ có dấu ấn và tự tin mang phong cách riêng mỗi ngày."
          align="center"
        />
        <div className="grid items-stretch gap-4 md:grid-cols-3">
          {directions.map(({ icon: Icon, title, text, accent }, index) => (
            <article
              key={title}
              className="group flex min-h-[280px] flex-col rounded-[18px] border border-neutral-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-hover md:p-7"
            >
              <div className={`mb-8 grid h-12 w-12 place-items-center rounded-xl text-primary ${accent}`}>
                <Icon size={23} />
              </div>
              <span className="mb-3 text-xs font-extrabold uppercase tracking-[0.08em] text-kraft">0{index + 1}</span>
              <h3 className="font-heading text-2xl leading-tight text-text">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-neutral-500">{text}</p>
            </article>
          ))}
        </div>
      </BrandContainer>
    </section>
  )
}

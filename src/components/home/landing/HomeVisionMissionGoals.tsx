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
    <section className="relative overflow-hidden bg-theme-page py-16 text-theme-primary md:py-24">
      <span
        aria-hidden
        className="animate-float-soft pointer-events-none absolute right-[7%] top-[14%] text-3xl text-coral"
      >
        ❤
      </span>
      <span
        aria-hidden
        className="animate-float-soft pointer-events-none absolute left-[6%] bottom-[16%] h-4 w-4 rounded-full bg-yellow"
      />
      <BrandContainer>
        <LandingSectionHeader
          eyebrow="Hướng đi của tụi mình"
          title="Không chỉ bán phụ kiện, Mushroomie muốn tạo một không gian sáng tạo"
          description="Nơi người trẻ chọn điều mình thích, biến nó thành món đồ có dấu ấn và tự tin mang phong cách riêng mỗi ngày."
          align="center"
        />
        <div className="grid items-stretch gap-5 md:grid-cols-3">
          {directions.map(({ icon: Icon, title, text, accent }, index) => (
            <article
              key={title}
              className="theme-transition group relative flex min-h-[280px] flex-col rounded-[22px] border-[1.5px] border-theme-border bg-theme-card p-6 shadow-card hover:-translate-y-1 hover:shadow-hover md:p-7"
            >
              <span className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full bg-primary font-heading text-sm text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)] md:right-7 md:top-7">
                0{index + 1}
              </span>
              <div className={`mb-8 grid h-14 w-14 place-items-center rounded-2xl text-primary ${accent}`}>
                <Icon size={26} />
              </div>
              <h3 className="font-heading text-2xl leading-tight text-theme-primary">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-theme-muted">{text}</p>
            </article>
          ))}
        </div>
      </BrandContainer>
    </section>
  )
}

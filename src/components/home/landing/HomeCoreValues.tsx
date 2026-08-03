import { Fingerprint, Heart, Scissors } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import LandingSectionHeader from './LandingSectionHeader'
import BrandSticker from './BrandSticker'

const values = [
  {
    icon: Scissors,
    sticker: '100% handmade',
    title: 'Thủ công',
    text: 'Từng hạt, dây cước, dây polyester và charm được chọn, phối và hoàn thiện bằng tay để món đồ gần gũi hơn sản phẩm đại trà.',
    color: 'bg-yellow',
    headingColor: 'text-brand-ink',
    bodyColor: 'text-brand-ink-muted',
    numberColor: 'text-brand-ink/10',
  },
  {
    icon: Fingerprint,
    sticker: 'Made for you',
    title: 'Cá nhân hóa',
    text: 'Bạn tham gia từ lúc chọn màu, chọn charm đến kiểu dáng. Thành phẩm phản ánh gu thẩm mỹ và câu chuyện của chính bạn.',
    color: 'bg-pink',
    headingColor: 'text-brand-ink',
    bodyColor: 'text-brand-ink-muted',
    numberColor: 'text-brand-ink/10',
  },
  {
    icon: Heart,
    sticker: 'Keep the feeling',
    title: 'Cảm xúc',
    text: 'Một món phụ kiện có thể giữ lại sở thích, kỷ niệm, tình bạn hoặc một giai đoạn đáng nhớ, không chỉ để đeo hay sử dụng.',
    color: 'bg-primary-light',
    headingColor: 'text-theme-primary',
    bodyColor: 'text-theme-secondary',
    numberColor: 'text-theme-primary/15',
  },
]

export default function HomeCoreValues() {
  return (
    <section className="bg-theme-section py-16 text-theme-primary md:py-24">
      <BrandContainer>
        <LandingSectionHeader
          eyebrow="Giá trị cốt lõi"
          title="Ba điều luôn có trong mỗi món Mushroomie"
          description="Làm kỹ bằng tay, mở rộng chỗ cho lựa chọn cá nhân và giữ lại một cảm xúc đủ lâu."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {values.map(({ icon: Icon, sticker, title, text, color, headingColor, bodyColor, numberColor }, index) => (
            <article
              key={title}
              className={`relative min-h-[320px] overflow-hidden rounded-[22px] border-[1.5px] border-theme-border p-6 md:p-8 ${color}`}
            >
              <div aria-hidden="true" className={`absolute right-5 top-5 font-heading text-6xl ${numberColor}`}>0{index + 1}</div>
              <div className="relative z-10">
                <div className="mb-12 grid h-14 w-14 place-items-center rounded-xl bg-white text-primary shadow-card">
                  <Icon size={27} />
                </div>
                <BrandSticker tone="white">{sticker}</BrandSticker>
                <h3 className={`mt-4 font-heading text-3xl leading-tight ${headingColor}`}>{title}</h3>
                <p className={`mt-4 text-sm leading-7 ${bodyColor}`}>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </BrandContainer>
    </section>
  )
}

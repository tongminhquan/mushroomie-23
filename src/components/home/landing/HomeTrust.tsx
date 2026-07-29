import { Gift, PackageCheck, Sparkles, Star } from 'lucide-react'
import BrandContainer from '@/components/ui/BrandContainer'
import LandingSectionHeader from './LandingSectionHeader'
import type { HomeReview } from './types'

const fallbackReasons = [
  {
    icon: Sparkles,
    title: 'Phối màu đúng gu',
    text: 'Từng lựa chọn được ghi lại rõ để thành phẩm bám sát mood bạn mong muốn.',
  },
  {
    icon: Gift,
    title: 'Tặng ai cũng có ý nghĩa',
    text: 'Món quà nhỏ nhưng gắn với sở thích, kỷ niệm và người nhận cụ thể.',
  },
  {
    icon: PackageCheck,
    title: 'Đóng gói chỉn chu',
    text: 'Sản phẩm được kiểm tra, bảo vệ và chuẩn bị sẵn sàng cho khoảnh khắc mở hộp.',
  },
]

export default function HomeTrust({ reviews }: { reviews: HomeReview[] }) {
  const hasReviews = reviews.length > 0

  return (
    <section className="bg-theme-section py-16 text-theme-primary md:py-24">
      <BrandContainer>
        <LandingSectionHeader
          eyebrow={hasReviews ? 'Khách kể thật' : 'Vì sao bạn sẽ thích'}
          title={hasReviews ? 'Những lời nhắn sau khi mở hộp' : 'Nhỏ xinh, đúng gu và có câu chuyện'}
          description={hasReviews
            ? 'Phản hồi từ những người đã chọn một món Mushroomie cho mình hoặc làm quà tặng.'
            : 'Trải nghiệm được chăm chút từ lúc chọn ý tưởng đến khi món phụ kiện nằm trong tay bạn.'}
          align="center"
        />

        {hasReviews ? (
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 3).map((review, index) => (
              <figure
                key={review.id}
                className={`theme-transition rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-6 shadow-card ${index === 1 ? 'md:-translate-y-4' : ''}`}
              >
                <div className="mb-5 flex gap-1 text-primary" role="img" aria-label={`${review.rating} trên 5 sao`}>
                  {Array.from({ length: review.rating }, (_, star) => (
                    <Star key={star} size={16} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="text-sm leading-7 text-theme-secondary">“{review.content}”</blockquote>
                <figcaption className="mt-5 border-t border-theme-border pt-4 text-sm font-extrabold text-theme-primary">
                  {review.name}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {fallbackReasons.map(({ icon: Icon, title, text }) => (
              <article key={title} className="theme-transition rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-6">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary-light text-primary">
                  <Icon size={21} />
                </div>
                <h3 className="mt-5 font-heading text-xl text-theme-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-theme-muted">{text}</p>
              </article>
            ))}
          </div>
        )}
      </BrandContainer>
    </section>
  )
}

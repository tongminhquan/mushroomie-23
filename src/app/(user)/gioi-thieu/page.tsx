import type { Metadata } from 'next'
import Link from 'next/link'
import AnimateOnScroll, { StaggerChildren } from '@/components/ui/AnimateOnScroll'

export const metadata: Metadata = {
  title: 'Giới thiệu | Mushroomie',
  description: 'Câu chuyện thương hiệu Mushroomie - phụ kiện handmade cá nhân hóa dành cho giới trẻ.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-red-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll animation="fade-up">
            <div className="text-5xl mb-4">🍄</div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">Về Mushroomie</h1>
            <p className="text-white/85 text-lg max-w-2xl mx-auto">Từ một sở thích nhỏ bé đến một thương hiệu phụ kiện handmade dễ thương</p>
          </AnimateOnScroll>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* Story */}
        <AnimateOnScroll animation="fade-up">
          <section className="bg-white rounded-3xl p-8 md:p-12 shadow-card">
            <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-6">Câu chuyện của Mushroomie</h2>
            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>Mushroomie hình thành từ một sở thích handmade nhỏ xinh. Ban đầu chỉ là những chiếc vòng tay tự làm tặng bạn bè, rồi dần dần lan ra với charm, móc khóa và nhiều phụ kiện nhỏ xinh khác.</p>
              <p>Tên <strong className="text-neutral-900">Mushroomie</strong> đến từ hình ảnh của nấm (mushroom) — nhỏ nhắn, dễ thương, sống trong những không gian ấm cúng và luôn mang lại cảm giác thú vị. Giống như những chiếc phụ kiện của chúng mình — nhỏ thôi nhưng đầy ý nghĩa!</p>
              <p>Điều khác biệt lớn nhất của Mushroomie là khả năng <strong className="text-neutral-900">cá nhân hóa</strong>. Khách hàng có thể chọn charm, màu sắc, kiểu dây, hoặc ghi chú tên, thông điệp đặc biệt. Mỗi sản phẩm là một phiên bản độc nhất — thật sự là của bạn!</p>
              <p>Chúng mình tin rằng phụ kiện không chỉ là đồ vật — nó là <em>cảm xúc, cá tính, và câu chuyện</em>. Và Mushroomie là nơi để bạn kể câu chuyện đó.</p>
            </div>
          </section>
        </AnimateOnScroll>

        {/* Values */}
        <section>
          <AnimateOnScroll animation="fade-up">
            <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-8 text-center">Giá trị cốt lõi</h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StaggerChildren animation="fade-up" staggerDelay={150}>
              {[
                { emoji: '🧵', title: 'Thủ công 100%', desc: 'Mỗi sản phẩm được làm bằng tay với tình yêu thương và sự tỉ mỉ chăm chút.' },
                { emoji: '🎨', title: 'Cá nhân hóa', desc: 'Bạn chọn màu sắc, charm, kiểu dáng. Không có hai sản phẩm nào giống nhau.' },
                { emoji: '💛', title: 'Cảm xúc thật', desc: 'Không chỉ là đồ vật — mỗi sản phẩm là một kỷ niệm, cá tính, câu chuyện riêng.' },
              ].map((v) => (
                <div key={v.title} className="bg-white rounded-2xl p-6 shadow-card text-center hover:shadow-hover transition-all">
                  <div className="text-4xl mb-4">{v.emoji}</div>
                  <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">{v.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </section>

        {/* What we do */}
        <AnimateOnScroll animation="fade-up" delay={100}>
          <section className="bg-white rounded-3xl p-8 md:p-12 shadow-card">
            <h2 className="font-heading text-3xl font-bold text-neutral-900 mb-6">Chúng mình làm gì?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { emoji: '💛', title: 'Vòng tay', desc: 'Vòng tay handmade từ hạt đá, dây cước, charm theo phong cách cá nhân.' },
                { emoji: '🔑', title: 'Móc khóa', desc: 'Móc khóa nhỏ xinh, dễ thương với nhiều hình dáng và màu sắc.' },
                { emoji: '✨', title: 'Charm', desc: 'Bộ sưu tập charm đa dạng để tùy chỉnh phụ kiện theo ý thích.' },
                { emoji: '🎀', title: 'Phụ kiện cá nhân hóa', desc: 'Thiết kế riêng theo yêu cầu với tên, ngày tháng, hoặc hình ảnh đặc biệt.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-4 bg-secondary rounded-2xl">
                  <span className="text-3xl flex-shrink-0">{item.emoji}</span>
                  <div>
                    <h3 className="font-heading font-bold text-base mb-1">{item.title}</h3>
                    <p className="text-neutral-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll animation="zoom-in">
          <section className="bg-primary rounded-3xl p-10 text-center text-white">
            <h2 className="font-heading text-3xl font-bold mb-4">Sẵn sàng tạo nên thứ gì đó dễ thương?</h2>
            <p className="text-white/80 mb-6">Khám phá bộ sưu tập phụ kiện handmade hoặc liên hệ để tự thiết kế riêng.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/san-pham" className="bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-yellow-50 transition-colors">
                Khám phá sản phẩm
              </Link>
              <Link href="/lien-he" className="border-2 border-white text-white px-6 py-3 rounded-full font-bold hover:bg-white hover:text-primary transition-colors">
                Liên hệ tư vấn
              </Link>
            </div>
          </section>
        </AnimateOnScroll>
      </div>
    </div>
  )
}

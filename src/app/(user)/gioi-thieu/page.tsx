import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import AnimateOnScroll, { StaggerChildren } from '@/components/ui/AnimateOnScroll'
import BrandSticker from '@/components/home/landing/BrandSticker'
import AnimatedDoodle from '@/components/home/landing/AnimatedDoodle'
import CategoryIcon from '@/components/ui/CategoryIcon'
import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'

export const metadata: Metadata = {
  title: 'Câu chuyện Mushroomie | Phụ kiện handmade',
  description: 'Từ từng hạt nhỏ, tạo phong cách riêng. Khám phá hành trình và giá trị cốt lõi của Mushroomie - thương hiệu phụ kiện handmade cá nhân hóa.',
}

export default async function AboutPage() {
  const targetSlugs = ['vong-tay', 'charm', 'moc-khoa', 'vong-co']
  const dbCategories = await prisma.category.findMany({
    where: { slug: { in: targetSlugs }, type: 'product' },
  }).catch(() => [])

  const orderedCategories = targetSlugs.map(slug => 
    dbCategories.find((c: Category) => c.slug === slug)
  ).filter(Boolean) as typeof dbCategories

  const bgColors: Record<string, string> = {
    'vong-tay': 'bg-pink',
    'charm': 'bg-yellow',
    'moc-khoa': 'bg-primary-light',
    'vong-co': 'bg-neutral-100',
  }

  return (
    <div className="bg-secondary pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24 brand-wave-bottom">
        <div className="brand-container relative z-10 text-center">
          <AnimateOnScroll animation="fade-up">
            <div className="flex justify-center mb-6">
              <BrandSticker tone="pink">Về Mushroomie</BrandSticker>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl text-primary leading-[1.1] mb-6">
              Câu chuyện Mushroomie
            </h1>
            <p className="font-body text-lg sm:text-xl text-text max-w-2xl mx-auto leading-relaxed">
              Tụi mình bắt đầu từ một mong muốn rất nhỏ: tạo ra những món phụ kiện <strong>handmade 100%</strong> đủ cá nhân để không bị trùng lặp, đủ gần gũi để kể câu chuyện của riêng bạn.
            </p>
          </AnimateOnScroll>
          <AnimatedDoodle icon="flower" className="absolute left-[10%] top-10 h-10 w-10 text-pink animate-float-soft hidden md:block" />
          <AnimatedDoodle icon="sparkle" className="absolute right-[15%] top-20 h-8 w-8 text-yellow animate-float-soft hidden md:block" />
        </div>
      </section>

      {/* 2. Timeline / Hành trình */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="brand-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <AnimateOnScroll animation="fade-right">
              <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square bg-pink rounded-[32px] p-8 brand-doodle-border flex items-center justify-center overflow-hidden">
                <AnimatedDoodle icon="heart" className="absolute top-10 left-10 h-8 w-8 text-primary animate-float-soft" />
                <div className="text-center relative z-10 bg-white/70 backdrop-blur-sm p-8 rounded-[24px]">
                  <span className="text-7xl drop-shadow-md sticker-pop inline-block mb-2">🍄</span>
                  <div className="font-heading text-2xl text-primary">Từ một dự án nhỏ</div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left" delay={200}>
              <div className="space-y-6">
                <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-4">
                  Bắt đầu từ niềm đam mê<br/>&quot;không đụng hàng&quot;
                </h2>
                <div className="space-y-4 font-body text-base sm:text-lg text-text/80 leading-relaxed">
                  <p>
                    Mọi thứ bắt nguồn từ một dự án tốt nghiệp nhỏ của nhóm sinh viên FPT Polytechnic, nhưng trên hết, đó là sự đồng điệu của những bạn trẻ yêu thích phụ kiện handmade. Chúng mình nhận ra, giữa vô vàn sản phẩm đại trà, tìm được một món đồ thực sự mang dấu ấn cá nhân lại chẳng hề dễ dàng.
                  </p>
                  <p>
                    Cái tên <strong>Mushroomie</strong> ra đời từ đó. Hình ảnh cây nấm (mushroom) trong tự nhiên luôn đa dạng, không có cây nào hoàn toàn giống cây nào. Kết hợp cùng hậu tố &quot;-ie&quot; xinh xắn, Mushroomie mang mong muốn trở thành một người bạn nhỏ bé, dễ thương đồng hành cùng bạn mỗi ngày.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 3. Vision & Mission */}
      <section className="py-16 md:py-24 paper-surface relative brand-wave-top brand-wave-bottom">
        <div className="brand-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimateOnScroll animation="zoom-in">
              <div className="h-full bg-white rounded-[24px] p-8 md:p-10 shadow-card hover-lift border border-neutral-100">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink text-3xl shadow-inner">
                  👁️
                </div>
                <h3 className="font-heading text-2xl text-primary mb-4">Tầm nhìn</h3>
                <p className="font-body text-text/80 leading-relaxed">
                  Trở thành thương hiệu phụ kiện handmade cá nhân hóa được giới trẻ yêu thích nhất. Mushroomie không chỉ bán phụ kiện, chúng mình xây dựng một <strong>không gian sáng tạo</strong> cho những người trẻ yêu cái đẹp, sự khác biệt và khát khao bộc lộ cá tính.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="zoom-in" delay={150}>
              <div className="h-full bg-white rounded-[24px] p-8 md:p-10 shadow-card hover-lift border border-neutral-100">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow text-3xl shadow-inner">
                  🎯
                </div>
                <h3 className="font-heading text-2xl text-primary mb-4">Sứ mệnh</h3>
                <p className="font-body text-text/80 leading-relaxed">
                  Mang đến những món phụ kiện nhỏ xinh, chất lượng và mang đậm yếu tố cá nhân hóa. Mỗi chiếc vòng tay, móc khóa đều là cầu nối giúp khách hàng tự tin thể hiện phong cách riêng, lưu giữ kỷ niệm và lan tỏa năng lượng tích cực mỗi ngày.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 4. Giá trị cốt lõi */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="brand-container">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <div className="brand-kicker mb-3">Lợi thế khác biệt</div>
              <h2 className="font-heading text-3xl sm:text-4xl text-primary">Giá trị cốt lõi</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StaggerChildren animation="fade-up" staggerDelay={150}>
              {[
                { 
                  icon: '👐', 
                  title: 'Thủ công 100%', 
                  desc: 'Mỗi sản phẩm đều được tạo ra bởi đôi bàn tay tỉ mỉ: từ lúc chọn hạt charm, phối màu cho đến khâu hoàn thiện. Sự chăm chút đó làm nên cái hồn chân thật mà máy móc không thể thay thế.'
                },
                { 
                  icon: '🎨', 
                  title: 'Cá nhân hóa', 
                  desc: 'Bạn là nhà thiết kế của chính mình. Tự do lựa chọn hạt charm, kiểu dáng hay ghi chú tên riêng. Một món đồ đẹp nhất là khi nó khiến bạn thốt lên: "Đây chính là mình!".'
                },
                { 
                  icon: '💌', 
                  title: 'Gói trọn cảm xúc', 
                  desc: 'Hơn cả đồ vật, đó là sự gắn kết. Từng chiếc thẻ tag cảm ơn, từng hộp quà Mushroomie đều chứa đựng sự trân trọng và lan tỏa nguồn năng lượng tích cực tới bạn.'
                },
              ].map((value, i) => (
                <div key={i} className="bg-secondary/50 rounded-[24px] p-8 border border-neutral-100 hover-lift">
                  <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-[18px] flex items-center justify-center shadow-sm">
                    {value.icon}
                  </div>
                  <h3 className="font-heading text-xl text-text mb-3">{value.title}</h3>
                  <p className="font-body text-sm text-text/70 leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </div>
      </section>

      {/* 5. Khám phá danh mục */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="brand-container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <AnimateOnScroll animation="fade-right">
              <h2 className="font-heading text-3xl md:text-4xl text-primary">
                Sản phẩm của chúng mình
              </h2>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-left">
              <Link href="/san-pham" className="inline-flex items-center gap-2 text-sm font-extrabold text-primary hover:text-primary-dark">
                Tất cả sản phẩm <ArrowRight size={16} />
              </Link>
            </AnimateOnScroll>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerChildren animation="zoom-in" staggerDelay={100}>
              {orderedCategories.map((prod: Category, idx: number) => {
                const color = bgColors[prod.slug] || 'bg-white'
                const link = `/san-pham?category=${prod.slug}`
                const iconSrc = prod.icon || prod.image_url || null

                return (
                  <Link href={link} key={prod.id ?? idx} className={`${color} flex h-[260px] flex-col rounded-[24px] border border-neutral-200 p-6 hover-lift`}>
                    <div className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                      <CategoryIcon iconSrc={iconSrc} name={prod.name} size="md" imageClassName="max-h-9 max-w-9" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <h3 className="min-h-14 font-heading text-lg text-text leading-tight">{prod.name}</h3>
                      <p className="mt-2 overflow-hidden text-sm leading-6 text-text/70 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                        {prod.description || 'Khám phá bộ sưu tập phụ kiện độc đáo từ Mushroomie.'}
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-extrabold uppercase tracking-[0.08em] text-primary">Xem chi tiết</span>
                  </Link>
                )
              })}
            </StaggerChildren>
          </div>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="pt-16 md:pt-24 pb-8">
        <div className="brand-container">
          <AnimateOnScroll animation="zoom-in">
            <div className="relative overflow-hidden rounded-[32px] bg-yellow px-6 py-12 text-center shadow-strong sm:px-10 sm:py-16 brand-doodle-border border-white border-opacity-50 border-4">
              <AnimatedDoodle icon="sparkle" className="absolute right-[10%] top-10 h-8 w-8 text-primary animate-float-soft" />
              <AnimatedDoodle icon="heart" className="absolute left-[15%] bottom-10 h-8 w-8 text-pink animate-float-soft hidden md:block" />
              
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="font-heading text-3xl sm:text-4xl text-primary mb-6">Sẵn sàng tạo phong cách riêng?</h2>
                <p className="font-body text-text/80 text-lg mb-8">
                  Hãy để Mushroomie trở thành mảnh ghép nhỏ xinh tô điểm thêm cá tính cho bạn mỗi ngày.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/san-pham" className="gradient-btn inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl px-8 font-extrabold text-white text-base">
                    Khám phá sản phẩm
                  </Link>
                  <Link href="/lien-he" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-white px-8 font-extrabold text-primary shadow-card hover:-translate-y-0.5 hover:bg-pink transition-all text-base">
                    <MessageCircle size={20} /> Custom món riêng
                  </Link>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </div>
  )
}

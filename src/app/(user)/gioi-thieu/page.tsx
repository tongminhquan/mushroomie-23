import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import AnimateOnScroll, { StaggerChildren } from '@/components/ui/AnimateOnScroll'
import { prisma } from '@/lib/prisma'
import CategoryIcon from '@/components/ui/CategoryIcon'

export const metadata: Metadata = {
  title: 'Giới thiệu | Mushroomie',
  description: 'Từ từng hạt nhỏ, tạo phong cách riêng. Khám phá câu chuyện thương hiệu Mushroomie - không gian phụ kiện handmade cá nhân hóa dành cho Gen Z.',
}

export default async function AboutPage() {
  const targetSlugs = ['vong-tay', 'charm', 'moc-khoa', 'vong-co'];
  const dbCategories = await prisma.category.findMany({
    where: { slug: { in: targetSlugs }, type: 'product' },
  });

  const orderedCategories = targetSlugs.map(slug => 
    dbCategories.find(c => c.slug === slug)
  ).filter(Boolean) as typeof dbCategories;

  const bgColors: Record<string, string> = {
    'vong-tay': 'bg-blue-50',
    'charm': 'bg-rose-50',
    'moc-khoa': 'bg-amber-50',
    'vong-co': 'bg-emerald-50',
  };
  return (
    <div className="min-h-screen bg-[#FDFBF7] overflow-hidden">
      {/* 1. Hero Section - Premium & Dreamy */}
      <section className="relative pt-28 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-red-50/80 to-[#FDFBF7]"></div>
          {/* Decorative blur blobs */}
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-red-100 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] bg-orange-50 rounded-full blur-3xl opacity-60"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <AnimateOnScroll animation="fade-up">
            <span className="inline-block py-1.5 px-4 rounded-full bg-red-100 text-primary font-medium text-sm mb-6 tracking-wide shadow-sm border border-red-200/50">
              VỀ MUSHROOMIE
            </span>
            <h1 className="font-heading text-5xl md:text-7xl font-extrabold text-neutral-900 mb-6 leading-tight tracking-tight">
              Từ từng hạt nhỏ, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-500">
                tạo phong cách riêng
              </span>
            </h1>
            <p className="text-neutral-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Không chỉ là phụ kiện nhỏ xinh, Mushroomie là không gian để bạn tự do sáng tạo, lưu giữ kỷ niệm và thể hiện cá tính riêng biệt qua từng chi tiết handmade 100%.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* 2. Brand Story - Asymmetric Layout with Glassmorphism */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateOnScroll animation="fade-right">
              <div className="relative">
                {/* Image Placeholder or abstract shape representing the pixel mushroom */}
                <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-red-100 to-rose-50 p-8 shadow-inner border border-white/50 relative overflow-hidden flex items-center justify-center">
                   <div className="absolute inset-0 bg-white/40 backdrop-blur-sm z-0"></div>
                   <div className="z-10 text-center">
                     <span className="text-8xl md:text-9xl filter drop-shadow-lg">🍄</span>
                     <div className="mt-6 font-heading font-bold text-2xl text-primary opacity-80 tracking-widest">MUSHROOMIE</div>
                   </div>
                   
                   {/* Pixel decorative dots */}
                   <div className="absolute top-10 right-10 w-4 h-4 bg-primary rounded-sm opacity-20"></div>
                   <div className="absolute top-16 right-16 w-4 h-4 bg-primary rounded-sm opacity-40"></div>
                   <div className="absolute bottom-20 left-12 w-4 h-4 bg-rose-400 rounded-sm opacity-30"></div>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-left" delay={200}>
              <div className="space-y-6">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900">
                  Câu chuyện bắt đầu <br/>từ niềm đam mê "không đụng hàng"
                </h2>
                <div className="space-y-4 text-neutral-600 leading-relaxed text-lg">
                  <p>
                    Mọi thứ bắt nguồn từ một dự án tốt nghiệp nhỏ của nhóm sinh viên FPT Polytechnic, nhưng trên hết, đó là sự đồng điệu của những bạn trẻ yêu thích phụ kiện handmade. Chúng mình nhận ra, giữa vô vàn sản phẩm đại trà trên thị trường, tìm được một món đồ thực sự mang <span className="font-semibold text-neutral-800">dấu ấn cá nhân</span> lại chẳng hề dễ dàng.
                  </p>
                  <p>
                    Cái tên <strong>Mushroomie</strong> ra đời từ đó. Hình ảnh cây nấm (mushroom) trong tự nhiên luôn đa dạng, không có cây nào hoàn toàn giống cây nào. Kết hợp cùng hậu tố <em>"-ie"</em> xinh xắn, Mushroomie mang mong muốn trở thành một người bạn nhỏ bé, dễ thương đồng hành cùng bạn mỗi ngày.
                  </p>
                  <p>
                    Đặc biệt, cảm hứng <strong>Pixel</strong> trong logo chính là phép ẩn dụ hoàn hảo: từng ô vuông nhỏ xíu ghép lại thành hình ảnh lớn, cũng như từng hạt charm, sợi dây cước được chúng mình tỉ mẩn kết nối bằng tay để tạo nên một món phụ kiện hoàn chỉnh — duy nhất dành cho bạn.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 3. Vision & Mission - Clean Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <AnimateOnScroll animation="fade-up">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Định hướng & Sứ mệnh</h2>
              <div className="w-24 h-1.5 bg-primary rounded-full mx-auto opacity-80"></div>
            </AnimateOnScroll>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimateOnScroll animation="zoom-in" delay={100}>
              <div className="h-full p-10 rounded-[2.5rem] bg-gradient-to-br from-[#FDFBF7] to-red-50/50 border border-red-100 shadow-sm hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm text-primary">👁️</div>
                <h3 className="font-heading text-2xl font-bold text-neutral-900 mb-4 relative z-10">Tầm nhìn</h3>
                <p className="text-neutral-600 leading-relaxed relative z-10">
                  Trở thành thương hiệu phụ kiện handmade cá nhân hóa được giới trẻ Việt Nam yêu thích nhất. Mushroomie không chỉ bán phụ kiện, chúng mình xây dựng một <strong>không gian sáng tạo</strong> cho những người trẻ yêu cái đẹp, sự khác biệt và khát khao bộc lộ cá tính.
                </p>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="zoom-in" delay={200}>
              <div className="h-full p-10 rounded-[2.5rem] bg-gradient-to-br from-[#FDFBF7] to-rose-50/50 border border-rose-100 shadow-sm hover:shadow-xl transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm text-primary">🎯</div>
                <h3 className="font-heading text-2xl font-bold text-neutral-900 mb-4 relative z-10">Sứ mệnh</h3>
                <p className="text-neutral-600 leading-relaxed relative z-10">
                  Mang đến những món phụ kiện nhỏ xinh, chất lượng và mang đậm yếu tố cá nhân hóa. Mỗi chiếc vòng tay, móc khóa đều là cầu nối giúp khách hàng tự tin thể hiện phong cách riêng, lưu giữ kỷ niệm và lan tỏa năng lượng tích cực mỗi ngày.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* 4. Core Values / USP */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-neutral-900 z-0">
           {/* Dark mode premium feel for core values */}
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <span className="text-primary font-bold tracking-widest uppercase text-sm mb-2 block">Lợi thế khác biệt</span>
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6">Giá trị cốt lõi</h2>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StaggerChildren animation="fade-up" staggerDelay={200}>
              {[
                { 
                  icon: '👐', 
                  title: 'Thủ công 100%', 
                  desc: 'Mỗi sản phẩm đều được tạo ra bởi đôi bàn tay tỉ mỉ: từ lúc chọn hạt charm, phối màu dây cước cho đến khâu hoàn thiện cuối cùng. Sự chăm chút đó làm nên cái hồn chân thật mà không cỗ máy nào thay thế được.'
                },
                { 
                  icon: '🎨', 
                  title: 'Cá nhân hóa', 
                  desc: 'Bạn chính là nhà thiết kế của riêng mình. Tự do lựa chọn từng hạt charm, kiểu dáng, màu sắc hoặc ghi chú tên riêng. Một món phụ kiện đẹp nhất là khi nó khiến bạn thốt lên: "Đây chính là mình!".'
                },
                { 
                  icon: '💌', 
                  title: 'Gói trọn cảm xúc', 
                  desc: 'Hơn cả công năng trang trí, đó là sự gắn kết. Một món quà sinh nhật, một kỷ niệm tình bạn hay món đồ lưu giữ thanh xuân. Từng chiếc thẻ tag cảm ơn, từng hộp quà Mushroomie đều chứa đựng sự trân trọng.'
                },
              ].map((value, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 hover:bg-white/10 transition-all duration-300">
                  <div className="text-5xl mb-6 bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                    {value.icon}
                  </div>
                  <h3 className="font-heading text-xl font-bold text-white mb-4">{value.title}</h3>
                  <p className="text-neutral-300 leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </StaggerChildren>
          </div>
        </div>
      </section>

      {/* 5. Products we make */}
      <section className="py-24 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <AnimateOnScroll animation="fade-right">
              <h2 className="font-heading text-3xl md:text-5xl font-bold text-neutral-900 max-w-lg leading-tight">
                Thế giới phụ kiện <br/>của chúng mình
              </h2>
            </AnimateOnScroll>
            <AnimateOnScroll animation="fade-left" delay={100}>
              <Link href="/san-pham" className="group flex items-center gap-2 text-primary font-bold hover:text-red-700 transition-colors pb-2 border-b-2 border-primary/30 hover:border-primary">
                Xem tất cả sản phẩm
                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </AnimateOnScroll>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerChildren animation="zoom-in" staggerDelay={100}>
              {orderedCategories.map((prod, idx) => {
                const color = bgColors[prod.slug] || 'bg-neutral-50';
                const link = `/san-pham?category=${prod.slug}`;
                const iconSrc = prod.icon || prod.image_url || null;

                return (
                <Link href={link} key={idx} className={`${color} block p-8 rounded-3xl border border-black/5 hover:scale-[1.02] transition-transform duration-300 cursor-pointer`}>
                  <div className="mb-4 bg-white/60 w-16 h-16 flex items-center justify-center rounded-full shadow-sm">
                    <CategoryIcon iconSrc={iconSrc} name={prod.name} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-neutral-900 mb-2">{prod.name}</h3>
                  <p className="text-neutral-600 text-sm">{prod.description || 'Khám phá bộ sưu tập phụ kiện độc đáo từ Mushroomie.'}</p>
                </Link>
                );
              })}
            </StaggerChildren>
          </div>
        </div>
      </section>

      {/* 6. CTA - Premium & Warm */}
      <section className="py-20 px-4">
        <AnimateOnScroll animation="zoom-in">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary to-rose-600 rounded-[3rem] p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
            {/* Decorative background vectors */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute -left-[20%] -top-[20%] w-[50%] h-[150%] text-white fill-current transform -rotate-12"><path d="M50 0 C20 0 0 20 0 50 C0 80 20 100 50 100 C80 100 100 80 100 50 C100 20 80 0 50 0 Z M50 80 C33.4 80 20 66.6 20 50 C20 33.4 33.4 20 50 20 C66.6 20 80 33.4 80 50 C80 66.6 66.6 80 50 80 Z"></path></svg>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute -right-[10%] -bottom-[20%] w-[40%] h-[120%] text-white fill-current transform rotate-12"><path d="M50 0 C20 0 0 20 0 50 C0 80 20 100 50 100 C80 100 100 80 100 50 C100 20 80 0 50 0 Z M50 80 C33.4 80 20 66.6 20 50 C20 33.4 33.4 20 50 20 C66.6 20 80 33.4 80 50 C80 66.6 66.6 80 50 80 Z"></path></svg>
            </div>
            
            <div className="relative z-10">
              <span className="text-4xl mb-6 block drop-shadow-md">🎀</span>
              <h2 className="font-heading text-3xl md:text-5xl font-bold mb-6">Sẵn sàng tạo nên <br className="hidden md:block"/>phong cách của riêng bạn?</h2>
              <p className="text-white/90 text-lg mb-10 max-w-xl mx-auto font-medium">
                Hãy để Mushroomie trở thành mảnh ghép nhỏ xinh tô điểm thêm cá tính cho bạn mỗi ngày.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/san-pham" className="bg-white text-primary px-8 py-4 rounded-full font-bold hover:bg-neutral-50 hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                  <span>Khám phá sản phẩm ngay</span>
                </Link>
                <Link href="/lien-he" className="bg-transparent border-2 border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 hover:border-white transition-all backdrop-blur-sm flex items-center justify-center gap-2">
                  <span>Liên hệ thiết kế riêng</span>
                </Link>
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </div>
  )
}

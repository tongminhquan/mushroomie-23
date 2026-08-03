import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'
import AnimateOnScroll, { StaggerChildren } from '@/components/ui/AnimateOnScroll'
import CategoryIcon from '@/components/ui/CategoryIcon'
import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'
import { aboutPageSchema } from '@/lib/local-seo'
import { safeJsonLd } from '@/lib/security'

export const metadata: Metadata = {
  title: 'Câu chuyện thương hiệu phụ kiện handmade',
  description: 'Làm bằng tay, Trao bằng tim. Khám phá hành trình và giá trị cốt lõi của Mushroomie - thương hiệu phụ kiện handmade cá nhân hóa.',
  alternates: { canonical: 'https://mushroomie.io.vn/gioi-thieu' },
}

const timeline = [
  { year: '2018 · Tuổi 18', title: 'Niềm yêu thích đầu tiên', desc: 'Những hộp hạt cườm đủ màu, vài chiếc charm và mong muốn tạo ra phụ kiện mang dấu ấn riêng. Mushroomie bắt đầu chỉ từ niềm vui làm thủ công.', dot: '#c91414' },
  { year: '2020 · Những đơn đầu tiên', title: 'Từ bạn bè đến cộng đồng', desc: 'Những món quà tặng bạn bè được yêu thích, rồi lan tỏa. Mushroomie nhận đơn custom đầu tiên — mỗi đơn là một câu chuyện riêng.', dot: '#ff6b6b' },
  { year: '2023 · Lớn lên cùng Gen Z', title: 'Thương hiệu của sự cá nhân hóa', desc: 'Mở rộng charm, màu dây & kiểu phối. Thêm mini game, voucher và trải nghiệm mua sắm mượt trên mobile — vẫn giữ trọn tinh thần handmade.', dot: '#b9794b' },
  { year: 'Hôm nay · Và cả bạn', title: 'Làm bằng tay, trao bằng tim', desc: 'Mỗi sản phẩm vẫn được làm thủ công tỉ mỉ — và câu chuyện tiếp theo sẽ thuộc về bạn.', dot: '#c91414', emoji: '🍄' },
]

const values = [
  { icon: '✋', chip: '#ffd6d6', title: 'Thủ công', desc: 'Tỉ mỉ từng chi tiết, mỗi món có dấu ấn riêng của người làm.' },
  { icon: '✨', chip: '#ffe7a3', title: 'Cá nhân hóa', desc: 'Bạn chọn màu, charm, kiểu dáng & thông điệp — đúng chất riêng.' },
  { icon: '❤️', chip: '#ffece6', title: 'Cảm xúc', desc: 'Không chỉ là phụ kiện — mà là quà tặng, kỷ niệm & câu chuyện.' },
]

export default async function AboutPage() {
  const targetSlugs = ['vong-tay', 'charm', 'moc-khoa', 'vong-co']
  const dbCategories = await prisma.category.findMany({
    where: { slug: { in: targetSlugs }, type: 'product' },
  }).catch(() => [])

  const orderedCategories = targetSlugs
    .map((slug) => dbCategories.find((c: Category) => c.slug === slug))
    .filter(Boolean) as typeof dbCategories

  const catChips: Record<string, string> = {
    'vong-tay': '#ffd6d6', 'charm': '#ffe7a3', 'moc-khoa': '#fff0ed', 'vong-co': '#ffece6',
  }

  return (
    <div className="min-h-screen bg-theme-page pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutPageSchema()) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-theme-section text-center">
        <span aria-hidden className="pointer-events-none select-none absolute left-[12%] top-[30%] text-2xl text-coral animate-float-soft">❤</span>
        <span aria-hidden className="pointer-events-none select-none absolute right-[14%] top-[26%] text-xl text-accent-mint animate-float-soft" style={{ animationDelay: '1.2s' }}>★</span>
        <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-12">
          <div className="text-5xl mb-4 animate-float-soft" aria-hidden>🍄</div>
          <span className="inline-block text-xs font-extrabold tracking-[0.14em] uppercase text-theme-accent mb-3">Câu chuyện Mushroomie</span>
          <h1 className="font-heading text-3xl md:text-5xl leading-[1.08] text-theme-primary mb-4">Bắt đầu từ một góc bàn nhỏ &amp; tình yêu handmade</h1>
          <p className="m-0 mx-auto max-w-lg text-[15px] md:text-base leading-relaxed text-theme-secondary">
            Mỗi hạt cườm, mỗi chiếc charm đều mang một câu chuyện. Đây là câu chuyện của chúng mình — và sẽ sớm có cả bạn trong đó ♡
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12">
        <div className="relative pl-10">
          <div className="absolute left-[11px] top-1.5 bottom-1.5 w-0.5" style={{ background: 'linear-gradient(#c91414,#ffd6d6)' }} aria-hidden />
          {timeline.map((m) => (
            <AnimateOnScroll key={m.year} animation="fade-up">
              <div className="relative mb-8 last:mb-0">
                <span
                  className="absolute -left-10 top-0.5 grid h-6 w-6 place-items-center rounded-full text-[11px]"
                  style={{ background: m.dot, border: '4px solid var(--color-secondary)', boxShadow: `0 0 0 2px ${m.dot}` }}
                  aria-hidden
                >{m.emoji || ''}</span>
                <div className="font-heading text-[13px] mb-1.5" style={{ color: m.dot === '#c91414' ? 'var(--primary-content)' : m.dot }}>{m.year}</div>
                <h2 className="font-heading text-lg text-theme-primary mb-1.5">{m.title}</h2>
                <p className="m-0 text-sm leading-relaxed text-theme-secondary">{m.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Vision / Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        <div className="grid gap-5 md:grid-cols-2">
          <AnimateOnScroll animation="fade-up">
            <div className="h-full rounded-[24px] border border-theme-border bg-theme-card p-7 shadow-card">
              <div className="text-2xl mb-2.5" aria-hidden>🌱</div>
              <h2 className="font-heading text-xl text-theme-primary mb-2">Tầm nhìn</h2>
              <p className="m-0 text-sm leading-relaxed text-theme-secondary">Trở thành thương hiệu phụ kiện handmade cá nhân hóa được Gen Z yêu thích nhất — nơi mỗi món đồ đều kể một câu chuyện.</p>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={120}>
            <div className="h-full rounded-[24px] border border-theme-border bg-theme-card p-7 shadow-card">
              <div className="text-2xl mb-2.5" aria-hidden>💌</div>
              <h2 className="font-heading text-xl text-theme-primary mb-2">Sứ mệnh</h2>
              <p className="m-0 text-sm leading-relaxed text-theme-secondary">Giúp mỗi bạn trẻ thể hiện cá tính &amp; cảm xúc qua phụ kiện thủ công, biến những chi tiết nhỏ thành niềm vui mỗi ngày.</p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Core values */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14">
        <AnimateOnScroll animation="fade-up">
          <div className="text-center mb-8">
            <span className="inline-block text-xs font-extrabold tracking-[0.14em] uppercase text-theme-accent mb-2.5">Giá trị cốt lõi</span>
            <h2 className="font-heading text-2xl md:text-3xl text-theme-primary">Ba điều chúng mình luôn giữ</h2>
          </div>
        </AnimateOnScroll>
        <div className="grid gap-5 sm:grid-cols-3">
          <StaggerChildren animation="fade-up" staggerDelay={120}>
            {values.map((v) => (
              <div key={v.title} className="rounded-[24px] border border-theme-border bg-theme-card p-7 text-center shadow-card">
                <span aria-hidden className="mx-auto mb-3.5 grid h-14 w-14 place-items-center rounded-[18px] text-2xl" style={{ background: v.chip }}>{v.icon}</span>
                <h3 className="font-heading text-lg text-theme-primary mb-1.5">{v.title}</h3>
                <p className="m-0 text-[13.5px] leading-relaxed text-theme-secondary">{v.desc}</p>
              </div>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* Product categories (real DB data) */}
      {orderedCategories.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
            <AnimateOnScroll animation="fade-up">
              <h2 className="font-heading text-2xl md:text-3xl text-theme-primary">Sản phẩm của chúng mình</h2>
            </AnimateOnScroll>
            <Link href="/san-pham" className="inline-flex items-center gap-2 text-sm font-extrabold text-theme-accent hover:text-theme-accent">
              Tất cả sản phẩm <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            <StaggerChildren animation="fade-up" staggerDelay={100}>
              {orderedCategories.map((prod: Category, idx: number) => {
                const iconSrc = prod.icon || prod.image_url || null
                return (
                  <Link
                    href={`/san-pham?category=${prod.slug}`}
                    key={prod.id ?? idx}
                    className="flex h-full flex-col rounded-[24px] border border-theme-border bg-theme-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-hover"
                  >
                    <div className="mb-4 grid h-14 w-14 shrink-0 place-items-center rounded-[16px]" style={{ background: catChips[prod.slug] || '#fff0ed' }}>
                      <CategoryIcon iconSrc={iconSrc} name={prod.name} size="md" imageClassName="max-h-8 max-w-8" />
                    </div>
                    <h3 className="font-heading text-base text-theme-primary leading-tight mb-2">{prod.name}</h3>
                    <p className="text-[13px] leading-6 text-theme-secondary overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
                      {prod.description || 'Khám phá bộ sưu tập phụ kiện độc đáo từ Mushroomie.'}
                    </p>
                    <span className="mt-auto pt-4 text-xs font-extrabold uppercase tracking-[0.08em] text-theme-accent">Xem chi tiết →</span>
                  </Link>
                )
              })}
            </StaggerChildren>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-14">
        <AnimateOnScroll animation="fade-up">
          <div
            className="relative overflow-hidden rounded-[28px] px-6 py-12 sm:px-10 text-center text-white"
            style={{ background: 'radial-gradient(120% 140% at 15% 20%, #ff6b6b, #c91414)', boxShadow: '0 22px 50px rgba(201,20,20,0.3)' }}
          >
            <span aria-hidden className="pointer-events-none select-none absolute left-[9%] top-[26%] text-2xl opacity-50 animate-float-soft">❤</span>
            <h2 className="font-heading text-2xl md:text-4xl leading-tight mb-3">Viết tiếp câu chuyện cùng Mushroomie</h2>
            <p className="mx-auto mb-7 max-w-md text-[15px] opacity-95">Tạo món phụ kiện của riêng bạn — mang theo cá tính &amp; cảm xúc của chính bạn.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/san-pham" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white px-7 font-extrabold text-primary transition-transform hover:scale-[1.03]">
                ✨ Khám phá sản phẩm
              </Link>
              <Link href="/lien-he" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-2 border-white/70 px-7 font-extrabold text-white transition-colors hover:bg-white/10">
                <MessageCircle size={18} /> Custom món riêng
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </div>
  )
}

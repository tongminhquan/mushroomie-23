import type { Metadata } from 'next'
import Link from 'next/link'
import BrandContainer from '@/components/ui/BrandContainer'
import { Gamepad2, Tag, ShoppingBag, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Voucher Mushroomie – Nhận mã giảm giá handmade',
  description: 'Chơi mini game tích điểm, nhập mã khuyến mãi và dùng voucher để mua phụ kiện handmade Mushroomie với giá tốt nhất.',
}

const HOW_TO_STEPS = [
  {
    icon: <Gamepad2 className="h-6 w-6 text-primary" />,
    title: 'Chơi mini game',
    desc: 'Vào trang Mini Game, chơi Tetris hoặc Block Blast. Đạt mốc điểm quy định để nhận voucher tự động về ví.',
  },
  {
    icon: <Tag className="h-6 w-6 text-kraft" />,
    title: 'Nhập mã khuyến mãi',
    desc: 'Đến trang "Voucher của tôi" → nhập mã do Mushroomie gửi qua email hoặc fanpage để kích hoạt vào ví.',
  },
  {
    icon: <ShoppingBag className="h-6 w-6 text-primary" />,
    title: 'Áp dụng khi thanh toán',
    desc: 'Tại bước Thanh toán, chọn voucher từ danh sách ví và xác nhận để trừ ngay vào tổng đơn hàng.',
  },
]

const FAQ = [
  {
    q: 'Voucher game có hết hạn không?',
    a: 'Có. Voucher từ mini game có hiệu lực 7 ngày kể từ khi nhận. Voucher mã code do Mushroomie phát có hạn dùng riêng ghi trên mã.',
  },
  {
    q: 'Mỗi đơn hàng dùng được bao nhiêu voucher?',
    a: 'Mỗi đơn hàng chỉ áp dụng một voucher. Hãy chọn voucher giảm nhiều nhất để tối ưu chi phí.',
  },
  {
    q: 'Chơi nhiều lần có nhận thêm voucher không?',
    a: 'Mỗi mức điểm (5%, 10%, 15%) bạn nhận một voucher. Khi đã dùng hết, chơi đạt mốc lại để nhận thêm.',
  },
  {
    q: 'Voucher có áp dụng cho tất cả sản phẩm không?',
    a: 'Voucher game áp dụng cho toàn bộ đơn hàng, không giới hạn sản phẩm, trừ trường hợp có ghi điều kiện riêng.',
  },
]

export default function VoucherLandingPage() {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'radial-gradient(120% 100% at 50% 0%, #ffd6d6 0%, #fff7f2 60%)' }}
      >
        <span aria-hidden className="pointer-events-none absolute left-[8%] top-[25%] select-none text-2xl opacity-30">🎟</span>
        <span aria-hidden className="pointer-events-none absolute right-[10%] top-[20%] select-none text-xl opacity-25">🍄</span>
        <div className="brand-container py-14 text-center md:py-20">
          <span className="brand-kicker mb-3 inline-block">Ưu đãi Mushroomie</span>
          <h1 className="font-heading text-4xl leading-tight text-text md:text-5xl">
            Voucher xinh từ Nhà Nấm
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-600">
            Chơi mini game tích điểm, nhập mã khuyến mãi và dùng voucher khi mua phụ kiện handmade. Tiết kiệm thật sự, không cần săn sale.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/mini-game"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(228,29,29,0.28)] transition hover:bg-primary-dark"
            >
              <Gamepad2 size={17} /> Chơi mini game
            </Link>
            <Link
              href="/tai-khoan/voucher"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#f0e0d6] bg-white px-7 py-3.5 text-sm font-extrabold text-text transition hover:border-primary hover:text-primary"
            >
              Voucher của tôi
            </Link>
          </div>
        </div>
      </section>

      <BrandContainer className="py-12 md:py-16">
        {/* How to */}
        <section>
          <div className="mb-8 text-center">
            <span className="brand-kicker">Cách nhận voucher</span>
            <h2 className="mt-2 font-heading text-2xl text-text md:text-3xl">3 bước đơn giản</h2>
          </div>
          <div data-batch-reveal className="grid gap-5 md:grid-cols-3">
            {HOW_TO_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex flex-col gap-4 rounded-[22px] border-[1.5px] border-[#f0e0d6] bg-white p-6 shadow-card"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                  {step.icon}
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-neutral-400">Bước {i + 1}</p>
                  <h3 className="font-heading text-lg text-text">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-neutral-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conditions */}
        <section className="mt-12">
          <div className="rounded-[22px] border-[1.5px] border-[#f0e0d6] bg-white p-6 shadow-card md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <Clock className="h-5 w-5 text-kraft" />
              <h2 className="font-heading text-xl text-text">Điều kiện sử dụng</h2>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-neutral-600">
              {[
                'Mỗi đơn hàng chỉ áp dụng được một voucher.',
                'Voucher giảm trên giá trị sản phẩm, không áp dụng cho phí vận chuyển.',
                'Voucher từ mini game có hiệu lực 7 ngày. Voucher sự kiện có hạn dùng riêng.',
                'Voucher không thể chuyển nhượng hay quy đổi thành tiền mặt.',
                'Mushroomie có quyền thu hồi voucher phát sinh do lỗi kỹ thuật hoặc gian lận.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-extrabold text-primary">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <div className="mb-6 text-center">
            <h2 className="font-heading text-2xl text-text">Câu hỏi thường gặp</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-[18px] border-[1.5px] border-[#f0e0d6] bg-white p-5">
                <p className="mb-1.5 text-sm font-extrabold text-text">{item.q}</p>
                <p className="text-sm leading-6 text-neutral-600">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA bottom */}
        <section className="mt-12 rounded-[24px] border-[1.5px] border-dashed border-[#d9b89e] bg-white p-8 text-center">
          <p className="font-heading text-xl text-text">Sẵn sàng săn voucher chưa?</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
            Chơi mini game, đạt mốc điểm và nhận voucher về ví ngay. Nhanh tay trước khi hết hạn nhé 🍄
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/mini-game"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(228,29,29,0.25)] transition hover:bg-primary-dark"
            >
              <Gamepad2 size={17} /> Chơi ngay
            </Link>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-[#f0e0d6] bg-white px-7 py-3.5 text-sm font-extrabold text-text transition hover:border-primary hover:text-primary"
            >
              <ShoppingBag size={17} /> Xem sản phẩm
            </Link>
          </div>
        </section>
      </BrandContainer>
    </div>
  )
}

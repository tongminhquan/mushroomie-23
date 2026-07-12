import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'

/**
 * Khối liên kết Local SEO trên trang chủ — dẫn về các landing page khu vực chính.
 * Anchor text tiếng Việt tự nhiên, không nhồi từ khóa. Phục vụ internal linking
 * cho gói Local SEO (Đồng Nai / Biên Hòa / TP.HCM).
 */
const AREAS = [
  { href: '/phu-kien-handmade-dong-nai', emoji: '🧶', label: 'Phụ kiện handmade Đồng Nai', desc: 'Vòng tay, móc khóa, charm & quà tặng custom' },
  { href: '/vong-tay-custom-dong-nai', emoji: '🎨', label: 'Vòng tay custom Đồng Nai', desc: 'Chọn màu, chọn charm theo gu riêng' },
  { href: '/moc-khoa-handmade-dong-nai', emoji: '🔑', label: 'Móc khóa handmade Đồng Nai', desc: 'Điểm nhấn cho túi, balo, điện thoại' },
  { href: '/qua-tang-handmade-dong-nai', emoji: '🎁', label: 'Quà tặng handmade Đồng Nai', desc: 'Set quà nhỏ xinh, cá nhân hóa theo dịp' },
]

export default function HomeLocalAreas() {
  return (
    <section className="brand-container my-12">
      <div className="mb-5 text-center">
        <p className="brand-kicker justify-center">
          <MapPin size={14} /> Mushroomie tại khu vực của bạn
        </p>
        <h2 className="mt-1 font-heading text-2xl text-neutral-900">Phụ kiện handmade Đồng Nai, Biên Hòa &amp; TP.HCM</h2>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-neutral-500">
          Đặt vòng tay, móc khóa, charm và quà tặng handmade cá nhân hóa — nhận đơn tại Đồng Nai và giao online đến TP.HCM.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AREAS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group rounded-[18px] border-[1.5px] border-warm-border bg-white p-5 shadow-card transition-transform hover:-translate-y-1 motion-reduce:transform-none"
          >
            <div className="mb-2 text-2xl" aria-hidden>{a.emoji}</div>
            <h3 className="font-heading text-base text-neutral-900 group-hover:text-primary">{a.label}</h3>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{a.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">
              Xem ngay <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

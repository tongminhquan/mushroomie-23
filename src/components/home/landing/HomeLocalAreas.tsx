import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { LOCAL_AREA_HUBS } from '@/lib/local-seo-link-graph'
import { getPriorityLocalHomeCards } from '@/lib/priority-local-keywords'

/**
 * Khối liên kết Local SEO trên trang chủ — dẫn về các landing page khu vực chính.
 * Anchor text tiếng Việt tự nhiên, không nhồi từ khóa. Phục vụ internal linking
 * cho gói Local SEO (Đồng Nai / Biên Hòa / TP.HCM).
 */
const HUB_CARD_DETAILS = {
  'Đồng Nai': {
    emoji: '🧶',
    description: 'Vòng tay, móc khóa, charm và quà tặng custom',
  },
  'Trảng Dài': {
    emoji: '🍄',
    description: 'Đặt sản phẩm và hẹn nhận tại xưởng sau khi xác nhận',
  },
  'Biên Hòa': {
    emoji: '📍',
    description: 'Tư vấn từ xưởng Trảng Dài và giao hàng linh hoạt',
  },
  'TP.HCM': {
    emoji: '📦',
    description: 'Đặt online từ Đồng Nai và giao đến TP.HCM',
  },
} as const

const AREAS = [
  ...LOCAL_AREA_HUBS.map((hub) => ({
    href: `/${hub.slug}`,
    label: hub.label,
    ...HUB_CARD_DETAILS[hub.area],
  })),
  ...getPriorityLocalHomeCards(),
]

export default function HomeLocalAreas() {
  return (
    <section className="brand-container my-12 text-theme-primary">
      <div className="mb-5 text-center">
        <p className="brand-kicker justify-center">
          <MapPin size={14} /> Mushroomie tại khu vực của bạn
        </p>
        <h2 className="mt-1 font-heading text-2xl text-theme-primary">Phụ kiện handmade Đồng Nai, Biên Hòa &amp; TP.HCM</h2>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-theme-muted">
          Đặt vòng tay, móc khóa, charm và quà tặng handmade cá nhân hóa — nhận đơn tại Đồng Nai và giao online đến TP.HCM.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            prefetch={false}
            className="theme-transition group rounded-[18px] border-[1.5px] border-theme-border bg-theme-card p-5 shadow-card hover:-translate-y-1 motion-reduce:transform-none"
          >
            <div className="mb-2 text-2xl" aria-hidden>{a.emoji}</div>
            <h3 className="font-heading text-base text-theme-primary group-hover:text-theme-accent">{a.label}</h3>
            <p className="mt-1 text-xs leading-relaxed text-theme-muted">{a.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-theme-accent">
              Xem ngay <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

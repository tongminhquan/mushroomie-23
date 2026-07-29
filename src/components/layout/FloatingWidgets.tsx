'use client'

import { MessageCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'

const channels = [
  { name: 'Zalo', url: 'https://zaloapp.com/qr/p/1pwjtok6797hc', short: 'Z', color: 'bg-[#0068ff]' },
  { name: 'Facebook', url: 'https://www.facebook.com/mushr00mie', short: 'f', color: 'bg-[#1877f2]' },
  { name: 'Instagram', url: 'https://www.instagram.com/mushr00mie._/', short: 'ig', color: 'bg-[#d62976]' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@mushr00mie._?lang=vi-VN', short: 'tk', color: 'bg-text' },
  { name: 'Shopee', url: 'https://shopee.vn/shop/475544379', short: 'S', color: 'bg-[#ee4d2d]' },
]

export default function FloatingWidgets() {
  const [open, setOpen] = useState(false)
  // Trước đây panel render theo `{open && …}` nên biến mất tức thì khi đóng — không còn
  // gì để chạy hiệu ứng. Hook này giữ nó trong DOM hết nhịp đóng (xem useDrawerTransition).
  const panel = useDrawerTransition(open, 180)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-6 md:right-6">
      {panel.mounted && (
        <div
          id="contact-channels"
          role="region"
          aria-label="Các kênh liên hệ Mushroomie"
          data-drawer-state={panel.state}
          className="m-modal absolute bottom-14 right-0 w-52 max-w-[calc(100vw-2rem)] origin-bottom-right rounded-[18px] border border-theme-border bg-theme-card p-2 shadow-strong"
        >
          <p className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-theme-muted">Kết nối với Mushroomie</p>
          {channels.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="m-press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-theme-primary hover:bg-theme-subtle"
            >
              <span className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-black uppercase text-white ${channel.color}`}>{channel.short}</span>
              {channel.name}
            </a>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Đóng kênh liên hệ' : 'Mở kênh liên hệ'}
        aria-expanded={open}
        aria-controls="contact-channels"
        /* Quầng sáng chỉ thở khi panel ĐANG ĐÓNG: nó là lời mời bấm vào. Khi panel đã mở
           thì lời mời đó không còn nghĩa gì, để tiếp chỉ gây nhiễu mắt. */
        className={`m-press grid h-12 w-12 place-items-center rounded-xl bg-primary text-white shadow-[0_10px_28px_rgba(228,29,29,0.28)] transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 motion-reduce:transition-none${
          open ? '' : ' m-pulse-glow'
        }`}
      >
        {open ? <X size={21} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}

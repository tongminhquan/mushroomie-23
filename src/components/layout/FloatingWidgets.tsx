'use client'

import { MessageCircle, X } from 'lucide-react'
import { useState } from 'react'

const channels = [
  { name: 'Zalo', url: 'http://zaloapp.com/qr/p/1pwjtok6797hc', short: 'Z', color: 'bg-[#0068ff]' },
  { name: 'Facebook', url: 'https://www.facebook.com/mushr00mie', short: 'f', color: 'bg-[#1877f2]' },
  { name: 'Instagram', url: 'https://www.instagram.com/mushr00mie._/', short: 'ig', color: 'bg-[#d62976]' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@mushr00mie._?lang=vi-VN', short: 'tk', color: 'bg-text' },
  { name: 'Shopee', url: 'https://shopee.vn/shop/475544379', short: 'S', color: 'bg-[#ee4d2d]' },
]

export default function FloatingWidgets() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      {open && (
        <div className="absolute bottom-14 right-0 w-52 rounded-[18px] border border-neutral-200 bg-white p-2 shadow-strong">
          <p className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-neutral-400">Kết nối với Mushroomie</p>
          {channels.map((channel) => (
            <a
              key={channel.name}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-text hover:bg-neutral-100"
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
        className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-white shadow-[0_10px_28px_rgba(228,29,29,0.28)] hover:bg-primary-dark"
      >
        {open ? <X size={21} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}

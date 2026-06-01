'use client'

import Link from 'next/link'

export default function ZaloButton() {
  return (
    <Link 
      href="http://zaloapp.com/qr/p/1pwjtok6797hc" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 group"
    >
      {/* Hiệu ứng tỏa sáng phía sau */}
      <div className="absolute inset-0 rounded-full bg-[#0068FF] animate-ping opacity-60"></div>
      
      {/* Nút chính */}
      <div className="relative flex items-center justify-center w-full h-full bg-[#0068FF] rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-300">
        <span className="text-white font-black text-lg tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>Zalo</span>
      </div>
    </Link>
  )
}

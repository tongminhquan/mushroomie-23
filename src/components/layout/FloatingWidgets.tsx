'use client'

import Link from 'next/link'

export default function FloatingWidgets() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      {/* Nút Zalo */}
      <Link 
        href="http://zaloapp.com/qr/p/1pwjtok6797hc" 
        target="_blank" 
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 group"
      >
        {/* Hiệu ứng tỏa sáng phía sau */}
        <div className="absolute inset-0 rounded-full bg-[#0068FF] animate-ping opacity-60"></div>
        
        {/* Nút chính */}
        <div className="relative flex items-center justify-center w-full h-full bg-[#0068FF] rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-300">
          <span className="text-white font-black text-lg tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>Zalo</span>
        </div>
      </Link>

      {/* Nút Instagram */}
      <Link 
        href="https://www.instagram.com/_.thnhkn?utm_source=qr" 
        target="_blank" 
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 group"
      >
        {/* Hiệu ứng tỏa sáng phía sau */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] animate-ping opacity-60"></div>
        
        {/* Nút chính */}
        <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
        </div>
      </Link>
    </div>
  )
}

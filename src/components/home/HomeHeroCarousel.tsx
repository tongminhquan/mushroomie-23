'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  id: number
  image_url: string
  title: string | null
  subtitle: string | null
  description: string | null
  button_text: string | null
  button_link: string | null
  secondary_button_text: string | null
  secondary_button_link: string | null
  text_position: string
  text_size: string
  sort_order: number
  status: string
}

interface HomeHeroCarouselProps {
  banners: Banner[]
  fallbackHero: React.ReactNode
}

export default function HomeHeroCarousel({ banners, fallbackHero }: HomeHeroCarouselProps) {
  if (!banners || banners.length === 0) {
    return <>{fallbackHero}</>
  }

  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto sliding interval: 5 seconds
  const startTimer = () => {
    stopTimer()
    timerRef.current = setInterval(() => {
      handleNext()
    }, 5000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    startTimer()
    return () => stopTimer()
  }, [current, banners.length])

  const handleNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrent(prev => (prev === banners.length - 1 ? 0 : prev + 1))
    setTimeout(() => setIsAnimating(false), 600) // Match transition duration
  }

  const handlePrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrent(prev => (prev === 0 ? banners.length - 1 : prev - 1))
    setTimeout(() => setIsAnimating(false), 600) // Match transition duration
  }

  const handleDotClick = (index: number) => {
    if (isAnimating || index === current) return
    setIsAnimating(true)
    setCurrent(index)
    setTimeout(() => setIsAnimating(false), 600)
  }

  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setTouchEnd(null)
    if ('touches' in e) {
      setTouchStart(e.targetTouches[0].clientX)
    } else {
      setTouchStart(e.clientX)
    }
    stopTimer() // Pause timer while dragging
  }

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      setTouchEnd(e.targetTouches[0].clientX)
    } else {
      if (touchStart !== null) {
        setTouchEnd(e.clientX)
      }
    }
  }

  const handleTouchEnd = () => {
    startTimer() // Resume timer after drag
    if (touchStart === null || touchEnd === null) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) {
      handleNext()
    }
    if (isRightSwipe) {
      handlePrev()
    }
    setTouchStart(null)
    setTouchEnd(null)
  }

  const handleMouseLeave = () => {
    startTimer()
    if (touchStart !== null) {
      handleTouchEnd()
    }
  }

  return (
    <div className="w-full bg-neutral-100 flex justify-center pb-8 pt-4">
      <section 
        className="relative w-full md:w-1/2 aspect-video bg-neutral-900 flex items-center overflow-hidden group select-none cursor-grab active:cursor-grabbing md:rounded-xl md:shadow-lg"
        onMouseEnter={stopTimer}
        onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
    >
      {/* Slides Container */}
      <div className="absolute inset-0 w-full h-full">
        {banners.map((banner, index) => {
          const isActive = index === current
          const isPureImage = !banner.title && !banner.subtitle && !banner.description && !banner.button_text
          
          return (
            <div 
              key={banner.id}
              className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
                isActive 
                  ? 'opacity-100 z-10 scale-100' 
                  : 'opacity-0 z-0 scale-105 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <img 
                src={banner.image_url} 
                alt={banner.title || 'Mushroomie Banner'} 
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Gradient Overlay (Only if there is text content to ensure readability) */}
              <div 
                className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
                  isPureImage 
                    ? 'bg-black/10' // Subtle darkening even for pure images
                    : 'bg-gradient-to-tr from-black/85 via-black/45 to-black/10 lg:from-black/75 lg:via-black/35 lg:to-transparent'
                }`}
              />

              {/* Float emojis overlay (Only if there is text) */}
              {!isPureImage && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {['top-10 left-10', 'top-1/4 right-20', 'bottom-20 left-1/4', 'bottom-10 right-10', 'top-1/2 left-1/3'].map((pos, i) => (
                    <div 
                      key={i} 
                      className={`absolute ${pos} text-5xl opacity-15`} 
                      style={{ animation: `bounce 2s ease-in-out ${i * 0.5}s infinite` }}
                    >
                      {['🍄', '✨', '💛', '🌸', '🧶'][i % 5]}
                    </div>
                  ))}
                </div>
              )}

              {/* Slide Content */}
              {!isPureImage && (
                <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 relative z-20 h-full flex pointer-events-none ${
                  banner.text_position === 'top-left' ? 'items-start justify-start' :
                  banner.text_position === 'top-right' ? 'items-start justify-end' :
                  banner.text_position === 'center' ? 'items-center justify-center' :
                  banner.text_position === 'bottom-right' ? 'items-end justify-end' :
                  'items-end justify-start'
                }`}>
                  <div className={`max-w-2xl text-white space-y-4 sm:space-y-6 ${
                    banner.text_position === 'center' ? 'text-center flex flex-col items-center' :
                    banner.text_position?.includes('right') ? 'text-right flex flex-col items-end' : 'text-left'
                  }`}>
                    {/* Floating pill badge */}
                    <div 
                      className={`inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm transition-all duration-700 delay-100 transform ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}
                    >
                      <span>🍄</span> Mushroomie Handmade
                    </div>

                    {/* Banner Headline */}
                    <h1 
                      className={`font-heading font-bold leading-tight transition-all duration-700 delay-200 transform ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      } ${
                        banner.text_size === 'small' ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl' :
                        banner.text_size === 'large' ? 'text-4xl sm:text-6xl md:text-7xl lg:text-8xl' :
                        'text-3xl sm:text-5xl md:text-6xl lg:text-7xl'
                      }`}
                    >
                      {banner.title}
                      {banner.subtitle && (
                        <>
                          <br />
                          <span className="text-yellow-300 drop-shadow-sm font-extrabold">{banner.subtitle}</span>
                        </>
                      )}
                    </h1>

                    {/* Banner Description */}
                    {banner.description && (
                      <p 
                        className={`text-white/85 leading-relaxed transition-all duration-700 delay-300 transform ${
                          isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        } ${
                          banner.text_size === 'small' ? 'text-xs sm:text-sm md:text-base' :
                          banner.text_size === 'large' ? 'text-base sm:text-xl md:text-2xl' :
                          'text-sm sm:text-lg md:text-xl'
                        }`}
                      >
                        {banner.description}
                      </p>
                    )}

                    {/* Action buttons */}
                    {(banner.button_text || banner.secondary_button_text) && (
                      <div 
                        className={`flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4 transition-all duration-700 delay-400 transform pointer-events-auto ${
                          isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                      >
                        {banner.button_text && (
                          <Link 
                            href={banner.button_link || '#'} 
                            className="bg-white text-primary px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full font-bold text-sm sm:text-base hover:bg-yellow-50 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center min-w-[120px] sm:min-w-[140px]"
                          >
                            {banner.button_text}
                          </Link>
                        )}
                        {banner.secondary_button_text && (
                          <Link 
                            href={banner.secondary_button_link || '#'} 
                            className="border-2 border-white text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base hover:bg-white hover:text-neutral-900 transition-all flex items-center justify-center min-w-[120px] sm:min-w-[140px]"
                          >
                            {banner.secondary_button_text}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* If it's a pure image, make the entire slide a clickable link if button_link is specified */}
              {isPureImage && banner.button_link && (
                <Link href={banner.button_link} className="absolute inset-0 z-20 w-full h-full cursor-pointer pointer-events-auto" />
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation Arrow Buttons */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 sm:left-4 z-30 p-2 sm:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/10 hover:border-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90"
            title="Slide trước"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 sm:right-4 z-30 p-2 sm:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white border border-white/10 hover:border-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 active:scale-90"
            title="Slide tiếp theo"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-30 flex justify-center items-center gap-2 sm:gap-2.5">
          {banners.map((_, index) => {
            const isActive = index === current
            return (
              <button 
                key={index}
                onClick={(e) => { e.stopPropagation(); handleDotClick(index); }}
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'w-6 sm:w-8 bg-yellow-300 shadow-sm' 
                    : 'w-2 sm:w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                title={`Chuyển đến slide ${index + 1}`}
              />
            )
          })}
        </div>
      )}
    </section>
  </div>
  )
}

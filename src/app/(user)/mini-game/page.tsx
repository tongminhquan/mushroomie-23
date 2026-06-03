'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const VOUCHER_TIERS = [
  { percent: 10, points: 10000, color: 'from-cyan-500 to-blue-500', icon: '🎟️' },
  { percent: 15, points: 15000, color: 'from-purple-500 to-pink-500', icon: '🎫' },
  { percent: 20, points: 20000, color: 'from-orange-500 to-red-500', icon: '🏆' },
]

export default function MiniGamePage() {
  const { data: session } = useSession()
  const [points, setPoints] = useState(0)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastScore, setLastScore] = useState<number | null>(null)

  const fetchPoints = async () => {
    if (!session) return
    try {
      const res = await fetch('/api/minigame/get-points')
      const data = await res.json()
      if (res.ok) {
        setPoints(data.points)
        setVouchers(data.vouchers)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchPoints()
    else setLoading(false)
  }, [session])

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      if (e.data && e.data.type === 'GAME_OVER') {
        const score = e.data.score
        setLastScore(score)
        if (score > 0 && session) {
          try {
            const res = await fetch('/api/minigame/submit-score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ score })
            })
            if (res.ok) {
              const data = await res.json()
              setPoints(data.points)
            }
          } catch (err) {
            console.error(err)
          }
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [session])

  const handleExchange = async (percent: number) => {
    if (!session) return
    setExchangeLoading(true)
    setError('')
    try {
      const res = await fetch('/api/minigame/exchange-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Lỗi đổi voucher')
      } else {
        alert(`🎉 Đổi thành công! Mã voucher của bạn là: ${data.voucher.code}`)
        fetchPoints()
      }
    } catch (e) {
      setError('Lỗi kết nối')
    } finally {
      setExchangeLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #111127 50%, #0a0a1a 100%)' }}>
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-3"
            style={{ background: 'rgba(228,29,29,0.15)', color: '#ff6b6b', border: '1px solid rgba(228,29,29,0.2)' }}>
            🎮 Mini Game
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Xếp gạch cùng <span style={{ background: 'linear-gradient(135deg, #e41d1d, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mushroomie</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Chơi game • Tích điểm • Đổi voucher giảm giá
          </p>
        </div>

        {/* Login Notice */}
        {!session && (
          <div className="max-w-xl mx-auto mb-6 text-center p-4 rounded-2xl text-sm font-medium"
            style={{ background: 'rgba(255,225,77,0.08)', border: '1px solid rgba(255,225,77,0.15)', color: '#ffe14d' }}>
            ⚡ Vui lòng đăng nhập để có thể tích điểm và đổi voucher!
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
          {/* Game Area */}
          <div className="flex-1">
            <div className="rounded-2xl overflow-hidden" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 0 60px rgba(0,0,0,0.3)'
            }}>
              <div className="flex justify-center p-3 md:p-4" style={{ minHeight: '500px' }}>
                <iframe
                  src="/minigame/index.html"
                  title="Mini Game Xếp gạch"
                  className="border-none rounded-xl"
                  style={{ width: '100%', maxWidth: '520px', height: '640px' }}
                  scrolling="no"
                ></iframe>
              </div>
            </div>

            {/* Last Score Toast */}
            {lastScore !== null && lastScore > 0 && session && (
              <div className="mt-4 text-center p-3 rounded-xl text-sm font-semibold animate-pulse"
                style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', color: '#00e5ff' }}>
                +{lastScore} điểm đã được cộng vào tài khoản! 🎉
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 space-y-5">
            {/* Points Card */}
            <div className="rounded-2xl p-5 text-center" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)'
            }}>
              <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Điểm tích lũy
              </div>
              {loading ? (
                <div className="h-12 animate-pulse rounded-lg w-1/2 mx-auto" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
              ) : (
                <div className="text-5xl font-black" style={{
                  background: 'linear-gradient(135deg, #00e5ff, #b44dff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {points.toLocaleString('vi-VN')}
                </div>
              )}
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{
                  width: `${Math.min((points / 20000) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #00e5ff, #b44dff)',
                  boxShadow: '0 0 10px rgba(0,229,255,0.4)'
                }} />
              </div>
              <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Chơi game để kiếm thêm điểm!
              </p>
            </div>

            {/* Voucher Exchange */}
            <div className="rounded-2xl p-5" style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)'
            }}>
              <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Đổi Voucher
              </div>
              {error && (
                <div className="text-sm mb-4 text-center p-2 rounded-lg" style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', color: '#ff4d6a' }}>
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {VOUCHER_TIERS.map(tier => {
                  const canExchange = points >= tier.points && session && !exchangeLoading
                  return (
                    <div key={tier.percent} className="rounded-xl p-3 flex items-center justify-between transition-all duration-300"
                      style={{
                        background: canExchange ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${canExchange ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                        opacity: canExchange ? 1 : 0.5
                      }}>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{tier.icon}</div>
                        <div>
                          <div className="font-bold text-white text-sm">Giảm {tier.percent}%</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {tier.points.toLocaleString('vi-VN')} điểm
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={!canExchange}
                        onClick={() => handleExchange(tier.percent)}
                        className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 disabled:cursor-not-allowed"
                        style={{
                          background: canExchange ? 'linear-gradient(135deg, #e41d1d, #ff4d6a)' : 'rgba(255,255,255,0.06)',
                          color: canExchange ? '#fff' : 'rgba(255,255,255,0.3)',
                          boxShadow: canExchange ? '0 0 15px rgba(228,29,29,0.3)' : 'none',
                          border: 'none'
                        }}
                      >
                        {exchangeLoading ? '...' : 'Đổi ngay'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Voucher List */}
            {vouchers.length > 0 && (
              <div className="rounded-2xl p-5" style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)'
              }}>
                <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Voucher của bạn
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                  {vouchers.map(v => (
                    <div key={v.id} className="rounded-xl p-3 flex justify-between items-center" style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div>
                        <div className="font-bold text-sm" style={{ color: '#00e5ff' }}>Giảm {v.discount_percent}%</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(v.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold select-all" style={{
                        background: 'rgba(0,229,255,0.08)',
                        border: '1px solid rgba(0,229,255,0.15)',
                        color: '#00e5ff'
                      }}>
                        {v.code}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

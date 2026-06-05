'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const TetrisGame = dynamic(() => import('@/components/minigame/TetrisGame'), { ssr: false })
const BlockBlastGame = dynamic(() => import('@/components/minigame/BlockBlastGame'), { ssr: false })

const VOUCHER_TIERS = [
  { percent: 10, points: 10000, icon: '🎟️', gradient: 'linear-gradient(135deg, #00e5ff, #4d7aff)' },
  { percent: 15, points: 15000, icon: '🎫', gradient: 'linear-gradient(135deg, #b44dff, #ff4da6)' },
  { percent: 20, points: 20000, icon: '🏆', gradient: 'linear-gradient(135deg, #ff8c1a, #e41d1d)' },
]

export default function MiniGamePage() {
  const { data: session } = useSession()
  const [activeGame, setActiveGame] = useState<'tetris' | 'blockblast'>('tetris')
  const [points, setPoints] = useState(0)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [showScoreToast, setShowScoreToast] = useState(false)

  const [gameToken, setGameToken] = useState<string>('')

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

  const startGameSession = async () => {
    if (!session) return
    try {
      const res = await fetch('/api/minigame/start', { method: 'POST' })
      const data = await res.json()
      if (data.token) setGameToken(data.token)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (session) {
      fetchPoints()
      startGameSession()
    } else {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    startGameSession()
  }, [activeGame])

  const handleGameOver = async (score: number) => {
    setLastScore(score)
    if (score > 0 && session) {
      try {
        const res = await fetch('/api/minigame/submit-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score, token: gameToken })
        })
        if (res.ok) {
          const data = await res.json()
          setPoints(data.points)
          setShowScoreToast(true)
          setTimeout(() => setShowScoreToast(false), 4000)
        } else {
          console.error(await res.text())
          alert('Không thể lưu điểm, có thể do token hết hạn hoặc lỗi kết nối. Đang tải lại game...')
        }
        // Luôn làm mới token sau mỗi lần submit để chống replay attack
        startGameSession()
      } catch (err) {
        console.error(err)
      }
    }
  }

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
        alert(`🎉 Đổi thành công! Mã voucher: ${data.voucher.code}`)
        fetchPoints()
      }
    } catch (e) {
      setError('Lỗi kết nối')
    } finally {
      setExchangeLoading(false)
    }
  }

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '20px',
    backdropFilter: 'blur(16px)',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a1a 0%, #0d0d24 40%, #0a0a1a 100%)',
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Header */}
        <div style={{
          textAlign: 'center',
          padding: 'clamp(40px, 6vw, 64px) 16px clamp(24px, 4vw, 40px)',
          background: 'radial-gradient(ellipse at center top, rgba(228,29,29,0.18), transparent 50%)',
          marginBottom: '8px',
          overflow: 'hidden',
        }}>
          <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '999px',
              background: 'rgba(228,29,29,0.12)',
              border: '1px solid rgba(228,29,29,0.35)',
              color: '#ff5a5a',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '2px',
              textTransform: 'uppercase' as const,
              marginBottom: '20px',
            }}>
              🎮 Mini Game
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(36px, 7vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.05,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              margin: '0 0 14px 0',
              textWrap: 'balance' as any,
            }}>
              Xếp gạch cùng{' '}
              <span style={{
                background: 'linear-gradient(135deg, #e41d1d, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Mushroomie
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 'clamp(15px, 2.2vw, 20px)',
              fontWeight: 600,
              color: '#c9cad8',
              lineHeight: 1.5,
              margin: 0,
            }}>
              Chơi game • Tích điểm • Đổi voucher giảm giá
            </p>
          </div>
        </div>

        {/* Login Notice */}
        {!session && (
          <div className="max-w-xl mx-auto mb-6 text-center p-4 rounded-2xl text-sm font-medium"
            style={{ background: 'rgba(255,225,77,0.08)', border: '1px solid rgba(255,225,77,0.15)', color: '#ffe14d' }}>
            ⚡ Vui lòng đăng nhập để tích điểm và đổi voucher!
          </div>
        )}

        {/* Score Toast */}
        {showScoreToast && lastScore && lastScore > 0 && (
          <div className="max-w-md mx-auto mb-4 text-center p-3 rounded-xl text-sm font-bold"
            style={{
              background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff',
              animation: 'fadeInUp 0.4s ease-out',
            }}>
            🎉 +{lastScore} điểm đã được cộng vào tài khoản!
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto items-start">
          {/* Game Area */}
          <div className="flex-1 min-w-0 flex flex-col items-center w-full">
            {/* Game Tabs */}
            <div className="flex gap-2 mb-4 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button 
                onClick={() => setActiveGame('tetris')}
                className="px-6 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ 
                  background: activeGame === 'tetris' ? 'rgba(0,229,255,0.15)' : 'transparent',
                  color: activeGame === 'tetris' ? '#00e5ff' : 'rgba(255,255,255,0.4)',
                  boxShadow: activeGame === 'tetris' ? '0 0 20px rgba(0,229,255,0.1)' : 'none'
                }}
              >
                Tetris
              </button>
              <button 
                onClick={() => setActiveGame('blockblast')}
                className="px-6 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ 
                  background: activeGame === 'blockblast' ? 'rgba(228,29,29,0.15)' : 'transparent',
                  color: activeGame === 'blockblast' ? '#ff4d6a' : 'rgba(255,255,255,0.4)',
                  boxShadow: activeGame === 'blockblast' ? '0 0 20px rgba(228,29,29,0.1)' : 'none'
                }}
              >
                Block Blast
              </button>
            </div>

            <div className="rounded-2xl p-4 md:p-5 w-full flex justify-center" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 0 80px rgba(0,0,0,0.4)',
              minHeight: '500px',
              alignItems: 'center'
            }}>
              {!session ? (
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-2xl font-bold text-white mb-3">Yêu cầu đăng nhập</h3>
                  <p className="text-base mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Bạn cần đăng nhập để tham gia chơi game và tích điểm đổi voucher nhé!
                  </p>
                  <Link 
                    href="/tai-khoan/dang-nhap?callbackUrl=/mini-game" 
                    className="px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105" 
                    style={{ 
                      background: 'linear-gradient(135deg, #e41d1d, #ff4d6a)', 
                      color: '#fff',
                      boxShadow: '0 0 20px rgba(228,29,29,0.3)'
                    }}
                  >
                    Đăng nhập ngay
                  </Link>
                </div>
              ) : activeGame === 'tetris' ? (
                <TetrisGame onGameOver={handleGameOver} />
              ) : (
                <BlockBlastGame onGameOver={handleGameOver} />
              )}
            </div>
          </div>

          {/* Points & Vouchers Sidebar */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-5">
            {/* Points Card */}
            <div style={glassCard} className="text-center">
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                ĐIỂM TÍCH LŨY
              </div>
              {loading ? (
                <div className="h-12 animate-pulse rounded-lg w-1/2 mx-auto" style={{ background: 'rgba(255,255,255,0.08)' }} />
              ) : (
                <div style={{
                  fontSize: '48px', fontWeight: 900, lineHeight: 1,
                  background: 'linear-gradient(135deg, #00e5ff, #b44dff)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                }}>
                  {points.toLocaleString('vi-VN')}
                </div>
              )}
              {/* Progress bar */}
              <div style={{ marginTop: '12px', height: '5px', borderRadius: '5px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '5px', transition: 'width 0.7s ease',
                  width: `${Math.min((points / 20000) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #00e5ff, #b44dff)',
                  boxShadow: '0 0 12px rgba(0,229,255,0.5)',
                }} />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                Chơi game để tích thêm điểm!
              </p>
            </div>

            {/* Voucher Exchange */}
            <div style={glassCard}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>
                ĐỔI VOUCHER
              </div>
              {error && (
                <div className="text-sm mb-4 text-center p-2.5 rounded-xl" style={{
                  background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', color: '#ff4d6a'
                }}>{error}</div>
              )}
              <div className="space-y-3">
                {VOUCHER_TIERS.map(tier => {
                  const canExchange = points >= tier.points && !!session && !exchangeLoading
                  return (
                    <div key={tier.percent} className="flex items-center justify-between rounded-xl p-3.5 transition-all duration-300" style={{
                      background: canExchange ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${canExchange ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
                      opacity: canExchange ? 1 : 0.45,
                    }}>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '12px',
                          background: tier.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', boxShadow: canExchange ? `0 0 15px rgba(0,0,0,0.3)` : 'none',
                        }}>
                          {tier.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>Giảm {tier.percent}%</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                            {tier.points.toLocaleString('vi-VN')} điểm
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={!canExchange}
                        onClick={() => handleExchange(tier.percent)}
                        style={{
                          padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                          border: 'none', cursor: canExchange ? 'pointer' : 'not-allowed',
                          background: canExchange ? 'linear-gradient(135deg, #e41d1d, #ff4d6a)' : 'rgba(255,255,255,0.06)',
                          color: canExchange ? '#fff' : 'rgba(255,255,255,0.25)',
                          boxShadow: canExchange ? '0 0 20px rgba(228,29,29,0.3)' : 'none',
                          transition: 'all 0.2s ease',
                          fontFamily: "'Outfit', sans-serif",
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
              <div style={glassCard}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>
                  VOUCHER CỦA BẠN
                </div>
                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                  {vouchers.map(v => (
                    <div key={v.id} className="flex justify-between items-center rounded-xl p-3" style={{
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#00e5ff' }}>Giảm {v.discount_percent}%</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                          {new Date(v.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div className="select-all" style={{
                        padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                        fontFamily: "'Courier New', monospace", fontWeight: 700,
                        background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', color: '#00e5ff',
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function MiniGamePage() {
  const { data: session } = useSession()
  const [points, setPoints] = useState(0)
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [error, setError] = useState('')

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
      // Nhận tin nhắn từ iframe game
      if (e.data && e.data.type === 'GAME_OVER') {
        const score = e.data.score
        if (score > 0 && session) {
          try {
            const res = await fetch('/api/minigame/submit-score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ score })
            })
            if (res.ok) {
              const data = await res.json()
              setPoints(data.points) // Cập nhật điểm mới ngay lập tức
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
        alert(`Đổi thành công! Mã voucher của bạn là: ${data.voucher.code}`)
        fetchPoints() // refresh points and vouchers list
      }
    } catch (e) {
      setError('Lỗi kết nối')
    } finally {
      setExchangeLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8">
      {/* Cột Game */}
      <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
        <h1 className="text-2xl font-bold font-heading text-primary mb-4 text-center">Xếp gạch cùng Mushroomie</h1>
        {!session && (
          <div className="text-center p-4 bg-orange-50 text-orange-600 rounded-xl mb-4">
            Vui lòng đăng nhập để có thể tích điểm và đổi voucher!
          </div>
        )}
        <div className="flex justify-center bg-stone-900 rounded-xl overflow-hidden py-4" style={{ height: '700px' }}>
          <iframe 
            src="/minigame/index.html" 
            title="Mini Game"
            width="500"
            height="650"
            className="border-none"
            scrolling="no"
          ></iframe>
        </div>
      </div>

      {/* Cột Đổi Điểm */}
      <div className="w-full lg:w-96 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 text-center">
          <h2 className="text-xl font-bold text-stone-800 mb-2">Điểm Tích Lũy</h2>
          {loading ? (
            <div className="h-10 animate-pulse bg-stone-200 rounded-lg w-1/2 mx-auto"></div>
          ) : (
            <div className="text-4xl font-black text-primary">{points}</div>
          )}
          <p className="text-sm text-stone-500 mt-2">Chơi game xếp gạch để kiếm thêm điểm!</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
          <h2 className="text-xl font-bold text-stone-800 mb-4">Đổi Voucher</h2>
          {error && <div className="text-red-500 text-sm mb-4 text-center bg-red-50 p-2 rounded-lg">{error}</div>}
          
          <div className="space-y-4">
            <div className="border border-stone-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Giảm 10%</div>
                <div className="text-sm text-stone-500">1000 điểm</div>
              </div>
              <button 
                disabled={points < 1000 || exchangeLoading || !session}
                onClick={() => handleExchange(10)}
                className="px-4 py-2 bg-primary text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Đổi
              </button>
            </div>
            
            <div className="border border-stone-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Giảm 15%</div>
                <div className="text-sm text-stone-500">2000 điểm</div>
              </div>
              <button 
                disabled={points < 2000 || exchangeLoading || !session}
                onClick={() => handleExchange(15)}
                className="px-4 py-2 bg-primary text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Đổi
              </button>
            </div>

            <div className="border border-stone-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-lg">Giảm 20%</div>
                <div className="text-sm text-stone-500">3000 điểm</div>
              </div>
              <button 
                disabled={points < 3000 || exchangeLoading || !session}
                onClick={() => handleExchange(20)}
                className="px-4 py-2 bg-primary text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Đổi
              </button>
            </div>
          </div>
        </div>

        {vouchers.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Voucher Của Bạn</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {vouchers.map(v => (
                <div key={v.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-primary">Giảm {v.discount_percent}%</div>
                    <div className="text-xs text-stone-500">{new Date(v.created_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="bg-white px-3 py-1 rounded font-mono text-sm border border-stone-200 select-all">
                    {v.code}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Ticket, Search, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function VoucherWalletPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'USED' | 'EXPIRED'>('AVAILABLE')
  const [vouchers, setVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [redeemCode, setRedeemCode] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const fetchVouchers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/vouchers/my-wallet')
      if (res.ok) {
        const json = await res.json()
        setVouchers(json.data || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchVouchers()
    }
  }, [session])

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!redeemCode.trim()) return
    setRedeemLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Lỗi khi nhận mã')
      }

      setMessage({ text: 'Nhận voucher thành công!', type: 'success' })
      setRedeemCode('')
      fetchVouchers() // Refresh the list
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setRedeemLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-500 mb-4">Vui lòng đăng nhập để xem voucher của bạn</p>
        <Link href="/tai-khoan/dang-nhap"><Button>Đăng nhập ngay</Button></Link>
      </div>
    )
  }

  const filteredVouchers = vouchers.filter(v => v.status === activeTab || (activeTab === 'EXPIRED' && v.status === 'REVOKED'))

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className="text-center pt-2 pb-1">
        <span aria-hidden className="animate-float-soft mr-1 text-lg align-middle pointer-events-none">🎁</span>
        <span className="text-xs font-extrabold tracking-[0.14em] uppercase text-primary">Ví voucher</span>
        <h1 className="font-heading text-3xl md:text-4xl text-text mt-2">Voucher của tôi</h1>
        <p className="text-sm text-neutral-500 mt-2">Săn ưu đãi xinh — áp dụng ngay khi thanh toán ♡</p>
      </div>

      {/* Redeem Form */}
      <div className="bg-white p-5 rounded-[20px] shadow-card border-[1.5px]" style={{ borderColor: '#f0e0d6' }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-text">
          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: '#ffd6d6' }}>
            <Ticket size={16} className="text-primary" />
          </span>
          Thêm mã voucher
        </h2>
        <form onSubmit={handleRedeem} className="flex gap-3 max-w-md">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher tại đây..."
            className="flex-1 rounded-xl border-[1.5px] border-[#e2d3c8] bg-[#fffdfb] px-4 py-2 text-sm font-mono outline-none focus:border-primary uppercase"
          />
          <Button type="submit" isLoading={redeemLoading}>Lưu</Button>
        </form>
        {message.text && (
          <p className={`mt-2 text-sm font-semibold ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('AVAILABLE')}
          className={`text-sm font-bold px-4 py-2 rounded-full transition ${activeTab === 'AVAILABLE' ? 'bg-primary text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)]' : 'bg-white text-neutral-600 border-[1.5px] border-[#e2d3c8] hover:border-primary'}`}
        >
          Có thể sử dụng
        </button>
        <button
          onClick={() => setActiveTab('USED')}
          className={`text-sm font-bold px-4 py-2 rounded-full transition ${activeTab === 'USED' ? 'bg-primary text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)]' : 'bg-white text-neutral-600 border-[1.5px] border-[#e2d3c8] hover:border-primary'}`}
        >
          Đã sử dụng
        </button>
        <button
          onClick={() => setActiveTab('EXPIRED')}
          className={`text-sm font-bold px-4 py-2 rounded-full transition ${activeTab === 'EXPIRED' ? 'bg-primary text-white shadow-[0_8px_20px_rgba(201,20,20,0.3)]' : 'bg-white text-neutral-600 border-[1.5px] border-[#e2d3c8] hover:border-primary'}`}
        >
          Hết hiệu lực
        </button>
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-10 text-center text-sm text-neutral-500">Đang tải voucher...</div>
        ) : filteredVouchers.length > 0 ? (
          filteredVouchers.map(uv => (
            <div
              key={uv.id}
              className={`relative flex rounded-[20px] overflow-hidden transition ${activeTab === 'AVAILABLE' ? 'text-white shadow-[0_12px_28px_rgba(201,20,20,0.22)]' : 'bg-white shadow-card grayscale opacity-75'}`}
              style={
                activeTab === 'AVAILABLE'
                  ? { background: 'linear-gradient(135deg, var(--color-primary), #ff6b6b)' }
                  : { border: '1.5px solid #f0e0d6' }
              }
            >
              {/* Stub */}
              <div
                className={`w-28 flex-shrink-0 flex flex-col items-center justify-center p-3 text-center ${activeTab === 'AVAILABLE' ? 'text-white' : 'text-accent-kraft'}`}
                style={
                  activeTab === 'AVAILABLE'
                    ? { borderRight: '2px dashed rgba(255,255,255,0.45)' }
                    : { borderRight: '2px dashed #f0e0d6', background: '#fffaf5' }
                }
              >
                <Ticket size={28} className="mb-1.5 opacity-85" />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {uv.voucher.type === 'GAME_REWARD' ? 'Thưởng Game' : 'Khuyến mãi'}
                </span>
              </div>
              {/* Punch holes */}
              <span
                aria-hidden
                className="absolute w-[18px] h-[18px] rounded-full bg-secondary"
                style={{ left: '103px', top: '-9px' }}
              />
              <span
                aria-hidden
                className="absolute w-[18px] h-[18px] rounded-full bg-secondary"
                style={{ left: '103px', bottom: '-9px' }}
              />
              {/* Body */}
              <div className="flex-1 p-4 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className={`font-mono font-bold text-lg break-all ${activeTab === 'AVAILABLE' ? 'text-white' : 'text-text'}`}>{uv.voucher.code}</span>
                  {activeTab === 'USED' && <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle2 size={12}/>Đã dùng</span>}
                  {activeTab === 'EXPIRED' && <span className="flex-shrink-0 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1"><XCircle size={12}/>Hết hạn</span>}
                </div>
                <div className={`font-heading text-base mb-1 ${activeTab === 'AVAILABLE' ? 'text-white' : 'text-primary'}`}>
                  Giảm {uv.voucher.discountType === 'PERCENT' ? `${uv.voucher.discountValue}%` : formatPrice(Number(uv.voucher.discountValue))}
                </div>
                <div className={`text-xs mb-2 ${activeTab === 'AVAILABLE' ? 'text-white/90' : 'text-neutral-500'}`}>
                  Đơn tối thiểu {uv.voucher.minOrderValue ? formatPrice(Number(uv.voucher.minOrderValue)) : '0đ'}
                  {uv.voucher.maxDiscount && uv.voucher.discountType === 'PERCENT' ? ` • Tối đa ${formatPrice(Number(uv.voucher.maxDiscount))}` : ''}
                </div>
                <div className={`text-[11px] flex items-center gap-1 mt-auto ${activeTab === 'AVAILABLE' ? 'text-white/80' : 'text-neutral-400'}`}>
                  <Clock size={12} /> HSD: {uv.expiresAt ? new Date(uv.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-white rounded-[24px]" style={{ border: '1.5px dashed #e2d3c8' }}>
            <span aria-hidden className="animate-float-soft text-4xl mb-3 pointer-events-none">🍄</span>
            <p className="font-heading text-lg text-text mb-1">Bạn chưa có voucher nào ở đây</p>
            <p className="text-sm text-neutral-500 max-w-xs">Chơi mini game để nhận voucher xinh, hoặc nhập mã ưu đãi từ fanpage nhé!</p>
          </div>
        )}
      </div>
    </div>
  )
}

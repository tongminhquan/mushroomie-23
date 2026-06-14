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
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-text">Voucher của tôi</h1>

      {/* Redeem Form */}
      <div className="bg-white p-5 rounded-[18px] border border-neutral-200 shadow-sm">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><Ticket size={18} className="text-primary"/> Thêm mã voucher</h2>
        <form onSubmit={handleRedeem} className="flex gap-3 max-w-md">
          <input 
            type="text" 
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher tại đây..." 
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-mono outline-none focus:border-primary uppercase"
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
      <div className="flex gap-6 border-b border-neutral-200">
        <button 
          onClick={() => setActiveTab('AVAILABLE')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'AVAILABLE' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
        >
          Có thể sử dụng
        </button>
        <button 
          onClick={() => setActiveTab('USED')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'USED' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
        >
          Đã sử dụng
        </button>
        <button 
          onClick={() => setActiveTab('EXPIRED')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'EXPIRED' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
        >
          Hết hiệu lực
        </button>
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 py-10 text-center text-sm text-neutral-500">Đang tải voucher...</div>
        ) : filteredVouchers.length > 0 ? (
          filteredVouchers.map(uv => (
            <div key={uv.id} className={`flex rounded-[16px] border ${activeTab === 'AVAILABLE' ? 'border-primary/20 bg-white shadow-sm' : 'border-neutral-200 bg-neutral-50 grayscale opacity-70'} overflow-hidden`}>
              <div className={`w-24 flex-shrink-0 flex flex-col items-center justify-center p-3 text-white ${activeTab === 'AVAILABLE' ? 'bg-primary' : 'bg-neutral-400'}`}>
                <Ticket size={32} className="mb-1 opacity-80" />
                <span className="text-[10px] font-bold text-center uppercase">
                  {uv.voucher.type === 'GAME_REWARD' ? 'Thưởng Game' : 'Khuyến mãi'}
                </span>
              </div>
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono font-bold text-lg text-neutral-800">{uv.voucher.code}</span>
                  {activeTab === 'USED' && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle2 size={12}/>Đã dùng</span>}
                  {activeTab === 'EXPIRED' && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1"><XCircle size={12}/>Hết hạn</span>}
                </div>
                <div className="text-sm font-bold text-primary mb-1">
                  Giảm {uv.voucher.discountType === 'PERCENT' ? `${uv.voucher.discountValue}%` : formatPrice(Number(uv.voucher.discountValue))}
                </div>
                <div className="text-xs text-neutral-500 mb-2">
                  Đơn tối thiểu {uv.voucher.minOrderValue ? formatPrice(Number(uv.voucher.minOrderValue)) : '0đ'}
                  {uv.voucher.maxDiscount && uv.voucher.discountType === 'PERCENT' ? ` • Tối đa ${formatPrice(Number(uv.voucher.maxDiscount))}` : ''}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-auto">
                  <Clock size={12} /> HSD: {uv.expiresAt ? new Date(uv.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-10 text-center flex flex-col items-center justify-center bg-neutral-50 rounded-[18px] border border-neutral-100">
            <Ticket size={40} className="text-neutral-300 mb-3" />
            <p className="text-sm font-semibold text-neutral-500">Chưa có voucher nào trong mục này</p>
          </div>
        )}
      </div>
    </div>
  )
}

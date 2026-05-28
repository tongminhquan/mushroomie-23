'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Payment {
  status: string
  bank_name: string
  bank_account: string
  account_name: string
  amount: number
  transfer_content: string
  qr_code_url?: string
  expires_at?: string
}

interface PaymentStatusData {
  status: string
  orderStatus: string
  paymentStatus: string
  expiresAt?: string
  paidAt?: string
}

export default function ConfirmPage() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get('orderCode') || ''
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    if (!orderCode) return
    try {
      const [orderRes, statusRes] = await Promise.all([
        fetch(`/api/orders/${orderCode}`),
        fetch(`/api/orders/${orderCode}/payment-status`),
      ])
      const orderData = await orderRes.json()
      const statusData = await statusRes.json()
      setPayment(orderData.payment)
      setPaymentStatus(statusData)
      if (statusData.expiresAt) {
        const left = Math.max(0, Math.floor((new Date(statusData.expiresAt).getTime() - Date.now()) / 1000))
        setTimeLeft(left)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [orderCode])

  useEffect(() => { fetchData() }, [fetchData])

  // Poll every 5s if pending
  useEffect(() => {
    if (paymentStatus?.status === 'PAID' || paymentStatus?.status === 'EXPIRED') return
    const interval = setInterval(async () => {
      setPolling(true)
      await fetchData()
      setPolling(false)
    }, 5000)
    return () => clearInterval(interval)
  }, [paymentStatus?.status, fetchData])

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft((t) => (t !== null ? Math.max(0, t - 1) : null)), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-neutral-500">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    )
  }

  if (paymentStatus?.status === 'PAID') {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Thanh toán thành công! 🎉</h1>
          <p className="text-neutral-500 mb-2">Mã đơn hàng: <strong>#{orderCode}</strong></p>
          <p className="text-neutral-500 text-sm mb-6">Mushroomie đã nhận được thanh toán và sẽ bắt đầu làm sản phẩm ngay cho bạn! 💛</p>
          <div className="space-y-3">
            <Link href={`/tai-khoan/don-hang/${orderCode}`}>
              <Button className="w-full">Xem chi tiết đơn hàng</Button>
            </Link>
            <Link href="/san-pham">
              <Button variant="outline" className="w-full">Tiếp tục mua sắm</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus?.status === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Đã hết hạn thanh toán</h1>
          <p className="text-neutral-500 mb-6">Thời gian thanh toán đã hết hạn. Vui lòng đặt lại đơn hàng.</p>
          <Link href="/san-pham"><Button className="w-full">Đặt hàng mới</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white p-6 text-center">
            <div className="text-3xl mb-2">🏦</div>
            <h1 className="font-heading text-xl font-bold">Chuyển khoản ngân hàng</h1>
            <p className="text-white/80 text-sm mt-1">Mã đơn: <strong>#{orderCode}</strong></p>
          </div>

          <div className="p-6 space-y-5">
            {/* QR Code */}
            {payment?.qr_code_url && (
              <div className="text-center">
                <Image
                  src={payment.qr_code_url}
                  alt="QR Code chuyển khoản"
                  width={250}
                  height={250}
                  className="mx-auto rounded-2xl border-4 border-primary-light shadow-card"
                  unoptimized
                />
                <p className="text-xs text-neutral-500 mt-2">Quét QR bằng app ngân hàng để chuyển tiền</p>
              </div>
            )}

            {/* Bank info */}
            {payment && (
              <div className="bg-neutral-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Ngân hàng</span>
                  <span className="font-bold">{payment.bank_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Số tài khoản</span>
                  <strong className="font-mono text-primary text-base">{payment.bank_account}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Chủ tài khoản</span>
                  <span className="font-bold uppercase">{payment.account_name}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-neutral-200 pt-2">
                  <span className="text-neutral-500">Số tiền</span>
                  <span className="font-bold text-primary text-lg">{formatPrice(Number(payment.amount))}</span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-2">
                  <p className="text-xs text-yellow-700 font-semibold mb-1">⚠️ Nội dung chuyển khoản (bắt buộc):</p>
                  <p className="font-mono font-bold text-sm text-yellow-900 break-all">{payment.transfer_content}</p>
                </div>
              </div>
            )}

            {/* Timer */}
            {timeLeft !== null && timeLeft > 0 && (
              <div className="flex items-center justify-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3">
                <Clock size={16} className="text-orange-600" />
                <span className="text-sm text-orange-700">Thời gian còn lại: <strong className="font-mono text-lg">{formatTime(timeLeft)}</strong></span>
              </div>
            )}

            {/* Auto-checking */}
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              <RefreshCw size={12} className={polling ? 'animate-spin' : ''} />
              Hệ thống tự động kiểm tra thanh toán mỗi 5 giây
            </div>

            <div className="bg-primary-light rounded-xl p-4 text-sm">
              <p className="font-semibold text-primary mb-1">📌 Lưu ý quan trọng:</p>
              <ul className="text-xs space-y-1 text-neutral-600">
                <li>• Chuyển đúng số tiền và nội dung bên trên</li>
                <li>• Đơn hàng tự động xác nhận sau 1-5 phút</li>
                <li>• Không đóng trang này trước khi chuyển khoản</li>
                <li>• Bạn sẽ nhận email xác nhận sau khi thanh toán</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Link from 'next/link'

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

/**
 * Build a VietQR image URL client-side from payment bank info.
 * This is the fallback when the server-provided qr_code_url is invalid or missing.
 */
function buildClientQrUrl(payment: Payment): string {
  const bankBin = payment.bank_name // may be BIN code like "970422"
  const accountNo = payment.bank_account
  const amount = Math.round(Number(payment.amount)) // integer VND, no decimals
  const addInfo = encodeURIComponent(payment.transfer_content || '')
  const accountName = encodeURIComponent(payment.account_name || '')

  return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`
}

/**
 * Check if a URL looks like a valid image URL (not an HTML page).
 */
function isImageUrl(url: string): boolean {
  if (!url) return false
  // PayOS checkoutUrl looks like https://pay.payos.vn/web/xxx — NOT an image
  if (url.includes('payos.vn')) return false
  // VietQR image URL contains img.vietqr.io and ends with .png
  if (url.includes('img.vietqr.io')) return true
  // Generic check: ends with image extension
  if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url)) return true
  return false
}

export default function ConfirmPage() {
  const searchParams = useSearchParams()
  const orderCode = searchParams.get('orderCode') || ''
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [qrStatus, setQrStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  const fetchData = useCallback(async () => {
    if (!orderCode) return
    try {
      const [orderRes, statusRes] = await Promise.all([
        fetch(`/api/orders/${orderCode}`),
        fetch(`/api/orders/${orderCode}/payment-status`),
      ])
      const orderData = await orderRes.json()
      const statusData = await statusRes.json()
      setOrderInfo(orderData)
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

  // Poll every 5s if pending (only for bank transfer)
  useEffect(() => {
    if (orderInfo?.payment_method === 'cod') return
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

  // Compute the best QR image URL
  const qrImageUrl = useMemo(() => {
    if (!payment) return ''

    // If server provided a valid image URL, use it (via proxy to avoid CORS)
    if (payment.qr_code_url && isImageUrl(payment.qr_code_url)) {
      return `/api/qr?url=${encodeURIComponent(payment.qr_code_url)}`
    }

    // Fallback: build VietQR image URL from payment bank info
    if (payment.bank_account && payment.amount) {
      const directUrl = buildClientQrUrl(payment)
      return `/api/qr?url=${encodeURIComponent(directUrl)}`
    }

    return ''
  }, [payment])

  // Reset QR status when URL changes
  useEffect(() => {
    if (qrImageUrl) {
      setQrStatus('loading')
    }
  }, [qrImageUrl])

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

  if (orderInfo?.payment_method === 'cod') {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-neutral-900 mb-2">Đặt hàng thành công! 🎉</h1>
          <p className="text-neutral-500 mb-2">Mã đơn hàng: <strong>#{orderCode}</strong></p>
          <p className="text-neutral-500 text-sm mb-6">Mushroomie sẽ liên hệ và giao hàng đến bạn trong thời gian sớm nhất. Bạn sẽ thanh toán khi nhận hàng nhé! 📦💛</p>
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
            {qrImageUrl ? (
              <div className="text-center">
                {/* Loading state */}
                {qrStatus === 'loading' && (
                  <div className="mx-auto w-[280px] h-[280px] rounded-2xl border-4 border-primary-light bg-neutral-50 flex items-center justify-center">
                    <div className="text-center">
                      <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-2" />
                      <p className="text-xs text-neutral-500">Đang tạo mã QR...</p>
                    </div>
                  </div>
                )}

                {/* QR image */}
                <img
                  src={qrImageUrl}
                  alt="QR Code chuyển khoản"
                  width={280}
                  height={280}
                  className={`mx-auto rounded-2xl border-4 border-primary-light shadow-card ${qrStatus !== 'loaded' ? 'hidden' : ''}`}
                  referrerPolicy="no-referrer"
                  onLoad={() => setQrStatus('loaded')}
                  onError={() => setQrStatus('error')}
                />

                {/* Error state */}
                {qrStatus === 'error' && (
                  <div className="mx-auto w-[280px] rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-6 flex flex-col items-center justify-center">
                    <AlertTriangle size={32} className="text-orange-500 mb-2" />
                    <p className="text-sm font-semibold text-orange-700 mb-1">Không thể tải mã QR</p>
                    <p className="text-xs text-orange-600">Vui lòng chuyển khoản thủ công theo thông tin bên dưới</p>
                  </div>
                )}

                {qrStatus === 'loaded' && (
                  <p className="text-xs text-neutral-500 mt-2">Quét QR bằng app ngân hàng để chuyển tiền</p>
                )}
              </div>
            ) : payment ? (
              <div className="text-center mx-auto w-[280px] rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 p-6">
                <AlertTriangle size={32} className="text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-orange-700 mb-1">Mã QR không khả dụng</p>
                <p className="text-xs text-orange-600">Vui lòng chuyển khoản thủ công theo thông tin bên dưới</p>
              </div>
            ) : null}

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

            <div style={{
              background: '#fff7f2',
              border: '1px solid #ffd6d6',
              borderRadius: '18px',
              padding: '20px 24px',
            }}>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#e41d1d', marginBottom: '10px' }}>📌 Lưu ý quan trọng:</p>
              <ul style={{ fontSize: '14px', lineHeight: 1.7, color: '#444', paddingLeft: '18px', margin: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: '4px' }}>• Chuyển đúng số tiền và nội dung bên trên</li>
                <li style={{ marginBottom: '4px' }}>• Đơn hàng tự động xác nhận sau 1-5 phút</li>
                <li style={{ marginBottom: '4px' }}>• Không đóng trang này trước khi chuyển khoản</li>
                <li>• Bạn sẽ nhận email xác nhận sau khi thanh toán</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

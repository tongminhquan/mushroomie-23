'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

function RegistrationForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const email = searchParams.get('email') || ''
  const name = searchParams.get('name') || ''
  const avatar = searchParams.get('avatar') || ''
  const google_id = searchParams.get('google_id') || ''

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSendOtp = async () => {
    if (!phone || !address) {
      setError('Vui lòng nhập số điện thoại và địa chỉ trước khi gửi mã OTP')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi gửi OTP')

      setOtpSent(true)
      setSuccess('Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      setError('Vui lòng nhập mã OTP')
      return
    }
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-and-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          phone,
          address,
          name,
          avatar,
          google_id
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi đăng ký')

      setSuccess('Đăng ký thành công! Đang tự động đăng nhập...')

      // Auto login with Google to create session
      await signIn('google', { callbackUrl: '/tai-khoan' })
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">Lỗi: Không tìm thấy thông tin xác thực Google.</p>
        <Link href="/tai-khoan/dang-nhap" className="text-primary hover:underline">Quay lại trang Đăng nhập</Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl text-sm bg-red-50 text-red-600 border-[1.5px]" style={{ borderColor: '#f7c9c9' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl text-sm bg-green-50 text-green-700 border-[1.5px]" style={{ borderColor: '#bce3cd' }}>
          {success}
        </div>
      )}

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-[0.06em] text-neutral-500 mb-1.5">Họ và tên</label>
        <input
          type="text"
          value={name}
          disabled
          className="w-full px-4 py-3 rounded-xl border-[1.5px] text-neutral-500 focus:outline-none"
          style={{ borderColor: '#e2d3c8', background: '#f7efe9' }}
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-[0.06em] text-neutral-500 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-4 py-3 rounded-xl border-[1.5px] text-neutral-500 focus:outline-none"
          style={{ borderColor: '#e2d3c8', background: '#f7efe9' }}
        />
        <p className="text-xs text-neutral-500 mt-1.5">Email đã được xác thực bởi Google</p>
      </div>

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-[0.06em] text-neutral-500 mb-1.5">Số điện thoại <span className="text-primary">*</span></label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          disabled={otpSent}
          className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e2d3c8] bg-[#fffdfb] focus:border-primary outline-none transition-all disabled:bg-[#f7efe9] disabled:text-neutral-500"
          placeholder="Ví dụ: 0912345678"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold uppercase tracking-[0.06em] text-neutral-500 mb-1.5">Địa chỉ nhận hàng <span className="text-primary">*</span></label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          disabled={otpSent}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e2d3c8] bg-[#fffdfb] focus:border-primary outline-none transition-all disabled:bg-[#f7efe9] disabled:text-neutral-500 resize-none"
          placeholder="Nhập địa chỉ nhận hàng chi tiết..."
          required
        />
      </div>

      {!otpSent ? (
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full py-3.5 bg-primary text-white rounded-full font-bold shadow-[0_8px_20px_rgba(201,20,20,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? 'Đang xử lý...' : 'Gửi mã xác nhận (OTP) về Email'}
        </button>
      ) : (
        <div className="p-4 rounded-[18px] space-y-4 border-[1.5px]" style={{ background: '#fffaf0', borderColor: '#ffe0b3' }}>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-[0.06em] mb-1.5" style={{ color: '#b9794b' }}>Nhập mã OTP (6 số) <span className="text-primary">*</span></label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-[1.5px] outline-none transition-all text-center tracking-[0.4em] font-bold text-xl bg-[#fffdfb] focus:border-primary"
              style={{ borderColor: '#ffe0b3' }}
              placeholder="••••••"
              maxLength={6}
              required
            />
            <p className="text-xs mt-2 text-center text-neutral-500">Vui lòng kiểm tra email <strong className="text-accent-kraft">{email}</strong> để lấy mã xác nhận.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white rounded-full font-bold shadow-[0_8px_20px_rgba(201,20,20,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? 'Đang xử lý...' : 'Xác Nhận & Hoàn Tất Đăng Ký'}
          </button>
        </div>
      )}
    </form>
  )
}

export default function CompleteRegistrationPage() {
  return (
    <div
      className="min-h-screen bg-secondary py-12 px-4 flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
    >
      <span className="animate-float-soft absolute left-[10%] top-[18%] text-3xl" aria-hidden style={{ pointerEvents: 'none', color: '#ffd6d6' }}>🍄</span>
      <span className="animate-float-soft absolute right-[12%] bottom-[20%] text-2xl" aria-hidden style={{ pointerEvents: 'none', color: '#ff6b6b' }}>❤</span>

      <div className="max-w-md w-full bg-white p-8 rounded-[24px] shadow-card border-[1.5px] relative z-10" style={{ borderColor: '#f0e0d6' }}>
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: '#ffd6d6' }} aria-hidden>🍄</div>
          <div className="text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2">Nhà Nấm nhỏ chào bạn</div>
          <h1 className="text-2xl font-heading text-accent-kraft mb-2">Hoàn Tất Đăng Ký</h1>
          <p className="text-neutral-500 text-sm">Vui lòng bổ sung các thông tin còn thiếu để hoàn thiện hồ sơ của bạn</p>
        </div>
        <Suspense fallback={<div className="text-center text-neutral-500">Đang tải dữ liệu...</div>}>
          <RegistrationForm />
        </Suspense>
      </div>
    </div>
  )
}

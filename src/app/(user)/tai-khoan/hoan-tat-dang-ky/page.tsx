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
    <form onSubmit={handleRegister} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Họ và tên</label>
        <input 
          type="text" 
          value={name} 
          disabled 
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
        <input 
          type="email" 
          value={email} 
          disabled 
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 focus:outline-none"
        />
        <p className="text-xs text-stone-500 mt-1">Email đã được xác thực bởi Google</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
        <input 
          type="tel" 
          value={phone}
          onChange={e => setPhone(e.target.value)}
          disabled={otpSent}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:bg-stone-100"
          placeholder="Ví dụ: 0912345678"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Địa chỉ nhận hàng <span className="text-red-500">*</span></label>
        <textarea 
          value={address}
          onChange={e => setAddress(e.target.value)}
          disabled={otpSent}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:bg-stone-100 resize-none"
          placeholder="Nhập địa chỉ nhận hàng chi tiết..."
          required
        />
      </div>

      {!otpSent ? (
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full py-3 bg-stone-800 hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Gửi mã xác nhận (OTP) về Email'}
        </button>
      ) : (
        <div className="p-4 bg-yellow-50 rounded-xl space-y-4 border border-yellow-100">
          <div>
            <label className="block text-sm font-bold text-yellow-800 mb-1">Nhập mã OTP (6 số) <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-yellow-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all text-center tracking-widest font-bold text-xl"
              placeholder="••••••"
              maxLength={6}
              required
            />
            <p className="text-xs text-yellow-700 mt-2 text-center">Vui lòng kiểm tra email <strong>{email}</strong> để lấy mã xác nhận.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all disabled:opacity-50"
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
    <div className="min-h-screen bg-stone-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-heading font-bold text-primary mb-2">Hoàn Tất Đăng Ký</h1>
          <p className="text-stone-500 text-sm">Vui lòng bổ sung các thông tin còn thiếu để hoàn thiện hồ sơ của bạn</p>
        </div>
        <Suspense fallback={<div className="text-center text-stone-500">Đang tải dữ liệu...</div>}>
          <RegistrationForm />
        </Suspense>
      </div>
    </div>
  )
}

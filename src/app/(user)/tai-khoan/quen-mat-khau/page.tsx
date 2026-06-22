'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Một email chứa đường dẫn khôi phục mật khẩu đã được gửi đến địa chỉ của bạn. Vui lòng kiểm tra hộp thư (và cả mục Spam).')
      } else {
        setError(data.message || 'Có lỗi xảy ra, vui lòng thử lại sau.')
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
    >
      <span aria-hidden className="animate-float-soft pointer-events-none absolute left-[10%] top-[18%] text-3xl select-none" style={{ color: '#ffd6d6' }}>❤</span>
      <span aria-hidden className="animate-float-soft pointer-events-none absolute right-[12%] bottom-[16%] text-2xl select-none">🍄</span>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative h-20 w-48 mb-4"><Image src="/logo.webp" alt="Mushroomie Logo" fill className="object-contain" priority /></div>
          <span className="text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2">Khôi phục tài khoản</span>
          <h1 className="font-heading text-2xl font-bold">Quên mật khẩu</h1>
          <p className="text-neutral-500 text-sm mt-1">Nhập email của bạn để nhận link khôi phục</p>
        </div>
        <div className="bg-white rounded-3xl shadow-card p-8 border-[1.5px]" style={{ borderColor: '#f0e0d6' }}>
          {message ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ background: '#ffece6' }}>✉️</div>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-sm mb-6">
                {message}
              </div>
              <Link href="/tai-khoan/dang-nhap" className="text-primary font-semibold hover:underline">
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-2xl" style={{ background: '#ffd6d6' }}>🔑</div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email đã đăng ký</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-[1.5px] border-[#e2d3c8] rounded-xl text-sm bg-[#fffdfb] focus:outline-none focus:border-primary transition-colors"
                  placeholder="email@example.com"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{error}</div>
              )}
              <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                Gửi link khôi phục
              </Button>
              <p className="text-center text-sm text-neutral-500 mt-4">
                <Link href="/tai-khoan/dang-nhap" className="text-primary font-semibold hover:underline">
                  Quay lại đăng nhập
                </Link>
              </p>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-accent-kraft mt-6">Làm bằng tay, trao bằng tim 🍄</p>
      </div>
    </div>
  )
}

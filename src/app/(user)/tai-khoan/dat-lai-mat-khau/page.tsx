'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Đường dẫn không hợp lệ hoặc đã hết hạn.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu không khớp.')
      return
    }

    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }

    setIsLoading(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.')
        setTimeout(() => {
          router.push('/tai-khoan/dang-nhap')
        }, 3000)
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
      className="min-h-screen bg-secondary flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(120% 120% at 50% 0%, #ffeee6, var(--color-secondary))' }}
    >
      <span aria-hidden className="animate-float-soft pointer-events-none absolute left-[12%] top-[18%] text-2xl text-[#ffd6d6] select-none">❤</span>
      <span aria-hidden className="animate-float-soft pointer-events-none absolute right-[12%] bottom-[18%] text-2xl select-none">🍄</span>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative h-20 w-48 mb-4"><Image src="/logo.webp" alt="Mushroomie Logo" fill className="object-contain" priority /></div>
          <span className="text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2">Tài khoản Mushroomie</span>
          <h1 className="font-heading text-2xl">Đặt lại mật khẩu</h1>
          <p className="text-neutral-500 text-sm mt-1">Vui lòng nhập mật khẩu mới của bạn</p>
        </div>
        <div className="bg-white rounded-3xl shadow-card p-8 border-[1.5px]" style={{ borderColor: '#f0e0d6' }}>
          {message ? (
            <div className="text-center">
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="h-14 w-14 rounded-full bg-[#ffece6] flex items-center justify-center text-3xl" aria-hidden>✅</div>
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-sm">
                  {message}
                </div>
              </div>
              <Link
                href="/tai-khoan/dang-nhap"
                className="inline-flex items-center justify-center bg-primary text-white rounded-full font-bold px-6 py-2.5 shadow-[0_8px_20px_rgba(201,20,20,0.3)] hover:opacity-95 transition-opacity"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-accent-kraft">Mật khẩu mới</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  disabled={!token}
                  className="w-full px-4 py-3 border-[1.5px] border-[#e2d3c8] rounded-xl text-sm bg-[#fffdfb] focus:outline-none focus:border-primary transition-colors disabled:bg-neutral-100 disabled:opacity-60"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-accent-kraft">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  disabled={!token}
                  className="w-full px-4 py-3 border-[1.5px] border-[#e2d3c8] rounded-xl text-sm bg-[#fffdfb] focus:outline-none focus:border-primary transition-colors disabled:bg-neutral-100 disabled:opacity-60"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{error}</div>
              )}
              <Button type="submit" isLoading={isLoading} disabled={!token} className="w-full" size="lg">
                Đổi mật khẩu
              </Button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-neutral-500 mt-6">Làm bằng tay, trao bằng tim 🍄</p>
      </div>
    </div>
  )
}

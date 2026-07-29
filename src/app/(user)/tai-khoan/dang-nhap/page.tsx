'use client'
import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { sanitizeCallbackUrl } from '@/lib/url'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = sanitizeCallbackUrl(searchParams.get('callbackUrl'))

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    const result = await signIn('credentials', { ...form, redirect: false })
    if (result?.error) {
      setError('Email hoặc mật khẩu không chính xác')
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-theme-page p-4 text-theme-primary">
      <span className="animate-float-soft absolute left-[10%] top-[16%] text-3xl text-[#ffb3b3]" aria-hidden style={{ pointerEvents: 'none' }}>🍄</span>
      <span className="animate-float-soft absolute right-[12%] top-[24%] text-2xl text-[#ff6b6b]" aria-hidden style={{ pointerEvents: 'none' }}>❤</span>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="relative h-20 w-48 mb-4"><Image src="/logo.webp" alt="Mushroomie Logo" fill className="object-contain" priority /></div>
          <span className="text-xs font-extrabold tracking-[0.14em] uppercase text-primary mb-2">Ghé Nhà Nấm nhỏ</span>
          <h1 className="font-heading text-3xl font-bold">Đăng nhập Mushroomie</h1>
          <p className="mt-2 text-sm text-theme-muted">Chào mừng bạn trở lại! ♡</p>
        </div>
        <div className="rounded-[24px] border-[1.5px] border-theme-border bg-theme-card p-8 shadow-card">
          {/* Nút đăng nhập Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="theme-transition mb-4 flex w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-theme-border bg-theme-input px-4 py-3 text-sm font-semibold text-theme-primary hover:border-primary hover:bg-theme-subtle disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <span className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {isGoogleLoading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google'}
          </button>


          {/* Đường phân cách */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-theme-border" />
            <span className="text-xs font-medium text-theme-muted">hoặc đăng nhập bằng email</span>
            <div className="h-px flex-1 bg-theme-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                className="theme-transition w-full rounded-xl border-[1.5px] border-theme-border bg-theme-input px-4 py-3 text-sm text-theme-primary outline-none focus:border-primary"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold">Mật khẩu</label>
                <Link href="/tai-khoan/quen-mat-khau" className="text-sm text-primary font-semibold hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                className="theme-transition w-full rounded-xl border-[1.5px] border-theme-border bg-theme-input px-4 py-3 text-sm text-theme-primary outline-none focus:border-primary"
                placeholder="Nhập mật khẩu"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">{error}</div>
            )}
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Đăng nhập
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-theme-muted">
            Chưa có tài khoản?{' '}
            <Link href="/tai-khoan/dang-ky" className="text-primary font-semibold hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-theme-muted">Làm bằng tay, trao bằng tim 🍄</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-theme-page py-16 text-center text-sm text-theme-muted">Đang tải trang đăng nhập...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}

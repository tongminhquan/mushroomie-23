'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Mushroomie Logo" className="h-20 w-auto object-contain mb-4" />
          <h1 className="font-heading text-2xl font-bold">Đăng nhập Mushroomie</h1>
          <p className="text-neutral-500 text-sm mt-1">Chào mừng bạn trở lại!</p>
        </div>
        <div className="bg-white rounded-3xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Mật khẩu</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
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
          <p className="text-center text-sm text-neutral-500 mt-4">
            Chưa có tài khoản?{' '}
            <Link href="/tai-khoan/dang-ky" className="text-primary font-semibold hover:underline">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

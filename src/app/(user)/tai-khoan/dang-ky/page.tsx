'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isFacebookLoading, setIsFacebookLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setErrors(data.error || {})
    } else {
      await signIn('credentials', { email: form.email, password: form.password, redirect: false })
      router.push('/')
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  const handleFacebookSignIn = async () => {
    setIsFacebookLoading(true)
    await signIn('facebook', { callbackUrl: '/' })
  }

  const fields = [
    { name: 'name', label: 'Họ tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com', required: true },
    { name: 'phone', label: 'Số điện thoại', type: 'tel', placeholder: '0912345678', required: true },
    { name: 'address', label: 'Địa chỉ nhận hàng', type: 'text', placeholder: 'Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố', required: true },
    { name: 'password', label: 'Mật khẩu', type: 'password', placeholder: 'Ít nhất 8 ký tự', required: true },
  ]

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Mushroomie Logo" className="h-20 w-auto object-contain mb-4" />
          <h1 className="font-heading text-2xl font-bold">Tạo tài khoản Mushroomie</h1>
          <p className="text-neutral-500 text-sm mt-1">Tham gia cộng đồng phụ kiện handmade!</p>
        </div>
        <div className="bg-white rounded-3xl shadow-card p-8">
          {/* Nút đăng ký bằng Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm font-semibold hover:bg-neutral-50 hover:border-neutral-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-4"
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
            {isGoogleLoading ? 'Đang chuyển hướng...' : 'Đăng ký nhanh với Google'}
          </button>

          {/* Nút đăng ký bằng Facebook */}
          <button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={isFacebookLoading || isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-[#1877F2] bg-[#1877F2] text-white rounded-xl text-sm font-semibold hover:bg-[#166FE5] hover:border-[#166FE5] transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {isFacebookLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            {isFacebookLoading ? 'Đang chuyển hướng...' : 'Đăng ký nhanh với Facebook'}
          </button>

          {/* Đường phân cách */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 font-medium">hoặc đăng ký bằng email</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={(form as any)[field.name]}
                  onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                  required={field.required}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${
                    errors[field.name] ? 'border-red-400 focus:border-red-400' : 'border-neutral-200 focus:border-primary'
                  }`}
                  placeholder={field.placeholder}
                />
                {errors[field.name] && (
                  <p className="text-red-500 text-xs mt-1">{errors[field.name][0]}</p>
                )}
              </div>
            ))}
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">Tạo tài khoản</Button>
          </form>
          <p className="text-center text-sm text-neutral-500 mt-4">
            Đã có tài khoản?{' '}
            <Link href="/tai-khoan/dang-nhap" className="text-primary font-semibold hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)

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

  const fields = [
    { name: 'name', label: 'Họ tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com', required: true },
    { name: 'phone', label: 'Số điện thoại (tùy chọn)', type: 'tel', placeholder: '0912345678', required: false },
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

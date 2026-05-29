'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) setErrors(data.error || {})
    else setSuccess(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-secondary">
      <section className="bg-gradient-to-br from-primary to-red-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-4xl mb-3">📞</div>
          <h1 className="font-heading text-4xl font-bold mb-3">Liên hệ với Mushroomie</h1>
          <p className="text-white/80">Chúng mình luôn sẵn sàng lắng nghe và giúp đỡ bạn!</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h2 className="font-heading font-bold text-xl mb-4">Thông tin liên hệ</h2>
              <div className="space-y-3">
                {[
                  { emoji: '📍', label: 'Địa chỉ', value: 'Hẻm 2 tổ 11, phường Trảng Dài, thành phố Đồng Nai' },
                  { emoji: '📧', label: 'Email', value: 'cskh@mushroomie.io.vn' },
                  { emoji: '📞', label: 'Điện thoại', value: '+84 84 874 4060' },
                  { emoji: '⏰', label: 'Giờ làm việc', value: 'T2-CN: 8:00 - 21:00' },
                  { emoji: '📷', label: 'Instagram', value: '@mushr00mie._' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-2 border-b border-neutral-50 last:border-0">
                    <span className="text-xl w-8">{item.emoji}</span>
                    <div>
                      <p className="text-xs text-neutral-500">{item.label}</p>
                      <p className="font-semibold text-sm text-neutral-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-light rounded-2xl p-6">
              <h3 className="font-heading font-bold text-primary mb-2">🎨 Tự thiết kế phụ kiện?</h3>
              <p className="text-sm text-neutral-600">Liên hệ và cho mình biết ý tưởng của bạn! Chúng mình sẽ tư vấn miễn phí và giúp bạn tạo ra chiếc phụ kiện độc nhất vô nhị.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h3 className="font-heading font-bold text-lg mb-3">Câu hỏi thường gặp</h3>
              <div className="space-y-3">
                {[
                  { q: 'Thời gian làm hàng bao lâu?', a: '3-7 ngày tùy độ phức tạp của sản phẩm.' },
                  { q: 'Có ship COD không?', a: 'Hiện tại chỉ nhận thanh toán chuyển khoản trước.' },
                  { q: 'Có làm số lượng lớn không?', a: 'Có! Liên hệ trực tiếp để được báo giá tốt hơn.' },
                ].map((faq) => (
                  <div key={faq.q} className="bg-neutral-50 rounded-xl p-3">
                    <p className="font-semibold text-sm text-neutral-900 mb-1">❓ {faq.q}</p>
                    <p className="text-sm text-neutral-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            {success ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-heading font-bold text-xl mb-2">Đã gửi thành công!</h3>
                <p className="text-neutral-500 text-sm">Mushroomie sẽ phản hồi bạn trong vòng 24h. Cảm ơn đã liên hệ!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-heading font-bold text-xl mb-2">Gửi tin nhắn</h2>
                {[
                  { name: 'name', label: 'Họ tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true },
                  { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com', required: true },
                  { name: 'phone', label: 'Số điện thoại (tùy chọn)', type: 'tel', placeholder: '0912345678', required: false },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-semibold mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={(form as any)[f.name]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                      required={f.required}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${
                        errors[f.name] ? 'border-red-400' : 'border-neutral-200 focus:border-primary'
                      }`}
                      placeholder={f.placeholder}
                    />
                    {errors[f.name] && <p className="text-red-500 text-xs mt-1">{errors[f.name][0]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-semibold mb-1">Nội dung *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    required
                    rows={4}
                    className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none resize-none transition-colors ${
                      errors.message ? 'border-red-400' : 'border-neutral-200 focus:border-primary'
                    }`}
                    placeholder="Nội dung cần tư vấn, đặt hàng cá nhân hóa..."
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message[0]}</p>}
                </div>
                <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
                  Gửi tin nhắn
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl p-2 shadow-card overflow-hidden">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d979.143346171457!2d106.8820431!3d10.9955388!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTDCsDU5JzQ2LjgiTiAxMDbCsDUyJzU2LjMiRQ!5e0!3m2!1svi!2s!4v1780065547238!5m2!1svi!2s" 
            width="100%" 
            height="450" 
            style={{ border: 0, borderRadius: '0.75rem' }} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  )
}

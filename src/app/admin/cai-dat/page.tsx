'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { AlertCircle, CreditCard, Mail, Globe, Save, Loader2, Truck } from 'lucide-react'
import ShippingFeeSettings from '@/components/admin/ShippingFeeSettings'

interface GeneralSettings {
  brand_name: string
  hotline: string
  support_email: string
}

interface SettingsResponse {
  settings?: Partial<GeneralSettings>
  env?: {
    bank_name?: string
    bank_account?: string
    email_provider?: string
    email_sender?: string
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('payment')

  const [data, setData] = useState<SettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [settings, setSettings] = useState({
    brand_name: 'Mushroomie',
    hotline: '+84 84 874 4060',
    support_email: 'cskh@mushroomie.io.vn'
  })

  useEffect(() => {
    setWebhookUrl(window.location.origin + '/api/webhooks/payment')
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((res: SettingsResponse) => {
        setData(res)
        if (res.settings && Object.keys(res.settings).length > 0) {
          const generalSettings = res.settings
          setSettings((previous) => ({
            brand_name: typeof generalSettings.brand_name === 'string'
              ? generalSettings.brand_name
              : previous.brand_name,
            hotline: typeof generalSettings.hotline === 'string'
              ? generalSettings.hotline
              : previous.hotline,
            support_email: typeof generalSettings.support_email === 'string'
              ? generalSettings.support_email
              : previous.support_email,
          }))
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      if (res.ok) alert('Đã lưu thành công!')
      else alert('Lỗi khi lưu cài đặt!')
    } catch {
      alert('Đã xảy ra lỗi!')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    alert('Đã copy webhook URL: ' + webhookUrl)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Hệ thống / Cài đặt</p>
        <h1 className="text-2xl font-heading mt-1 text-neutral-900">Cài đặt Hệ thống</h1>
        <p className="text-neutral-500 text-sm mt-1">Cấu hình thanh toán, gửi email và các thông số kỹ thuật.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1.5">
          <button
            onClick={() => setActiveTab('payment')}
            aria-pressed={activeTab === 'payment'}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold border-[1.5px] ${
              activeTab === 'payment'
                ? 'bg-primary text-white border-primary shadow-card'
                : 'bg-white text-neutral-600 border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}
          >
            <CreditCard size={18} /> Cổng thanh toán
          </button>
          <button
            onClick={() => setActiveTab('email')}
            aria-pressed={activeTab === 'email'}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold border-[1.5px] ${
              activeTab === 'email'
                ? 'bg-primary text-white border-primary shadow-card'
                : 'bg-white text-neutral-600 border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}
          >
            <Mail size={18} /> Cấu hình Email
          </button>
          <button
            onClick={() => setActiveTab('general')}
            aria-pressed={activeTab === 'general'}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold border-[1.5px] ${
              activeTab === 'general'
                ? 'bg-primary text-white border-primary shadow-card'
                : 'bg-white text-neutral-600 border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}
          >
            <Globe size={18} /> Thông tin Website
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            aria-pressed={activeTab === 'shipping'}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold border-[1.5px] ${
              activeTab === 'shipping'
                ? 'bg-primary text-white border-primary shadow-card'
                : 'bg-white text-neutral-600 border-[#f0e0d6] hover:border-primary hover:text-primary'
            }`}
          >
            <Truck size={18} /> Vận chuyển
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-[16px] shadow-card border-[1.5px] border-[#f0e0d6]">

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#f0e0d6] pb-4">
                  <div>
                    <h2 className="font-heading text-lg text-neutral-900">Cổng thanh toán tự động (Webhook)</h2>
                    <p className="text-neutral-500 text-sm mt-0.5">Cấu hình kết nối với Casso hoặc SePay.</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow text-kraft text-xs font-bold rounded-lg border-[1.5px] border-[#f0e0d6]">
                    Sẵn sàng
                  </span>
                </div>

                <div className="bg-cream border-[1.5px] border-[#f0e0d6] text-neutral-700 p-4 rounded-xl text-sm flex gap-3">
                  <AlertCircle size={20} className="flex-shrink-0 text-primary" />
                  <div>
                    <p className="font-semibold mb-1 text-neutral-900">Lưu ý bảo mật</p>
                    <p className="text-neutral-600">Các thông số API Key, Webhook Secret và thông tin Ngân hàng hiện được lưu an toàn trong file <code className="font-mono text-primary bg-primary-light px-1.5 py-0.5 rounded">.env</code> trên máy chủ. Bạn không thể chỉnh sửa trực tiếp các thông số nhạy cảm này từ giao diện Web để đảm bảo an toàn.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Ngân hàng thụ hưởng</label>
                    <input disabled value={loading ? 'Đang tải...' : (data?.env?.bank_name || 'Đang lấy từ file .env')} className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg bg-neutral-100 text-neutral-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Số tài khoản</label>
                    <input disabled value={loading ? 'Đang tải...' : (data?.env?.bank_account || 'Đang lấy từ file .env')} className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg bg-neutral-100 text-neutral-500 cursor-not-allowed font-mono" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Webhook URL (Dành cho Casso/SePay)</label>
                    <div className="flex">
                      <input readOnly value={webhookUrl} className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-l-lg bg-neutral-100 font-mono text-sm text-neutral-600 outline-none" />
                      <button onClick={handleCopyWebhook} className="px-4 bg-primary text-white border-[1.5px] border-primary rounded-r-lg text-sm font-semibold hover:bg-primary-dark transition-colors">Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="border-b border-[#f0e0d6] pb-4">
                  <h2 className="font-heading text-lg text-neutral-900">Cấu hình gửi Email</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">Gửi mail xác nhận đơn hàng tự động cho khách.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Nhà cung cấp Email (SMTP)</label>
                    <input disabled value={loading ? 'Đang tải...' : (data?.env?.email_provider || 'Đang lấy từ file .env')} className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg bg-neutral-100 text-neutral-500 cursor-not-allowed font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Địa chỉ Email người gửi</label>
                    <input disabled value={loading ? 'Đang tải...' : (data?.env?.email_sender || 'Đang lấy từ file .env')} className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg bg-neutral-100 text-neutral-500 cursor-not-allowed font-mono" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="border-b border-[#f0e0d6] pb-4">
                  <h2 className="font-heading text-lg text-neutral-900">Thông tin Website</h2>
                  <p className="text-neutral-500 text-sm mt-0.5">Thông tin hiển thị trên chân trang và liên hệ.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Tên thương hiệu</label>
                    <input
                      value={settings.brand_name}
                      onChange={e => setSettings({...settings, brand_name: e.target.value})}
                      className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Số điện thoại Hotline</label>
                    <input
                      value={settings.hotline}
                      onChange={e => setSettings({...settings, hotline: e.target.value})}
                      className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-neutral-500">Email hỗ trợ</label>
                    <input
                      value={settings.support_email}
                      onChange={e => setSettings({...settings, support_email: e.target.value})}
                      className="w-full px-4 py-2.5 border-[1.5px] border-[#e2d3c8] rounded-lg focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div className="pt-4 flex justify-end border-t border-[#f0e0d6]">
                    <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && <ShippingFeeSettings />}

          </div>
        </div>
      </div>
    </div>
  )
}

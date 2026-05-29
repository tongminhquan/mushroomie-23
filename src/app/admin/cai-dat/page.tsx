'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { AlertCircle, CreditCard, Mail, Globe, Save } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('payment')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-heading">Cài đặt Hệ thống</h1>
        <p className="text-neutral-500 text-sm mt-1">Cấu hình thanh toán, gửi email và các thông số kỹ thuật.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('payment')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'payment' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <CreditCard size={18} /> Cổng thanh toán
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'email' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Mail size={18} /> Cấu hình Email
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
              activeTab === 'general' ? 'bg-primary text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Globe size={18} /> Thông tin Website
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <h2 className="font-bold text-lg">Cổng thanh toán tự động (Webhook)</h2>
                    <p className="text-neutral-500 text-sm">Cấu hình kết nối với Casso hoặc SePay.</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200">
                    Sẵn sàng
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm flex gap-3">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Lưu ý bảo mật</p>
                    <p>Các thông số API Key, Webhook Secret và thông tin Ngân hàng hiện được lưu an toàn trong file <code>.env</code> trên máy chủ. Bạn không thể chỉnh sửa trực tiếp các thông số nhạy cảm này từ giao diện Web để đảm bảo an toàn.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Ngân hàng thụ hưởng</label>
                    <input disabled value="Đang lấy từ file .env" className="w-full px-4 py-2 border rounded-xl bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Số tài khoản</label>
                    <input disabled value="Đang lấy từ file .env" className="w-full px-4 py-2 border rounded-xl bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Webhook URL (Dành cho Casso/SePay)</label>
                    <div className="flex">
                      <input readOnly value="https://domain-cua-ban.com/api/webhooks/payment" className="w-full px-4 py-2 border rounded-l-xl bg-neutral-50 font-mono text-sm text-neutral-600 outline-none" />
                      <button className="px-4 bg-neutral-200 border-y border-r rounded-r-xl text-sm font-semibold hover:bg-neutral-300">Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="font-bold text-lg">Cấu hình gửi Email</h2>
                  <p className="text-neutral-500 text-sm">Gửi mail xác nhận đơn hàng tự động cho khách.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Nhà cung cấp Email (SMTP)</label>
                    <input disabled value="Đang lấy từ file .env" className="w-full px-4 py-2 border rounded-xl bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Địa chỉ Email người gửi</label>
                    <input disabled value="Đang lấy từ file .env" className="w-full px-4 py-2 border rounded-xl bg-neutral-50 text-neutral-500 cursor-not-allowed" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="font-bold text-lg">Thông tin Website</h2>
                  <p className="text-neutral-500 text-sm">Thông tin hiển thị trên chân trang và liên hệ.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Tên thương hiệu</label>
                    <input defaultValue="Mushroomie" className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Số điện thoại Hotline</label>
                    <input defaultValue="+84 84 874 4060" className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-neutral-700">Email hỗ trợ</label>
                    <input defaultValue="cskh@mushroomie.io.vn" className="w-full px-4 py-2 border rounded-xl focus:border-primary outline-none" />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button className="flex items-center gap-2"><Save size={18} /> Lưu thay đổi</Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

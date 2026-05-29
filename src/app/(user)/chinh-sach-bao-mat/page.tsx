import React from 'react';
import { Shield, Database, Lock, RefreshCcw, UserCheck, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Chính sách & Bảo mật | Mushroomie',
  description: 'Chính sách và bảo mật thông tin khách hàng tại Mushroomie',
};

export default function PrivacyPolicyPage() {
  const policies = [
    {
      icon: <Database className="w-8 h-8 text-[#e41d1d]" />,
      title: "Mục đích thu thập",
      content: (
        <>
          <p className="mb-2">Mushroomie thu thập thông tin cá nhân của bạn (bao gồm: Tên, Số điện thoại, Email, Địa chỉ) nhằm mục đích:</p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Xử lý đơn đặt hàng và giao hàng nhanh chóng.</li>
            <li>Hỗ trợ khách hàng và giải đáp thắc mắc.</li>
            <li>Gửi thông báo về các chương trình khuyến mãi (nếu bạn đồng ý).</li>
            <li>Ngăn ngừa gian lận và bảo vệ tài khoản của bạn.</li>
          </ul>
        </>
      )
    },
    {
      icon: <UserCheck className="w-8 h-8 text-[#FFB347]" />,
      title: "Phạm vi sử dụng",
      content: (
        <p>
          Thông tin thu thập được sẽ <strong>chỉ được sử dụng trong nội bộ Mushroomie</strong>. Chúng tôi chỉ chia sẻ thông tin cần thiết (Tên, địa chỉ, số điện thoại) cho các đối tác vận chuyển (Shipper) để đảm bảo đơn hàng được giao đến tận tay bạn an toàn.
        </p>
      )
    },
    {
      icon: <RefreshCcw className="w-8 h-8 text-[#A8E6CF]" />,
      title: "Thời gian lưu trữ",
      content: (
        <p>
          Mushroomie sẽ lưu trữ các Thông tin cá nhân trên hệ thống bảo mật của chúng tôi trong suốt quá trình cung cấp dịch vụ, hoặc cho đến khi bạn có yêu cầu <strong>hủy bỏ/xóa tài khoản</strong>. Bạn hoàn toàn có quyền kiểm soát dữ liệu của mình.
        </p>
      )
    },
    {
      icon: <Shield className="w-8 h-8 text-[#e41d1d]" />,
      title: "Cam kết bảo mật",
      content: (
        <p>
          Chúng tôi coi trọng quyền riêng tư của bạn. Mushroomie cam kết <strong>không bán, trao đổi hay chia sẻ</strong> thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại. Mọi thông tin đều được mã hóa và bảo vệ nghiêm ngặt.
        </p>
      )
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-[#FFB347]" />,
      title: "Xử lý sự cố",
      content: (
        <p>
          Trong trường hợp bất khả kháng (như máy chủ bị tấn công), chúng tôi sẽ lập tức thông báo cho cơ quan chức năng điều tra xử lý kịp thời và thông báo minh bạch cho bạn về tình hình dữ liệu.
        </p>
      )
    },
    {
      icon: <Lock className="w-8 h-8 text-[#A8E6CF]" />,
      title: "Cập nhật chính sách",
      content: (
        <p>
          Mushroomie có quyền thay đổi, cập nhật chính sách bảo mật này để phù hợp với luật pháp và thực tế vận hành. Mọi thay đổi lớn sẽ được thông báo rõ ràng trên website.
        </p>
      )
    }
  ];

  return (
    <div className="bg-[#fff5f5] min-h-screen py-16 sm:py-24 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#fde8e8] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#A8E6CF]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 w-64 h-64 bg-[#FFB347]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-4">
            <Shield className="w-10 h-10 text-[#e41d1d]" />
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            Chính sách & Bảo mật
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Tại Mushroomie, chúng tôi tin rằng sự tin tưởng của bạn là tài sản quý giá nhất. 
            Đọc để hiểu rõ cách chúng tôi bảo vệ thông tin của bạn.
          </p>
        </div>
        
        {/* Policy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {policies.map((policy, index) => (
            <div 
              key={index} 
              className="bg-white p-8 rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(228,29,29,0.1)] transition-all duration-300 hover:-translate-y-1 group border border-neutral-100"
            >
              <div className="flex items-start gap-5">
                <div className="p-3 bg-neutral-50 rounded-xl group-hover:bg-[#fde8e8] transition-colors duration-300 shrink-0">
                  {policy.icon}
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-neutral-900 mb-3 group-hover:text-[#e41d1d] transition-colors duration-300">
                    {policy.title}
                  </h2>
                  <div className="text-neutral-600 leading-relaxed text-sm sm:text-base">
                    {policy.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-sm border border-neutral-100">
            <p className="text-sm text-neutral-500 font-medium">
              Cập nhật lần cuối: <span className="text-[#e41d1d]">Tháng 5 năm 2026</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

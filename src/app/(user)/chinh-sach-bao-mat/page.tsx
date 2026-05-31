import React from 'react';
import { Shield, Database, Lock, RefreshCcw, UserCheck, AlertTriangle } from 'lucide-react';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách bảo mật | Mushroomie',
  description: 'Chính sách và bảo mật thông tin khách hàng tại Mushroomie',
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Chính sách bảo mật">
      <div className="space-y-8">
        <p className="text-neutral-600">
          Tại Mushroomie, chúng tôi tin rằng sự tin tưởng của bạn là tài sản quý giá nhất. Đọc để hiểu rõ cách chúng tôi bảo vệ thông tin của bạn.
        </p>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <Database className="w-5 h-5 text-primary" /> Mục đích thu thập
          </h3>
          <p className="mb-2">Mushroomie thu thập thông tin cá nhân của bạn (bao gồm: Tên, Số điện thoại, Email, Địa chỉ) nhằm mục đích:</p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Xử lý đơn đặt hàng và giao hàng nhanh chóng.</li>
            <li>Hỗ trợ khách hàng và giải đáp thắc mắc.</li>
            <li>Gửi thông báo về các chương trình khuyến mãi (nếu bạn đồng ý).</li>
            <li>Ngăn ngừa gian lận và bảo vệ tài khoản của bạn.</li>
          </ul>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <UserCheck className="w-5 h-5 text-[#FFB347]" /> Phạm vi sử dụng
          </h3>
          <p className="text-neutral-600">
            Thông tin thu thập được sẽ <strong>chỉ được sử dụng trong nội bộ Mushroomie</strong>. Chúng tôi chỉ chia sẻ thông tin cần thiết (Tên, địa chỉ, số điện thoại) cho các đối tác vận chuyển (Shipper) để đảm bảo đơn hàng được giao đến tận tay bạn an toàn.
          </p>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <RefreshCcw className="w-5 h-5 text-[#A8E6CF]" /> Thời gian lưu trữ
          </h3>
          <p className="text-neutral-600">
            Mushroomie sẽ lưu trữ các Thông tin cá nhân trên hệ thống bảo mật của chúng tôi trong suốt quá trình cung cấp dịch vụ, hoặc cho đến khi bạn có yêu cầu <strong>hủy bỏ/xóa tài khoản</strong>. Bạn hoàn toàn có quyền kiểm soát dữ liệu của mình.
          </p>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <Shield className="w-5 h-5 text-primary" /> Cam kết bảo mật
          </h3>
          <p className="text-neutral-600">
            Chúng tôi coi trọng quyền riêng tư của bạn. Mushroomie cam kết <strong>không bán, trao đổi hay chia sẻ</strong> thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại. Mọi thông tin đều được mã hóa và bảo vệ nghiêm ngặt.
          </p>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <AlertTriangle className="w-5 h-5 text-[#FFB347]" /> Xử lý sự cố
          </h3>
          <p className="text-neutral-600">
            Trong trường hợp bất khả kháng (như máy chủ bị tấn công), chúng tôi sẽ lập tức thông báo cho cơ quan chức năng điều tra xử lý kịp thời và thông báo minh bạch cho bạn về tình hình dữ liệu.
          </p>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <Lock className="w-5 h-5 text-[#A8E6CF]" /> Cập nhật chính sách
          </h3>
          <p className="text-neutral-600">
            Mushroomie có quyền thay đổi, cập nhật chính sách bảo mật này để phù hợp với luật pháp và thực tế vận hành. Mọi thay đổi lớn sẽ được thông báo rõ ràng trên website.
          </p>
        </section>

        <div className="mt-10 pt-6 border-t border-neutral-100 text-sm text-neutral-500 font-medium">
          Cập nhật lần cuối: <span className="text-primary">Tháng 5 năm 2026</span>
        </div>
      </div>
    </PolicyLayout>
  );
}

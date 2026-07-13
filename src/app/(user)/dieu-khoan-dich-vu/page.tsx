import React from 'react';
import { ScrollText, FileCheck, AlertCircle, Scale, ShieldAlert } from 'lucide-react';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Điều khoản dịch vụ',
  description: 'Điều khoản và điều kiện sử dụng dịch vụ tại Mushroomie',
  alternates: { canonical: 'https://mushroomie.io.vn/dieu-khoan-dich-vu' },
};

export default function TermsOfServicePage() {
  return (
    <PolicyLayout title="Điều khoản dịch vụ">
      <div className="space-y-8">
        <p className="text-neutral-600">
          Chào mừng bạn đến với Mushroomie. Bằng việc truy cập và sử dụng website cũng như các dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
        </p>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <ScrollText className="w-5 h-5 text-primary" /> 1. Chấp nhận điều khoản
          </h3>
          <p className="text-neutral-600">
            Khi truy cập website Mushroomie và mua sắm, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi các Điều khoản Dịch vụ này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <FileCheck className="w-5 h-5 text-[#FFB347]" /> 2. Thông tin sản phẩm và giá cả
          </h3>
          <p className="text-neutral-600 mb-2">
            Chúng tôi cam kết cung cấp thông tin sản phẩm chính xác nhất có thể. Tuy nhiên:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Màu sắc sản phẩm thực tế có thể hơi khác so với hình ảnh do cài đặt màn hình.</li>
            <li>Giá cả có thể thay đổi mà không cần thông báo trước, tuy nhiên những thay đổi sẽ không ảnh hưởng đến các đơn hàng đã được xác nhận.</li>
            <li>Trong trường hợp sản phẩm hiển thị sai giá do lỗi hệ thống, chúng tôi có quyền từ chối hoặc hủy đơn hàng và sẽ hoàn tiền nếu bạn đã thanh toán.</li>
          </ul>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <AlertCircle className="w-5 h-5 text-[#A8E6CF]" /> 3. Quyền và Trách nhiệm của Khách hàng
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Cung cấp thông tin giao hàng (Tên, số điện thoại, địa chỉ) chính xác.</li>
            <li>Bảo mật thông tin tài khoản đăng nhập (nếu có).</li>
            <li>Không sử dụng website cho các mục đích bất hợp pháp, phát tán virus, spam hoặc các hành vi gây ảnh hưởng đến hệ thống.</li>
          </ul>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <ShieldAlert className="w-5 h-5 text-primary" /> 4. Trách nhiệm của Mushroomie
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Đảm bảo chất lượng sản phẩm đúng như mô tả.</li>
            <li>Bảo vệ thông tin cá nhân của khách hàng theo <a href="/chinh-sach-bao-mat" className="text-primary hover:underline">Chính sách bảo mật</a>.</li>
            <li>Hỗ trợ khách hàng trong quá trình mua sắm, giao nhận và đổi trả.</li>
          </ul>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <Scale className="w-5 h-5 text-[#FFB347]" /> 5. Bản quyền và Sở hữu trí tuệ
          </h3>
          <p className="text-neutral-600">
            Tất cả nội dung trên website bao gồm văn bản, hình ảnh, đồ họa, logo, biểu tượng thuộc sở hữu độc quyền của Mushroomie hoặc các nhà cung cấp nội dung của chúng tôi và được bảo vệ bởi luật sở hữu trí tuệ. Bạn không được phép sao chép, phân phối hoặc sử dụng cho mục đích thương mại nếu chưa có sự đồng ý bằng văn bản.
          </p>
        </section>

        <div className="mt-10 pt-6 border-t border-neutral-100 text-sm text-neutral-500 font-medium">
          Cập nhật lần cuối: <span className="text-primary">Tháng 6 năm 2026</span>
        </div>
      </div>
    </PolicyLayout>
  );
}

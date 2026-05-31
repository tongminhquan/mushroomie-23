import React from 'react';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách trả góp | Mushroomie',
  description: 'Hướng dẫn và chính sách trả góp khi mua sắm tại Mushroomie',
};

export default function InstallmentPolicyPage() {
  return (
    <PolicyLayout title="Chính sách trả góp">
      <div className="space-y-6 text-neutral-600">
        <p>
          Mushroomie hiện tại <strong>chưa áp dụng hình thức trả góp</strong> cho các sản phẩm phụ kiện handmade do giá trị đơn hàng thường ở mức dễ tiếp cận.
        </p>
        <p>
          Tuy nhiên, chúng tôi luôn nỗ lực mang đến các phương thức thanh toán linh hoạt và tiện lợi nhất cho bạn. Trong tương lai, nếu có các bộ sưu tập đặc biệt hoặc combo sản phẩm giá trị cao, Mushroomie sẽ hợp tác với các đối tác thanh toán (như Fundiin, Kredivo, SPayLater...) để hỗ trợ tính năng "Mua trước trả sau".
        </p>
        
        <h3 className="text-lg font-bold text-neutral-800 mt-8 mb-4">Các hình thức thanh toán đang hỗ trợ:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Thanh toán khi nhận hàng (COD):</strong> Nhận hàng, kiểm tra và thanh toán trực tiếp cho shipper.</li>
          <li><strong>Chuyển khoản ngân hàng:</strong> Thanh toán nhanh chóng qua mã QR VietQR (miễn phí giao dịch).</li>
          <li><strong>Ví điện tử:</strong> Hỗ trợ thanh toán qua MoMo, ZaloPay (sắp ra mắt).</li>
        </ul>

        <div className="bg-primary/5 p-4 rounded-lg mt-8 border border-primary/20">
          <p className="font-semibold text-primary mb-1">Mẹo nhỏ:</p>
          <p className="text-sm">Hãy theo dõi các kênh Mạng xã hội của Mushroomie để cập nhật ngay khi chúng tôi ra mắt hình thức thanh toán mới nhé!</p>
        </div>
      </div>
    </PolicyLayout>
  );
}

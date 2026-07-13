import React from 'react';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách giao hàng',
  description: 'Thông tin thời gian xử lý, giao hàng và phí vận chuyển đơn phụ kiện handmade Mushroomie.',
  alternates: { canonical: 'https://mushroomie.io.vn/chinh-sach-giao-hang' },
};

export default function DeliveryPolicyPage() {
  return (
    <PolicyLayout title="Chính sách giao hàng">
      <div className="space-y-4 text-neutral-600">
        <h3 className="text-lg font-bold text-neutral-800 mt-4">1. Thời gian xử lý đơn hàng</h3>
        <p>Vì các sản phẩm của Mushroomie là đồ thủ công (handmade) và có thể tùy chỉnh theo yêu cầu cá nhân, thời gian chuẩn bị hàng thường kéo dài từ 1 đến 3 ngày làm việc trước khi giao cho đơn vị vận chuyển.</p>
        <h3 className="text-lg font-bold text-neutral-800 mt-6">2. Thời gian giao hàng</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Nội thành Thành Phố Đồng Nai:</strong> 1 - 2 ngày làm việc.</li>
          <li><strong>Các tỉnh thành khác:</strong> 3 - 5 ngày làm việc tùy khu vực.</li>
        </ul>
        <h3 className="text-lg font-bold text-neutral-800 mt-6">3. Phí vận chuyển</h3>
        <p>Phí vận chuyển sẽ được tính tự động dựa trên địa chỉ của bạn khi thanh toán. Mushroomie thường xuyên có các chương trình Freeship cho đơn hàng từ 150.000đ.</p>
      </div>
    </PolicyLayout>
  );
}

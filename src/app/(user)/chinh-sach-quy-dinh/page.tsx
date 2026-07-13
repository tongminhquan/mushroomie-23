import React from 'react';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách và quy định chung',
  description: 'Các quy định chung khi truy cập, đặt hàng và sử dụng dịch vụ của Mushroomie.',
  alternates: { canonical: 'https://mushroomie.io.vn/chinh-sach-quy-dinh' },
};

export default function GeneralPolicyPage() {
  return (
    <PolicyLayout title="Chính sách & Quy định chung">
      <div className="space-y-4 text-neutral-600">
        <p>Chào mừng bạn đến với Mushroomie. Khi truy cập và mua sắm tại website của chúng tôi, bạn đồng ý tuân thủ các quy định dưới đây.</p>
        <h3 className="text-lg font-bold text-neutral-800 mt-6">1. Chấp nhận điều khoản</h3>
        <p>Bằng việc đặt hàng, bạn xác nhận đã đọc, hiểu và đồng ý với các chính sách của Mushroomie về giao hàng, đổi trả và bảo mật thông tin.</p>
        <h3 className="text-lg font-bold text-neutral-800 mt-6">2. Quy định về sản phẩm</h3>
        <p>Tất cả sản phẩm của Mushroomie đều là hàng thủ công (handmade). Do đó, sản phẩm thực tế có thể có sự sai lệch rất nhỏ về màu sắc hoặc chi tiết so với ảnh chụp, tuy nhiên chúng tôi cam kết chất lượng luôn đạt tiêu chuẩn cao nhất.</p>
      </div>
    </PolicyLayout>
  );
}

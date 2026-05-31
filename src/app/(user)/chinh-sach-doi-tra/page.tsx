import React from 'react';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách đổi trả | Mushroomie',
};

export default function ReturnPolicyPage() {
  return (
    <PolicyLayout title="Chính sách đổi trả">
      <div className="space-y-4 text-neutral-600">
        <p>Để đảm bảo quyền lợi cho khách hàng, Mushroomie hỗ trợ chính sách đổi trả linh hoạt.</p>
        <h3 className="text-lg font-bold text-neutral-800 mt-4">1. Điều kiện đổi trả</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Sản phẩm bị lỗi do quá trình sản xuất (đứt dây, thiếu charm, nhầm mẫu).</li>
          <li>Sản phẩm bị hư hỏng nghiêm trọng trong quá trình vận chuyển (yêu cầu có video quay lúc mở hàng).</li>
          <li>Thời gian yêu cầu đổi trả: Trong vòng <strong>3 ngày</strong> kể từ khi nhận hàng.</li>
        </ul>
        <h3 className="text-lg font-bold text-neutral-800 mt-6">2. Quy trình đổi trả</h3>
        <p>Bước 1: Liên hệ với chúng tôi qua Zalo hoặc Fanpage Mushroomie, kèm theo hình ảnh/video tình trạng sản phẩm.</p>
        <p>Bước 2: Nêu rõ yêu cầu (Đổi sản phẩm mới hoặc Hoàn tiền).</p>
        <p>Bước 3: Mushroomie sẽ xác nhận và tiến hành gửi hàng thay thế hoặc hoàn tiền cho bạn trong vòng 24h.</p>
        <div className="bg-primary/5 p-4 rounded-lg mt-6 border border-primary/20">
          <p className="text-sm">Lưu ý: Chúng tôi <strong>không</strong> hỗ trợ đổi trả đối với các trường hợp khách hàng thay đổi ý định sau khi hàng đã được làm xong (đặc biệt là hàng thiết kế theo tên riêng).</p>
        </div>
      </div>
    </PolicyLayout>
  );
}

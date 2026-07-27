import React from 'react';
import Link from 'next/link';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách đổi trả',
  description: 'Điều kiện, thời hạn 3 ngày, quy trình đổi trả và cách hoàn tiền cho sản phẩm handmade tại Mushroomie.',
  alternates: { canonical: 'https://mushroomie.io.vn/chinh-sach-doi-tra' },
};

export default function ReturnPolicyPage() {
  return (
    <PolicyLayout title="Chính sách đổi trả">
      <div className="space-y-4 text-neutral-600">
        <p>Để đảm bảo quyền lợi cho khách hàng, Mushroomie hỗ trợ chính sách đổi trả linh hoạt. Vì sản phẩm được làm thủ công và phần lớn là hàng cá nhân hóa, chính sách dưới đây phân biệt rõ trường hợp nào được đổi trả và trường hợp nào không.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-4">1. Điều kiện đổi trả</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Sản phẩm bị lỗi do quá trình sản xuất (đứt dây, thiếu charm, nhầm mẫu).</li>
          <li>Sản phẩm bị hư hỏng nghiêm trọng trong quá trình vận chuyển (yêu cầu có video quay lúc mở hàng).</li>
          <li>Giao sai sản phẩm, sai màu hoặc sai kích thước so với đơn đã xác nhận.</li>
          <li>Thời gian yêu cầu đổi trả: Trong vòng <strong>3 ngày</strong> kể từ khi nhận hàng.</li>
          <li>Sản phẩm còn nguyên vẹn, chưa qua sử dụng và còn đầy đủ phụ kiện, bao bì đi kèm.</li>
        </ul>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">2. Trường hợp không áp dụng đổi trả</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Khách hàng thay đổi ý định sau khi hàng đã được làm xong, đặc biệt với hàng thiết kế theo tên riêng hoặc yêu cầu custom.</li>
          <li>Sản phẩm có dấu hiệu đã qua sử dụng, bị đứt, gãy hoặc biến dạng do tác động sau khi nhận hàng.</li>
          <li>Yêu cầu gửi sau 3 ngày kể từ khi nhận hàng.</li>
          <li>Không có video quay lúc mở kiện hàng trong trường hợp khiếu nại hư hỏng do vận chuyển.</li>
          <li>Sai lệch rất nhỏ về màu sắc hoặc chi tiết vốn có ở hàng thủ công — đây là đặc điểm tự nhiên của sản phẩm handmade, không phải lỗi sản xuất.</li>
        </ul>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">3. Quy trình đổi trả</h3>
        <p>Bước 1: Liên hệ với chúng tôi qua Zalo hoặc Fanpage Mushroomie, kèm theo hình ảnh/video tình trạng sản phẩm.</p>
        <p>Bước 2: Nêu rõ yêu cầu (Đổi sản phẩm mới hoặc Hoàn tiền).</p>
        <p>Bước 3: Mushroomie sẽ xác nhận và tiến hành gửi hàng thay thế hoặc hoàn tiền cho bạn trong vòng 24h.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">4. Chi phí đổi trả</h3>
        <p>Với các trường hợp lỗi thuộc về Mushroomie (lỗi sản xuất, giao sai, hư hỏng khi vận chuyển), <strong>Mushroomie chịu toàn bộ chi phí</strong> gửi trả và gửi lại sản phẩm mới. Bạn không phải trả thêm bất kỳ khoản nào.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">5. Hình thức hoàn tiền</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Đơn chuyển khoản / QR:</strong> hoàn về đúng tài khoản ngân hàng đã dùng để thanh toán.</li>
          <li><strong>Đơn COD:</strong> hoàn qua chuyển khoản tới số tài khoản bạn cung cấp.</li>
        </ul>
        <p>Thời gian tiền về tài khoản phụ thuộc ngân hàng, thường trong vòng 1–3 ngày làm việc kể từ khi Mushroomie xác nhận hoàn tiền.</p>

        <div className="bg-primary/5 p-4 rounded-lg mt-6 border border-primary/20">
          <p className="text-sm">Lưu ý: Chúng tôi <strong>không</strong> hỗ trợ đổi trả đối với các trường hợp khách hàng thay đổi ý định sau khi hàng đã được làm xong (đặc biệt là hàng thiết kế theo tên riêng). Nếu chưa chắc chắn về màu sắc hay kích thước, hãy nhắn tin để Mushroomie tư vấn trước khi chốt đơn — xem thêm tại trang <Link href="/lien-he" className="font-semibold text-primary hover:underline">Liên hệ</Link>.</p>
        </div>
      </div>
    </PolicyLayout>
  );
}

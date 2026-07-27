import React from 'react';
import Link from 'next/link';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách giao hàng',
  description: 'Thời gian xử lý, thời gian giao hàng, phí vận chuyển và cách theo dõi đơn phụ kiện handmade tại Mushroomie.',
  alternates: { canonical: 'https://mushroomie.io.vn/chinh-sach-giao-hang' },
};

export default function DeliveryPolicyPage() {
  return (
    <PolicyLayout title="Chính sách giao hàng">
      <div className="space-y-4 text-neutral-600">
        <p>Mushroomie làm thủ công từng đơn nên thời gian giao hàng gồm hai phần tách biệt: thời gian chuẩn bị hàng tại xưởng và thời gian vận chuyển của đơn vị giao nhận. Trang này mô tả chi tiết cả hai, cùng cách tính phí và cách theo dõi đơn.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">1. Thời gian xử lý đơn hàng</h3>
        <p>Vì các sản phẩm của Mushroomie là đồ thủ công (handmade) và có thể tùy chỉnh theo yêu cầu cá nhân, thời gian chuẩn bị hàng thường kéo dài từ <strong>1 đến 3 ngày làm việc</strong> trước khi giao cho đơn vị vận chuyển.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Mẫu có sẵn:</strong> thường đóng gói và gửi đi trong vòng 1 ngày làm việc.</li>
          <li><strong>Hàng custom (chọn màu, charm, khắc tên):</strong> cần 2–3 ngày làm việc để phối và hoàn thiện.</li>
          <li><strong>Đơn nhiều sản phẩm hoặc set quà:</strong> thời gian chuẩn bị tính theo món cần nhiều thời gian nhất trong đơn.</li>
        </ul>
        <p>Ngày lễ, Tết và các đợt cao điểm (20/10, Giáng sinh, Valentine) có thể kéo dài thêm 1–2 ngày. Mushroomie sẽ nhắn tin báo trước nếu đơn của bạn bị ảnh hưởng.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">2. Thời gian giao hàng</h3>
        <p>Tính từ lúc đơn được bàn giao cho đơn vị vận chuyển:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Nội thành Thành Phố Đồng Nai:</strong> 1 - 2 ngày làm việc.</li>
          <li><strong>Các tỉnh thành khác:</strong> 3 - 5 ngày làm việc tùy khu vực.</li>
        </ul>
        <p>Như vậy tổng thời gian từ lúc đặt đến lúc nhận thường là 2–5 ngày làm việc trong khu vực Đồng Nai và 4–8 ngày làm việc với các tỉnh thành khác. Thời gian trên không tính Chủ nhật và ngày lễ.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">3. Phí vận chuyển</h3>
        <p>Phí vận chuyển sẽ được tính tự động dựa trên địa chỉ của bạn khi thanh toán và hiển thị đầy đủ ở bước xác nhận đơn, trước khi bạn đặt hàng. Mushroomie thường xuyên có các chương trình Freeship cho đơn hàng từ 150.000đ.</p>
        <p>Nếu bạn có voucher miễn phí vận chuyển (nhận từ mini game hoặc chương trình khuyến mãi), phí ship sẽ được trừ trực tiếp ở bước thanh toán.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">4. Theo dõi đơn hàng</h3>
        <p>Sau khi đặt hàng thành công, bạn có thể xem trạng thái đơn tại mục <Link href="/tai-khoan/don-hang" className="font-semibold text-primary hover:underline">Đơn hàng của tôi</Link> trong tài khoản. Mỗi đơn đều có mã riêng và lịch sử trạng thái từ lúc tiếp nhận đến khi giao thành công.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">5. Khi nhận hàng</h3>
        <p>Mushroomie khuyến khích bạn <strong>quay video lúc mở kiện hàng</strong>. Đây là căn cứ bắt buộc nếu sản phẩm bị hư hỏng trong quá trình vận chuyển và bạn muốn yêu cầu đổi trả — xem chi tiết tại <Link href="/chinh-sach-doi-tra" className="font-semibold text-primary hover:underline">Chính sách đổi trả</Link>.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">6. Giao hàng không thành công</h3>
        <p>Nếu đơn vị vận chuyển không liên hệ được với bạn, đơn hàng thường được giao lại thêm 1–2 lần trước khi hoàn về xưởng. Để tránh trường hợp này, bạn vui lòng kiểm tra kỹ số điện thoại và địa chỉ trước khi xác nhận đơn, đồng thời để ý điện thoại trong khoảng thời gian dự kiến giao.</p>
        <p>Nếu đơn đã hoàn về mà bạn vẫn muốn nhận hàng, hãy nhắn tin cho Mushroomie để được hỗ trợ gửi lại.</p>

        <div className="bg-primary/5 p-4 rounded-lg mt-6 border border-primary/20">
          <p className="text-sm">Cần hỗ trợ về đơn hàng đang giao? Nhắn tin qua Fanpage hoặc Zalo Mushroomie, hoặc liên hệ theo thông tin tại trang <Link href="/lien-he" className="font-semibold text-primary hover:underline">Liên hệ</Link>. Mushroomie phản hồi trong giờ mở cửa 08:00 – 21:00 hằng ngày.</p>
        </div>
      </div>
    </PolicyLayout>
  );
}

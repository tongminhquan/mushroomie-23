import React from 'react';
import Link from 'next/link';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách và quy định chung',
  description: 'Quy định về tài khoản, đặt hàng, giá, voucher, sở hữu trí tuệ và trách nhiệm khi sử dụng dịch vụ Mushroomie.',
  alternates: { canonical: 'https://mushroomie.io.vn/chinh-sach-quy-dinh' },
};

export default function GeneralPolicyPage() {
  return (
    <PolicyLayout title="Chính sách & Quy định chung">
      <div className="space-y-4 text-neutral-600">
        <p>Chào mừng bạn đến với Mushroomie. Khi truy cập và mua sắm tại website của chúng tôi, bạn đồng ý tuân thủ các quy định dưới đây.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">1. Chấp nhận điều khoản</h3>
        <p>Bằng việc đặt hàng, bạn xác nhận đã đọc, hiểu và đồng ý với các chính sách của Mushroomie về giao hàng, đổi trả và bảo mật thông tin.</p>
        <p>Mushroomie có thể cập nhật các chính sách này theo thời gian. Phiên bản áp dụng cho đơn hàng của bạn là phiên bản đang hiển thị trên website tại thời điểm bạn đặt hàng.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">2. Quy định về sản phẩm</h3>
        <p>Tất cả sản phẩm của Mushroomie đều là hàng thủ công (handmade). Do đó, sản phẩm thực tế có thể có sự sai lệch rất nhỏ về màu sắc hoặc chi tiết so với ảnh chụp, tuy nhiên chúng tôi cam kết chất lượng luôn đạt tiêu chuẩn cao nhất.</p>
        <p>Màu sắc hiển thị còn phụ thuộc vào màn hình thiết bị của bạn. Với hàng custom, Mushroomie luôn xác nhận lại màu và chi tiết với khách trước khi bắt tay vào làm.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">3. Tài khoản người dùng</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động phát sinh từ tài khoản của mình.</li>
          <li>Thông tin đăng ký (họ tên, số điện thoại, địa chỉ) cần chính xác để đơn hàng được giao đúng.</li>
          <li>Mushroomie có quyền tạm khóa tài khoản có dấu hiệu gian lận, spam hoặc lạm dụng chương trình khuyến mãi.</li>
        </ul>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">4. Đặt hàng và xác nhận đơn</h3>
        <p>Đơn hàng được xem là xác lập khi bạn hoàn tất bước đặt hàng và nhận được mã đơn. Mushroomie có quyền từ chối hoặc hủy đơn trong các trường hợp: sản phẩm hết hàng, thông tin liên hệ không chính xác, hoặc phát hiện sai sót rõ ràng về giá hiển thị. Nếu đơn đã thanh toán mà bị hủy vì các lý do trên, bạn sẽ được hoàn tiền đầy đủ.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">5. Giá và khuyến mãi</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Giá niêm yết trên website đã bao gồm thuế (nếu có) và chưa bao gồm phí vận chuyển.</li>
          <li>Phí vận chuyển được tính và hiển thị đầy đủ ở bước thanh toán trước khi bạn xác nhận đơn.</li>
          <li>Giá và chương trình khuyến mãi có thể thay đổi mà không cần báo trước, nhưng không ảnh hưởng tới đơn đã được xác nhận.</li>
        </ul>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">6. Voucher và mini game</h3>
        <p>Voucher nhận được từ mini game hoặc chương trình khuyến mãi có thời hạn và điều kiện sử dụng riêng, hiển thị ngay trên từng voucher trong mục <Link href="/voucher" className="font-semibold text-primary hover:underline">Voucher</Link>. Mỗi voucher chỉ dùng một lần, không quy đổi thành tiền mặt và không cộng dồn trừ khi có ghi chú khác. Mushroomie có quyền thu hồi voucher phát sinh từ hành vi gian lận điểm số.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">7. Quyền sở hữu trí tuệ</h3>
        <p>Toàn bộ hình ảnh sản phẩm, bài viết, thiết kế và logo trên website thuộc quyền sở hữu của Mushroomie. Vui lòng không sao chép, chỉnh sửa hoặc sử dụng cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản. Bạn được phép chia sẻ đường dẫn tới trang sản phẩm và bài viết.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">8. Giới hạn trách nhiệm</h3>
        <p>Mushroomie chịu trách nhiệm với chất lượng sản phẩm theo <Link href="/chinh-sach-doi-tra" className="font-semibold text-primary hover:underline">Chính sách đổi trả</Link>. Chúng tôi không chịu trách nhiệm với hư hỏng phát sinh do sử dụng sai cách, tiếp xúc hóa chất, nước biển hoặc tác động mạnh sau khi nhận hàng.</p>

        <h3 className="text-lg font-bold text-neutral-800 mt-6">9. Giải quyết khiếu nại</h3>
        <p>Mọi khiếu nại vui lòng gửi qua Fanpage, Zalo hoặc thông tin tại trang <Link href="/lien-he" className="font-semibold text-primary hover:underline">Liên hệ</Link>. Mushroomie ưu tiên giải quyết trên tinh thần thương lượng, thiện chí. Trường hợp không đạt được thỏa thuận, tranh chấp sẽ được giải quyết theo quy định pháp luật Việt Nam.</p>
      </div>
    </PolicyLayout>
  );
}

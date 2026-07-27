import React from 'react';
import Link from 'next/link';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Chính sách trả góp',
  description: 'Mushroomie chưa áp dụng trả góp. Xem các phương thức thanh toán đang hỗ trợ: COD và chuyển khoản QR VietQR.',
  alternates: { canonical: 'https://mushroomie.io.vn/chinh-sach-tra-gop' },
};

export default function InstallmentPolicyPage() {
  return (
    <PolicyLayout title="Chính sách trả góp">
      <div className="space-y-6 text-neutral-600">
        <p>
          Mushroomie hiện tại <strong>chưa áp dụng hình thức trả góp</strong> cho các sản phẩm phụ kiện handmade do giá trị đơn hàng thường ở mức dễ tiếp cận.
        </p>
        <p>
          Tuy nhiên, chúng tôi luôn nỗ lực mang đến các phương thức thanh toán linh hoạt và tiện lợi nhất cho bạn. Trong tương lai, nếu có các bộ sưu tập đặc biệt hoặc combo sản phẩm giá trị cao, Mushroomie sẽ hợp tác với các đối tác thanh toán (như Fundiin, Kredivo, SPayLater...) để hỗ trợ tính năng &quot;Mua trước trả sau&quot;.
        </p>

        <h3 className="text-lg font-bold text-neutral-800 mt-8 mb-4">Các hình thức thanh toán đang hỗ trợ:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Thanh toán khi nhận hàng (COD):</strong> Nhận hàng, kiểm tra và thanh toán trực tiếp cho shipper.</li>
          <li><strong>Chuyển khoản ngân hàng:</strong> Thanh toán nhanh chóng qua mã QR VietQR (miễn phí giao dịch).</li>
          <li><strong>Ví điện tử:</strong> Hỗ trợ thanh toán qua MoMo, ZaloPay (sắp ra mắt).</li>
        </ul>

        <h3 className="text-lg font-bold text-neutral-800 mt-8 mb-4">Thanh toán bằng mã QR như thế nào?</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Chọn &quot;Chuyển khoản ngân hàng&quot; ở bước thanh toán và xác nhận đơn.</li>
          <li>Website hiển thị mã QR kèm đúng số tiền và nội dung chuyển khoản của đơn.</li>
          <li>Mở app ngân hàng, quét mã và giữ nguyên nội dung chuyển khoản được điền sẵn.</li>
          <li>Hệ thống tự động ghi nhận và cập nhật trạng thái đơn sang &quot;Đã thanh toán&quot;, thường trong vòng 1–2 phút.</li>
        </ol>

        <h3 className="text-lg font-bold text-neutral-800 mt-8 mb-4">Một số lưu ý</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Giữ nguyên nội dung chuyển khoản.</strong> Đây là căn cứ để hệ thống khớp giao dịch với đơn hàng. Nếu bạn sửa nội dung, đơn có thể không được ghi nhận tự động.</li>
          <li><strong>Chuyển sai số tiền hoặc sai nội dung?</strong> Nhắn tin ngay cho Mushroomie kèm ảnh chụp biên lai để được đối soát thủ công.</li>
          <li><strong>Đơn COD:</strong> vui lòng chuẩn bị đủ tiền mặt và kiểm tra hàng trước khi thanh toán cho shipper.</li>
          <li><strong>Hóa đơn:</strong> nếu cần hóa đơn cho đơn hàng, hãy báo trước khi Mushroomie đóng gói.</li>
        </ul>

        <p>Chi tiết về thời gian giao hàng và phí vận chuyển, xem tại <Link href="/chinh-sach-giao-hang" className="font-semibold text-primary hover:underline">Chính sách giao hàng</Link>. Trường hợp cần hoàn tiền, xem <Link href="/chinh-sach-doi-tra" className="font-semibold text-primary hover:underline">Chính sách đổi trả</Link>.</p>

        <div className="bg-primary/5 p-4 rounded-lg mt-8 border border-primary/20">
          <p className="font-semibold text-primary mb-1">Mẹo nhỏ:</p>
          <p className="text-sm">Hãy theo dõi các kênh Mạng xã hội của Mushroomie để cập nhật ngay khi chúng tôi ra mắt hình thức thanh toán mới nhé!</p>
        </div>
      </div>
    </PolicyLayout>
  );
}

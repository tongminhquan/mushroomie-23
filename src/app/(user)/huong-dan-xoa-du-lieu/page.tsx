import React from 'react';
import { Trash2, ShieldAlert, Mail, Phone, ExternalLink } from 'lucide-react';
import PolicyLayout from '@/components/layout/PolicyLayout';

export const metadata = {
  title: 'Hướng dẫn xóa dữ liệu | Mushroomie',
  description: 'Hướng dẫn xóa dữ liệu cá nhân liên kết với tài khoản Facebook tại Mushroomie',
};

export default function DataDeletionInstructionsPage() {
  return (
    <PolicyLayout title="Hướng dẫn xóa dữ liệu">
      <div className="space-y-8">
        <p className="text-neutral-600">
          Tại Mushroomie, chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. Nếu bạn đã sử dụng tài khoản Facebook để đăng nhập hoặc tạo tài khoản trên website của chúng tôi và muốn yêu cầu xóa dữ liệu liên kết này, bạn có thể thực hiện theo các phương thức dưới đây.
        </p>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <Trash2 className="w-5 h-5 text-primary" /> Cách 1: Gỡ liên kết trực tiếp trên Facebook cá nhân
          </h3>
          <p className="mb-3 text-neutral-600">Bạn có thể tự chủ động gỡ bỏ liên kết của ứng dụng Mushroomie thông qua cài đặt tài khoản Facebook của mình:</p>
          <ol className="list-decimal pl-5 space-y-2 text-neutral-600">
            <li>Đăng nhập vào tài khoản Facebook cá nhân của bạn.</li>
            <li>Đi tới <strong>Cài đặt & Quyền riêng tư</strong> (Settings & Privacy) &rarr; chọn <strong>Cài đặt</strong> (Settings).</li>
            <li>Tại menu bên trái, cuộn xuống phần <strong>Tiện ích tích hợp</strong> (Integrations) và chọn <strong>Ứng dụng và trang web</strong> (Apps and websites).</li>
            <li>Tìm ứng dụng <strong>Mushroomie</strong> trong danh sách các ứng dụng đang hoạt động.</li>
            <li>Nhấp vào nút <strong>Gỡ</strong> (Remove) bên cạnh tên ứng dụng.</li>
            <li>Xác nhận một lần nữa để hoàn tất việc gỡ bỏ liên kết.</li>
          </ol>
          <p className="mt-3 text-sm text-neutral-500 italic">
            * Sau khi gỡ bỏ, Facebook sẽ ngừng chia sẻ thông tin mới với Mushroomie và gửi tín hiệu yêu cầu xóa quyền truy cập dữ liệu đến máy chủ của chúng tôi.
          </p>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <ShieldAlert className="w-5 h-5 text-[#FFB347]" /> Cách 2: Yêu cầu xóa dữ liệu trực tiếp khỏi hệ thống Mushroomie
          </h3>
          <p className="mb-3 text-neutral-600 font-medium">
            Nếu bạn muốn xóa vĩnh viễn toàn bộ dữ liệu cá nhân của mình trên hệ thống của chúng tôi (bao gồm họ tên, email, lịch sử đơn hàng và các hoạt động khác):
          </p>
          <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-neutral-800">Gửi yêu cầu qua Email:</p>
                <p className="text-neutral-600 text-sm">
                  Gửi email yêu cầu đến địa chỉ <a href="mailto:cskh@mushroomie.io.vn" className="text-primary hover:underline">cskh@mushroomie.io.vn</a> từ chính địa chỉ email mà bạn sử dụng để liên kết với Facebook.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-neutral-800">Liên hệ qua Hotline:</p>
                <p className="text-neutral-600 text-sm">
                  Gọi điện thoại trực tiếp cho bộ phận hỗ trợ khách hàng của chúng tôi qua số điện thoại <a href="tel:+84848744060" className="text-primary hover:underline">+84 848 744 060</a> để được hướng dẫn xử lý nhanh chóng.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="flex items-center gap-2 text-lg font-bold text-neutral-800 mb-3">
            <ExternalLink className="w-5 h-5 text-[#A8E6CF]" /> Quy trình xử lý yêu cầu xóa dữ liệu
          </h3>
          <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
            <li>Sau khi nhận được yêu cầu hợp lệ của bạn, bộ phận hỗ trợ khách hàng của chúng tôi sẽ xác minh danh tính tài khoản liên kết.</li>
            <li>Chúng tôi sẽ tiến hành xóa hoàn toàn các thông tin cá nhân của bạn khỏi cơ sở dữ liệu hoạt động trong vòng <strong>24 đến 48 giờ làm việc</strong>.</li>
            <li>Một email xác nhận kết quả xóa dữ liệu sẽ được gửi tới địa chỉ email của bạn ngay sau khi quy trình hoàn thành.</li>
          </ul>
        </section>

        <div className="mt-10 pt-6 border-t border-neutral-100 text-sm text-neutral-500 font-medium flex justify-between items-center">
          <span>Cập nhật lần cuối: <span className="text-primary">Tháng 6 năm 2026</span></span>
          <span className="text-xs text-neutral-400">Mushroomie Data Compliance</span>
        </div>
      </div>
    </PolicyLayout>
  );
}

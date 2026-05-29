import React from 'react';

export const metadata = {
  title: 'Chính sách & Bảo mật | Mushroomie',
  description: 'Chính sách và bảo mật thông tin khách hàng tại Mushroomie',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl mb-8 text-center">
          Chính sách & Bảo mật
        </h1>
        
        <div className="prose prose-lg prose-neutral mx-auto mt-6 text-neutral-600">
          <h2>1. Mục đích thu thập thông tin cá nhân</h2>
          <p>
            Mushroomie thu thập thông tin cá nhân của bạn (bao gồm: Tên, Số điện thoại, Email, Địa chỉ) nhằm mục đích:
          </p>
          <ul>
            <li>Xử lý đơn đặt hàng và giao hàng.</li>
            <li>Cung cấp thông tin liên quan đến sản phẩm, dịch vụ và hỗ trợ khách hàng.</li>
            <li>Thông báo về các chương trình khuyến mãi, ưu đãi đặc biệt (nếu bạn đăng ký nhận tin).</li>
            <li>Ngăn ngừa các hoạt động gian lận và nâng cao trải nghiệm mua sắm trên website.</li>
          </ul>

          <h2>2. Phạm vi sử dụng thông tin</h2>
          <p>
            Thông tin thu thập được sẽ chỉ được sử dụng trong nội bộ Mushroomie. Chúng tôi có thể chia sẻ tên, địa chỉ và số điện thoại của bạn cho dịch vụ chuyển phát nhanh để có thể giao hàng cho bạn.
          </p>

          <h2>3. Thời gian lưu trữ thông tin</h2>
          <p>
            Mushroomie sẽ lưu trữ các Thông tin cá nhân do Khách hàng cung cấp trên các hệ thống nội bộ của chúng tôi trong quá trình cung cấp dịch vụ cho Khách hàng hoặc cho đến khi hoàn thành mục đích thu thập hoặc khi Khách hàng có yêu cầu hủy các thông tin đã cung cấp.
          </p>

          <h2>4. Cam kết bảo mật thông tin cá nhân khách hàng</h2>
          <p>
            Chúng tôi rất quan tâm đến quyền riêng tư của bạn và cam kết không bán, trao đổi hay chia sẻ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào khác vì mục đích thương mại vi phạm những cam kết được đặt ra trong quy định Chính sách bảo mật này.
          </p>
          <p>
            Bảo mật thông tin của bạn là ưu tiên hàng đầu của Mushroomie. Trong trường hợp máy chủ lưu trữ thông tin bị hacker tấn công dẫn đến mất mát dữ liệu cá nhân khách hàng, chúng tôi sẽ có trách nhiệm thông báo vụ việc cho cơ quan chức năng điều tra xử lý kịp thời và thông báo cho bạn được biết.
          </p>

          <h2>5. Thay đổi về chính sách</h2>
          <p>
            Chúng tôi có quyền thay đổi, cập nhật chính sách bảo mật này bất cứ lúc nào để phù hợp với những thay đổi của công ty cũng như yêu cầu của pháp luật. Những thay đổi sẽ được cập nhật trên website.
          </p>

          <p className="mt-8 italic text-sm text-neutral-500">
            Cập nhật lần cuối: Tháng 5 năm 2026.
          </p>
        </div>
      </div>
    </div>
  );
}

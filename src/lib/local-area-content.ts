import type { LocalArea } from '@/lib/local-seo'

/**
 * Nội dung riêng cho từng trang landing địa phương.
 *
 * Audit 2026-07-27 đo bằng 5-gram Jaccard: 23 trang landing chỉ có 8.7–32.3% nội dung
 * độc nhất (trung bình ~18%), vì mọi trang dùng chung template — cùng 16 thẻ H2, cùng
 * khối FAQ, cùng phần quy trình đặt hàng. Đây là rủi ro doorway page.
 *
 * Module này giữ phần nội dung KHÔNG được dùng chung: mỗi slug có một đoạn riêng nói
 * đúng về khu vực đó và nhóm sản phẩm đó. Khi thêm trang landing mới, bắt buộc thêm
 * entry ở đây — tests/local-area-content.test.ts kiểm tra độ phủ và độ trùng lặp.
 */

export interface AreaDelivery {
  /** Mô tả thời gian giao thực tế tới khu vực. */
  summary: string
  /** Có nhận trực tiếp tại xưởng Trảng Dài được không. */
  pickup: string
}

/** Thời gian giao bám theo /chinh-sach-giao-hang: 1-2 ngày nội tỉnh, 3-5 ngày tỉnh khác. */
export const AREA_DELIVERY: Record<LocalArea, AreaDelivery> = {
  'Trảng Dài': {
    summary:
      'Trảng Dài là nơi Mushroomie đặt xưởng, nên đơn trong phường thường được giao trong ngày hoặc sang ngày hôm sau, tính từ lúc sản phẩm làm xong.',
    pickup:
      'Bạn có thể hẹn nhận trực tiếp tại Hẻm 2, tổ 11, phường Trảng Dài. Nhắn trước để Mushroomie xác nhận thời gian, tránh trường hợp đơn chưa hoàn thiện.',
  },
  'Biên Hòa': {
    summary:
      'Từ xưởng ở Trảng Dài sang các phường Biên Hòa chỉ vài ki-lô-mét, nên đơn thường tới tay trong 1–2 ngày làm việc sau khi hoàn thiện.',
    pickup:
      'Khách Biên Hòa có thể chọn giao tận nơi hoặc hẹn ghé xưởng ở Trảng Dài nhận trực tiếp — quãng đường khoảng 15–20 phút chạy xe.',
  },
  'Đồng Nai': {
    summary:
      'Trong địa bàn Đồng Nai, đơn thường được giao trong 1–2 ngày làm việc kể từ khi sản phẩm hoàn thiện.',
    pickup:
      'Nếu tiện đường, bạn có thể hẹn nhận trực tiếp tại xưởng Trảng Dài thay vì chờ vận chuyển.',
  },
  'TP.HCM': {
    summary:
      'Đơn đi TP.HCM được gửi từ Đồng Nai qua đơn vị vận chuyển, thường mất 3–5 ngày làm việc sau khi sản phẩm hoàn thiện.',
    pickup:
      'Mushroomie không có cửa hàng tại TP.HCM — toàn bộ đơn khu vực này là đặt online và giao tận nơi.',
  },
}

/**
 * Đoạn nội dung riêng của từng trang. Mỗi đoạn phải nói được điều mà các trang khác
 * KHÔNG nói: đặc thù khu vực, đặc thù nhóm sản phẩm, hoặc dịp dùng cụ thể.
 */
export const AREA_NOTES: Record<string, string> = {
  'phu-kien-handmade-dong-nai':
    'Đồng Nai là thị trường gốc của Mushroomie — phần lớn đơn đầu tiên đều đến từ các bạn học sinh, sinh viên trong tỉnh. Vì vậy nhóm phụ kiện ở đây được giữ ở tầm giá dễ tiếp cận và ưu tiên mẫu đeo được hằng ngày: vòng hạt cườm nhẹ tay, móc khóa gắn balo, charm rời để tự phối. Nếu bạn chưa biết bắt đầu từ đâu, cách phổ biến nhất là chọn một mẫu có sẵn rồi đổi vài charm cho hợp gu — chi phí gần như không đổi nhưng thành phẩm đã là của riêng bạn.',
  'shop-phu-kien-handmade-dong-nai':
    'Khác với các trang giới thiệu từng dòng sản phẩm, đây là điểm vào cho ai muốn xem toàn bộ những gì Mushroomie đang làm tại Đồng Nai: vòng tay, dây chuyền, móc khóa, charm rời và set quà đóng gói sẵn. Mushroomie không có mặt bằng bán lẻ theo kiểu cửa hàng truyền thống — mọi thứ được làm tại xưởng nhỏ ở Trảng Dài rồi giao đi, nên bạn xem mẫu online và chốt qua tin nhắn hoặc đặt thẳng trên website.',
  'phu-kien-handmade-bien-hoa':
    'Biên Hòa là khu vực đông khách nhất sau chính Trảng Dài, phần lớn là các bạn trẻ đặt phụ kiện để đeo đi học hoặc làm quà tặng bạn bè. Vì quãng đường từ xưởng sang Biên Hòa rất ngắn, đây cũng là khu vực dễ xử lý các đơn gấp nhất — nếu bạn cần hàng cho một dịp cụ thể, hãy nhắn kèm ngày cần nhận để Mushroomie sắp lịch làm trước.',
  'phu-kien-handmade-tphcm':
    'Với khách TP.HCM, toàn bộ quy trình diễn ra online: bạn chọn mẫu trên website hoặc Shopee, chốt màu và charm qua tin nhắn, Mushroomie làm tại Đồng Nai rồi gửi vào. Điều đáng lưu ý khi đặt từ xa là khâu chốt màu — màu hiển thị trên màn hình có thể lệch so với thực tế, nên Mushroomie thường gửi ảnh chụp thành phẩm trước khi đóng gói để bạn xác nhận.',
  'vong-tay-handmade-dong-nai':
    'Vòng tay là dòng bán chạy nhất của Mushroomie tại Đồng Nai. Phần lớn khách chọn cỡ tay tiêu chuẩn, nhưng nếu bạn có cổ tay nhỏ hoặc muốn đeo chồng nhiều vòng thì nên đo và báo số đo trước — vòng handmade không co giãn nhiều như vòng thun công nghiệp. Cách đo đơn giản nhất là dùng một sợi dây quấn quanh cổ tay rồi đo lại bằng thước.',
  'vong-tay-custom-dong-nai':
    'Trang này dành cho đơn đặt riêng, khác với các mẫu có sẵn. Quy trình custom thường bắt đầu bằng việc bạn mô tả ý tưởng — tông màu, charm muốn có, chữ hoặc ký hiệu cần khắc — sau đó Mushroomie phối thử và báo lại phương án cùng chi phí trước khi bắt tay làm. Hàng custom cần thêm 1–2 ngày so với mẫu có sẵn và không thuộc diện đổi trả khi khách đổi ý, nên khâu xác nhận mẫu ban đầu khá quan trọng.',
  'vong-tay-custom-bien-hoa':
    'Đơn custom từ Biên Hòa có một lợi thế: khoảng cách gần nên nếu cần, bạn có thể ghé xưởng xem trực tiếp mẫu hạt và charm trước khi chốt, thay vì chỉ nhìn qua ảnh. Điều này đặc biệt hữu ích khi bạn muốn phối một tông màu khó mô tả bằng lời, hoặc khi làm vòng đôi cần hai màu ăn nhau.',
  'moc-khoa-handmade-dong-nai':
    'Móc khóa là món dễ tặng nhất trong các dòng của Mushroomie: không cần biết số đo, không kén người dùng, và tầm giá thấp hơn vòng tay. Tại Đồng Nai, đây là lựa chọn phổ biến cho quà tặng nhóm — lớp học, đội nhóm, hoặc quà tri ân số lượng vừa. Với đơn từ 10 chiếc trở lên, hãy nhắn trước để Mushroomie sắp xếp đủ nguyên liệu cùng tông.',
  'moc-khoa-handmade-theo-yeu-cau-dong-nai':
    'Khác với móc khóa mẫu sẵn, đơn theo yêu cầu cho phép bạn quyết định gần như mọi chi tiết: hình dáng charm chính, màu dây, chữ cái hoặc con số muốn gắn, và cả loại khoen móc. Đây là dạng đơn Mushroomie nhận nhiều vào mùa tốt nghiệp và cuối năm. Vì mỗi chiếc được làm riêng, thời gian hoàn thiện dài hơn mẫu có sẵn — nên đặt trước ít nhất một tuần nếu bạn cần cho một dịp cố định.',
  'qua-tang-handmade-dong-nai':
    'Quà tặng ở Mushroomie không phải một dòng sản phẩm riêng mà là cách đóng gói: bạn chọn một hoặc vài món phụ kiện, Mushroomie đóng hộp kèm thiệp viết tay. Tại Đồng Nai, đơn quà tặng tăng mạnh vào các dịp 20/10, Giáng sinh và Valentine — những thời điểm này thời gian chuẩn bị có thể dài hơn bình thường 1–2 ngày, nên đặt sớm sẽ chủ động hơn.',
  'qua-tang-ca-nhan-hoa-dong-nai':
    'Cá nhân hóa là điểm khác biệt lớn nhất so với quà mua sẵn: món quà mang tên, ngày tháng hoặc ký hiệu chỉ có ý nghĩa với người nhận. Mushroomie thường gợi ý bắt đầu từ một chi tiết cụ thể — chữ cái đầu tên, một màu người nhận hay mặc, hoặc một biểu tượng gắn với kỷ niệm chung — rồi mới xây phần còn lại quanh chi tiết đó. Lưu ý: hàng đã khắc tên không đổi trả được khi đổi ý.',
  'phu-kien-handmade-trang-dai':
    'Trảng Dài là nơi Mushroomie thực sự đặt xưởng, không phải một khu vực chỉ giao hàng tới. Nếu bạn ở trong phường, đây là khu vực duy nhất có thể hẹn xem hàng trực tiếp và nhận ngay sau khi làm xong. Xưởng nằm trong hẻm 2, tổ 11 — cách Trường Tiểu học Trảng Dài khoảng 2,1km và UBND phường khoảng 2,4km, tương đương 4–8 phút chạy xe.',
  'vong-tay-handmade-trang-dai':
    'Với khách ngay tại Trảng Dài, vòng tay là món dễ chốt nhất vì bạn có thể ghé thử trực tiếp — đo cổ tay tại chỗ, xem màu hạt thật thay vì qua ảnh, và chọn charm từ khay mẫu. Đây cũng là cách nhanh nhất để có một chiếc vòng đúng ý ngay trong ngày, thay vì qua vài lượt trao đổi ảnh.',
  'shop-phu-kien-handmade-bien-hoa':
    'Nhiều bạn ở Biên Hòa tìm "shop phụ kiện handmade" với mong đợi một cửa hàng để ghé xem. Nói rõ để bạn khỏi mất công: Mushroomie không có mặt bằng tại Biên Hòa. Xưởng đặt ở Trảng Dài, cách trung tâm Biên Hòa khoảng 15–20 phút chạy xe, và bạn có thể hẹn ghé nhận trực tiếp nếu muốn — nhưng cần nhắn trước để chắc chắn đơn đã xong và có người ở xưởng.',
  'vong-tay-handmade-bien-hoa':
    'Vòng tay giao Biên Hòa thường tới tay trong 1–2 ngày sau khi hoàn thiện, nên đây là khu vực dễ xử lý đơn gấp. Một lưu ý riêng cho khách Biên Hòa: nếu bạn định đặt vòng đôi hoặc vòng nhóm bạn thân, hãy gom chung một đơn thay vì đặt lẻ — Mushroomie sẽ phối cùng lô nguyên liệu để hai chiếc thật sự ăn màu nhau.',
  'moc-khoa-handmade-bien-hoa':
    'Móc khóa handmade được khách Biên Hòa đặt nhiều nhất cho hai mục đích: gắn balo đi học và làm quà tặng nhỏ trong nhóm bạn. Vì đây là món treo và va chạm thường xuyên, Mushroomie dùng khoen kim loại chắc hơn so với loại dùng cho charm trang trí — chi tiết này không thấy qua ảnh nhưng ảnh hưởng trực tiếp tới độ bền khi dùng hằng ngày.',
  'qua-tang-handmade-bien-hoa':
    'Điểm thuận lợi khi đặt quà từ Biên Hòa là bạn có thể canh ngày khá sát: quãng đường ngắn nên rủi ro trễ thấp hơn nhiều so với gửi đi tỉnh xa. Dù vậy, phần quyết định thời gian không phải khâu vận chuyển mà là khâu làm hàng — nếu quà cần khắc tên hoặc phối riêng, hãy tính thêm 2–3 ngày làm việc vào lịch của bạn.',
  'vong-tay-custom-tphcm':
    'Đặt vòng custom từ TP.HCM nghĩa là toàn bộ khâu chốt mẫu diễn ra qua tin nhắn. Để tránh sai lệch, Mushroomie thường làm theo trình tự: bạn gửi ảnh tham khảo hoặc mô tả tông màu, Mushroomie phối thử và chụp lại gửi bạn duyệt, chốt xong mới hoàn thiện và đóng gói. Cộng cả thời gian làm và 3–5 ngày vận chuyển, bạn nên đặt trước khoảng một tuần nếu có ngày cần nhận cố định.',
  'moc-khoa-handmade-tphcm':
    'Móc khóa là món hợp nhất để đặt từ xa: không cần số đo, nhẹ nên phí vận chuyển thấp, và ít rủi ro lệch kỳ vọng hơn vòng tay. Với khách TP.HCM, đây thường là món "thử" đầu tiên trước khi đặt các đơn lớn hơn. Đơn gửi từ Đồng Nai vào thường mất 3–5 ngày làm việc sau khi hoàn thiện.',
  'qua-tang-handmade-tphcm':
    'Khi gửi quà vào TP.HCM, điều đáng cân nhắc nhất là thời gian. Tổng thời gian gồm 1–3 ngày làm hàng cộng 3–5 ngày vận chuyển, tức là nên đặt trước ít nhất một tuần so với ngày tặng. Nếu bạn muốn gửi thẳng tới địa chỉ người nhận thay vì địa chỉ của mình, hãy ghi rõ trong ghi chú đơn — Mushroomie sẽ không kèm hóa đơn giá vào hộp.',
  'vong-tay-cap-doi-dong-nai':
    'Vòng đôi khác vòng lẻ ở chỗ hai chiếc phải ăn nhau chứ không chỉ đẹp riêng. Mushroomie thường phối theo hai hướng: cùng tông nhưng khác sắc độ, hoặc hai màu tương phản có chung một charm liên kết. Vì cần lấy nguyên liệu cùng lô, đơn vòng đôi nên đặt một lần cho cả hai chiếc — đặt lẻ hai lần rất khó khớp màu tuyệt đối.',
  'charm-handmade-dong-nai':
    'Charm rời là phần linh hoạt nhất trong hệ sản phẩm của Mushroomie: bạn có thể mua riêng để tự thay lên vòng hoặc móc khóa đang có, thay vì đặt cả món mới. Đây cũng là cách nhiều bạn dùng để đổi mới phụ kiện cũ theo mùa hoặc theo tâm trạng. Khi mua charm rời, hãy kiểm tra khoen của vòng hiện tại có mở được không — một số mẫu vòng cố định sẽ không gắn thêm charm được.',
  'day-chuyen-handmade-dong-nai':
    'Dây chuyền và vòng cổ handmade cần lưu ý về độ dài nhiều hơn vòng tay, vì độ dài quyết định mặt dây rơi ở vị trí nào. Mushroomie thường hỏi bạn muốn dây ôm sát cổ hay rủ xuống ngực trước khi làm. Ngoài ra, dây chuyền tiếp xúc da cổ nhiều hơn nên nếu bạn có cơ địa dễ kích ứng kim loại, hãy báo trước để Mushroomie chọn loại khoen phù hợp.',
}

export function getAreaNote(slug: string): string | null {
  return AREA_NOTES[slug] ?? null
}

export function getAreaDelivery(area: LocalArea): AreaDelivery {
  return AREA_DELIVERY[area]
}

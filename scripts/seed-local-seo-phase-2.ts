import { PrismaClient } from '@prisma/client'
import { calculateReadingTime, calculateWordCount } from '../src/lib/sanitize'
import { generateSlug } from '../src/lib/utils'

const prisma = new PrismaClient()
const SITE_URL = 'https://mushroomie.io.vn'
const CATEGORY_SLUG = 'tin-tuc-handmade'
const PUBLISH_INTERVAL_DAYS = 3

type Section = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

type Article = {
  title: string
  slug: string
  excerpt: string
  focusKeyword: string
  metaDescription: string
  secondaryKeywords: string[]
  sections: Section[]
  relatedLinks: Array<{ href: string; label: string }>
}

const articles: Article[] = [
  {
    title: 'Cách chọn vòng tay handmade ở Đồng Nai phù hợp phong cách riêng',
    slug: 'cach-chon-vong-tay-handmade-o-dong-nai',
    excerpt: 'Hướng dẫn chọn vòng tay handmade theo màu da, kích thước cổ tay, phong cách và mục đích sử dụng dành cho bạn ở Đồng Nai.',
    focusKeyword: 'cách chọn vòng tay handmade ở Đồng Nai',
    metaDescription: 'Cách chọn vòng tay handmade ở Đồng Nai theo màu da, size cổ tay, chất liệu và phong cách. Gợi ý dễ áp dụng từ Mushroomie.',
    secondaryKeywords: ['vòng tay handmade Đồng Nai', 'vòng tay custom Đồng Nai', 'chọn size vòng tay'],
    sections: [
      {
        heading: 'Bắt đầu từ cách bạn muốn đeo chiếc vòng',
        paragraphs: [
          'Một chiếc vòng đẹp trên ảnh chưa chắc là chiếc vòng bạn sẽ đeo thường xuyên. Trước khi chọn hạt hay charm, hãy nghĩ về hoàn cảnh sử dụng: đeo đi học mỗi ngày, phối cùng trang phục đi chơi, làm điểm nhấn khi chụp ảnh hay dành cho một dịp đặc biệt. Mục đích càng rõ, lựa chọn về màu sắc, độ nổi bật và chất liệu càng dễ.',
          'Với người thích phong cách tối giản, một đến hai màu chủ đạo và charm nhỏ thường dễ phối hơn. Nếu bạn thích vẻ vui nhộn, có thể kết hợp hạt chữ, hạt trong, charm hình và các màu tương phản. Điều quan trọng là chiếc vòng phản ánh thói quen thật của bạn, không phải cố chạy theo một mẫu đang phổ biến.',
        ],
      },
      {
        heading: 'Đo cổ tay đúng để vòng vừa và thoải mái',
        paragraphs: [
          'Dùng thước dây quấn sát quanh vị trí thường đeo vòng nhưng không siết chặt. Nếu không có thước dây, bạn có thể dùng một sợi chỉ, đánh dấu điểm giao rồi đo lại bằng thước thẳng. Khi gửi số đo cho người làm vòng, nên nói rõ đó là số đo sát tay hay kích thước chiếc vòng cũ bạn đang đeo.',
          'Vòng ôm tay hợp với thiết kế nhỏ gọn; vòng rộng hơn một chút tạo cảm giác thoải mái và có độ rơi. Người thường gõ máy tính, viết bài hoặc vận động nhiều nên tránh vòng quá rộng vì charm dễ va vào mặt bàn. Với vòng làm quà, hãy hỏi khéo size vòng cũ hoặc chọn kiểu có dây tăng chỉnh.',
        ],
        bullets: ['Đo tại đúng vị trí sẽ đeo vòng.', 'Không cộng thêm số đo nếu shop sẽ tự tính độ thoải mái.', 'Báo trước nếu bạn thích vòng ôm hoặc vòng rơi nhẹ.'],
      },
      {
        heading: 'Chọn màu theo tủ đồ thay vì chỉ theo màu da',
        paragraphs: [
          'Màu da là một tham khảo hữu ích, nhưng tủ đồ mới quyết định chiếc vòng có được sử dụng nhiều hay không. Hãy nhìn ba màu xuất hiện nhiều nhất trong quần áo, túi và giày của bạn. Một chiếc vòng có màu trung tính liên kết với các món đồ đó, cộng một màu nhấn yêu thích, thường dễ phối hơn một bảng màu quá nhiều sắc.',
          'Tông đỏ, hồng và vàng kem tạo cảm giác ấm áp; xanh lá, xanh dương và hạt trong mang vẻ mát, nhẹ. Đen, trắng hoặc bạc phù hợp phong cách gọn và cá tính. Nếu còn phân vân, hãy gửi ảnh trang phục thường mặc để Mushroomie gợi ý bảng màu thay vì chọn hoàn toàn theo tên màu trên màn hình.',
        ],
      },
      {
        heading: 'Charm nên kể một câu chuyện nhỏ',
        paragraphs: [
          'Charm đẹp nhất khi có lý do xuất hiện. Đó có thể là chữ cái tên, biểu tượng gợi một sở thích, màu đại diện cho nhóm bạn hoặc hình ảnh gắn với một kỷ niệm. Một charm chính và vài chi tiết hỗ trợ thường tạo điểm nhìn rõ hơn so với việc đặt quá nhiều charm nổi bật cạnh nhau.',
          'Bạn cũng nên cân nhắc trọng lượng và vị trí charm. Charm lớn đặt gần khóa hoặc điểm nối có thể khiến vòng xoay; charm kim loại cần được giữ khô để bền màu. Với vòng đeo hằng ngày, thiết kế nhẹ và ít cạnh sắc sẽ thuận tiện hơn.',
        ],
      },
      {
        heading: 'Kiểm tra chất lượng trước khi nhận vòng',
        paragraphs: [
          'Hãy kiểm tra độ chắc của nút dây, điểm nối, khóa và bề mặt hạt. Các chi tiết cần nằm đúng hướng, không có cạnh sắc gây cấn tay. Nếu là thiết kế custom, nên đối chiếu lại thứ tự chữ, màu và charm với bản đã chốt trước khi sử dụng.',
          'Vòng handmade có thể có khác biệt nhỏ giữa từng chiếc vì được phối tay. Sự khác biệt hợp lý tạo nên nét riêng, nhưng kích thước, nội dung chữ và các chi tiết đã thống nhất vẫn phải chính xác. Cất vòng riêng, tránh hóa chất và lau khô sau khi dính nước sẽ giúp sản phẩm bền hơn.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/vong-tay-handmade-dong-nai', label: 'Xem vòng tay handmade Đồng Nai' },
      { href: '/vong-tay-custom-dong-nai', label: 'Đặt vòng tay custom theo gu' },
      { href: '/san-pham?category=vong-tay', label: 'Khám phá các mẫu vòng tay' },
    ],
  },
  {
    title: 'Địa chỉ mua vòng tay custom Đồng Nai: cần kiểm tra điều gì?',
    slug: 'dia-chi-mua-vong-tay-custom-dong-nai',
    excerpt: 'Các tiêu chí giúp bạn chọn nơi làm vòng tay custom tại Đồng Nai: quy trình chốt mẫu, size, hình ảnh thật, chi phí và chính sách chỉnh sửa.',
    focusKeyword: 'địa chỉ mua vòng tay custom Đồng Nai',
    metaDescription: 'Tìm địa chỉ mua vòng tay custom Đồng Nai? Đây là checklist kiểm tra mẫu thật, size, quy trình chốt thiết kế và chính sách hỗ trợ.',
    secondaryKeywords: ['shop vòng tay handmade Đồng Nai', 'đặt vòng custom Đồng Nai', 'vòng tay theo yêu cầu'],
    sections: [
      {
        heading: 'Đừng chỉ nhìn vào số lượng mẫu có sẵn',
        paragraphs: [
          'Một nơi có nhiều mẫu chưa chắc phù hợp nếu bạn cần chiếc vòng mang dấu ấn riêng. Với vòng custom, điều đáng quan tâm hơn là khả năng lắng nghe yêu cầu và chuyển ý tưởng thành lựa chọn cụ thể về màu, hạt, charm, chữ và kích thước. Người tư vấn tốt sẽ giúp bạn thu hẹp lựa chọn thay vì chỉ gửi một danh sách dài.',
          'Hãy mô tả người đeo, phong cách, dịp sử dụng và ngân sách trước. Nếu làm quà, nói thêm mối quan hệ và điều bạn muốn gửi gắm. Những thông tin này giúp bản phối có chủ đề rõ ràng và hạn chế việc sửa đi sửa lại.',
        ],
      },
      {
        heading: 'Ưu tiên hình ảnh sản phẩm thật và thông tin rõ ràng',
        paragraphs: [
          'Ảnh thật cho thấy màu hạt, kích thước charm và độ hoàn thiện tốt hơn ảnh minh họa. Nên xem ảnh ở nhiều góc, ảnh đặt trên cổ tay hoặc cạnh vật quen thuộc để ước lượng tỷ lệ. Nếu màu thực tế có thể chênh do ánh sáng và màn hình, shop nên nói rõ ngay từ đầu.',
          'Thông tin về chất liệu dây, kiểu khóa, cách đo size và thời gian hoàn thiện cũng cần dễ hiểu. Với sản phẩm handmade, thời gian làm có thể thay đổi theo độ phức tạp; một mốc dự kiến thực tế đáng tin hơn lời hứa giao cực nhanh nhưng không có quy trình.',
        ],
        bullets: ['Ảnh thật của sản phẩm hoặc mẫu phối gần nhất.', 'Chi phí cơ bản và khoản phát sinh khi thêm charm.', 'Thời gian chốt mẫu, hoàn thiện và giao hàng.', 'Cách hỗ trợ nếu sai chữ, sai size hoặc thiếu chi tiết.'],
      },
      {
        heading: 'Quy trình chốt mẫu giúp bảo vệ cả hai bên',
        paragraphs: [
          'Một quy trình gọn thường gồm tiếp nhận ý tưởng, đề xuất bảng màu, xác nhận size, chốt danh sách charm và xác nhận tổng chi phí. Với thiết kế nhiều chữ hoặc biểu tượng, bản mô tả thứ tự hạt nên được lưu lại trong tin nhắn để hai bên cùng đối chiếu.',
          'Thay đổi trước khi bắt đầu làm thường đơn giản hơn thay đổi khi sản phẩm đã hoàn thiện. Vì vậy bạn nên kiểm tra chính tả tên, ngày, ký hiệu và địa chỉ nhận hàng ngay ở bước chốt. Nếu cần đúng dịp sinh nhật hoặc kỷ niệm, hãy đặt sớm để có khoảng đệm cho khâu chỉnh sửa và vận chuyển.',
        ],
      },
      {
        heading: 'Khoảng cách địa lý không phải tiêu chí duy nhất',
        paragraphs: [
          'Chọn nơi gần Đồng Nai thuận tiện khi cần trao đổi hoặc nhận hàng, nhưng chất lượng tư vấn và sự minh bạch vẫn quan trọng hơn vài kilomet khoảng cách. Một shop làm online tốt có thể xác nhận thiết kế bằng ảnh, cung cấp mã vận chuyển và hỗ trợ sau khi nhận sản phẩm.',
          'Mushroomie hoạt động tại Trảng Dài, Đồng Nai và nhận tư vấn qua website, mạng xã hội hoặc Shopee. Khách ở Biên Hòa và các khu vực lân cận có thể trao đổi mẫu từ xa; khách TP.HCM có thể đặt online và nhận hàng theo đơn vị vận chuyển.',
        ],
      },
      {
        heading: 'Checklist trước khi đặt vòng custom',
        paragraphs: [
          'Trước khi chuyển sang bước làm vòng, hãy xác nhận lại năm thông tin: size cổ tay, màu chủ đạo, charm chính, nội dung chữ và thời gian cần nhận. Giữ lại ảnh hoặc tin nhắn chốt mẫu để việc đối chiếu dễ dàng. Khi nhận hàng, quay video mở gói nếu đơn có nhiều chi tiết custom.',
          'Một chiếc vòng custom tốt không cần quá nhiều chi tiết. Nó cần đúng người, đúng câu chuyện và đủ thoải mái để được đeo thường xuyên. Đó cũng là tiêu chí hữu ích nhất để chọn nơi làm vòng.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/shop-phu-kien-handmade-dong-nai', label: 'Thông tin shop Mushroomie Đồng Nai' },
      { href: '/vong-tay-custom-dong-nai', label: 'Quy trình đặt vòng custom' },
      { href: '/lien-he', label: 'Gửi ý tưởng để được tư vấn' },
    ],
  },
  {
    title: 'Gợi ý quà tặng handmade Đồng Nai cho sinh nhật và dịp đặc biệt',
    slug: 'goi-y-qua-tang-handmade-dong-nai',
    excerpt: 'Gợi ý chọn quà handmade theo người nhận, ngân sách và dịp tặng, từ vòng tay, móc khóa đến set phụ kiện cá nhân hóa.',
    focusKeyword: 'gợi ý quà tặng handmade Đồng Nai',
    metaDescription: 'Gợi ý quà tặng handmade Đồng Nai cho sinh nhật, kỷ niệm và dịp đặc biệt: vòng tay, móc khóa, charm và set quà custom theo người nhận.',
    secondaryKeywords: ['quà sinh nhật handmade Đồng Nai', 'quà tặng cá nhân hóa Đồng Nai', 'set quà handmade'],
    sections: [
      {
        heading: 'Chọn quà từ câu chuyện của người nhận',
        paragraphs: [
          'Quà handmade có lợi thế ở khả năng gắn một chi tiết nhỏ với người nhận. Thay vì bắt đầu bằng câu hỏi món nào đang thịnh hành, hãy nhớ lại màu họ thường dùng, món đồ họ luôn mang theo, biểu tượng họ yêu thích hoặc một kỷ niệm chung. Chỉ một chữ cái, charm hoặc cặp màu đúng cũng đủ khiến món quà trở nên riêng.',
          'Nếu chưa biết rõ gu, hãy chọn nền màu dễ dùng rồi đặt điểm nhấn ở bao bì hoặc thiệp. Thiết kế quá cá tính có thể đẹp nhưng khó đeo; thiết kế cân bằng giữa sở thích của người nhận và tính ứng dụng thường tạo niềm vui lâu hơn.',
        ],
      },
      {
        heading: 'Vòng tay cho người thích mang kỷ niệm bên mình',
        paragraphs: [
          'Vòng tay phù hợp cho sinh nhật, kỷ niệm tình bạn, ngày đặc biệt của cặp đôi hoặc món quà động viên. Bạn có thể phối theo màu yêu thích, chữ cái tên, ngày đáng nhớ hoặc hai charm có liên quan. Với nhóm bạn, cùng một bảng màu nhưng thay đổi một chi tiết ở mỗi vòng sẽ vừa đồng bộ vừa giữ cá tính riêng.',
          'Khi đặt vòng làm quà, size là yếu tố cần lưu ý. Nếu không thể hỏi trực tiếp, kiểu dây tăng chỉnh hoặc vòng có khoảng điều chỉnh sẽ an toàn hơn. Đừng quên ghi rõ người nhận có thích phụ kiện nổi bật hay nhỏ gọn.',
        ],
      },
      {
        heading: 'Móc khóa và dây đeo cho món quà dễ sử dụng',
        paragraphs: [
          'Móc khóa thích hợp khi bạn không chắc người nhận có đeo trang sức hay không. Món quà có thể gắn vào balo, túi, chìa khóa hoặc hộp bút. Với học sinh, sinh viên và người thường mang túi, đây là lựa chọn thực tế nhưng vẫn có nhiều không gian để cá nhân hóa.',
          'Dây đeo điện thoại và charm nhỏ cũng dễ phối theo chủ đề. Nên chú ý trọng lượng tổng thể, độ chắc của móc nối và các cạnh charm. Thiết kế nhẹ sẽ thuận tiện hơn khi sử dụng mỗi ngày.',
        ],
      },
      {
        heading: 'Set quà giúp nhiều chi tiết trở thành một câu chuyện',
        paragraphs: [
          'Một set nhỏ có thể gồm vòng tay, móc khóa, thiệp và hộp quà. Không cần món nào cũng cầu kỳ; chỉ cần cùng bảng màu hoặc cùng chủ đề. Ví dụ, set dành cho người thích màu xanh có thể dùng vòng hạt xanh nhạt, charm mây và thiệp trắng, thay vì ghép nhiều món không liên quan.',
          'Hãy ưu tiên hai hoặc ba chi tiết có mục đích rõ ràng. Phần ngân sách còn lại nên dành cho hộp, lớp bảo vệ và vận chuyển. Cảm giác khi mở quà là một phần của trải nghiệm, nhưng bao bì không nên lấn át sản phẩm bên trong.',
        ],
        bullets: ['Sinh nhật: màu yêu thích và chữ cái tên.', 'Kỷ niệm: charm gợi ngày hoặc địa điểm chung.', 'Bạn thân: set đồng bộ với chi tiết riêng.', 'Quà động viên: thông điệp ngắn, màu nhẹ và dễ dùng.'],
      },
      {
        heading: 'Đặt quà ở Đồng Nai cần chuẩn bị gì?',
        paragraphs: [
          'Nên đặt trước ngày tặng đủ thời gian để chốt mẫu, làm thủ công và giao hàng. Gửi đầy đủ ngày cần nhận, khu vực nhận, ngân sách và ý tưởng ngay từ đầu. Với dịp cao điểm, khoảng đệm vài ngày giúp bạn chủ động hơn nếu cần chỉnh size hoặc thay đổi bao bì.',
          'Mushroomie nhận làm phụ kiện handmade tại Đồng Nai và hỗ trợ đặt online. Bạn có thể bắt đầu bằng vài thông tin đơn giản về người nhận; phần phối màu, charm và cấu trúc set sẽ được gợi ý dựa trên nhu cầu thực tế.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/qua-tang-handmade-dong-nai', label: 'Xem quà tặng handmade Đồng Nai' },
      { href: '/qua-tang-ca-nhan-hoa-dong-nai', label: 'Gợi ý quà cá nhân hóa' },
      { href: '/lien-he', label: 'Tư vấn set quà theo dịp' },
    ],
  },
  {
    title: 'Vòng tay handmade làm quà sinh nhật ở Đồng Nai: chọn sao cho có ý nghĩa?',
    slug: 'vong-tay-handmade-lam-qua-sinh-nhat-dong-nai',
    excerpt: 'Cách biến một chiếc vòng tay handmade thành quà sinh nhật có ý nghĩa bằng màu sắc, charm, size và thông điệp phù hợp.',
    focusKeyword: 'vòng tay handmade làm quà sinh nhật Đồng Nai',
    metaDescription: 'Chọn vòng tay handmade làm quà sinh nhật ở Đồng Nai theo màu, charm, size và câu chuyện của người nhận. Có checklist đặt quà.',
    secondaryKeywords: ['quà sinh nhật handmade Đồng Nai', 'vòng tay quà tặng', 'vòng tay cá nhân hóa'],
    sections: [
      {
        heading: 'Vì sao vòng tay hợp làm quà sinh nhật?',
        paragraphs: [
          'Vòng tay là món quà nhỏ, dễ mang theo và có thể xuất hiện trong cuộc sống hằng ngày của người nhận. So với một món trang trí chỉ đặt ở một chỗ, chiếc vòng có cơ hội đồng hành khi đi học, đi làm hoặc gặp bạn bè. Giá trị của nó nằm ở dấu hiệu nhận ra: màu quen thuộc, một chữ cái hay charm gợi kỷ niệm.',
          'Handmade không tự động đồng nghĩa với ý nghĩa. Món quà chỉ thật sự riêng khi các lựa chọn được kết nối với người nhận. Vì vậy, vài thông tin đúng thường giá trị hơn việc thêm thật nhiều hạt và charm.',
        ],
      },
      {
        heading: 'Ba cách xây chủ đề cho chiếc vòng',
        paragraphs: [
          'Cách đầu tiên là dựa trên màu sắc: chọn màu người nhận thường mặc và một màu nhấn. Cách thứ hai là dựa trên biểu tượng: hoa, ngôi sao, chữ cái, trái tim hoặc hình liên quan đến sở thích. Cách thứ ba là dựa trên kỷ niệm: phối hai màu đại diện cho hai người, thêm ký hiệu hoặc con số có ý nghĩa.',
          'Chỉ nên chọn một chủ đề chính. Khi màu, chữ và charm cùng kể một câu chuyện, chiếc vòng trông hài hòa hơn. Nếu có nhiều ý tưởng, hãy ưu tiên chi tiết người nhận dễ nhận ra nhất.',
        ],
        bullets: ['Chủ đề màu: dễ đeo và ít rủi ro.', 'Chủ đề biểu tượng: tạo điểm nhấn rõ.', 'Chủ đề kỷ niệm: riêng tư và giàu cảm xúc.'],
      },
      {
        heading: 'Chọn size khi muốn giữ bí mật',
        paragraphs: [
          'Size là phần khó nhất khi tặng bất ngờ. Bạn có thể mượn một chiếc vòng người nhận đang đeo để đo, hỏi bạn thân của họ hoặc chọn thiết kế tăng chỉnh. Không nên ước lượng hoàn toàn bằng chiều cao hay vóc dáng vì kích thước cổ tay khác nhau khá nhiều.',
          'Nếu dùng số đo của vòng cũ, hãy nói rõ đó là chiều dài toàn vòng hay chu vi bên trong. Một người làm vòng có kinh nghiệm sẽ giúp quy đổi và cộng độ thoải mái phù hợp với kiểu hạt.',
        ],
      },
      {
        heading: 'Thiệp và cách trao quà làm tăng ý nghĩa',
        paragraphs: [
          'Một câu ngắn viết riêng thường đáng nhớ hơn lời chúc dài lấy từ mẫu. Bạn có thể giải thích vì sao chọn màu hoặc charm đó, nhắc lại một khoảnh khắc chung hoặc đơn giản nói điều bạn trân trọng ở người nhận. Thiệp giúp họ hiểu câu chuyện nếu thiết kế sử dụng ký hiệu kín đáo.',
          'Khi đóng gói, giữ vòng cố định để hạt và charm không va đập. Nếu gửi đi xa, nên dùng thêm lớp bảo vệ bên ngoài hộp quà. Với người nhận ở Đồng Nai, hãy tính cả thời gian hoàn thiện và giao nội tỉnh thay vì chỉ nhìn ngày đặt.',
        ],
      },
      {
        heading: 'Checklist đặt vòng sinh nhật',
        paragraphs: [
          'Chuẩn bị trước tên hoặc chữ cái, màu yêu thích, size dự kiến, ngày cần nhận và ngân sách. Nếu có ảnh phong cách hoặc trang phục của người nhận, gửi kèm để việc phối màu chính xác hơn. Xác nhận lại chính tả và thứ tự ký tự trước khi làm.',
          'Mushroomie có thể tư vấn vòng tay handmade và set quà tại Đồng Nai dựa trên những thông tin đó. Bạn không cần nghĩ sẵn toàn bộ thiết kế; chỉ cần bắt đầu từ câu chuyện muốn gửi gắm.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/vong-tay-handmade-dong-nai', label: 'Mẫu vòng tay handmade Đồng Nai' },
      { href: '/qua-tang-handmade-dong-nai', label: 'Xem thêm gợi ý quà handmade' },
      { href: '/lien-he', label: 'Đặt vòng làm quà sinh nhật' },
    ],
  },
  {
    title: 'Móc khóa handmade làm quà tặng ở Đồng Nai: cute, gọn và dễ custom',
    slug: 'moc-khoa-handmade-lam-qua-tang-dong-nai',
    excerpt: 'Gợi ý chọn móc khóa handmade theo đồ dùng, phong cách, độ bền và câu chuyện người nhận để món quà nhỏ vẫn có dấu ấn riêng.',
    focusKeyword: 'móc khóa handmade làm quà tặng Đồng Nai',
    metaDescription: 'Gợi ý móc khóa handmade làm quà tặng ở Đồng Nai: chọn kiểu móc, charm, màu sắc, độ bền và cách custom phù hợp người nhận.',
    secondaryKeywords: ['móc khóa handmade Đồng Nai', 'quà tặng nhỏ handmade', 'móc khóa custom'],
    sections: [
      {
        heading: 'Món quà nhỏ nhưng có nhiều cơ hội được sử dụng',
        paragraphs: [
          'Móc khóa không yêu cầu size và không phụ thuộc việc người nhận có đeo trang sức hay không. Nó có thể đi cùng chìa khóa, balo, túi xách, hộp bút hoặc điện thoại. Nhờ vậy, đây là lựa chọn an toàn cho bạn bè, đồng nghiệp, học sinh và sinh viên.',
          'Để món quà không trở nên chung chung, hãy chọn vị trí sử dụng trước. Móc cho chùm chìa khóa cần gọn và chắc; móc trang trí balo có thể nổi bật hơn; dây điện thoại cần nhẹ và có điểm nối phù hợp.',
        ],
      },
      {
        heading: 'Chọn loại móc theo vật sẽ gắn',
        paragraphs: [
          'Khoen tròn quen thuộc phù hợp với chìa khóa và các vật có lỗ gắn nhỏ. Móc càng cua dễ tháo lắp trên túi hoặc balo. Dây loop dùng cho điện thoại và máy ảnh nhỏ cần được kiểm tra độ chắc ở phần dây nối. Việc chọn đúng phần cứng quan trọng không kém màu hạt.',
          'Nếu người nhận thường di chuyển, tránh thiết kế quá dài hoặc có nhiều cạnh dễ vướng. Một cụm hạt gọn với một charm chính thường bền và tiện hơn chuỗi trang trí lớn.',
        ],
      },
      {
        heading: 'Custom bằng màu, chữ và biểu tượng',
        paragraphs: [
          'Màu có thể lấy từ balo, đội nhóm, nhân vật yêu thích hoặc tông người nhận thường dùng. Hạt chữ phù hợp để thêm tên ngắn, biệt danh hoặc ký hiệu. Với tên dài, có thể dùng chữ cái đầu để thiết kế không bị nặng.',
          'Charm nên liên quan đến sở thích hoặc câu chuyện, chẳng hạn ngôi sao cho người thích bầu trời, nốt nhạc cho người yêu âm nhạc hoặc biểu tượng nhỏ của hai người. Không cần giải thích quá trực tiếp; một chi tiết gợi nhớ đã đủ tạo cảm giác riêng.',
        ],
        bullets: ['Balo: màu nổi vừa phải, móc dễ tháo.', 'Chìa khóa: thiết kế gọn, khoen chắc.', 'Điện thoại: nhẹ, dây nối được kiểm tra.', 'Set nhóm: cùng chủ đề, thay đổi màu hoặc chữ.'],
      },
      {
        heading: 'Kiểm tra độ bền và sự an toàn',
        paragraphs: [
          'Kéo nhẹ từng điểm nối để kiểm tra; khoen không nên có khe hở rõ, dây không bị xước và hạt không có cạnh sắc. Nếu dùng charm kim loại, tránh để sản phẩm tiếp xúc lâu với nước hoa, chất tẩy hoặc nước biển. Móc khóa trên balo cũng nên được tháo khi giặt.',
          'Sản phẩm dành cho trẻ nhỏ cần đặc biệt thận trọng vì có chi tiết nhỏ. Móc khóa handmade phù hợp hơn với người đã có ý thức bảo quản và không nên được xem là đồ chơi.',
        ],
      },
      {
        heading: 'Gửi quà từ Đồng Nai sao cho chỉn chu',
        paragraphs: [
          'Một túi nhỏ, tấm thiệp và lớp chống va đập là đủ cho phần lớn móc khóa. Nếu gửi cùng nhiều món, cố định từng sản phẩm để charm không cọ xát. Ghi rõ tên người nhận và lời nhắn giúp trải nghiệm mở gói cá nhân hơn.',
          'Mushroomie nhận phối móc khóa handmade tại Đồng Nai theo màu, chữ và charm. Khi liên hệ, hãy nói vật sẽ gắn, phong cách người nhận và ngày cần có để được gợi ý cấu trúc phù hợp.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/moc-khoa-handmade-dong-nai', label: 'Xem móc khóa handmade Đồng Nai' },
      { href: '/moc-khoa-handmade-theo-yeu-cau-dong-nai', label: 'Đặt móc khóa theo yêu cầu' },
      { href: '/lien-he', label: 'Gửi ý tưởng món quà' },
    ],
  },
  {
    title: 'Phụ kiện handmade cho Gen Z Đồng Nai: nhỏ xinh nhưng có gu riêng',
    slug: 'phu-kien-handmade-cho-gen-z-dong-nai',
    excerpt: 'Cách Gen Z chọn vòng tay, charm, móc khóa và dây đeo handmade để thể hiện cá tính mà vẫn dễ phối, dễ dùng và đúng ngân sách.',
    focusKeyword: 'phụ kiện handmade cho Gen Z Đồng Nai',
    metaDescription: 'Khám phá phụ kiện handmade cho Gen Z Đồng Nai: vòng tay, charm, móc khóa và dây đeo custom theo mood, dễ phối và có gu riêng.',
    secondaryKeywords: ['phụ kiện handmade Đồng Nai', 'phụ kiện Gen Z', 'đồ handmade cá nhân hóa'],
    sections: [
      {
        heading: 'Phụ kiện như một cách kể mình là ai',
        paragraphs: [
          'Gen Z thường không cần một món phụ kiện thật đắt để tạo dấu ấn. Một bảng màu, chữ cái hoặc charm đúng sở thích có thể khiến balo, điện thoại và trang phục trở nên gần với cá tính hơn. Handmade phù hợp vì mỗi chi tiết có thể được điều chỉnh, thay vì buộc người dùng chọn nguyên một mẫu cố định.',
          'Tuy nhiên, cá nhân hóa không có nghĩa là thêm mọi thứ mình thích vào cùng một món. Thiết kế có một chủ đề rõ ràng thường dễ nhận diện và dễ sử dụng hơn.',
        ],
      },
      {
        heading: 'Chọn phụ kiện theo nhịp sống hằng ngày',
        paragraphs: [
          'Người đi học có thể ưu tiên vòng nhẹ, móc khóa gọn và dây đeo không vướng. Người thích chụp ảnh có thể chọn chi tiết nổi bật hơn để tạo điểm nhấn. Nếu thường xuyên dùng máy tính, vòng quá nhiều charm rơi sẽ gây bất tiện; khi đó móc khóa hoặc charm cho túi là lựa chọn hợp lý.',
          'Hãy quan sát món đồ bạn luôn mang theo. Tùy thói quen, phụ kiện nên bổ sung cho điện thoại, balo, túi hoặc cổ tay chứ không cần xuất hiện ở mọi nơi.',
        ],
      },
      {
        heading: 'Bảng màu theo mood nhưng vẫn dễ phối',
        paragraphs: [
          'Pastel tạo cảm giác nhẹ, vui; tông đỏ và đen mạnh hơn; xanh lá và màu trong gợi vẻ tươi; nâu, kem và vàng cho cảm giác ấm. Một công thức dễ áp dụng là dùng hai màu nền gần nhau và một màu nhấn. Cách này cho phép thể hiện mood mà không làm thiết kế rối.',
          'Nếu muốn theo trend, hãy đưa trend vào một chi tiết có thể thay đổi như charm hoặc màu nhấn. Phần nền giữ trung tính sẽ giúp phụ kiện không nhanh lỗi thời.',
        ],
        bullets: ['Cute: pastel, hạt trong, charm nhỏ.', 'Cá tính: đen, đỏ, kim loại và tương phản.', 'Tối giản: một màu nền, một điểm nhấn.', 'Hoài cổ: hạt chữ, màu kẹo và biểu tượng quen thuộc.'],
      },
      {
        heading: 'Custom nhóm mà không biến mọi người thành bản sao',
        paragraphs: [
          'Vòng nhóm hoặc móc khóa nhóm nên có một mã chung, chẳng hạn một charm, một màu hoặc một kiểu chữ. Mỗi người sau đó chọn màu phụ, chữ cái hoặc thứ tự hạt riêng. Kết quả vẫn nhận ra là một set nhưng không mất cá tính cá nhân.',
          'Trước khi đặt, nhóm nên thống nhất ngân sách và ngày cần nhận. Một người tổng hợp size, tên và màu sẽ giảm sai sót hơn việc gửi nhiều tin nhắn rời rạc.',
        ],
      },
      {
        heading: 'Mua có gu cũng là mua có cân nhắc',
        paragraphs: [
          'Hãy hỏi về chất liệu, cách bảo quản và khả năng sửa hoặc thay dây. Phụ kiện được dùng lâu sẽ có ý nghĩa hơn món mua theo cảm hứng rồi bỏ quên. Chọn số lượng vừa đủ và ưu tiên thiết kế hợp nhiều trang phục cũng là một cách tiêu dùng có trách nhiệm.',
          'Mushroomie làm phụ kiện handmade tại Đồng Nai với định hướng cá nhân hóa. Bạn có thể gửi moodboard, ảnh màu hoặc vài từ mô tả phong cách để bắt đầu một bản phối thực tế, không cần dùng thuật ngữ thiết kế.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/phu-kien-handmade-dong-nai', label: 'Khám phá phụ kiện handmade Đồng Nai' },
      { href: '/san-pham', label: 'Xem sản phẩm đang có' },
      { href: '/lien-he', label: 'Tư vấn phối phụ kiện theo mood' },
    ],
  },
  {
    title: 'Vòng tay bạn thân handmade ở Biên Hòa: cách phối set lưu giữ kỷ niệm',
    slug: 'vong-tay-ban-than-handmade-o-bien-hoa',
    excerpt: 'Gợi ý phối vòng tay bạn thân theo màu chung, ký hiệu riêng, size và ngân sách để set vòng đồng điệu nhưng vẫn đúng cá tính mỗi người.',
    focusKeyword: 'vòng tay bạn thân handmade ở Biên Hòa',
    metaDescription: 'Gợi ý vòng tay bạn thân handmade ở Biên Hòa: phối màu chung, charm riêng, chọn size và đặt set nhóm để lưu giữ kỷ niệm cùng nhau.',
    secondaryKeywords: ['vòng tay handmade Biên Hòa', 'vòng tay bạn thân', 'set vòng custom'],
    sections: [
      {
        heading: 'Một set đẹp cần điểm chung và khoảng riêng',
        paragraphs: [
          'Vòng tay bạn thân không nhất thiết phải giống hệt nhau. Cảm giác gắn kết có thể đến từ một charm chung, một màu lặp lại hoặc cùng kiểu chữ. Phần còn lại nên phản ánh cá tính từng người để mỗi chiếc vòng vẫn được đeo thường xuyên.',
          'Hãy chọn một yếu tố đại diện cho câu chuyện của nhóm trước, sau đó cho từng thành viên chọn màu phụ hoặc ký hiệu. Cách phối này linh hoạt hơn việc buộc mọi người dùng chung một bảng màu.',
        ],
      },
      {
        heading: 'Bốn ý tưởng tạo mã chung cho nhóm',
        paragraphs: [
          'Nhóm có thể dùng chữ cái đầu của tên nhóm, một charm liên quan đến nơi gặp nhau, một màu đại diện cho kỷ niệm hoặc các biểu tượng ghép thành bộ. Với nhóm đông, số thứ tự hoặc màu riêng giúp phân biệt vòng khi đóng gói.',
          'Đừng chọn ký hiệu quá phức tạp nếu kích thước charm nhỏ. Một biểu tượng đơn giản nhưng cả nhóm hiểu thường tạo cảm xúc mạnh hơn chi tiết cầu kỳ.',
        ],
        bullets: ['Một charm chung, màu phụ khác nhau.', 'Cùng bảng màu, chữ cái theo tên.', 'Các charm tạo thành một bộ chủ đề.', 'Cùng kiểu dây, mỗi người chọn cách sắp hạt.'],
      },
      {
        heading: 'Thu thập size mà không làm mất bất ngờ',
        paragraphs: [
          'Nếu cả nhóm cùng đặt, hãy dùng một biểu mẫu đơn giản ghi tên, số đo sát cổ tay, màu thích và chữ muốn thêm. Nếu tặng bất ngờ, có thể chọn dây tăng chỉnh hoặc mượn vòng cũ để đo. Không nên dùng một size cho tất cả.',
          'Người tổng hợp đơn cần kiểm tra lại chính tả và ghép đúng màu với đúng tên. Một bảng nhỏ trước khi chốt giúp tránh nhầm khi set có nhiều vòng gần giống nhau.',
        ],
      },
      {
        heading: 'Chọn thời điểm tặng và cách đóng gói',
        paragraphs: [
          'Set vòng hợp sinh nhật, ngày tốt nghiệp, kỷ niệm quen nhau hoặc buổi gặp lại. Có thể đặt từng vòng trong túi riêng rồi ghép vào một hộp chung, hoặc tặng đồng thời để mọi người cùng mở. Một tấm thiệp ghi câu chuyện của charm chung sẽ làm ý tưởng dễ hiểu hơn.',
          'Nếu các thành viên ở nhiều nơi, nên kiểm tra địa chỉ và phương án giao trước. Với Biên Hòa và khu vực lân cận Đồng Nai, tính thêm thời gian làm thủ công thay vì chỉ dựa vào thời gian vận chuyển.',
        ],
      },
      {
        heading: 'Giữ set vòng bền sau khi sử dụng',
        paragraphs: [
          'Mỗi người nên tháo vòng khi tắm, bơi hoặc tiếp xúc hóa chất. Cất riêng để charm không va vào nhau và kiểm tra dây định kỳ nếu đeo thường xuyên. Khi một vòng cần sửa, giữ lại ảnh bản phối ban đầu để khôi phục đúng thứ tự.',
          'Mushroomie nhận phối set vòng bạn thân phục vụ Biên Hòa từ xưởng tại Trảng Dài, Đồng Nai. Nhóm có thể gửi danh sách màu, chữ và size để được sắp thành một bản phối thống nhất.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/vong-tay-custom-bien-hoa', label: 'Đặt vòng tay custom Biên Hòa' },
      { href: '/vong-tay-cap-doi-dong-nai', label: 'Xem gợi ý vòng đôi và bạn thân' },
      { href: '/lien-he', label: 'Gửi danh sách đặt set nhóm' },
    ],
  },
  {
    title: 'Phụ kiện handmade cá nhân hóa Đồng Nai: từ từng hạt nhỏ tạo phong cách riêng',
    slug: 'phu-kien-handmade-ca-nhan-hoa-dong-nai',
    excerpt: 'Tìm hiểu cá nhân hóa phụ kiện là gì, cách chọn chi tiết có ý nghĩa và quy trình biến ý tưởng thành vòng tay, móc khóa hoặc set quà.',
    focusKeyword: 'phụ kiện handmade cá nhân hóa Đồng Nai',
    metaDescription: 'Phụ kiện handmade cá nhân hóa Đồng Nai được tạo thế nào? Tìm hiểu cách chọn màu, hạt, charm và quy trình làm riêng tại Mushroomie.',
    secondaryKeywords: ['phụ kiện custom Đồng Nai', 'đồ handmade cá nhân hóa', 'vòng tay móc khóa custom'],
    sections: [
      {
        heading: 'Cá nhân hóa không chỉ là thêm tên',
        paragraphs: [
          'Tên và chữ cái là cách dễ nhận biết, nhưng một món phụ kiện có thể mang dấu ấn riêng bằng màu, nhịp sắp hạt, chất liệu, biểu tượng và cách sử dụng. Một thiết kế không có chữ vẫn có thể rất cá nhân nếu bảng màu gắn với người đeo hoặc charm nhắc đến một câu chuyện cụ thể.',
          'Cá nhân hóa tốt bắt đầu từ việc hiểu người dùng, không phải từ số lượng tùy chọn. Mỗi chi tiết cần có vai trò trong tổng thể và không làm sản phẩm khó sử dụng.',
        ],
      },
      {
        heading: 'Từ ý tưởng cảm xúc đến yêu cầu có thể làm được',
        paragraphs: [
          'Bạn có thể bắt đầu bằng những từ như nhẹ nhàng, vui, cá tính, hoài cổ hoặc ấm áp. Người làm phụ kiện sẽ chuyển chúng thành bảng màu, loại hạt và charm. Ảnh trang phục, góc bàn học hoặc món đồ yêu thích cũng là dữ liệu trực quan hữu ích.',
          'Sau đó cần xác định giới hạn thực tế: kích thước, trọng lượng, ngân sách và ngày cần nhận. Một ý tưởng đẹp nhưng quá nhiều charm có thể nặng; tên quá dài có thể làm vòng mất cân đối. Điều chỉnh ở bước này giúp sản phẩm cuối vừa đẹp vừa dùng được.',
        ],
      },
      {
        heading: 'Mỗi loại phụ kiện có cách cá nhân hóa khác nhau',
        paragraphs: [
          'Vòng tay nhạy với size và cảm giác khi đeo, nên màu và charm cần đi cùng độ thoải mái. Móc khóa có nhiều không gian hơn nhưng phải chú ý độ chắc. Dây đeo điện thoại cần nhẹ; vòng cổ cần cân nhắc độ dài và vị trí charm. Set quà cần một chủ đề liên kết các món.',
          'Vì vậy, không nên lấy nguyên bản phối của vòng tay để áp sang móc khóa. Cùng một câu chuyện có thể được diễn giải khác nhau tùy chức năng sản phẩm.',
        ],
        bullets: ['Vòng tay: size, nhịp hạt và cảm giác đeo.', 'Móc khóa: điểm nối, độ dài và vật sẽ gắn.', 'Dây đeo: trọng lượng và độ chắc.', 'Set quà: chủ đề chung và trải nghiệm mở hộp.'],
      },
      {
        heading: 'Vai trò của trao đổi và chốt mẫu',
        paragraphs: [
          'Trao đổi rõ giúp tránh khoảng cách giữa hình dung và sản phẩm thật. Hãy thống nhất màu gần đúng, loại chữ, số lượng charm, size và tổng chi phí. Với chi tiết quan trọng, nên có mô tả hoặc ảnh tham khảo trong tin nhắn.',
          'Handmade có sai khác nhỏ do hạt và thao tác thủ công, nhưng các thông tin đã chốt vẫn phải được giữ. Khi nhận hàng, hãy kiểm tra những điểm đó trước và phản hồi sớm nếu có vấn đề.',
        ],
      },
      {
        heading: 'Giá trị lâu dài nằm ở khả năng sử dụng',
        paragraphs: [
          'Một món custom thành công không chỉ gây bất ngờ lúc mở hộp. Nó cần hợp trang phục, thói quen và môi trường sử dụng. Thiết kế có thể tháo charm, thay dây hoặc điều chỉnh size sẽ kéo dài vòng đời sản phẩm và giảm việc mua mới không cần thiết.',
          'Mushroomie thực hiện phụ kiện handmade cá nhân hóa tại Đồng Nai theo tinh thần “Từ từng hạt nhỏ, tạo phong cách riêng”. Bạn có thể mang đến một ý tưởng chưa hoàn chỉnh; quá trình tư vấn sẽ giúp biến nó thành lựa chọn cụ thể.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/phu-kien-handmade-dong-nai', label: 'Phụ kiện handmade Đồng Nai' },
      { href: '/moc-khoa-handmade-theo-yeu-cau-dong-nai', label: 'Móc khóa làm theo yêu cầu' },
      { href: '/lien-he', label: 'Bắt đầu một thiết kế riêng' },
    ],
  },
  {
    title: 'Quà tặng cho sinh viên Đồng Nai: chọn phụ kiện handmade dễ thương và hữu ích',
    slug: 'shop-qua-tang-cho-sinh-vien-dong-nai',
    excerpt: 'Gợi ý quà cho sinh viên theo ngân sách và thói quen sử dụng: vòng tay, móc khóa, dây đeo và set handmade có thể cá nhân hóa.',
    focusKeyword: 'quà tặng cho sinh viên Đồng Nai',
    metaDescription: 'Gợi ý quà tặng cho sinh viên Đồng Nai: vòng tay, móc khóa, dây đeo và set phụ kiện handmade dễ dùng, có thể custom theo ngân sách.',
    secondaryKeywords: ['quà handmade cho sinh viên Đồng Nai', 'quà sinh nhật sinh viên', 'phụ kiện handmade giá dễ tiếp cận'],
    sections: [
      {
        heading: 'Quà cho sinh viên nên gần với cuộc sống hằng ngày',
        paragraphs: [
          'Lịch học, di chuyển và hoạt động nhóm khiến sinh viên thường ưu tiên món nhỏ, nhẹ và dễ dùng. Một món quà xuất hiện trên balo, điện thoại hoặc cổ tay có cơ hội được sử dụng nhiều hơn đồ trang trí cồng kềnh. Giá trị nằm ở sự phù hợp, không nhất thiết ở kích thước hay giá cao.',
          'Trước khi chọn, hãy nhớ người nhận thường mang gì và có phong cách ra sao. Người tối giản thích màu trung tính; người thích chụp ảnh có thể muốn điểm nhấn nổi; người vận động nhiều cần phụ kiện gọn và chắc.',
        ],
      },
      {
        heading: 'Vòng tay: lựa chọn giàu cảm xúc',
        paragraphs: [
          'Vòng tay hợp với quà sinh nhật, tốt nghiệp, kỷ niệm câu lạc bộ hoặc tình bạn. Có thể thêm chữ cái, màu khoa, màu nhóm hoặc charm liên quan đến sở thích. Thiết kế nên nhẹ để không cản trở khi viết và dùng máy tính.',
          'Nếu không biết size, ưu tiên dây tăng chỉnh hoặc hỏi người thân. Đừng đoán size bằng cân nặng; một sai lệch nhỏ cũng ảnh hưởng cảm giác đeo.',
        ],
      },
      {
        heading: 'Móc khóa và dây đeo: thực tế, dễ tặng',
        paragraphs: [
          'Móc khóa có thể gắn vào balo, chìa khóa phòng, hộp bút hoặc túi đựng laptop. Dây đeo điện thoại phù hợp người thường chụp ảnh hoặc di chuyển. Hai lựa chọn này không cần size nên thuận tiện cho quà bất ngờ và set tặng nhiều người.',
          'Nên giữ thiết kế gọn, kiểm tra điểm nối và chọn charm không quá nặng. Nếu gắn chữ, biệt danh ngắn hoặc chữ cái đầu thường cân đối hơn tên dài.',
        ],
        bullets: ['Ngân sách nhỏ: charm hoặc móc khóa đơn.', 'Ngân sách vừa: vòng tay custom hoặc dây đeo.', 'Tặng nhóm: set cùng chủ đề, khác màu.', 'Dịp đặc biệt: phụ kiện, thiệp và hộp quà.'],
      },
      {
        heading: 'Cách kiểm soát ngân sách mà quà vẫn riêng',
        paragraphs: [
          'Hãy chốt mức ngân sách trước khi chọn charm. Dùng một charm chính, hạt màu và chữ cái có thể tạo dấu ấn mà không cần quá nhiều chi tiết. Đầu tư vào sự liên quan của thiết kế thường hiệu quả hơn tăng số lượng món.',
          'Nếu làm set, một món chính và một thiệp riêng đã đủ. Bao bì nên bảo vệ sản phẩm, gọn để mang theo và không làm chi phí tăng không cần thiết.',
        ],
      },
      {
        heading: 'Đặt quà handmade tại Đồng Nai',
        paragraphs: [
          'Chuẩn bị ngày cần nhận, khu vực giao, phong cách, màu thích và ngân sách. Với đơn nhóm hoặc dịp tốt nghiệp, đặt sớm để có thời gian tổng hợp tên, size và kiểm tra từng món. Một bảng danh sách rõ sẽ hạn chế nhầm lẫn.',
          'Mushroomie nhận phối phụ kiện handmade tại Trảng Dài, Đồng Nai và giao đến Biên Hòa cùng các khu vực khác. Bạn có thể gửi vài thông tin về người nhận để được đề xuất món phù hợp thay vì phải chọn từ đầu. Khi đặt cho nhiều người, hãy tách rõ tên, màu và lời nhắn của từng món để khâu kiểm tra cuối không bị nhầm.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/qua-tang-ca-nhan-hoa-dong-nai', label: 'Quà cá nhân hóa tại Đồng Nai' },
      { href: '/san-pham', label: 'Xem phụ kiện trong ngân sách' },
      { href: '/lien-he', label: 'Tư vấn quà cho sinh viên' },
    ],
  },
  {
    title: 'Vì sao nên chọn phụ kiện handmade cá nhân hóa?',
    slug: 'vi-sao-nen-chon-phu-kien-handmade-ca-nhan-hoa',
    excerpt: 'Những giá trị thực tế của phụ kiện handmade cá nhân hóa: phù hợp người dùng, minh bạch quy trình, dễ sửa đổi và mang câu chuyện riêng.',
    focusKeyword: 'vì sao nên chọn phụ kiện handmade cá nhân hóa',
    metaDescription: 'Vì sao nên chọn phụ kiện handmade cá nhân hóa? Tìm hiểu giá trị về trải nghiệm, tính ứng dụng, câu chuyện và cách đặt sản phẩm phù hợp.',
    secondaryKeywords: ['phụ kiện handmade cá nhân hóa', 'đồ handmade custom', 'quà tặng có ý nghĩa'],
    sections: [
      {
        heading: 'Khác biệt quan trọng nhất là sự phù hợp',
        paragraphs: [
          'Sản phẩm làm sẵn được thiết kế cho số đông, còn phụ kiện cá nhân hóa bắt đầu từ người sẽ sử dụng. Màu, kích thước, charm và cách sắp hạt có thể điều chỉnh theo phong cách và thói quen. Sự phù hợp này làm tăng khả năng món đồ được dùng lâu thay vì chỉ đẹp trong ảnh.',
          'Tuy nhiên, custom không đồng nghĩa với thêm thật nhiều chi tiết. Một thay đổi nhỏ nhưng đúng nhu cầu, chẳng hạn size vừa tay hoặc màu dễ phối, thường có giá trị hơn thiết kế quá cầu kỳ.',
        ],
      },
      {
        heading: 'Quy trình tạo ra trải nghiệm cùng tham gia',
        paragraphs: [
          'Người mua không chỉ chọn sản phẩm cuối mà còn tham gia vào quá trình: mô tả ý tưởng, xem bảng màu, chọn charm và xác nhận bản phối. Với quà tặng, quá trình này giúp người tặng suy nghĩ kỹ hơn về người nhận và câu chuyện muốn gửi.',
          'Trao đổi cũng làm rõ giới hạn vật liệu, thời gian và ngân sách. Một người làm handmade có trách nhiệm sẽ nói khi ý tưởng quá nặng, khó bền hoặc không cân đối và đề xuất phương án thay thế.',
        ],
      },
      {
        heading: 'Mỗi sản phẩm có sai khác nhỏ nhưng không tùy tiện',
        paragraphs: [
          'Làm tay tạo ra khác biệt nhẹ về vị trí hạt hoặc sắc độ vật liệu. Đây là đặc điểm tự nhiên, không phải lý do để bỏ qua chất lượng. Size, chữ, charm và cấu trúc đã chốt vẫn cần chính xác; điểm nối phải chắc và bề mặt an toàn khi sử dụng.',
          'Người mua nên phân biệt nét riêng của thủ công với lỗi chức năng. Việc có ảnh chốt mẫu và thông tin rõ giúp hai bên cùng kiểm tra công bằng.',
        ],
      },
      {
        heading: 'Khả năng sửa và làm mới kéo dài vòng đời',
        paragraphs: [
          'Nhiều phụ kiện có thể thay dây, đổi charm hoặc điều chỉnh size. Khi phong cách thay đổi, bạn không nhất thiết bỏ toàn bộ sản phẩm. Khả năng bảo trì này chỉ có ý nghĩa khi cấu trúc được làm chắc và người bán cung cấp hướng dẫn bảo quản.',
          'Hãy hỏi trước về trường hợp dây giãn, mất charm hoặc cần đổi size. Chính sách rõ ràng tạo niềm tin hơn những lời quảng cáo chung chung về độ bền tuyệt đối.',
        ],
        bullets: ['Phù hợp size và thói quen sử dụng.', 'Chọn màu, chữ và biểu tượng có ý nghĩa.', 'Có thể trao đổi, chốt mẫu trước khi làm.', 'Có cơ hội sửa, thay hoặc làm mới về sau.'],
      },
      {
        heading: 'Khi nào không cần chọn custom?',
        paragraphs: [
          'Nếu bạn cần nhận ngay, chưa biết gu người dùng hoặc muốn một món cơ bản dễ đổi trả, sản phẩm có sẵn có thể phù hợp hơn. Cá nhân hóa cần thêm thời gian trao đổi và thường khó đổi nếu yêu cầu đã được thực hiện chính xác.',
          'Lựa chọn tốt không phải lúc nào cũng là lựa chọn nhiều tùy chỉnh nhất. Hãy chọn custom khi câu chuyện, độ vừa vặn hoặc dấu ấn cá nhân thật sự quan trọng. Mushroomie cung cấp cả mẫu sẵn và tư vấn làm riêng để bạn cân nhắc theo nhu cầu.',
        ],
      },
    ],
    relatedLinks: [
      { href: '/gioi-thieu', label: 'Tìm hiểu câu chuyện Mushroomie' },
      { href: '/phu-kien-handmade-dong-nai', label: 'Khám phá phụ kiện handmade' },
      { href: '/lien-he', label: 'Trao đổi ý tưởng cá nhân hóa' },
    ],
  },
]

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildContent(article: Article) {
  const sections = article.sections.map((section) => {
    const paragraphs = section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')
    const bullets = section.bullets?.length
      ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
      : ''
    return `<h2>${escapeHtml(section.heading)}</h2>\n${paragraphs}\n${bullets}`
  }).join('\n')

  const links = article.relatedLinks
    .map((link) => `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`)
    .join('')

  const buyingGuide = [
    '<h2>Lưu ý khi đặt phụ kiện handmade online</h2>',
    '<p>Trước khi chốt đơn, hãy gửi đủ kích thước nếu sản phẩm cần size, bảng màu mong muốn, chi tiết chữ hoặc charm và ngày cần nhận. Màu hiển thị có thể chênh nhẹ giữa màn hình và vật liệu thật, vì vậy ảnh tham khảo nên được dùng để thống nhất phong cách thay vì yêu cầu khớp tuyệt đối từng sắc độ. Với quà tặng, cần kiểm tra lại chính tả tên và địa chỉ giao ngay trong phần xác nhận.</p>',
    '<p>Sau khi nhận sản phẩm, nên giữ phụ kiện tránh xa nước hoa, chất tẩy và môi trường ẩm; tháo vòng khi tắm hoặc vận động mạnh; cất riêng để charm không cọ xát. Nếu phát hiện sai khác so với nội dung đã chốt, hãy chụp ảnh sản phẩm và liên hệ sớm. Một quy trình trao đổi rõ ràng giúp sản phẩm handmade giữ được nét riêng mà vẫn đáp ứng đúng nhu cầu sử dụng.</p>',
  ].join('\n')

  return [
    `<p><strong>${escapeHtml(article.excerpt)}</strong></p>`,
    sections,
    buyingGuide,
    '<h2>Bước tiếp theo cùng Mushroomie</h2>',
    '<p>Mushroomie làm phụ kiện thủ công và tư vấn cá nhân hóa dựa trên nhu cầu thực tế. Bạn có thể xem mẫu có sẵn trước, sau đó gửi màu sắc, kích thước, ngân sách và ngày cần nhận nếu muốn điều chỉnh riêng. Mỗi yêu cầu sẽ được trao đổi trước khi bắt đầu làm.</p>',
    `<ul>${links}</ul>`,
    '<p><em>Nội dung được Mushroomie biên soạn từ quy trình tư vấn và làm phụ kiện handmade. Hình ảnh, màu sắc và thời gian hoàn thiện có thể thay đổi theo vật liệu thực tế.</em></p>',
  ].join('\n')
}

function publishDateFor(index: number, now: Date) {
  if (index < 2) return now

  // Production runs in UTC. Build the calendar date in Vietnam time, then
  // persist 02:00 UTC so scheduled posts publish at 09:00 Asia/Ho_Chi_Minh.
  const vietnamNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return new Date(Date.UTC(
    vietnamNow.getUTCFullYear(),
    vietnamNow.getUTCMonth(),
    vietnamNow.getUTCDate() + (index - 1) * PUBLISH_INTERVAL_DAYS,
    2,
    0,
    0,
  ))
}

function buildPlan(existing: Set<string>, now = new Date()) {
  return articles.map((article, index) => {
    const content = buildContent(article)
    const publishedAt = publishDateFor(index, now)
    const status = index < 2 ? 'published' : 'scheduled'
    return {
      ...article,
      content,
      publishedAt,
      status,
      wordCount: calculateWordCount(content),
      readingTime: calculateReadingTime(content),
      action: existing.has(article.slug) ? 'skip-existing' : 'create',
    }
  })
}

function validatePlan(plan: ReturnType<typeof buildPlan>) {
  if (plan.length !== 10) throw new Error(`Đợt 2 phải có đúng 10 bài, hiện có ${plan.length}.`)

  const duplicateSlugs = plan
    .map((item) => item.slug)
    .filter((slug, index, values) => values.indexOf(slug) !== index)
  if (duplicateSlugs.length) throw new Error(`Slug trùng: ${duplicateSlugs.join(', ')}`)

  const invalid = plan.flatMap((item) => {
    const issues: string[] = []
    if (item.wordCount < 800) issues.push(`chỉ có ${item.wordCount} từ`)
    if (item.metaDescription.length < 120 || item.metaDescription.length > 165) {
      issues.push(`meta description dài ${item.metaDescription.length} ký tự`)
    }
    if (item.relatedLinks.length < 3) issues.push('có dưới 3 internal link')
    if (!item.content.includes(`<strong>${escapeHtml(item.excerpt)}</strong>`)) issues.push('thiếu answer-first intro')
    return issues.length ? [`${item.slug}: ${issues.join('; ')}`] : []
  })
  if (invalid.length) throw new Error(`Quality gate không đạt:\n${invalid.join('\n')}`)
}

function printPlan(plan: ReturnType<typeof buildPlan>) {
  console.table(plan.map((item) => ({
    slug: item.slug,
    action: item.action,
    status: item.status,
    words: item.wordCount,
    publish_at: item.publishedAt.toISOString(),
  })))
}

async function main() {
  const apply = process.argv.includes('--apply')
  const backupConfirmed = process.argv.includes('--backup-confirmed')

  if (process.argv.includes('--content-check')) {
    const plan = buildPlan(new Set(), new Date('2026-07-13T02:00:00.000Z'))
    validatePlan(plan)
    printPlan(plan)
    console.log('CONTENT CHECK: 10/10 bài đạt quality gate; database chưa được kết nối.')
    return
  }

  if (apply && !backupConfirmed) {
    throw new Error('Chế độ apply yêu cầu --backup-confirmed sau khi đã backup database production.')
  }

  const category = await prisma.category.findUnique({ where: { slug: CATEGORY_SLUG } })
  if (!category || category.type !== 'post') {
    throw new Error(`Không tìm thấy category bài viết ${CATEGORY_SLUG}.`)
  }

  const author = await prisma.user.findFirst({
    where: { role: 'super_admin' },
    orderBy: { id: 'asc' },
    select: { id: true },
  })
  if (!author) throw new Error('Không tìm thấy super_admin để gắn tác giả.')

  const existing = new Set(
    (await prisma.post.findMany({
      where: { slug: { in: articles.map((article) => article.slug) } },
      select: { slug: true },
    })).map((post) => post.slug),
  )

  const plan = buildPlan(existing)
  validatePlan(plan)
  printPlan(plan)

  if (!apply) {
    console.log(`DRY-RUN: ${plan.filter((item) => item.action === 'create').length} bài sẽ được tạo; database chưa thay đổi.`)
    return
  }

  let created = 0
  let skipped = 0
  for (const item of plan) {
    if (item.action === 'skip-existing') {
      skipped += 1
      continue
    }

    await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          title: item.title,
          slug: item.slug || generateSlug(item.title),
          excerpt: item.excerpt,
          content: item.content,
          status: item.status,
          category_id: category.id,
          seo_title: item.title,
          meta_description: item.metaDescription,
          focus_keyword: item.focusKeyword,
          secondary_keywords: item.secondaryKeywords.join(', '),
          canonical_url: `${SITE_URL}/tin-tuc/${item.slug}`,
          robots_index: true,
          robots_follow: true,
          schema_type: 'BlogPosting',
          author_id: author.id,
          published_at: item.publishedAt,
          reading_time: item.readingTime,
          word_count: item.wordCount,
        },
      })

      for (const tagName of item.secondaryKeywords) {
        const tagSlug = generateSlug(tagName)
        const tag = await tx.postTag.upsert({
          where: { slug: tagSlug },
          create: { name: tagName, slug: tagSlug },
          update: { name: tagName },
        })
        await tx.postTagMap.create({ data: { post_id: post.id, tag_id: tag.id } })
      }
    })
    created += 1
  }

  console.log(`APPLY hoàn tất: tạo ${created}, bỏ qua ${skipped} bài đã tồn tại.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

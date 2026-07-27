export const SITE_URL = 'https://mushroomie.io.vn'
export const CATALOG_SEO_LAST_MODIFIED = new Date('2026-07-28T00:00:00.000Z')

export function getCatalogSeoLastModified(dataLastModified?: Date | null): Date {
  if (
    dataLastModified
    && !Number.isNaN(dataLastModified.getTime())
    && dataLastModified > CATALOG_SEO_LAST_MODIFIED
  ) {
    return dataLastModified
  }

  return CATALOG_SEO_LAST_MODIFIED
}

export interface CatalogSeoLink {
  href: string
  label: string
}

export interface CatalogSeoSection {
  title: string
  body: string
}

export interface CatalogSeoConfig {
  categorySlug: string | null
  title: string
  description: string
  h1: string
  eyebrow: string
  intro: string
  sections: CatalogSeoSection[]
  links: CatalogSeoLink[]
}

const BASE_CATALOG_SEO: CatalogSeoConfig = {
  categorySlug: null,
  title: 'Phụ kiện handmade nữ cá nhân hóa theo gu',
  description:
    'Khám phá vòng tay, charm, móc khóa, vòng cổ và phụ kiện handmade cá nhân hóa từ Mushroomie, làm thủ công để bạn chọn theo phong cách riêng.',
  h1: 'Phụ kiện handmade cá nhân hóa',
  eyebrow: 'Bộ sưu tập Mushroomie',
  intro:
    'Mỗi món phụ kiện tại Mushroomie được hoàn thiện thủ công từ những hạt, dây và charm nhỏ. Bạn có thể bắt đầu với một mẫu có sẵn, sau đó chọn màu sắc hoặc chi tiết phù hợp với phong cách và câu chuyện muốn gửi gắm.',
  sections: [
    {
      title: 'Chọn phụ kiện theo cách bạn sử dụng',
      body: 'Vòng tay phù hợp để phối hằng ngày hoặc làm quà; charm giúp tạo điểm nhấn; móc khóa dành cho chìa khóa, túi và điện thoại; vòng cổ mang lại một lớp phối đồ nhẹ nhàng. Hãy xem đúng danh mục để so sánh các mẫu đang có.',
    },
    {
      title: 'Cá nhân hóa vừa đủ, không mất chất handmade',
      body: 'Với sản phẩm hỗ trợ tùy chỉnh, Mushroomie sẽ dựa trên lựa chọn màu, charm, kiểu dây và lời nhắn của bạn. Khả năng tùy chỉnh cụ thể luôn được ghi rõ tại trang chi tiết sản phẩm.',
    },
    {
      title: 'Đặt đúng mẫu, đúng thời gian cần nhận',
      body: 'Sản phẩm có sẵn và sản phẩm custom có thời gian chuẩn bị khác nhau. Hãy kiểm tra tồn kho, tùy chọn gói quà và ngày dự kiến nhận trước khi thanh toán; với món cá nhân hóa, Mushroomie sẽ xác nhận lại size, vật liệu, cách phối và chi phí trước khi làm để hạn chế thay đổi ngoài ý muốn.',
    },
  ],
  links: [
    { href: '/san-pham?category=vong-tay', label: 'Xem vòng tay handmade' },
    { href: '/san-pham?category=charm', label: 'Chọn charm theo phong cách' },
    { href: '/san-pham?category=moc-khoa', label: 'Xem móc khóa handmade' },
    { href: '/san-pham?category=vong-co', label: 'Xem vòng cổ handmade' },
    { href: '/tin-tuc/qua-tang-handmade', label: 'Gợi ý quà tặng handmade' },
    { href: '/phu-kien-handmade-dong-nai', label: 'Phụ kiện handmade tại Đồng Nai' },
    { href: '/qua-tang-handmade-dong-nai', label: 'Quà tặng handmade tại Đồng Nai' },
  ],
}

const CATEGORY_CATALOG_SEO: Record<string, CatalogSeoConfig> = {
  'vong-tay': {
    categorySlug: 'vong-tay',
    title: 'Vòng tay handmade nữ & custom theo yêu cầu',
    description:
      'Chọn vòng tay handmade nữ, vòng hạt cườm, vòng charm và mẫu custom từ Mushroomie. Nhiều thiết kế có thể đổi màu hoặc phối charm theo yêu cầu.',
    h1: 'Vòng tay handmade cá nhân hóa',
    eyebrow: 'Từng hạt nhỏ, một dấu ấn riêng',
    intro:
      'Bộ sưu tập vòng tay handmade của Mushroomie gồm các mẫu hạt cườm, dây tết, charm và thiết kế có thể cá nhân hóa. Mỗi trang sản phẩm ghi rõ kích thước, chất liệu, tồn kho và lựa chọn custom đang hỗ trợ để bạn chọn đúng mẫu thay vì phải đoán.',
    sections: [
      {
        title: 'Chọn vòng tay theo phong cách và người nhận',
        body: 'Mẫu màu dịu và hạt nhỏ dễ phối hằng ngày; vòng có charm tạo điểm nhấn rõ hơn; mẫu đôi hoặc vòng tình bạn phù hợp khi muốn lưu một kỷ niệm chung. Với quà tặng, hãy ưu tiên màu người nhận thường dùng và chọn lời nhắn ngắn, có ý nghĩa.',
      },
      {
        title: 'Đặt vòng tay custom theo yêu cầu',
        body: 'Những mẫu có nhãn cá nhân hóa cho phép bạn trao đổi thêm về màu dây, charm hoặc cách phối. Mushroomie chỉ xác nhận phương án có thể thực hiện sau khi xem yêu cầu cụ thể, giúp thành phẩm vẫn bền và hài hòa.',
      },
      {
        title: 'Đo size và chăm vòng sau khi nhận',
        body: 'Dùng thước dây đo sát quanh cổ tay, ghi số đo theo centimet và cho biết bạn thích đeo ôm hay lỏng. Sau khi nhận, nên hạn chế ngâm vòng trong nước, tránh mỹ phẩm và cất riêng khi không dùng. Cách đo rõ ràng cùng việc bảo quản đúng giúp vòng vừa tay, giữ màu và giảm nguy cơ dây bị giãn sớm.',
      },
    ],
    links: [
      { href: '/tin-tuc/vong-tay-hat-cuom', label: 'Cách chọn vòng tay hạt cườm' },
      { href: '/tin-tuc/vong-tay-charm', label: 'Phối vòng tay charm' },
      { href: '/tin-tuc/vong-tay-doi-handmade', label: 'Gợi ý vòng tay đôi' },
      { href: '/tin-tuc/vong-tay-custom-theo-ten', label: 'Vòng tay custom theo tên' },
      { href: '/lien-he', label: 'Trao đổi mẫu custom' },
      { href: '/vong-tay-handmade-dong-nai', label: 'Vòng tay handmade Đồng Nai' },
      { href: '/vong-tay-custom-bien-hoa', label: 'Vòng tay custom Biên Hòa' },
    ],
  },
  charm: {
    categorySlug: 'charm',
    title: 'Charm handmade cho vòng tay và phụ kiện',
    description:
      'Khám phá charm handmade và charm vòng tay tại Mushroomie. Chọn biểu tượng, màu sắc phù hợp để phối vòng, móc khóa hoặc phụ kiện cá nhân hóa theo gu riêng.',
    h1: 'Charm handmade cho phong cách riêng',
    eyebrow: 'Chi tiết nhỏ, cá tính lớn',
    intro:
      'Charm là chi tiết giúp một mẫu phụ kiện trở nên gần với sở thích của bạn hơn. Danh mục này tập hợp những mẫu charm và sản phẩm liên quan đang có thật tại Mushroomie; tình trạng còn hàng và khả năng phối thêm được hiển thị trên từng sản phẩm.',
    sections: [
      {
        title: 'Chọn charm theo câu chuyện muốn kể',
        body: 'Bạn có thể bắt đầu từ màu chủ đạo, biểu tượng yêu thích hoặc một kỷ niệm chung. Khi phối nhiều charm, nên giữ một điểm nhấn chính và cân bằng khoảng trống để phụ kiện không bị rối.',
      },
      {
        title: 'Phối charm với vòng tay và móc khóa',
        body: 'Charm nhỏ hợp với vòng tay đeo hằng ngày, còn chi tiết nổi bật có thể dùng cho móc khóa hoặc dây đeo. Hãy kiểm tra mô tả sản phẩm hoặc liên hệ Mushroomie trước khi chọn charm cho một mẫu custom cụ thể.',
      },
      {
        title: 'Kiểm tra kích thước và kiểu gắn charm',
        body: 'Không phải charm nào cũng lắp được cho mọi loại dây hoặc khoen. Trước khi chọn, hãy đối chiếu kích thước, trọng lượng, màu kim loại và kiểu gắn trong mô tả sản phẩm. Với thiết kế custom, Mushroomie sẽ kiểm tra độ cân bằng giữa hạt, dây và charm để phụ kiện không bị nặng, vướng hoặc lệch khỏi bố cục dự kiến.',
      },
    ],
    links: [
      { href: '/tin-tuc/vong-tay-charm-handmade', label: 'Cách phối vòng tay charm' },
      { href: '/tin-tuc/charm-ten-rieng', label: 'Ý tưởng charm tên riêng' },
      { href: '/san-pham?category=vong-tay', label: 'Xem vòng tay handmade' },
      { href: '/san-pham?category=moc-khoa', label: 'Phối charm với móc khóa' },
      { href: '/charm-handmade-dong-nai', label: 'Charm handmade Đồng Nai' },
    ],
  },
  'moc-khoa': {
    categorySlug: 'moc-khoa',
    title: 'Móc khóa handmade cute & cá nhân hóa',
    description:
      'Chọn móc khóa handmade, móc khóa cute và dây treo điện thoại từ Mushroomie. Xem mẫu thật, giá, tồn kho và tùy chọn cá nhân hóa theo màu, tên hoặc charm.',
    h1: 'Móc khóa handmade dễ thương',
    eyebrow: 'Mang một niềm vui nhỏ theo bên mình',
    intro:
      'Móc khóa handmade là món phụ kiện nhỏ có thể dùng cho chìa khóa, balo, túi hoặc điện thoại tùy cấu tạo từng mẫu. Mushroomie ưu tiên những cách phối màu trẻ trung, dễ tặng và có thể thêm dấu ấn riêng khi sản phẩm hỗ trợ custom.',
    sections: [
      {
        title: 'Chọn đúng kiểu móc khóa cho nhu cầu',
        body: 'Móc kim loại phù hợp với chìa khóa và túi; dây treo nhẹ phù hợp cho điện thoại khi sản phẩm ghi rõ công dụng; mẫu có hạt và charm là lựa chọn dễ tạo chủ đề quà tặng. Luôn xem ảnh và mô tả chi tiết trước khi đặt.',
      },
      {
        title: 'Biến móc khóa thành món quà cá nhân',
        body: 'Một màu sắc quen thuộc, biểu tượng nhỏ hoặc lời nhắn đi kèm có thể khiến món quà gần gũi hơn. Nếu muốn thay đổi thiết kế, hãy gửi yêu cầu để Mushroomie xác nhận vật liệu và phương án đang có.',
      },
      {
        title: 'Ưu tiên độ chắc theo vị trí sử dụng',
        body: 'Móc cho chìa khóa nên gọn và có khoen chắc; mẫu treo balo hoặc túi có thể dài, nhiều hạt và nổi bật hơn. Dây treo điện thoại chỉ nên dùng khi sản phẩm ghi rõ công dụng và điểm gắn phù hợp. Khi đặt mẫu custom, hãy nói nơi bạn sẽ sử dụng để Mushroomie chọn bố cục và phụ kiện nối an toàn hơn.',
      },
    ],
    links: [
      { href: '/tin-tuc/moc-khoa-handmade', label: 'Khám phá móc khóa handmade' },
      { href: '/tin-tuc/moc-khoa-handmade-cho-dien-thoai', label: 'Chọn móc khóa điện thoại' },
      { href: '/tin-tuc/moc-khoa-handmade-ca-nhan-hoa', label: 'Móc khóa cá nhân hóa' },
      { href: '/san-pham?category=charm', label: 'Chọn charm đi kèm' },
      { href: '/moc-khoa-handmade-dong-nai', label: 'Móc khóa handmade Đồng Nai' },
    ],
  },
  'vong-co': {
    categorySlug: 'vong-co',
    title: 'Vòng cổ và dây chuyền handmade',
    description:
      'Khám phá vòng cổ và dây chuyền handmade tại Mushroomie, với thiết kế hạt và charm trẻ trung. Xem mẫu thật, kích thước và gợi ý phối đồ hoặc làm quà.',
    h1: 'Vòng cổ và dây chuyền handmade',
    eyebrow: 'Một lớp điểm nhấn cho trang phục',
    intro:
      'Danh mục vòng cổ tập hợp các mẫu vòng cổ và dây chuyền handmade đang được Mushroomie mở bán. Hãy xem ảnh thật, chiều dài hoặc thông tin chất liệu trong trang sản phẩm để chọn mẫu hợp với cổ áo và cách phối thường ngày.',
    sections: [
      {
        title: 'Chọn vòng cổ theo tỷ lệ và trang phục',
        body: 'Mẫu hạt nhỏ, màu trung tính dễ dùng mỗi ngày; thiết kế có charm hoặc màu nổi phù hợp khi muốn tạo điểm nhấn. Khi làm quà, một kiểu dáng dễ phối thường an toàn hơn việc chọn quá nhiều chi tiết.',
      },
      {
        title: 'Giữ phụ kiện handmade bền đẹp',
        body: 'Hạn chế để sản phẩm tiếp xúc lâu với nước, nước hoa và hóa chất. Sau khi dùng, lau nhẹ và cất riêng để dây, hạt và charm không bị va chạm với phụ kiện khác.',
      },
      {
        title: 'Kiểm tra chiều dài trước khi chọn',
        body: 'Chiều dài quyết định vị trí vòng nằm trên cổ và cách nó đi cùng cổ áo. Hãy so số đo sản phẩm với một sợi dây chuyền bạn đang đeo vừa, đồng thời xem kích thước charm để hình dung tỷ lệ thật. Nếu mua làm quà, ưu tiên mẫu có chiều dài dễ phối và hỏi Mushroomie khi cần xác nhận khả năng điều chỉnh.',
      },
    ],
    links: [
      { href: '/tin-tuc/vong-co-handmade-de-thuong', label: 'Gợi ý vòng cổ handmade' },
      { href: '/tin-tuc/day-chuyen-handmade-nu', label: 'Chọn dây chuyền handmade nữ' },
      { href: '/tin-tuc/trang-suc-handmade', label: 'Cách phối trang sức handmade' },
      { href: '/san-pham?category=charm', label: 'Xem thêm charm handmade' },
      { href: '/day-chuyen-handmade-dong-nai', label: 'Dây chuyền handmade Đồng Nai' },
    ],
  },
}

export const CATALOG_SEO_SLUGS = Object.freeze(Object.keys(CATEGORY_CATALOG_SEO))

export function getCatalogSeo(categorySlug?: string | null): CatalogSeoConfig {
  if (!categorySlug) return BASE_CATALOG_SEO
  return CATEGORY_CATALOG_SEO[categorySlug] || BASE_CATALOG_SEO
}

export function isCatalogCategory(categorySlug?: string | null): boolean {
  return Boolean(categorySlug && CATEGORY_CATALOG_SEO[categorySlug])
}

export function getCatalogCanonicalPath(categorySlug?: string | null): string {
  return isCatalogCategory(categorySlug)
    ? `/san-pham?category=${encodeURIComponent(categorySlug!)}`
    : '/san-pham'
}

export function shouldIndexCatalog(params: {
  categorySlug?: string | null
  searchKeyword?: string | null
  sortValue?: string | null
  page?: number
}): boolean {
  const { categorySlug, searchKeyword, sortValue, page = 1 } = params
  const categoryIsKnown = !categorySlug || isCatalogCategory(categorySlug)
  return categoryIsKnown && !searchKeyword && !sortValue && page === 1
}

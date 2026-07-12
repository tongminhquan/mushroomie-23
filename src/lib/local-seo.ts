/**
 * Gói Local SEO cho Mushroomie — bản đồ từ khóa địa phương (Đồng Nai, Biên Hòa,
 * Trảng Dài, TP.HCM) chuyển thành dữ liệu trang landing + schema dùng chung.
 *
 * Nguồn: file mushroomie_local_seo_keywords.csv (khách cung cấp).
 * Đợt 1 triển khai 12 slug ưu tiên; các slug còn lại nối tiếp cùng cấu trúc này.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'

/** Thông tin NAP nhất quán (dùng cho schema + trang liên hệ + footer) */
export const BRAND = {
  name: 'Mushroomie',
  legalName: 'Mushroomie Handmade',
  slogan: 'Từ từng hạt nhỏ, tạo phong cách riêng',
  description:
    'Thương hiệu phụ kiện handmade cá nhân hóa cho giới trẻ: vòng tay, móc khóa, charm, dây chuyền và quà tặng custom theo màu sắc, kiểu dáng và cá tính riêng.',
  phone: '0947192590',
  phoneE164: '+84947192590',
  email: 'cskh@mushroomie.io.vn',
  streetAddress: 'Hẻm 2, tổ 11, Phường Trảng Dài',
  addressLocality: 'Thành phố Đồng Nai',
  addressRegion: 'Đồng Nai',
  addressCountry: 'VN',
  areaServed: ['Đồng Nai', 'Biên Hòa', 'Trảng Dài', 'TP. Hồ Chí Minh'],
  sameAs: [
    'https://www.facebook.com/mushr00mie',
    'https://www.instagram.com/mushr00mie._/',
    'https://www.tiktok.com/@mushr00mie._',
    'https://shopee.vn/shop/475544379',
  ],
  shopee: 'https://shopee.vn/shop/475544379',
  logo: `${SITE_URL}/logo.webp`,
} as const

export type LocalArea = 'Đồng Nai' | 'Biên Hòa' | 'Trảng Dài' | 'TP.HCM'
export type LocalGroup = 'phu-kien' | 'vong-tay' | 'moc-khoa' | 'qua-tang'

export interface LocalHighlight {
  emoji: string
  title: string
  body: string
}

export interface LocalPage {
  slug: string
  area: LocalArea
  group: LocalGroup
  /** true nếu khu vực chỉ phục vụ giao hàng online (không phải cửa hàng vật lý) */
  onlineOnly?: boolean
  seoTitle: string
  metaDescription: string
  h1: string
  /** đoạn mở đầu 2-3 câu, tự nhiên, chứa từ khóa ở mức hợp lý */
  intro: string
  /** 3-4 khối giá trị */
  highlights: LocalHighlight[]
  /** liên kết sản phẩm/custom nội bộ */
  productLinks: { label: string; href: string }[]
  cta: { label: string; href: string }
  /** slug các trang local liên quan (2-3 cái) */
  related: string[]
  /** breadcrumb nhãn ngắn */
  crumb: string
  /** loại dịch vụ cho schema */
  serviceType: string
}

const productHub = {
  all: { label: 'Xem tất cả sản phẩm', href: '/san-pham' },
  bracelet: { label: 'Danh mục vòng tay handmade', href: '/san-pham?category=vong-tay' },
  keychain: { label: 'Danh mục móc khóa handmade', href: '/san-pham?category=moc-khoa' },
  charm: { label: 'Danh mục charm', href: '/san-pham?category=charm' },
  necklace: { label: 'Danh mục dây chuyền & vòng cổ', href: '/san-pham?category=vong-co' },
  gift: { label: 'Set quà tặng & hộp quà', href: '/san-pham' },
  contact: { label: 'Đặt hàng / tư vấn custom', href: '/lien-he' },
}

/** Nội dung dùng lại cho phần "giao hàng địa phương" theo khu vực */
export function deliveryNote(area: LocalArea, onlineOnly?: boolean): string {
  if (onlineOnly) {
    return `Mushroomie đặt tại Đồng Nai và nhận đơn online giao đến ${area === 'TP.HCM' ? 'TP.HCM' : area} qua các đơn vị vận chuyển. Bạn chọn mẫu, chốt màu và charm qua website hoặc nhắn tin, Mushroomie làm thủ công rồi gửi đi.`
  }
  return `Mushroomie ở khu vực Trảng Dài, ${area === 'Đồng Nai' ? 'Đồng Nai' : area} và hỗ trợ nhận đơn trực tiếp lẫn giao hàng linh hoạt trong ${area}, đồng thời giao online đến TP.HCM.`
}

/**
 * Dữ liệu 12 trang ưu tiên (11 landing + trang /lien-he tối ưu riêng).
 * Nội dung tiếng Việt, không nhồi từ khóa, bám USP handmade – custom – cảm xúc.
 */
export const LOCAL_PAGES: LocalPage[] = [
  {
    slug: 'phu-kien-handmade-dong-nai',
    area: 'Đồng Nai',
    group: 'phu-kien',
    crumb: 'Phụ kiện handmade Đồng Nai',
    serviceType: 'Phụ kiện handmade cá nhân hóa',
    seoTitle: 'Phụ Kiện Handmade Đồng Nai – Mushroomie Cá Nhân Hóa Theo Gu Riêng',
    metaDescription:
      'Khám phá phụ kiện handmade Mushroomie tại Đồng Nai: vòng tay, móc khóa, charm và quà tặng custom theo màu sắc, kiểu dáng, cá tính riêng.',
    h1: 'Phụ kiện handmade Đồng Nai – cá nhân hóa theo gu riêng',
    intro:
      'Mushroomie là thương hiệu phụ kiện handmade cá nhân hóa ở Đồng Nai, chuyên vòng tay, móc khóa, charm và quà tặng nhỏ xinh làm thủ công 100%. Mỗi món đều có thể chọn màu, chọn charm và phối kiểu theo đúng phong cách của bạn — từ từng hạt nhỏ, tạo phong cách riêng.',
    highlights: [
      { emoji: '🧶', title: 'Handmade 100%', body: 'Từng chiếc vòng, móc khóa được phối tay tỉ mỉ tại Đồng Nai, không sản xuất đại trà.' },
      { emoji: '🎨', title: 'Custom theo sở thích', body: 'Chọn màu sắc, charm, size và kiểu dáng để món phụ kiện mang đúng dấu ấn của riêng bạn.' },
      { emoji: '🎁', title: 'Hợp làm quà', body: 'Nhỏ gọn, dễ thương và giàu cảm xúc — lựa chọn quà tặng ý nghĩa cho bạn bè, người thân.' },
    ],
    productLinks: [productHub.all, productHub.bracelet, productHub.keychain, productHub.contact],
    cta: { label: 'Xem phụ kiện handmade', href: '/san-pham' },
    related: ['vong-tay-handmade-dong-nai', 'moc-khoa-handmade-dong-nai', 'qua-tang-handmade-dong-nai'],
  },
  {
    slug: 'shop-phu-kien-handmade-dong-nai',
    area: 'Đồng Nai',
    group: 'phu-kien',
    crumb: 'Shop phụ kiện handmade Đồng Nai',
    serviceType: 'Shop phụ kiện handmade',
    seoTitle: 'Shop Phụ Kiện Handmade Đồng Nai – Vòng Tay, Charm Và Quà Tặng Custom',
    metaDescription:
      'Mushroomie là shop phụ kiện handmade tại Đồng Nai, chuyên vòng tay custom, móc khóa, charm và hộp quà cá nhân hóa cho giới trẻ.',
    h1: 'Shop phụ kiện handmade Đồng Nai',
    intro:
      'Bạn đang tìm một shop phụ kiện handmade ở Đồng Nai để đặt vòng tay custom, móc khóa hay hộp quà cá nhân hóa? Mushroomie làm thủ công từng sản phẩm, nhận tư vấn phối màu – charm theo gu của bạn và hỗ trợ đặt hàng qua website, Facebook lẫn Shopee.',
    highlights: [
      { emoji: '🛍️', title: 'Nhiều mẫu sẵn & custom', body: 'Vòng hạt cườm, vòng charm, móc khóa, dây đeo điện thoại và set quà — có mẫu sẵn và nhận làm riêng.' },
      { emoji: '💬', title: 'Tư vấn theo gu', body: 'Nhắn tin để Mushroomie gợi ý màu sắc và charm hợp phong cách, dịp tặng hoặc người nhận.' },
      { emoji: '🚚', title: 'Đặt online tiện lợi', body: 'Chốt đơn qua website hoặc Shopee, Mushroomie làm và gửi hàng đến bạn tại Đồng Nai và TP.HCM.' },
    ],
    productLinks: [productHub.all, productHub.bracelet, productHub.gift, productHub.contact],
    cta: { label: 'Đặt mẫu riêng', href: '/lien-he' },
    related: ['phu-kien-handmade-dong-nai', 'vong-tay-custom-dong-nai', 'qua-tang-ca-nhan-hoa-dong-nai'],
  },
  {
    slug: 'phu-kien-handmade-bien-hoa',
    area: 'Biên Hòa',
    group: 'phu-kien',
    crumb: 'Phụ kiện handmade Biên Hòa',
    serviceType: 'Phụ kiện handmade cá nhân hóa',
    seoTitle: 'Phụ Kiện Handmade Biên Hòa – Đồ Nhỏ Xinh, Custom Theo Phong Cách',
    metaDescription:
      'Mushroomie mang đến phụ kiện handmade tại Biên Hòa với vòng tay, móc khóa, charm và set quà tặng được phối thủ công theo sở thích.',
    h1: 'Phụ kiện handmade Biên Hòa – nhỏ xinh, custom theo phong cách',
    intro:
      'Ở gần Biên Hòa và muốn tìm phụ kiện handmade dễ thương, có thể phối riêng? Mushroomie làm thủ công vòng tay, móc khóa, charm và set quà tặng, cho bạn chọn màu và charm theo phong cách của mình, giao hàng thuận tiện trong khu vực Biên Hòa – Đồng Nai.',
    highlights: [
      { emoji: '📍', title: 'Ngay gần Biên Hòa', body: 'Mushroomie đặt tại Trảng Dài, Đồng Nai — rất gần Biên Hòa nên đặt và nhận hàng đều nhanh gọn.' },
      { emoji: '🎨', title: 'Phối theo cá tính', body: 'Chọn tông màu, charm và kiểu dáng để tạo phụ kiện không đụng hàng.' },
      { emoji: '🧸', title: 'Cute mà tinh tế', body: 'Thiết kế trẻ trung, dễ thương nhưng vẫn chỉn chu để đeo hằng ngày hoặc làm quà.' },
    ],
    productLinks: [productHub.all, productHub.bracelet, productHub.keychain, productHub.contact],
    cta: { label: 'Xem mẫu custom', href: '/san-pham' },
    related: ['vong-tay-custom-bien-hoa', 'phu-kien-handmade-dong-nai', 'moc-khoa-handmade-dong-nai'],
  },
  {
    slug: 'phu-kien-handmade-tphcm',
    area: 'TP.HCM',
    group: 'phu-kien',
    onlineOnly: true,
    crumb: 'Phụ kiện handmade TP.HCM',
    serviceType: 'Phụ kiện handmade cá nhân hóa (giao TP.HCM)',
    seoTitle: 'Phụ Kiện Handmade TP.HCM – Mẫu Cute, Cá Tính, Có Thể Custom',
    metaDescription:
      'Mushroomie nhận đặt phụ kiện handmade giao TP.HCM: vòng tay custom, móc khóa, charm và set quà tặng nhỏ xinh cho giới trẻ.',
    h1: 'Phụ kiện handmade giao TP.HCM – cute, cá tính, có thể custom',
    intro:
      'Ở TP.HCM và thích phụ kiện handmade nhỏ xinh, có thể custom theo mood? Mushroomie nhận đặt online và giao đến TP.HCM: vòng tay, móc khóa, charm và set quà tặng đều được làm thủ công, chọn màu và charm theo sở thích của bạn.',
    highlights: [
      { emoji: '📦', title: 'Đặt online, giao TP.HCM', body: 'Bạn chọn mẫu và chốt màu qua website hoặc Shopee, Mushroomie làm thủ công rồi gửi đến TP.HCM.' },
      { emoji: '🎨', title: 'Custom theo mood', body: 'Phối màu, charm và kiểu dáng theo phong cách riêng, không đại trà.' },
      { emoji: '💗', title: 'Hợp Gen Z', body: 'Mẫu trẻ trung, dễ phối đồ, hợp đi học, đi chơi, chụp ảnh hoặc làm quà tặng.' },
    ],
    productLinks: [productHub.all, productHub.bracelet, productHub.gift, productHub.contact],
    cta: { label: 'Đặt hàng online', href: '/san-pham' },
    related: ['phu-kien-handmade-dong-nai', 'vong-tay-custom-dong-nai', 'qua-tang-ca-nhan-hoa-dong-nai'],
  },
  {
    slug: 'vong-tay-handmade-dong-nai',
    area: 'Đồng Nai',
    group: 'vong-tay',
    crumb: 'Vòng tay handmade Đồng Nai',
    serviceType: 'Vòng tay handmade',
    seoTitle: 'Vòng Tay Handmade Đồng Nai – Nhỏ Xinh, Dễ Phối, Có Thể Custom',
    metaDescription:
      'Khám phá vòng tay handmade Mushroomie tại Đồng Nai, phối thủ công từ hạt, dây và charm, phù hợp đi học, đi chơi hoặc làm quà tặng.',
    h1: 'Vòng tay handmade Đồng Nai – nhỏ xinh, dễ phối',
    intro:
      'Vòng tay handmade của Mushroomie tại Đồng Nai được phối thủ công từ hạt, dây và charm, thiết kế nhỏ xinh dễ phối đồ. Bạn có thể chọn vòng hạt cườm, vòng charm, vòng đôi hay vòng bạn thân, và custom màu – charm theo gu riêng.',
    highlights: [
      { emoji: '🌈', title: 'Đa dạng kiểu', body: 'Vòng hạt cườm, vòng charm, vòng đôi, vòng bạn thân — nhiều lựa chọn để phối theo mood.' },
      { emoji: '🎨', title: 'Custom màu & charm', body: 'Tự chọn tông màu và charm yêu thích để chiếc vòng thật sự là của riêng bạn.' },
      { emoji: '🎓', title: 'Hợp mọi dịp', body: 'Đeo đi học, đi chơi, chụp ảnh hay làm quà tặng nhỏ đều xinh.' },
    ],
    productLinks: [productHub.bracelet, productHub.all, productHub.contact],
    cta: { label: 'Xem mẫu vòng tay', href: '/san-pham?category=vong-tay' },
    related: ['vong-tay-custom-dong-nai', 'phu-kien-handmade-dong-nai', 'qua-tang-handmade-dong-nai'],
  },
  {
    slug: 'vong-tay-custom-dong-nai',
    area: 'Đồng Nai',
    group: 'vong-tay',
    crumb: 'Vòng tay custom Đồng Nai',
    serviceType: 'Vòng tay custom theo yêu cầu',
    seoTitle: 'Vòng Tay Custom Đồng Nai – Chọn Màu, Chọn Charm Theo Gu Riêng',
    metaDescription:
      'Mushroomie nhận làm vòng tay custom tại Đồng Nai, cho phép chọn màu sắc, charm, kiểu dáng và phong cách theo sở thích cá nhân.',
    h1: 'Vòng tay custom Đồng Nai – chọn màu, chọn charm theo gu riêng',
    intro:
      'Mushroomie nhận làm vòng tay custom tại Đồng Nai theo đúng ý bạn: chọn màu sắc, chọn charm, chọn size và kiểu phối. Phù hợp làm phụ kiện cá nhân, vòng đôi hoặc vòng bạn thân lưu giữ kỷ niệm.',
    highlights: [
      { emoji: '🎨', title: 'Bạn chọn – Mushroomie làm', body: 'Từ màu dây, hạt đến charm và ký hiệu riêng, mọi chi tiết đều theo yêu cầu của bạn.' },
      { emoji: '👯', title: 'Vòng đôi & bạn thân', body: 'Phối set cho hai người hoặc cả nhóm để lưu giữ kỷ niệm cùng nhau.' },
      { emoji: '💬', title: 'Tư vấn tận tình', body: 'Nhắn tin để được gợi ý phối màu và charm hợp phong cách hoặc dịp tặng.' },
    ],
    productLinks: [productHub.bracelet, productHub.contact, productHub.all],
    cta: { label: 'Xem mẫu vòng tay', href: '/san-pham?category=vong-tay' },
    related: ['vong-tay-handmade-dong-nai', 'vong-tay-custom-bien-hoa', 'qua-tang-ca-nhan-hoa-dong-nai'],
  },
  {
    slug: 'vong-tay-custom-bien-hoa',
    area: 'Biên Hòa',
    group: 'vong-tay',
    crumb: 'Vòng tay custom Biên Hòa',
    serviceType: 'Vòng tay custom theo yêu cầu',
    seoTitle: 'Vòng Tay Custom Biên Hòa – Đặt Vòng Theo Tên, Màu Và Charm',
    metaDescription:
      'Đặt vòng tay custom tại Biên Hòa với Mushroomie: chọn màu, chọn charm, phối kiểu dáng riêng và nhận tư vấn theo gu cá nhân.',
    h1: 'Vòng tay custom Biên Hòa – đặt theo tên, màu và charm',
    intro:
      'Ở Biên Hòa và muốn một chiếc vòng tay của riêng mình? Mushroomie (ngay gần Biên Hòa, tại Trảng Dài – Đồng Nai) nhận đặt vòng tay custom: chọn màu, charm, thêm chữ cái hoặc ký hiệu và phối kiểu dáng theo gu của bạn.',
    highlights: [
      { emoji: '📍', title: 'Gần Biên Hòa', body: 'Vị trí thuận tiện để đặt và nhận hàng nhanh trong khu vực Biên Hòa – Đồng Nai.' },
      { emoji: '🔤', title: 'Theo tên & ký hiệu', body: 'Thêm chữ cái, tên hoặc charm ý nghĩa để chiếc vòng thật riêng biệt.' },
      { emoji: '🎨', title: 'Phối theo gu', body: 'Chọn tông màu và charm hợp phong cách hoặc người nhận.' },
    ],
    productLinks: [productHub.bracelet, productHub.contact, productHub.all],
    cta: { label: 'Xem mẫu vòng tay', href: '/san-pham?category=vong-tay' },
    related: ['vong-tay-custom-dong-nai', 'phu-kien-handmade-bien-hoa', 'vong-tay-handmade-dong-nai'],
  },
  {
    slug: 'moc-khoa-handmade-dong-nai',
    area: 'Đồng Nai',
    group: 'moc-khoa',
    crumb: 'Móc khóa handmade Đồng Nai',
    serviceType: 'Móc khóa & charm handmade',
    seoTitle: 'Móc Khóa Handmade Đồng Nai – Phụ Kiện Nhỏ Cho Túi, Balo Và Điện Thoại',
    metaDescription:
      'Mushroomie có móc khóa handmade tại Đồng Nai, phối hạt và charm thủ công, phù hợp trang trí balo, túi xách hoặc làm quà tặng.',
    h1: 'Móc khóa handmade Đồng Nai – cho túi, balo và điện thoại',
    intro:
      'Móc khóa handmade của Mushroomie tại Đồng Nai được phối hạt và charm thủ công, giúp balo, túi xách, chìa khóa hay điện thoại của bạn thêm điểm nhấn dễ thương. Có mẫu sẵn và nhận làm theo yêu cầu.',
    highlights: [
      { emoji: '🎒', title: 'Điểm nhấn cho đồ dùng', body: 'Trang trí balo, túi, chìa khóa, điện thoại thêm cá tính và nổi bật.' },
      { emoji: '🧷', title: 'Phối hạt & charm', body: 'Nhiều kiểu charm cute để chọn theo sở thích và màu sắc yêu thích.' },
      { emoji: '🎁', title: 'Quà nhỏ dễ thương', body: 'Giá dễ tiếp cận, gọn nhẹ, hợp làm quà tặng bạn bè.' },
    ],
    productLinks: [productHub.keychain, productHub.all, productHub.contact],
    cta: { label: 'Xem mẫu móc khóa & charm', href: '/san-pham?category=moc-khoa' },
    related: ['moc-khoa-handmade-theo-yeu-cau-dong-nai', 'phu-kien-handmade-dong-nai', 'qua-tang-handmade-dong-nai'],
  },
  {
    slug: 'moc-khoa-handmade-theo-yeu-cau-dong-nai',
    area: 'Đồng Nai',
    group: 'moc-khoa',
    crumb: 'Móc khóa theo yêu cầu Đồng Nai',
    serviceType: 'Móc khóa handmade theo yêu cầu',
    seoTitle: 'Móc Khóa Handmade Theo Yêu Cầu Đồng Nai – Làm Riêng Cho Bạn',
    metaDescription:
      'Mushroomie nhận làm móc khóa handmade theo yêu cầu tại Đồng Nai, từ màu sắc, charm đến kiểu phối phù hợp cá tính riêng.',
    h1: 'Móc khóa handmade theo yêu cầu Đồng Nai',
    intro:
      'Bạn muốn một chiếc móc khóa không đụng hàng? Mushroomie nhận làm móc khóa handmade theo yêu cầu tại Đồng Nai: chọn màu, chọn charm, thêm tên hoặc ký hiệu và phối kiểu theo đúng cá tính của bạn hoặc người nhận.',
    highlights: [
      { emoji: '🛠️', title: 'Làm riêng theo yêu cầu', body: 'Từ màu sắc, charm đến chữ/ký hiệu — Mushroomie làm đúng theo mô tả của bạn.' },
      { emoji: '🎨', title: 'Không đại trà', body: 'Mỗi chiếc là một thiết kế riêng, mang dấu ấn cá nhân.' },
      { emoji: '💬', title: 'Chốt mẫu dễ dàng', body: 'Nhắn tin mô tả ý tưởng, Mushroomie tư vấn và báo mẫu trước khi làm.' },
    ],
    productLinks: [productHub.keychain, productHub.contact, productHub.all],
    cta: { label: 'Xem mẫu móc khóa & charm', href: '/san-pham?category=moc-khoa' },
    related: ['moc-khoa-handmade-dong-nai', 'vong-tay-custom-dong-nai', 'qua-tang-ca-nhan-hoa-dong-nai'],
  },
  {
    slug: 'qua-tang-handmade-dong-nai',
    area: 'Đồng Nai',
    group: 'qua-tang',
    crumb: 'Quà tặng handmade Đồng Nai',
    serviceType: 'Quà tặng handmade',
    seoTitle: 'Quà Tặng Handmade Đồng Nai – Món Quà Nhỏ Có Dấu Ấn Riêng',
    metaDescription:
      'Mushroomie gợi ý quà tặng handmade tại Đồng Nai: vòng tay, móc khóa, charm và hộp quà custom theo màu sắc, phong cách người nhận.',
    h1: 'Quà tặng handmade Đồng Nai – món quà nhỏ có dấu ấn riêng',
    intro:
      'Tìm một món quà nhỏ mà giàu cảm xúc ở Đồng Nai? Mushroomie có vòng tay, móc khóa, charm và hộp quà handmade, có thể custom theo màu sắc và phong cách người nhận — hợp cho sinh nhật, kỷ niệm, 20/10, Noel hay Valentine.',
    highlights: [
      { emoji: '🎁', title: 'Set quà chỉn chu', body: 'Phụ kiện nhỏ xinh đóng gói gọn gàng, kèm thiệp, sẵn sàng để tặng.' },
      { emoji: '🗓️', title: 'Hợp mọi dịp', body: 'Sinh nhật, kỷ niệm, 20/10, Noel, Valentine — chọn quà theo dịp và người nhận.' },
      { emoji: '💗', title: 'Cá nhân hóa cảm xúc', body: 'Thêm tên, màu hoặc charm ý nghĩa để món quà thật sự dành riêng cho ai đó.' },
    ],
    productLinks: [productHub.gift, productHub.all, productHub.contact],
    cta: { label: 'Xem set quà tặng', href: '/san-pham' },
    related: ['qua-tang-ca-nhan-hoa-dong-nai', 'vong-tay-handmade-dong-nai', 'phu-kien-handmade-dong-nai'],
  },
  {
    slug: 'qua-tang-ca-nhan-hoa-dong-nai',
    area: 'Đồng Nai',
    group: 'qua-tang',
    crumb: 'Quà tặng cá nhân hóa Đồng Nai',
    serviceType: 'Quà tặng cá nhân hóa handmade',
    seoTitle: 'Quà Tặng Cá Nhân Hóa Đồng Nai – Phụ Kiện Handmade Theo Gu Người Nhận',
    metaDescription:
      'Đặt quà tặng cá nhân hóa tại Đồng Nai cùng Mushroomie: chọn màu, charm, kiểu dáng và cách gói quà theo cảm xúc riêng.',
    h1: 'Quà tặng cá nhân hóa Đồng Nai – theo gu người nhận',
    intro:
      'Quà cá nhân hóa là món quà kể được câu chuyện riêng. Tại Đồng Nai, Mushroomie giúp bạn tạo set quà handmade theo gu người nhận: chọn màu, charm, kiểu dáng và cách gói — từ từng hạt nhỏ, tạo nên món quà có dấu ấn riêng.',
    highlights: [
      { emoji: '✍️', title: 'Theo tên & sở thích', body: 'Thêm tên, màu yêu thích hoặc charm gắn với kỷ niệm của người nhận.' },
      { emoji: '🎨', title: 'Bạn chọn từng chi tiết', body: 'Từ sản phẩm bên trong đến cách phối và đóng gói đều tùy chỉnh được.' },
      { emoji: '💝', title: 'Ý nghĩa hơn quà mua sẵn', body: 'Một món quà làm riêng luôn chạm cảm xúc hơn đồ đại trà.' },
    ],
    productLinks: [productHub.gift, productHub.contact, productHub.all],
    cta: { label: 'Xem set quà tặng', href: '/san-pham' },
    related: ['qua-tang-handmade-dong-nai', 'vong-tay-custom-dong-nai', 'moc-khoa-handmade-theo-yeu-cau-dong-nai'],
  },
]

export function getLocalPage(slug: string): LocalPage | undefined {
  return LOCAL_PAGES.find((p) => p.slug === slug)
}

export function getRelatedPages(slug: string): LocalPage[] {
  const page = getLocalPage(slug)
  if (!page) return []
  return page.related.map(getLocalPage).filter((p): p is LocalPage => Boolean(p))
}

// ─────────────────────────────────────────────
// JSON-LD builders
// ─────────────────────────────────────────────

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: BRAND.name,
    legalName: BRAND.legalName,
    description: BRAND.description,
    slogan: BRAND.slogan,
    url: SITE_URL,
    logo: BRAND.logo,
    image: BRAND.logo,
    telephone: BRAND.phoneE164,
    email: BRAND.email,
    priceRange: '₫₫',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.streetAddress,
      addressLocality: BRAND.addressLocality,
      addressRegion: BRAND.addressRegion,
      addressCountry: BRAND.addressCountry,
    },
    areaServed: BRAND.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
    sameAs: BRAND.sameAs,
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BRAND.name,
    description: BRAND.description,
    inLanguage: 'vi-VN',
    publisher: { '@id': `${SITE_URL}/#localbusiness` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/san-pham?search={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

/** Schema Service cho từng landing local (áp dụng khu vực + loại dịch vụ) */
export function localServiceSchema(page: LocalPage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.h1,
    serviceType: page.serviceType,
    description: page.metaDescription,
    areaServed: { '@type': 'Place', name: page.area },
    provider: { '@id': `${SITE_URL}/#localbusiness` },
    url: `${SITE_URL}/${page.slug}`,
  }
}

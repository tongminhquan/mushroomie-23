import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo-assets'
import { getAreaDelivery } from '@/lib/local-area-content'
import type { LocalB30ContentSectionId } from '@/lib/local-seo-b30'

/**
 * Gói Local SEO cho Mushroomie — bản đồ từ khóa địa phương (Đồng Nai, Biên Hòa,
 * Trảng Dài, TP.HCM) chuyển thành dữ liệu trang landing + schema dùng chung.
 *
 * Nguồn: file mushroomie_local_seo_keywords.csv (khách cung cấp).
 * Đợt 1 triển khai 12 slug ưu tiên; các slug còn lại nối tiếp cùng cấu trúc này.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn'

const PHONE = '0947192590'
const STREET_ADDRESS = 'Hẻm 2, tổ 11, phường Trảng Dài'
const ADDRESS_REGION = 'Đồng Nai'
const VERIFIED_GEO = {
  latitude: 10.996333,
  longitude: 106.882306,
} as const
const COORDINATE_PAIR = `${VERIFIED_GEO.latitude},${VERIFIED_GEO.longitude}`
const SOCIALS = {
  facebook: {
    url: 'https://www.facebook.com/mushr00mie',
    handle: 'fb.com/mushr00mie',
  },
  instagram: {
    url: 'https://www.instagram.com/mushr00mie._/',
    handle: '@mushr00mie._',
  },
  tiktok: {
    url: 'https://www.tiktok.com/@mushr00mie._',
    handle: '@mushr00mie._',
  },
  shopee: {
    url: 'https://shopee.vn/shop/475544379',
    handle: 'Mushroomie',
  },
} as const

/** Thông tin NAP nhất quán (dùng cho schema + trang liên hệ + footer) */
export const BRAND = {
  name: 'Mushroomie',
  legalName: 'Mushroomie Handmade',
  slogan: 'Từ từng hạt nhỏ, tạo phong cách riêng',
  description:
    'Thương hiệu phụ kiện handmade cá nhân hóa cho giới trẻ: vòng tay, móc khóa, charm, dây chuyền và quà tặng custom theo màu sắc, kiểu dáng và cá tính riêng.',
  phone: PHONE,
  phoneDisplay: PHONE.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3'),
  phoneE164: '+84947192590',
  email: 'cskh@mushroomie.io.vn',
  streetAddress: STREET_ADDRESS,
  addressLocality: 'Trảng Dài',
  addressRegion: ADDRESS_REGION,
  addressCountry: 'VN',
  formattedAddress: `${STREET_ADDRESS}, tỉnh ${ADDRESS_REGION}`,
  areaServed: ['Đồng Nai', 'Biên Hòa', 'Trảng Dài', 'TP. Hồ Chí Minh'],
  socials: SOCIALS,
  sameAs: Object.values(SOCIALS).map((social) => social.url),
  shopee: SOCIALS.shopee.url,
  mapUrl: `https://www.google.com/maps?q=${COORDINATE_PAIR}`,
  mapEmbedUrl: `https://www.google.com/maps/?q=${COORDINATE_PAIR}&output=embed`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${COORDINATE_PAIR}`,
  geo: VERIFIED_GEO,
  nearbyLandmarks: [
    {
      name: 'Trường Tiểu học Trảng Dài',
      addressHint: 'đường Nguyễn Thái Học',
      distanceKm: 2.1,
      travelTime: 'khoảng 4–7 phút',
    },
    {
      name: 'UBND phường Trảng Dài',
      addressHint: '462 Bùi Trọng Nghĩa',
      distanceKm: 2.4,
      travelTime: 'khoảng 5–8 phút',
    },
  ],
  openingHours: {
    opens: '08:00',
    closes: '21:00',
  },
  logo: `${SITE_URL}/logo.webp`,
  socialImage: `${SITE_URL}${DEFAULT_SOCIAL_IMAGE.path}`,
} as const

export type LocalArea = 'Đồng Nai' | 'Biên Hòa' | 'Trảng Dài' | 'TP.HCM'
export type LocalGroup = 'phu-kien' | 'vong-tay' | 'moc-khoa' | 'qua-tang'

export interface LocalHighlight {
  emoji: string
  title: string
  body: string
}

export interface LocalIntentSection {
  id?: LocalB30ContentSectionId
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
  /** Nội dung tư vấn riêng cho ý định tìm kiếm của landing ưu tiên */
  intentSections?: LocalIntentSection[]
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

export interface LocalFaq {
  question: string
  answer: string
}

/**
 * Chỉ các slug có route thật mới được đưa vào sitemap và liên kết nội bộ.
 * Mỗi slug ở đây bắt buộc phải có src/app/(user)/<slug>/page.tsx — tests/local-seo.test.ts
 * kiểm tra ràng buộc này, và không slug nào được `related` tới trang chưa xuất bản.
 */
export const PUBLISHED_LOCAL_SLUGS = [
  'phu-kien-handmade-dong-nai',
  'shop-phu-kien-handmade-dong-nai',
  'phu-kien-handmade-bien-hoa',
  'phu-kien-handmade-tphcm',
  'vong-tay-handmade-dong-nai',
  'vong-tay-custom-dong-nai',
  'vong-tay-custom-bien-hoa',
  'moc-khoa-handmade-dong-nai',
  'moc-khoa-handmade-theo-yeu-cau-dong-nai',
  'qua-tang-handmade-dong-nai',
  'qua-tang-ca-nhan-hoa-dong-nai',
  // Đợt 2: mở rộng Trảng Dài / Biên Hòa / TP.HCM + loại sản phẩm
  'phu-kien-handmade-trang-dai',
  'vong-tay-handmade-trang-dai',
  'shop-phu-kien-handmade-bien-hoa',
  'vong-tay-handmade-bien-hoa',
  'moc-khoa-handmade-bien-hoa',
  'qua-tang-handmade-bien-hoa',
  'vong-tay-custom-tphcm',
  'moc-khoa-handmade-tphcm',
  'qua-tang-handmade-tphcm',
  'vong-tay-cap-doi-dong-nai',
  'charm-handmade-dong-nai',
  'day-chuyen-handmade-dong-nai',
] as const

export const LOCAL_SEO_LAST_MODIFIED = new Date('2026-08-12T00:00:00.000Z')

export function getLocalSeoLastModified(_slug: string): Date {
  void _slug
  return LOCAL_SEO_LAST_MODIFIED
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
  if (area === 'Trảng Dài') {
    return 'Mushroomie ở ngay khu vực Trảng Dài, tỉnh Đồng Nai — bạn có thể hẹn nhận trực tiếp hoặc chọn giao hàng linh hoạt trong khu vực, đồng thời Mushroomie giao online đến TP.HCM.'
  }
  return `Mushroomie ở khu vực Trảng Dài, ${area === 'Đồng Nai' ? 'tỉnh Đồng Nai' : area} và hỗ trợ nhận đơn trực tiếp lẫn giao hàng linh hoạt trong ${area}, đồng thời giao online đến TP.HCM.`
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
    seoTitle: 'Phụ Kiện Handmade Đồng Nai – Custom Theo Gu Cá Tính',
    metaDescription:
      'Khám phá phụ kiện handmade Mushroomie tại Đồng Nai: vòng tay, móc khóa, charm và quà tặng custom theo màu sắc, kiểu dáng, cá tính riêng. Xem mẫu.',
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
    seoTitle: 'Shop Phụ Kiện Handmade Đồng Nai – Đặt Mẫu Theo Gu Riêng',
    metaDescription:
      'Mushroomie là shop phụ kiện handmade tại Đồng Nai, chuyên vòng tay custom, móc khóa, charm và hộp quà cá nhân hóa; đặt online, tư vấn theo gu.',
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
    seoTitle: 'Phụ Kiện Handmade Biên Hòa – Custom Theo Gu Cá Tính',
    metaDescription:
      'Mushroomie phục vụ phụ kiện handmade tại Biên Hòa: vòng tay, móc khóa, charm và set quà phối thủ công theo sở thích, giao thuận tiện từ Trảng Dài.',
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
    seoTitle: 'Phụ Kiện Handmade TP.HCM – Đặt Online, Giao Tận Nơi',
    metaDescription:
      'Mushroomie nhận đặt phụ kiện handmade giao TP.HCM: vòng tay custom, móc khóa, charm và set quà nhỏ xinh; tư vấn, chốt mẫu online trước khi làm.',
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
    seoTitle: 'Vòng Tay Handmade Đồng Nai – Phối Hạt Theo Gu Riêng',
    metaDescription:
      'Khám phá vòng tay handmade Đồng Nai tại Mushroomie: mẫu hạt cườm, charm, vòng đôi và custom theo size, phối thủ công để đeo hoặc làm quà. Xem mẫu.',
    h1: 'Vòng tay handmade Đồng Nai – nhỏ xinh, dễ phối',
    intro:
      'Vòng tay handmade của Mushroomie tại Đồng Nai được phối thủ công từ hạt, dây và charm, thiết kế nhỏ xinh dễ phối đồ. Bạn có thể chọn vòng hạt cườm, vòng charm, vòng đôi hay vòng bạn thân, và custom màu – charm theo gu riêng.',
    highlights: [
      { emoji: '🌈', title: 'Đa dạng kiểu', body: 'Vòng hạt cườm, vòng charm, vòng đôi, vòng bạn thân — nhiều lựa chọn để phối theo mood.' },
      { emoji: '🎨', title: 'Custom màu & charm', body: 'Tự chọn tông màu và charm yêu thích để chiếc vòng thật sự là của riêng bạn.' },
      { emoji: '🎓', title: 'Hợp mọi dịp', body: 'Đeo đi học, đi chơi, chụp ảnh hay làm quà tặng nhỏ đều xinh.' },
    ],
    intentSections: [
      {
        id: 'bracelet-shop-dong-nai',
        title: 'Shop vòng tay handmade Đồng Nai: xem mẫu và đặt đúng size',
        body: 'Nếu bạn tìm shop vòng tay handmade Đồng Nai, Mushroomie có mẫu hạt, charm, vòng đôi và nhận phối theo gu tại xưởng Trảng Dài. Bạn có thể xem mẫu trên website, gửi số đo cổ tay và nhắn màu mong muốn để được tư vấn. Việc hẹn nhận trực tiếp chỉ được chốt sau khi đơn đã hoàn thiện; khách ở xa vẫn có thể đặt online và giao hàng.',
      },
      {
        title: 'Chọn size vòng tay handmade vừa cổ tay',
        body: 'Để vòng đeo thoải mái, bạn nên đo sát quanh cổ tay bằng thước dây hoặc một sợi chỉ rồi ghi lại số đo theo centimet. Nếu thích vòng ôm gọn, Mushroomie sẽ chừa độ thoải mái vừa phải; nếu thích đeo lỏng hoặc phối nhiều vòng, hãy nói rõ khi đặt. Size được xác nhận trước khi làm để hạn chế vòng quá chật, quá rộng hoặc phải chỉnh lại sau khi nhận.',
      },
      {
        title: 'Chọn hạt, màu và charm theo cách sử dụng',
        body: 'Vòng đeo hằng ngày nên ưu tiên hạt nhẹ, tông màu dễ phối và một charm làm điểm nhấn. Vòng tặng bạn thân hoặc người yêu có thể dùng hai bảng màu liên kết, chữ cái hoặc biểu tượng chung nhưng vẫn giữ nét riêng cho từng người. Khi gửi yêu cầu, bạn chỉ cần nêu màu yêu thích, dịp sử dụng và ngân sách; Mushroomie sẽ đề xuất cách phối phù hợp với vật liệu đang có.',
      },
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
    seoTitle: 'Vòng Tay Custom Đồng Nai – Chọn Màu, Charm Và Tên Riêng',
    metaDescription:
      'Mushroomie nhận làm vòng tay custom tại Đồng Nai: chọn màu, charm, size, kiểu dáng và tên theo sở thích; được tư vấn, chốt mẫu trước khi làm.',
    h1: 'Vòng tay custom Đồng Nai – chọn màu, chọn charm theo gu riêng',
    intro:
      'Mushroomie nhận làm vòng tay custom tại Đồng Nai theo đúng ý bạn: chọn màu sắc, chọn charm, chọn size và kiểu phối. Phù hợp làm phụ kiện cá nhân, vòng đôi hoặc vòng bạn thân lưu giữ kỷ niệm.',
    highlights: [
      { emoji: '🎨', title: 'Bạn chọn – Mushroomie làm', body: 'Từ màu dây, hạt đến charm và ký hiệu riêng, mọi chi tiết đều theo yêu cầu của bạn.' },
      { emoji: '👯', title: 'Vòng đôi & bạn thân', body: 'Phối set cho hai người hoặc cả nhóm để lưu giữ kỷ niệm cùng nhau.' },
      { emoji: '💬', title: 'Tư vấn tận tình', body: 'Nhắn tin để được gợi ý phối màu và charm hợp phong cách hoặc dịp tặng.' },
    ],
    intentSections: [
      {
        id: 'bracelet-made-to-order-dong-nai',
        title: 'Vòng tay theo yêu cầu Đồng Nai: từ ý tưởng đến mẫu đã chốt',
        body: 'Khi đặt vòng tay theo yêu cầu Đồng Nai, bạn gửi số đo cổ tay, màu chủ đạo, loại hạt, charm và dịp sử dụng. Mushroomie đối chiếu vật liệu đang có, tư vấn cách phối rồi xác nhận mẫu, chi phí và thời gian trước khi làm. Quy trình này giúp yêu cầu cá nhân hóa rõ ràng, tránh hứa vật liệu hoặc lịch giao chưa được kiểm tra.',
      },
      {
        id: 'bracelet-name-dong-nai',
        title: 'Vòng tay handmade theo tên Đồng Nai cần chuẩn bị gì?',
        body: 'Với vòng tay handmade theo tên Đồng Nai, bạn cần kiểm tra chính tả tên hoặc chữ cái, chọn bảng màu, size và biểu tượng đi kèm. Tên dài có thể cần đổi bố cục hoặc dùng chữ viết tắt để vòng vẫn cân đối. Vì đây là sản phẩm cá nhân hóa, Mushroomie sẽ gửi lại nội dung đã nhận để hai bên chốt chính xác trước khi xâu hạt và hoàn thiện.',
      },
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
    seoTitle: 'Vòng Tay Custom Biên Hòa – Chọn Màu, Charm Và Tên Riêng',
    metaDescription:
      'Đặt vòng tay custom Biên Hòa tại Mushroomie: chọn tên, size, màu hạt và charm theo gu; được tư vấn cách phối, thời gian hoàn thiện và giao nhận rõ ràng.',
    h1: 'Vòng tay custom Biên Hòa – đặt theo tên, màu và charm',
    intro:
      'Ở Biên Hòa và muốn một chiếc vòng tay của riêng mình? Mushroomie (ngay gần Biên Hòa, tại Trảng Dài – Đồng Nai) nhận đặt vòng tay custom: chọn màu, charm, thêm chữ cái hoặc ký hiệu và phối kiểu dáng theo gu của bạn.',
    highlights: [
      { emoji: '📍', title: 'Gần Biên Hòa', body: 'Vị trí thuận tiện để đặt và nhận hàng nhanh trong khu vực Biên Hòa – Đồng Nai.' },
      { emoji: '🔤', title: 'Theo tên & ký hiệu', body: 'Thêm chữ cái, tên hoặc charm ý nghĩa để chiếc vòng thật riêng biệt.' },
      { emoji: '🎨', title: 'Phối theo gu', body: 'Chọn tông màu và charm hợp phong cách hoặc người nhận.' },
    ],
    intentSections: [
      {
        title: 'Cần gửi gì khi đặt vòng tay custom tại Biên Hòa?',
        body: 'Một yêu cầu rõ ràng nên có số đo cổ tay, hai hoặc ba màu chủ đạo, chữ cái hoặc tên muốn thêm, loại charm yêu thích và ảnh tham khảo nếu có. Bạn cũng nên cho biết vòng dùng để đeo hằng ngày, làm quà hay làm set đôi để Mushroomie cân bằng độ nổi bật và độ bền. Trước khi làm, cửa hàng sẽ xác nhận lại phương án, vật liệu có sẵn, giá và thời gian dự kiến.',
      },
      {
        title: 'Thời gian hoàn thiện và cách nhận vòng',
        body: 'Vòng custom cần thời gian phối thử và hoàn thiện thủ công nên không giống sản phẩm có sẵn. Thời gian cụ thể phụ thuộc số lượng, mức độ cá nhân hóa và vật liệu tại thời điểm đặt; lịch hẹn sẽ được chốt trước khi bạn thanh toán. Khách ở Biên Hòa có thể chọn giao hàng hoặc liên hệ trước để hẹn nhận gần khu vực Trảng Dài, tránh đến khi đơn chưa hoàn thiện.',
      },
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
    seoTitle: 'Móc Khóa Handmade Đồng Nai – Phối Charm Theo Gu Riêng',
    metaDescription:
      'Khám phá móc khóa handmade Đồng Nai tại Mushroomie: phối hạt và charm cho balo, túi, chìa khóa; nhận custom theo màu, tên và nhu cầu làm quà nhóm.',
    h1: 'Móc khóa handmade Đồng Nai – cho túi, balo và điện thoại',
    intro:
      'Móc khóa handmade của Mushroomie tại Đồng Nai được phối hạt và charm thủ công, giúp balo, túi xách, chìa khóa hay điện thoại của bạn thêm điểm nhấn dễ thương. Có mẫu sẵn và nhận làm theo yêu cầu.',
    highlights: [
      { emoji: '🎒', title: 'Điểm nhấn cho đồ dùng', body: 'Trang trí balo, túi, chìa khóa, điện thoại thêm cá tính và nổi bật.' },
      { emoji: '🧷', title: 'Phối hạt & charm', body: 'Nhiều kiểu charm cute để chọn theo sở thích và màu sắc yêu thích.' },
      { emoji: '🎁', title: 'Quà nhỏ dễ thương', body: 'Giá dễ tiếp cận, gọn nhẹ, hợp làm quà tặng bạn bè.' },
    ],
    intentSections: [
      {
        title: 'Chọn móc khóa theo balo, túi hay chùm chìa khóa',
        body: 'Móc dùng cho chùm chìa khóa nên gọn, chắc và không có quá nhiều chi tiết dễ vướng. Với balo hoặc túi xách, bạn có thể chọn dây dài hơn, cụm hạt nổi bật hoặc charm theo chủ đề để nhìn rõ từ xa. Dây treo điện thoại cần đúng cấu tạo và điểm gắn của mẫu; vì vậy hãy xem công dụng ghi trên sản phẩm, không mặc định mọi móc khóa đều dùng an toàn cho điện thoại.',
      },
      {
        title: 'Đặt móc khóa nhóm và quà tặng theo chủ đề',
        body: 'Khi đặt cho lớp, nhóm bạn hoặc sự kiện nhỏ, hãy gửi số lượng, ngày cần nhận, màu chung và phần chi tiết muốn thay đổi cho từng người. Mushroomie có thể giữ một ngôn ngữ thiết kế thống nhất rồi biến tấu chữ cái, màu hạt hoặc charm để mỗi món vẫn dễ nhận biết. Số lượng và thời hạn được kiểm tra trước nhằm bảo đảm vật liệu đủ, chất lượng đồng đều và không hẹn giao gấp thiếu thực tế.',
      },
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
    seoTitle: 'Móc Khóa Handmade Theo Yêu Cầu Đồng Nai – Làm Riêng',
    metaDescription:
      'Đặt móc khóa handmade theo yêu cầu tại Đồng Nai cùng Mushroomie: chọn màu, charm, tên và kiểu khoen; được tư vấn, chốt mẫu trước khi làm. Xem mẫu.',
    h1: 'Móc khóa handmade theo yêu cầu Đồng Nai',
    intro:
      'Bạn muốn một chiếc móc khóa không đụng hàng? Mushroomie nhận làm móc khóa handmade theo yêu cầu tại Đồng Nai: chọn màu, chọn charm, thêm tên hoặc ký hiệu và phối kiểu theo đúng cá tính của bạn hoặc người nhận.',
    highlights: [
      { emoji: '🛠️', title: 'Làm riêng theo yêu cầu', body: 'Từ màu sắc, charm đến chữ/ký hiệu — Mushroomie làm đúng theo mô tả của bạn.' },
      { emoji: '🎨', title: 'Không đại trà', body: 'Mỗi chiếc là một thiết kế riêng, mang dấu ấn cá nhân.' },
      { emoji: '💬', title: 'Chốt mẫu dễ dàng', body: 'Nhắn tin mô tả ý tưởng, Mushroomie tư vấn và báo mẫu trước khi làm.' },
    ],
    intentSections: [
      {
        id: 'keychain-custom-dong-nai',
        title: 'Móc khóa custom Đồng Nai theo tên, màu và công dụng',
        body: 'Đặt móc khóa custom Đồng Nai nên bắt đầu từ nơi bạn muốn gắn: chìa khóa, balo hay túi xách. Từ đó Mushroomie tư vấn kích thước, kiểu khoen, độ dài, màu hạt, charm và tên phù hợp. Đơn nhóm cần ghi rõ số lượng, phần thiết kế chung và chi tiết riêng từng người; vật liệu, giá và ngày nhận đều được xác nhận trước khi làm.',
      },
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
    seoTitle: 'Quà Tặng Handmade Đồng Nai – Chọn Quà Theo Từng Dịp',
    metaDescription:
      'Chọn quà tặng handmade Đồng Nai tại Mushroomie: vòng tay, móc khóa, charm và gói quà có thiệp viết tay, custom theo người nhận và dịp tặng ý nghĩa.',
    h1: 'Quà tặng handmade Đồng Nai – món quà nhỏ có dấu ấn riêng',
    intro:
      'Tìm một món quà nhỏ mà giàu cảm xúc ở Đồng Nai? Mushroomie có vòng tay, móc khóa, charm và hộp quà handmade, có thể custom theo màu sắc và phong cách người nhận — hợp cho sinh nhật, kỷ niệm, 20/10, Noel hay Valentine.',
    highlights: [
      { emoji: '🎁', title: 'Set quà chỉn chu', body: 'Phụ kiện nhỏ xinh đóng gói gọn gàng, kèm thiệp, sẵn sàng để tặng.' },
      { emoji: '🗓️', title: 'Hợp mọi dịp', body: 'Sinh nhật, kỷ niệm, 20/10, Noel, Valentine — chọn quà theo dịp và người nhận.' },
      { emoji: '💗', title: 'Cá nhân hóa cảm xúc', body: 'Thêm tên, màu hoặc charm ý nghĩa để món quà thật sự dành riêng cho ai đó.' },
    ],
    intentSections: [
      {
        id: 'birthday-gift-dong-nai',
        title: 'Chọn quà sinh nhật handmade Đồng Nai theo người nhận',
        body: 'Một món quà sinh nhật handmade Đồng Nai nên bắt đầu từ phong cách, màu yêu thích, sở thích và độ tuổi của người nhận. Bạn có thể chọn vòng tay, móc khóa hoặc set charm rồi thêm chữ cái, thiệp và cách gói phù hợp. Hãy gửi ngày cần nhận và ngân sách ngay từ đầu để Mushroomie kiểm tra thời gian làm thủ công, vật liệu và phương án giao thực tế.',
      },
      {
        title: 'Chọn quà handmade theo người nhận và dịp tặng',
        body: 'Với bạn thân, một vòng tay hoặc móc khóa có màu chung, chữ cái hay biểu tượng kỷ niệm thường dễ tạo cảm xúc. Quà sinh nhật có thể nổi bật hơn bằng charm theo sở thích; quà kỷ niệm nên ưu tiên chi tiết gắn với câu chuyện của hai người. Nếu chưa biết chọn gì, hãy cho Mushroomie biết độ tuổi, phong cách, dịp tặng và khoảng ngân sách để được gợi ý từ sản phẩm đang có thật.',
      },
      {
        title: 'Gói quà, thiệp viết tay và thời gian chuẩn bị',
        body: 'Tùy chọn gói quà áp dụng cho đơn phù hợp và có thể kèm nội dung thư tay do bạn gửi. Hãy kiểm tra chính tả, tên người nhận và giới hạn nội dung trước khi xác nhận vì thiệp được viết theo thông tin đã chốt. Với quà custom hoặc đơn cần giao đúng ngày tại Đồng Nai, nên đặt sớm để có thời gian duyệt cách phối, hoàn thiện thủ công, đóng gói và dự phòng thời gian vận chuyển.',
      },
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
    seoTitle: 'Quà Tặng Cá Nhân Hóa Đồng Nai – Chọn Theo Người Nhận',
    metaDescription:
      'Đặt quà tặng cá nhân hóa tại Đồng Nai cùng Mushroomie: chọn vòng tay, móc khóa, màu, charm, thiệp và cách gói theo người nhận, dịp tặng. Xem gợi ý.',
    h1: 'Quà tặng cá nhân hóa Đồng Nai – theo gu người nhận',
    intro:
      'Quà cá nhân hóa là món quà kể được câu chuyện riêng. Tại Đồng Nai, Mushroomie giúp bạn tạo set quà handmade theo gu người nhận: chọn màu, charm, kiểu dáng và cách gói — từ từng hạt nhỏ, tạo nên món quà có dấu ấn riêng.',
    highlights: [
      { emoji: '✍️', title: 'Theo tên & sở thích', body: 'Thêm tên, màu yêu thích hoặc charm gắn với kỷ niệm của người nhận.' },
      { emoji: '🎨', title: 'Bạn chọn từng chi tiết', body: 'Từ sản phẩm bên trong đến cách phối và đóng gói đều tùy chỉnh được.' },
      { emoji: '💝', title: 'Ý nghĩa hơn quà mua sẵn', body: 'Một món quà làm riêng luôn chạm cảm xúc hơn đồ đại trà.' },
    ],
    intentSections: [
      {
        id: 'lover-gift-dong-nai',
        title: 'Quà handmade cho người yêu Đồng Nai mang dấu ấn riêng',
        body: 'Khi chọn quà handmade cho người yêu Đồng Nai, một chi tiết gắn với câu chuyện chung thường ý nghĩa hơn việc thêm thật nhiều charm. Bạn có thể dùng màu kỷ niệm, chữ cái, ngày đặc biệt hoặc biểu tượng hai người cùng hiểu. Mushroomie tư vấn cách đưa chi tiết đó vào vòng tay, móc khóa hay set quà và chốt nội dung thiệp trước khi hoàn thiện.',
      },
    ],
    productLinks: [productHub.gift, productHub.contact, productHub.all],
    cta: { label: 'Xem set quà tặng', href: '/san-pham' },
    related: ['qua-tang-handmade-dong-nai', 'vong-tay-custom-dong-nai', 'moc-khoa-handmade-theo-yeu-cau-dong-nai'],
  },

  // ── Đợt 2: mở rộng khu vực Trảng Dài / Biên Hòa / TP.HCM + loại sản phẩm ──
  {
    slug: 'phu-kien-handmade-trang-dai',
    area: 'Trảng Dài',
    group: 'phu-kien',
    crumb: 'Phụ kiện handmade Trảng Dài',
    serviceType: 'Phụ kiện handmade cá nhân hóa',
    seoTitle: 'Phụ Kiện Handmade Trảng Dài – Custom Theo Gu Riêng',
    metaDescription:
      'Mushroomie làm phụ kiện handmade tại Trảng Dài, Đồng Nai: vòng tay, móc khóa, charm và quà custom; thuận tiện đặt online hoặc hẹn nhận. Xem mẫu gần bạn.',
    h1: 'Phụ kiện handmade Trảng Dài – ngay tại khu của bạn',
    intro:
      'Mushroomie có xưởng nhỏ ngay tại Trảng Dài, tỉnh Đồng Nai, chuyên phụ kiện handmade cá nhân hóa: vòng tay, móc khóa, charm và quà tặng. Ở gần nên bạn đặt, chốt mẫu và nhận hàng đều nhanh gọn — mỗi món đều có thể chọn màu và charm theo gu riêng.',
    highlights: [
      { emoji: '📍', title: 'Ngay tại Trảng Dài', body: 'Xưởng đặt tại Hẻm 2, tổ 11, Phường Trảng Dài — thuận tiện cho khách quanh khu vực.' },
      { emoji: '🎨', title: 'Custom theo gu', body: 'Chọn màu, charm, size và kiểu dáng để phụ kiện mang đúng dấu ấn của bạn.' },
      { emoji: '🤝', title: 'Đặt & nhận linh hoạt', body: 'Hẹn nhận trực tiếp hoặc giao tận nơi trong khu vực Trảng Dài – Đồng Nai.' },
    ],
    productLinks: [productHub.all, productHub.bracelet, productHub.keychain, productHub.contact],
    cta: { label: 'Xem phụ kiện handmade', href: '/san-pham' },
    related: ['phu-kien-handmade-dong-nai', 'vong-tay-handmade-trang-dai', 'moc-khoa-handmade-dong-nai'],
  },
  {
    slug: 'vong-tay-handmade-trang-dai',
    area: 'Trảng Dài',
    group: 'vong-tay',
    crumb: 'Vòng tay handmade Trảng Dài',
    serviceType: 'Vòng tay handmade',
    seoTitle: 'Vòng Tay Handmade Trảng Dài – Phối Hạt Theo Gu Riêng',
    metaDescription:
      'Vòng tay handmade Mushroomie tại Trảng Dài, Đồng Nai: phối hạt và charm thủ công, chọn màu, đo size, chốt mẫu rồi hẹn giao hoặc nhận. Xem cách đo size.',
    h1: 'Vòng tay handmade Trảng Dài – phối tay từng chiếc',
    intro:
      'Ở Trảng Dài và muốn một chiếc vòng tay của riêng mình? Mushroomie phối tay từng chiếc từ hạt, dây và charm ngay tại khu vực, cho bạn chọn màu và charm theo gu — hợp đi học, đi chơi hoặc làm quà tặng nhỏ.',
    highlights: [
      { emoji: '🧶', title: 'Phối tay tỉ mỉ', body: 'Từng chiếc vòng được làm thủ công, không sản xuất đại trà.' },
      { emoji: '🎨', title: 'Chọn màu & charm', body: 'Tự phối tông màu và charm để chiếc vòng thật sự là của bạn.' },
      { emoji: '📍', title: 'Gần bạn', body: 'Xưởng tại Trảng Dài nên đặt và nhận vòng đều nhanh gọn.' },
    ],
    productLinks: [productHub.bracelet, productHub.all, productHub.contact],
    cta: { label: 'Xem mẫu vòng tay', href: '/san-pham?category=vong-tay' },
    related: ['vong-tay-handmade-dong-nai', 'vong-tay-custom-dong-nai', 'phu-kien-handmade-trang-dai'],
  },
  {
    slug: 'shop-phu-kien-handmade-bien-hoa',
    area: 'Biên Hòa',
    group: 'phu-kien',
    crumb: 'Shop phụ kiện handmade Biên Hòa',
    serviceType: 'Shop phụ kiện handmade',
    seoTitle: 'Shop Phụ Kiện Handmade Biên Hòa – Đặt Mẫu Online Theo Gu',
    metaDescription:
      'Mushroomie là shop phụ kiện handmade phục vụ Biên Hòa: vòng tay custom, móc khóa, charm và quà cá nhân hóa; đặt online từ xưởng Trảng Dài. Xem mẫu.',
    h1: 'Shop phụ kiện handmade Biên Hòa',
    intro:
      'Bạn ở Biên Hòa và tìm một shop phụ kiện handmade để đặt vòng tay custom, móc khóa hay quà tặng cá nhân hóa? Mushroomie (ngay gần Biên Hòa, tại Trảng Dài – Đồng Nai) làm thủ công từng món, tư vấn phối màu – charm và hỗ trợ đặt qua website, Facebook lẫn Shopee.',
    highlights: [
      { emoji: '🛍️', title: 'Mẫu sẵn & custom', body: 'Vòng tay, móc khóa, charm, dây đeo và set quà — có mẫu sẵn và nhận làm riêng.' },
      { emoji: '📍', title: 'Gần Biên Hòa', body: 'Vị trí tại Trảng Dài – Đồng Nai giúp đặt và giao hàng nhanh cho khách Biên Hòa.' },
      { emoji: '💬', title: 'Tư vấn theo gu', body: 'Nhắn tin để Mushroomie gợi ý màu và charm hợp phong cách hoặc dịp tặng.' },
    ],
    productLinks: [productHub.all, productHub.bracelet, productHub.gift, productHub.contact],
    cta: { label: 'Đặt mẫu riêng', href: '/lien-he' },
    related: ['phu-kien-handmade-bien-hoa', 'vong-tay-custom-bien-hoa', 'moc-khoa-handmade-bien-hoa'],
  },
  {
    slug: 'vong-tay-handmade-bien-hoa',
    area: 'Biên Hòa',
    group: 'vong-tay',
    crumb: 'Vòng tay handmade Biên Hòa',
    serviceType: 'Vòng tay handmade',
    seoTitle: 'Vòng Tay Handmade Biên Hòa – Phối Hạt Theo Gu Riêng',
    metaDescription:
      'Vòng tay handmade Mushroomie phục vụ Biên Hòa: phối hạt và charm thủ công, chọn màu, đo size, chốt mẫu rồi giao thuận tiện từ Trảng Dài. Xem mẫu.',
    h1: 'Vòng tay handmade Biên Hòa – nhỏ xinh, dễ phối',
    intro:
      'Ở Biên Hòa và thích vòng tay handmade dễ thương, có thể phối riêng? Mushroomie phối tay từng chiếc từ hạt, dây và charm, cho bạn chọn màu và charm theo gu, giao hàng thuận tiện trong khu vực Biên Hòa – Đồng Nai.',
    highlights: [
      { emoji: '🌈', title: 'Đa dạng kiểu', body: 'Vòng hạt cườm, vòng charm, vòng đôi, vòng bạn thân — nhiều lựa chọn để phối.' },
      { emoji: '🎨', title: 'Custom màu & charm', body: 'Chọn tông màu và charm yêu thích cho chiếc vòng của riêng bạn.' },
      { emoji: '📍', title: 'Gần Biên Hòa', body: 'Đặt và nhận vòng nhanh gọn trong khu vực Biên Hòa – Đồng Nai.' },
    ],
    productLinks: [productHub.bracelet, productHub.all, productHub.contact],
    cta: { label: 'Xem mẫu vòng tay', href: '/san-pham?category=vong-tay' },
    related: ['vong-tay-custom-bien-hoa', 'phu-kien-handmade-bien-hoa', 'vong-tay-handmade-dong-nai'],
  },
  {
    slug: 'moc-khoa-handmade-bien-hoa',
    area: 'Biên Hòa',
    group: 'moc-khoa',
    crumb: 'Móc khóa handmade Biên Hòa',
    serviceType: 'Móc khóa & charm handmade',
    seoTitle: 'Móc Khóa Handmade Biên Hòa – Chọn Charm Theo Gu Riêng',
    metaDescription:
      'Móc khóa handmade Mushroomie phục vụ Biên Hòa: phối hạt, charm, tên và kiểu khoen cho balo, túi hoặc quà nhóm; chốt mẫu trước khi làm. Xem mẫu custom.',
    h1: 'Móc khóa handmade Biên Hòa – điểm nhấn cho đồ dùng',
    intro:
      'Muốn balo, túi xách hay chìa khóa của mình thêm dễ thương? Móc khóa handmade Mushroomie phục vụ khu vực Biên Hòa được phối hạt và charm thủ công, có mẫu sẵn và nhận làm theo yêu cầu, giao nhanh trong khu vực Biên Hòa – Đồng Nai.',
    highlights: [
      { emoji: '🎒', title: 'Điểm nhấn cho đồ dùng', body: 'Trang trí balo, túi, chìa khóa, điện thoại thêm cá tính.' },
      { emoji: '🧷', title: 'Phối hạt & charm', body: 'Nhiều kiểu charm cute để chọn theo sở thích và màu sắc.' },
      { emoji: '📍', title: 'Gần Biên Hòa', body: 'Đặt và nhận hàng thuận tiện trong khu vực Biên Hòa – Đồng Nai.' },
    ],
    productLinks: [productHub.keychain, productHub.charm, productHub.contact],
    cta: { label: 'Xem mẫu móc khóa', href: '/san-pham?category=moc-khoa' },
    related: ['moc-khoa-handmade-dong-nai', 'phu-kien-handmade-bien-hoa', 'charm-handmade-dong-nai'],
  },
  {
    slug: 'qua-tang-handmade-bien-hoa',
    area: 'Biên Hòa',
    group: 'qua-tang',
    crumb: 'Quà tặng handmade Biên Hòa',
    serviceType: 'Quà tặng handmade',
    seoTitle: 'Quà Tặng Handmade Biên Hòa – Chọn Quà Theo Từng Dịp',
    metaDescription:
      'Quà tặng handmade Mushroomie phục vụ Biên Hòa: vòng tay, móc khóa, charm và hộp quà custom theo người nhận, dịp tặng; giao từ Trảng Dài. Xem gợi ý quà.',
    h1: 'Quà tặng handmade Biên Hòa – món quà nhỏ có dấu ấn riêng',
    intro:
      'Cần một món quà nhỏ mà giàu cảm xúc ở Biên Hòa? Mushroomie có vòng tay, móc khóa, charm và hộp quà handmade, custom theo màu sắc và phong cách người nhận — hợp sinh nhật, kỷ niệm, 20/10, Noel hay Valentine, giao nhanh khu vực Biên Hòa – Đồng Nai.',
    highlights: [
      { emoji: '🎁', title: 'Set quà chỉn chu', body: 'Phụ kiện nhỏ xinh đóng gói gọn gàng, kèm thiệp, sẵn sàng để tặng.' },
      { emoji: '🗓️', title: 'Hợp mọi dịp', body: 'Sinh nhật, kỷ niệm, 20/10, Noel, Valentine — chọn quà theo dịp.' },
      { emoji: '💗', title: 'Cá nhân hóa', body: 'Thêm tên, màu hoặc charm ý nghĩa để món quà dành riêng cho ai đó.' },
    ],
    productLinks: [productHub.gift, productHub.all, productHub.contact],
    cta: { label: 'Xem set quà tặng', href: '/san-pham' },
    related: ['qua-tang-handmade-dong-nai', 'qua-tang-ca-nhan-hoa-dong-nai', 'phu-kien-handmade-bien-hoa'],
  },
  {
    slug: 'vong-tay-custom-tphcm',
    area: 'TP.HCM',
    group: 'vong-tay',
    onlineOnly: true,
    crumb: 'Vòng tay custom TP.HCM',
    serviceType: 'Vòng tay custom theo yêu cầu (giao TP.HCM)',
    seoTitle: 'Vòng Tay Custom TP.HCM – Đặt Online, Giao Đến Tận Nơi',
    metaDescription:
      'Mushroomie nhận làm vòng tay custom giao TP.HCM: chọn màu, charm, size, tên và kiểu phối theo sở thích; đặt online, chốt mẫu trước khi làm. Xem mẫu.',
    h1: 'Vòng tay custom giao TP.HCM – chọn màu, chọn charm theo gu',
    intro:
      'Ở TP.HCM và muốn một chiếc vòng tay đúng gu? Mushroomie nhận đặt online và giao đến TP.HCM: bạn chọn màu, charm, size và kiểu phối, Mushroomie làm thủ công rồi gửi tận nơi — hợp làm phụ kiện cá nhân, vòng đôi hoặc vòng bạn thân.',
    highlights: [
      { emoji: '📦', title: 'Đặt online, giao TP.HCM', body: 'Chốt mẫu qua website hoặc Shopee, Mushroomie làm và gửi đến TP.HCM.' },
      { emoji: '🎨', title: 'Bạn chọn – Mushroomie làm', body: 'Từ màu dây, hạt đến charm và ký hiệu riêng, mọi chi tiết theo yêu cầu.' },
      { emoji: '👯', title: 'Vòng đôi & bạn thân', body: 'Phối set cho hai người hoặc cả nhóm để lưu kỷ niệm.' },
    ],
    productLinks: [productHub.bracelet, productHub.contact, productHub.all],
    cta: { label: 'Đặt vòng custom', href: '/lien-he' },
    related: ['phu-kien-handmade-tphcm', 'vong-tay-custom-dong-nai', 'moc-khoa-handmade-tphcm'],
  },
  {
    slug: 'moc-khoa-handmade-tphcm',
    area: 'TP.HCM',
    group: 'moc-khoa',
    onlineOnly: true,
    crumb: 'Móc khóa handmade TP.HCM',
    serviceType: 'Móc khóa & charm handmade (giao TP.HCM)',
    seoTitle: 'Móc Khóa Handmade TP.HCM – Đặt Online, Giao Tận Nơi',
    metaDescription:
      'Móc khóa handmade Mushroomie giao TP.HCM: phối hạt, charm, tên và kiểu khoen cho balo, túi hoặc làm quà; đặt online, chốt mẫu trước khi làm.',
    h1: 'Móc khóa handmade giao TP.HCM – cute, đặt online',
    intro:
      'Thích móc khóa handmade nhỏ xinh mà ở TP.HCM? Mushroomie nhận đặt online và giao đến TP.HCM: móc khóa phối hạt và charm thủ công, có mẫu sẵn và nhận làm theo yêu cầu để balo, túi hay chìa khóa của bạn thêm điểm nhấn.',
    highlights: [
      { emoji: '📦', title: 'Đặt online, giao TP.HCM', body: 'Chọn mẫu qua website hoặc Shopee, Mushroomie làm và gửi đến TP.HCM.' },
      { emoji: '🧷', title: 'Phối hạt & charm', body: 'Nhiều kiểu charm cute để chọn theo màu và sở thích.' },
      { emoji: '🎁', title: 'Quà nhỏ dễ thương', body: 'Gọn nhẹ, giá dễ tiếp cận, hợp làm quà tặng bạn bè.' },
    ],
    productLinks: [productHub.keychain, productHub.charm, productHub.contact],
    cta: { label: 'Đặt hàng online', href: '/san-pham?category=moc-khoa' },
    related: ['phu-kien-handmade-tphcm', 'moc-khoa-handmade-dong-nai', 'vong-tay-custom-tphcm'],
  },
  {
    slug: 'qua-tang-handmade-tphcm',
    area: 'TP.HCM',
    group: 'qua-tang',
    onlineOnly: true,
    crumb: 'Quà tặng handmade TP.HCM',
    serviceType: 'Quà tặng handmade (giao TP.HCM)',
    seoTitle: 'Quà Tặng Handmade TP.HCM – Đặt Online, Giao Tận Nơi',
    metaDescription:
      'Quà tặng handmade Mushroomie giao TP.HCM: vòng tay, móc khóa, charm, thiệp và hộp quà custom theo dịp, người nhận; đặt online tiện lợi. Xem gợi ý quà.',
    h1: 'Quà tặng handmade giao TP.HCM – set quà cá nhân hóa',
    intro:
      'Muốn tặng một món quà nhỏ mà có tâm ở TP.HCM? Mushroomie nhận đặt online và giao đến TP.HCM: set quà gồm vòng tay, móc khóa, charm và hộp quà handmade, custom theo màu sắc và phong cách người nhận cho sinh nhật, kỷ niệm hay các dịp lễ.',
    highlights: [
      { emoji: '🎁', title: 'Set quà chỉn chu', body: 'Đóng gói gọn gàng kèm thiệp, sẵn sàng để tặng.' },
      { emoji: '📦', title: 'Đặt online, giao TP.HCM', body: 'Chốt set quà qua website hoặc nhắn tin, Mushroomie gửi đến TP.HCM.' },
      { emoji: '💗', title: 'Cá nhân hóa', body: 'Thêm tên, màu hoặc charm ý nghĩa để món quà dành riêng cho ai đó.' },
    ],
    productLinks: [productHub.gift, productHub.all, productHub.contact],
    cta: { label: 'Xem set quà tặng', href: '/san-pham' },
    related: ['phu-kien-handmade-tphcm', 'qua-tang-ca-nhan-hoa-dong-nai', 'vong-tay-custom-tphcm'],
  },
  {
    slug: 'vong-tay-cap-doi-dong-nai',
    area: 'Đồng Nai',
    group: 'vong-tay',
    crumb: 'Vòng tay cặp đôi Đồng Nai',
    serviceType: 'Vòng tay cặp đôi & bạn thân handmade',
    seoTitle: 'Vòng Tay Cặp Đôi Đồng Nai – Phối Riêng Cho Hai Bạn',
    metaDescription:
      'Mushroomie làm vòng tay cặp đôi và bạn thân tại Đồng Nai: đo size, phối màu, charm và tên riêng; chốt set trước khi làm để lưu giữ kỷ niệm. Xem mẫu set đôi.',
    h1: 'Vòng tay cặp đôi Đồng Nai – lưu giữ kỷ niệm cùng nhau',
    intro:
      'Muốn một cặp vòng đôi hay set vòng bạn thân thật riêng? Mushroomie tại Đồng Nai phối set vòng tay cho hai người hoặc cả nhóm: chọn màu, charm và thêm tên hoặc ký hiệu để mỗi chiếc vòng kể một câu chuyện chung.',
    highlights: [
      { emoji: '👯', title: 'Vòng đôi & bạn thân', body: 'Phối set cho cặp đôi, đôi bạn thân hoặc cả nhóm để đồng điệu.' },
      { emoji: '🔤', title: 'Theo tên & ký hiệu', body: 'Thêm chữ cái, tên hoặc charm gắn với kỷ niệm của hai người.' },
      { emoji: '🎨', title: 'Cùng tông, riêng dấu ấn', body: 'Chọn tông màu hợp nhau nhưng vẫn có điểm nhấn riêng từng người.' },
    ],
    productLinks: [productHub.bracelet, productHub.contact, productHub.all],
    cta: { label: 'Đặt vòng đôi', href: '/lien-he' },
    related: ['vong-tay-custom-dong-nai', 'vong-tay-handmade-dong-nai', 'qua-tang-ca-nhan-hoa-dong-nai'],
  },
  {
    slug: 'charm-handmade-dong-nai',
    area: 'Đồng Nai',
    group: 'moc-khoa',
    crumb: 'Charm handmade Đồng Nai',
    serviceType: 'Charm handmade',
    seoTitle: 'Charm Handmade Đồng Nai – Phối Vòng, Móc Khóa Theo Gu',
    metaDescription:
      'Charm handmade Mushroomie tại Đồng Nai: chọn mẫu cute để phối vòng tay, móc khóa hoặc trang trí; mua charm rời hay đặt phối set theo gu riêng.',
    h1: 'Charm handmade Đồng Nai – phối vòng, móc khóa theo gu',
    intro:
      'Charm là chi tiết nhỏ tạo nên cá tính cho phụ kiện. Tại Đồng Nai, Mushroomie có nhiều mẫu charm handmade dễ thương để bạn phối vào vòng tay, móc khóa hay trang trí — chọn theo màu, chủ đề và sở thích để tạo set không đụng hàng.',
    highlights: [
      { emoji: '✨', title: 'Nhiều mẫu cute', body: 'Charm nhiều chủ đề và màu sắc để phối theo mood.' },
      { emoji: '🔗', title: 'Dễ phối', body: 'Gắn vào vòng tay, móc khóa hoặc dây đeo để làm mới phụ kiện.' },
      { emoji: '🎨', title: 'Tạo set riêng', body: 'Kết hợp charm theo cách của bạn để không đụng hàng.' },
    ],
    intentSections: [
      {
        id: 'bracelet-charm-dong-nai',
        title: 'Charm vòng tay Đồng Nai: chọn đúng khoen và cách phối',
        body: 'Khi tìm charm vòng tay Đồng Nai, bạn nên gửi ảnh vòng hiện có và kích thước điểm gắn để kiểm tra độ tương thích. Charm quá nặng hoặc khoen không đúng cỡ có thể làm vòng mất cân đối. Mushroomie tư vấn chủ đề, màu, số lượng charm và khoảng cách phối; bạn có thể mua charm rời khi phù hợp hoặc đặt phối lại thành một set hoàn chỉnh.',
      },
    ],
    productLinks: [productHub.charm, productHub.keychain, productHub.bracelet, productHub.contact],
    cta: { label: 'Xem mẫu charm', href: '/san-pham?category=charm' },
    related: ['moc-khoa-handmade-dong-nai', 'vong-tay-handmade-dong-nai', 'phu-kien-handmade-dong-nai'],
  },
  {
    slug: 'day-chuyen-handmade-dong-nai',
    area: 'Đồng Nai',
    group: 'phu-kien',
    crumb: 'Dây chuyền handmade Đồng Nai',
    serviceType: 'Dây chuyền & vòng cổ handmade',
    seoTitle: 'Dây Chuyền Handmade Đồng Nai – Chọn Charm Theo Gu Riêng',
    metaDescription:
      'Dây chuyền và vòng cổ handmade Mushroomie tại Đồng Nai: phối hạt, charm thủ công; chọn màu, độ dài và kiểu dáng rồi chốt mẫu trước khi làm. Xem mẫu.',
    h1: 'Dây chuyền handmade Đồng Nai – vòng cổ nhỏ xinh, custom',
    intro:
      'Thích một chiếc dây chuyền hay vòng cổ nhỏ xinh, có thể phối riêng? Mushroomie tại Đồng Nai phối tay dây chuyền và vòng cổ từ hạt và charm, cho bạn chọn màu, độ dài và kiểu dáng theo phong cách — hợp đi chơi, chụp ảnh hoặc làm quà tặng.',
    highlights: [
      { emoji: '📿', title: 'Phối tay từng chiếc', body: 'Dây chuyền, vòng cổ hạt cườm và charm làm thủ công.' },
      { emoji: '🎨', title: 'Custom theo gu', body: 'Chọn màu, độ dài và charm để hợp phong cách của bạn.' },
      { emoji: '🌸', title: 'Nhỏ xinh, dễ phối', body: 'Thiết kế trẻ trung, dễ phối đồ và làm quà tặng.' },
    ],
    productLinks: [productHub.necklace, productHub.charm, productHub.all, productHub.contact],
    cta: { label: 'Xem dây chuyền & vòng cổ', href: '/san-pham?category=vong-co' },
    related: ['phu-kien-handmade-dong-nai', 'vong-tay-handmade-dong-nai', 'charm-handmade-dong-nai'],
  },
]

export function getLocalPage(slug: string): LocalPage | undefined {
  return LOCAL_PAGES.find((p) => p.slug === slug)
}

const publishedLocalSlugSet = new Set<string>(PUBLISHED_LOCAL_SLUGS)

export const PUBLISHED_LOCAL_PAGES = LOCAL_PAGES.filter((page) => publishedLocalSlugSet.has(page.slug))

export function isPublishedLocalPage(slug: string): boolean {
  return publishedLocalSlugSet.has(slug)
}

export function getRelatedPages(slug: string): LocalPage[] {
  const page = getLocalPage(slug)
  if (!page) return []
  return page.related
    .filter(isPublishedLocalPage)
    .map(getLocalPage)
    .filter((p): p is LocalPage => Boolean(p))
}

function productLabel(group: LocalGroup): string {
  if (group === 'vong-tay') return 'vòng tay'
  if (group === 'moc-khoa') return 'móc khóa'
  if (group === 'qua-tang') return 'quà tặng'
  return 'phụ kiện'
}

export function getLocalFaqs(page: LocalPage): LocalFaq[] {
  const product = productLabel(page.group)
  const delivery = getAreaDelivery(page.area)
  const locationAnswer = page.onlineOnly
    ? `Mushroomie không có cửa hàng tại ${page.area}. Sản phẩm được làm thủ công tại Trảng Dài, Đồng Nai và nhận đơn online giao đến ${page.area}.`
    : 'Mushroomie hoạt động tại Hẻm 2, tổ 11, Phường Trảng Dài, tỉnh Đồng Nai. Nếu muốn nhận trực tiếp, bạn nên liên hệ trước để Mushroomie xác nhận thời gian.'

  return [
    {
      question: `Mushroomie có cửa hàng ${product} tại ${page.area} không?`,
      answer: locationAnswer,
    },
    {
      question: `${product.charAt(0).toUpperCase() + product.slice(1)} có thể custom theo yêu cầu không?`,
      answer:
        'Có. Bạn có thể gửi màu sắc, charm, chữ cái, kích thước và phong cách mong muốn. Mushroomie sẽ tư vấn phương án phù hợp rồi xác nhận mẫu và chi phí trước khi làm.',
    },
    {
      question: `Đặt ${product} handmade tại ${page.area} mất bao lâu?`,
      // Thời gian = khâu làm hàng (1-3 ngày) + khâu vận chuyển (khác nhau theo khu vực),
      // nên câu trả lời phải riêng cho từng area thay vì dùng chung một đoạn.
      answer:
        `Mushroomie cần 1–3 ngày làm việc để hoàn thiện, lâu hơn nếu là hàng custom nhiều chi tiết. ${delivery.summary}`,
    },
    {
      question: `Mushroomie giao ${product} đến ${page.area} bằng cách nào?`,
      answer: `${delivery.summary} ${delivery.pickup}`,
    },
  ]
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
    image: BRAND.socialImage,
    telephone: BRAND.phoneE164,
    email: BRAND.email,
    priceRange: '₫₫',
    hasMap: BRAND.mapUrl,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BRAND.geo.latitude,
      longitude: BRAND.geo.longitude,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: BRAND.openingHours.opens,
      closes: BRAND.openingHours.closes,
    },
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
    areaServed: { '@type': 'Place', name: page.area === 'TP.HCM' ? 'TP. Hồ Chí Minh' : page.area },
    provider: { '@id': `${SITE_URL}/#localbusiness` },
    url: `${SITE_URL}/${page.slug}`,
  }
}

/**
 * Tham chiếu thương hiệu dùng chung cho `publisher` / `seller` trên MỌI trang.
 *
 * Trước đây bài viết và sản phẩm mỗi trang khai một node `Organization` riêng, không có
 * `@id` và không có `sameAs` — Google cùng các LLM nhìn thấy nhiều thực thể rời rạc thay
 * vì một thương hiệu duy nhất. Helper này vừa mang `@id` trỏ về LocalBusiness ở trang
 * chủ (để hợp nhất thực thể), vừa mang đủ thuộc tính nhận dạng để tự đứng vững nếu
 * crawler chỉ đọc riêng trang đó.
 */
export function brandEntityRef() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#localbusiness`,
    name: BRAND.name,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: BRAND.logo,
    },
    sameAs: BRAND.sameAs,
  }
}

/**
 * Schema cho /gioi-thieu — trang duy nhất trong sitemap chưa có structured data.
 * Gắn với @id của LocalBusiness để Google nối trang câu chuyện vào entity thương hiệu.
 */
export function aboutPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_URL}/gioi-thieu#aboutpage`,
    url: `${SITE_URL}/gioi-thieu`,
    name: `Câu chuyện thương hiệu ${BRAND.name}`,
    description: BRAND.description,
    inLanguage: 'vi-VN',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: {
      '@id': `${SITE_URL}/#localbusiness`,
      '@type': 'LocalBusiness',
      name: BRAND.name,
      legalName: BRAND.legalName,
      slogan: BRAND.slogan,
      foundingDate: '2018',
      foundingLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: BRAND.addressLocality,
          addressRegion: BRAND.addressRegion,
          addressCountry: BRAND.addressCountry,
        },
      },
      url: SITE_URL,
      logo: BRAND.logo,
      sameAs: BRAND.sameAs,
    },
  }
}

export function faqPageSchema(faqs: LocalFaq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export type PriorityLocalLinkSource = 'contact' | 'footer'

export interface PriorityLocalLink {
  href: `/${string}`
  label: string
}

export interface PriorityLocalHomeCard extends PriorityLocalLink {
  emoji: string
  description: string
}

export interface PriorityLocalKeywordOwner {
  keyword: string
  slug: string
  href: `/${string}`
  home: Omit<PriorityLocalHomeCard, 'href'>
  contactLabel: string
  footerLabel: string
}

export const PRIORITY_LOCAL_KEYWORD_OWNERS = [
  {
    keyword: 'vòng tay handmade Đồng Nai',
    slug: 'vong-tay-handmade-dong-nai',
    href: '/vong-tay-handmade-dong-nai',
    home: {
      emoji: '🧵',
      label: 'Vòng tay làm thủ công tại Đồng Nai',
      description: 'Mẫu hạt cườm, charm và vòng đôi có thể chọn theo size',
    },
    contactLabel: 'Xem vòng tay handmade tại Đồng Nai',
    footerLabel: 'Vòng tay handmade Đồng Nai',
  },
  {
    keyword: 'vòng tay custom Biên Hòa',
    slug: 'vong-tay-custom-bien-hoa',
    href: '/vong-tay-custom-bien-hoa',
    home: {
      emoji: '🪄',
      label: 'Vòng tay custom gần Biên Hòa',
      description: 'Đặt theo tên, màu và charm mang dấu ấn riêng',
    },
    contactLabel: 'Đặt vòng tay custom gần Biên Hòa',
    footerLabel: 'Vòng tay custom Biên Hòa',
  },
  {
    keyword: 'móc khóa handmade Đồng Nai',
    slug: 'moc-khoa-handmade-dong-nai',
    href: '/moc-khoa-handmade-dong-nai',
    home: {
      emoji: '🔑',
      label: 'Móc khóa thủ công tại Đồng Nai',
      description: 'Điểm nhấn cho túi, balo và quà tặng nhóm',
    },
    contactLabel: 'Chọn móc khóa handmade tại Đồng Nai',
    footerLabel: 'Móc khóa handmade Đồng Nai',
  },
  {
    keyword: 'quà tặng handmade Đồng Nai',
    slug: 'qua-tang-handmade-dong-nai',
    href: '/qua-tang-handmade-dong-nai',
    home: {
      emoji: '🎁',
      label: 'Quà handmade gửi tại Đồng Nai',
      description: 'Phụ kiện cá nhân hóa, gói quà và thiệp viết tay',
    },
    contactLabel: 'Gợi ý quà handmade giao tại Đồng Nai',
    footerLabel: 'Quà tặng handmade Đồng Nai',
  },
] as const satisfies readonly PriorityLocalKeywordOwner[]

export function getPriorityLocalHomeCards(): PriorityLocalHomeCard[] {
  return PRIORITY_LOCAL_KEYWORD_OWNERS.map((owner) => ({
    href: owner.href,
    label: owner.home.label,
    emoji: owner.home.emoji,
    description: owner.home.description,
  }))
}

export function getPriorityLocalLinks(source: PriorityLocalLinkSource): PriorityLocalLink[] {
  return PRIORITY_LOCAL_KEYWORD_OWNERS.map((owner) => ({
    href: owner.href,
    label: source === 'contact' ? owner.contactLabel : owner.footerLabel,
  }))
}

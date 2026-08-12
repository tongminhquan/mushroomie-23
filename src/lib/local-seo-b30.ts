export type LocalB30Area = 'Đồng Nai' | 'Biên Hòa' | 'Trảng Dài' | 'TP.HCM'
export type LocalB30Role = 'primary' | 'secondary'
export type LocalB30Intent = 'commercial' | 'transactional' | 'local-navigation'

export const LOCAL_B30_CONTENT_SECTION_IDS = [
  'bracelet-made-to-order-dong-nai',
  'bracelet-name-dong-nai',
  'keychain-custom-dong-nai',
  'birthday-gift-dong-nai',
  'lover-gift-dong-nai',
  'bracelet-charm-dong-nai',
  'bracelet-shop-dong-nai',
] as const

export type LocalB30ContentSectionId = typeof LOCAL_B30_CONTENT_SECTION_IDS[number]

export interface LocalB30Target {
  id: number
  query: string
  ownerSlug: string
  ownerHref: `/${string}`
  role: LocalB30Role
  area: LocalB30Area
  intent: LocalB30Intent
  contentSectionId?: LocalB30ContentSectionId
}

export const LOCAL_B30_TARGETS = [
  { id: 1, query: 'phụ kiện handmade Đồng Nai', ownerSlug: 'phu-kien-handmade-dong-nai', ownerHref: '/phu-kien-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 2, query: 'shop phụ kiện handmade Đồng Nai', ownerSlug: 'shop-phu-kien-handmade-dong-nai', ownerHref: '/shop-phu-kien-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'local-navigation' },
  { id: 3, query: 'phụ kiện handmade Biên Hòa', ownerSlug: 'phu-kien-handmade-bien-hoa', ownerHref: '/phu-kien-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 4, query: 'phụ kiện handmade TP.HCM', ownerSlug: 'phu-kien-handmade-tphcm', ownerHref: '/phu-kien-handmade-tphcm', role: 'primary', area: 'TP.HCM', intent: 'commercial' },
  { id: 5, query: 'vòng tay handmade Đồng Nai', ownerSlug: 'vong-tay-handmade-dong-nai', ownerHref: '/vong-tay-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 6, query: 'vòng tay custom Đồng Nai', ownerSlug: 'vong-tay-custom-dong-nai', ownerHref: '/vong-tay-custom-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 7, query: 'vòng tay custom Biên Hòa', ownerSlug: 'vong-tay-custom-bien-hoa', ownerHref: '/vong-tay-custom-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'transactional' },
  { id: 8, query: 'móc khóa handmade Đồng Nai', ownerSlug: 'moc-khoa-handmade-dong-nai', ownerHref: '/moc-khoa-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 9, query: 'móc khóa handmade theo yêu cầu Đồng Nai', ownerSlug: 'moc-khoa-handmade-theo-yeu-cau-dong-nai', ownerHref: '/moc-khoa-handmade-theo-yeu-cau-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 10, query: 'quà tặng handmade Đồng Nai', ownerSlug: 'qua-tang-handmade-dong-nai', ownerHref: '/qua-tang-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 11, query: 'quà tặng cá nhân hóa Đồng Nai', ownerSlug: 'qua-tang-ca-nhan-hoa-dong-nai', ownerHref: '/qua-tang-ca-nhan-hoa-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 12, query: 'phụ kiện handmade Trảng Dài', ownerSlug: 'phu-kien-handmade-trang-dai', ownerHref: '/phu-kien-handmade-trang-dai', role: 'primary', area: 'Trảng Dài', intent: 'commercial' },
  { id: 13, query: 'vòng tay handmade Trảng Dài', ownerSlug: 'vong-tay-handmade-trang-dai', ownerHref: '/vong-tay-handmade-trang-dai', role: 'primary', area: 'Trảng Dài', intent: 'commercial' },
  { id: 14, query: 'shop phụ kiện handmade Biên Hòa', ownerSlug: 'shop-phu-kien-handmade-bien-hoa', ownerHref: '/shop-phu-kien-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'local-navigation' },
  { id: 15, query: 'vòng tay handmade Biên Hòa', ownerSlug: 'vong-tay-handmade-bien-hoa', ownerHref: '/vong-tay-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 16, query: 'móc khóa handmade Biên Hòa', ownerSlug: 'moc-khoa-handmade-bien-hoa', ownerHref: '/moc-khoa-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 17, query: 'quà tặng handmade Biên Hòa', ownerSlug: 'qua-tang-handmade-bien-hoa', ownerHref: '/qua-tang-handmade-bien-hoa', role: 'primary', area: 'Biên Hòa', intent: 'commercial' },
  { id: 18, query: 'vòng tay custom TP.HCM', ownerSlug: 'vong-tay-custom-tphcm', ownerHref: '/vong-tay-custom-tphcm', role: 'primary', area: 'TP.HCM', intent: 'transactional' },
  { id: 19, query: 'móc khóa handmade TP.HCM', ownerSlug: 'moc-khoa-handmade-tphcm', ownerHref: '/moc-khoa-handmade-tphcm', role: 'primary', area: 'TP.HCM', intent: 'commercial' },
  { id: 20, query: 'quà tặng handmade TP.HCM', ownerSlug: 'qua-tang-handmade-tphcm', ownerHref: '/qua-tang-handmade-tphcm', role: 'primary', area: 'TP.HCM', intent: 'commercial' },
  { id: 21, query: 'vòng tay cặp đôi Đồng Nai', ownerSlug: 'vong-tay-cap-doi-dong-nai', ownerHref: '/vong-tay-cap-doi-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'transactional' },
  { id: 22, query: 'charm handmade Đồng Nai', ownerSlug: 'charm-handmade-dong-nai', ownerHref: '/charm-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 23, query: 'dây chuyền handmade Đồng Nai', ownerSlug: 'day-chuyen-handmade-dong-nai', ownerHref: '/day-chuyen-handmade-dong-nai', role: 'primary', area: 'Đồng Nai', intent: 'commercial' },
  { id: 24, query: 'vòng tay theo yêu cầu Đồng Nai', ownerSlug: 'vong-tay-custom-dong-nai', ownerHref: '/vong-tay-custom-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'transactional', contentSectionId: 'bracelet-made-to-order-dong-nai' },
  { id: 25, query: 'vòng tay handmade theo tên Đồng Nai', ownerSlug: 'vong-tay-custom-dong-nai', ownerHref: '/vong-tay-custom-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'transactional', contentSectionId: 'bracelet-name-dong-nai' },
  { id: 26, query: 'móc khóa custom Đồng Nai', ownerSlug: 'moc-khoa-handmade-theo-yeu-cau-dong-nai', ownerHref: '/moc-khoa-handmade-theo-yeu-cau-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'transactional', contentSectionId: 'keychain-custom-dong-nai' },
  { id: 27, query: 'quà sinh nhật handmade Đồng Nai', ownerSlug: 'qua-tang-handmade-dong-nai', ownerHref: '/qua-tang-handmade-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'commercial', contentSectionId: 'birthday-gift-dong-nai' },
  { id: 28, query: 'quà handmade cho người yêu Đồng Nai', ownerSlug: 'qua-tang-ca-nhan-hoa-dong-nai', ownerHref: '/qua-tang-ca-nhan-hoa-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'commercial', contentSectionId: 'lover-gift-dong-nai' },
  { id: 29, query: 'charm vòng tay Đồng Nai', ownerSlug: 'charm-handmade-dong-nai', ownerHref: '/charm-handmade-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'commercial', contentSectionId: 'bracelet-charm-dong-nai' },
  { id: 30, query: 'shop vòng tay handmade Đồng Nai', ownerSlug: 'vong-tay-handmade-dong-nai', ownerHref: '/vong-tay-handmade-dong-nai', role: 'secondary', area: 'Đồng Nai', intent: 'local-navigation', contentSectionId: 'bracelet-shop-dong-nai' },
] as const satisfies readonly LocalB30Target[]

export const LOCAL_B30_OWNER_SLUGS = Object.freeze([
  ...new Set(LOCAL_B30_TARGETS.map((target) => target.ownerSlug)),
])

export function getLocalB30Target(query: string): LocalB30Target | undefined {
  const normalized = query.normalize('NFC').trim().toLocaleLowerCase('vi')
  return LOCAL_B30_TARGETS.find((target) => (
    target.query.normalize('NFC').trim().toLocaleLowerCase('vi') === normalized
  ))
}

export function getLocalB30TargetsByOwner(ownerSlug: string): readonly LocalB30Target[] {
  return LOCAL_B30_TARGETS.filter((target) => target.ownerSlug === ownerSlug)
}

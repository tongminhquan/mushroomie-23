export interface SeoPhase4KeywordRow {
  index: number
  keyword: string
  cluster: string
  intent: string
  priority: string
  proposedPage: string
  proposedSlug: string
  note: string
}

export interface SeoPhase4PostRecord {
  id: number
  slug: string
  title: string
  focusKeyword: string | null
  wordCount: number
}

export interface SeoKeywordOwner {
  key: string
  href: string
  label: string
  description: string
}

export interface SeoPhase4MetadataChange {
  id: number
  slug: string
  reason: string
  data: {
    title?: string
    focus_keyword?: string
    canonical_url?: string
    robots_index?: boolean
  }
}

const KEYWORD_OWNERS = {
  bracelets: {
    key: 'bracelets',
    href: '/san-pham?category=vong-tay',
    label: 'Khám phá vòng tay handmade',
    description: 'Xem các mẫu vòng tay, tùy chọn charm và thiết kế cá nhân hóa tại Mushroomie.',
  },
  catalog: {
    key: 'catalog',
    href: '/san-pham',
    label: 'Khám phá phụ kiện handmade',
    description: 'Xem bộ sưu tập phụ kiện handmade và quà tặng cá nhân hóa của Mushroomie.',
  },
  home: {
    key: 'home',
    href: '/',
    label: 'Tìm hiểu về Mushroomie',
    description: 'Khám phá thương hiệu, sản phẩm và cách Mushroomie tạo nên từng món phụ kiện.',
  },
  keychains: {
    key: 'keychains',
    href: '/san-pham?category=moc-khoa',
    label: 'Khám phá móc khóa handmade',
    description: 'Xem các mẫu móc khóa nhỏ xinh, dễ phối và phù hợp làm quà tặng.',
  },
  charms: {
    key: 'charms',
    href: '/san-pham?category=charm',
    label: 'Khám phá charm handmade',
    description: 'Chọn charm theo màu sắc, câu chuyện và phong cách riêng của bạn.',
  },
  necklaces: {
    key: 'necklaces',
    href: '/san-pham?category=vong-co',
    label: 'Khám phá vòng cổ handmade',
    description: 'Xem các mẫu vòng cổ và dây chuyền handmade từ Mushroomie.',
  },
  gifts: {
    key: 'gifts',
    href: '/tin-tuc/qua-tang-handmade',
    label: 'Xem cẩm nang quà tặng handmade',
    description: 'Chọn món quà phù hợp theo dịp, người nhận và thông điệp bạn muốn gửi gắm.',
  },
  friendGifts: {
    key: 'friend-gifts',
    href: '/tin-tuc/vong-tay-best-friend-handmade',
    label: 'Gợi ý quà sinh nhật cho bạn thân',
    description: 'Tham khảo cách chọn vòng tay tình bạn và quà cá nhân hóa cho bạn thân.',
  },
  loverGifts: {
    key: 'lover-gifts',
    href: '/tin-tuc/qua-tang-handmade',
    label: 'Gợi ý quà handmade cho người yêu',
    description: 'Tìm ý tưởng quà tặng giàu cảm xúc và có dấu ấn riêng cho người thương.',
  },
} satisfies Record<string, SeoKeywordOwner>

const ARTICLE_OWNER_SLUGS = new Set([
  'qua-tang-handmade',
  'vong-tay-best-friend-handmade',
])

export const PHASE4_PRIORITY_POST_SLUGS = [
  'xu-huong-phu-kien-handmade-2024',
  'cach-lam-vong-tay-handmade-don-gian',
  'phu-kien-handmade',
  'shop-phu-kien-handmade',
  'vong-tay-hat-cuom',
  'moc-khoa-handmade',
  'vong-tay-handmade-nu',
  'vong-tay-charm',
  'vong-tay-best-friend-handmade',
] as const

export const PHASE4_METADATA_CHANGES: SeoPhase4MetadataChange[] = [
  {
    id: 3,
    slug: 'vong-tay-handmade',
    reason: 'Move the supporting article away from the broad commercial category keyword.',
    data: {
      title: 'Cách chọn vòng tay handmade theo phong cách riêng',
      focus_keyword: 'cách chọn vòng tay handmade theo phong cách',
    },
  },
  {
    id: 4,
    slug: 'https://mushroomie.io.vn/vong-tay-handmade-nu/',
    reason: 'Keep the malformed legacy duplicate for safety but canonicalize and noindex it.',
    data: {
      focus_keyword: 'phối vòng tay handmade nữ',
      canonical_url: 'https://mushroomie.io.vn/tin-tuc/vong-tay-handmade-nu',
      robots_index: false,
    },
  },
  {
    id: 17,
    slug: 'trang-suc-handmade',
    reason: 'Reposition the article as informational support for the product catalog.',
    data: { focus_keyword: 'cách phối trang sức handmade' },
  },
  {
    id: 18,
    slug: 'phu-kien-handmade',
    reason: 'Reposition the article as a selection guide supporting the catalog owner.',
    data: { focus_keyword: 'cách chọn phụ kiện handmade' },
  },
  {
    id: 21,
    slug: 'shop-phu-kien-handmade',
    reason: 'Use a trust-oriented informational query while the homepage owns the shop keyword.',
    data: { focus_keyword: 'cách chọn shop phụ kiện handmade uy tín' },
  },
  {
    id: 22,
    slug: 'vong-tay-hat-cuom',
    reason: 'Use a selection-guide query while the bracelet category owns the commercial term.',
    data: { focus_keyword: 'cách chọn vòng tay hạt cườm' },
  },
  {
    id: 36,
    slug: 'moc-khoa-handmade',
    reason: 'Use a selection-guide query while the keychain category owns the commercial term.',
    data: { focus_keyword: 'cách chọn móc khóa handmade' },
  },
  {
    id: 39,
    slug: 'vong-tay-handmade-nu',
    reason: 'Use a selection-guide query while the bracelet category owns the commercial term.',
    data: { focus_keyword: 'cách chọn vòng tay handmade nữ' },
  },
  {
    id: 41,
    slug: 'vong-tay-charm',
    reason: 'Use a styling query while the bracelet category owns the commercial term.',
    data: { focus_keyword: 'cách phối vòng tay charm' },
  },
  {
    id: 61,
    slug: 'vong-tay-best-friend-handmade',
    reason: 'Align the editorial owner with the approved keyword plan.',
    data: { focus_keyword: 'quà sinh nhật cho bạn thân' },
  },
]

export function normalizeSeoKeyword(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolveKeywordOwner(index: number): SeoKeywordOwner {
  if (index >= 1 && index <= 15) return KEYWORD_OWNERS.bracelets
  if ([16, 18, 19, 20].includes(index)) return KEYWORD_OWNERS.catalog
  if (index === 17) return KEYWORD_OWNERS.home
  if (index >= 21 && index <= 23) return KEYWORD_OWNERS.keychains
  if (index >= 24 && index <= 25) return KEYWORD_OWNERS.charms
  if (index >= 26 && index <= 27) return KEYWORD_OWNERS.necklaces
  if (index === 28) return KEYWORD_OWNERS.gifts
  if (index === 29) return KEYWORD_OWNERS.friendGifts
  if (index === 30) return KEYWORD_OWNERS.loverGifts
  throw new Error(`Unsupported keyword index: ${index}`)
}

export function getSupportingPostOwner(post: {
  slug: string
  focusKeyword?: string | null
}): SeoKeywordOwner | null {
  if (ARTICLE_OWNER_SLUGS.has(post.slug)) return null

  const searchable = normalizeSeoKeyword(`${post.slug} ${post.focusKeyword || ''}`)
  if (searchable.includes('shop phu kien')) return KEYWORD_OWNERS.home
  if (searchable.includes('moc khoa')) return KEYWORD_OWNERS.keychains
  if (searchable.includes('vong tay')) return KEYWORD_OWNERS.bracelets
  if (searchable.includes('charm')) return KEYWORD_OWNERS.charms
  if (searchable.includes('vong co') || searchable.includes('day chuyen')) {
    return KEYWORD_OWNERS.necklaces
  }
  if (searchable.includes('trang suc') || searchable.includes('phu kien')) {
    return KEYWORD_OWNERS.catalog
  }
  if (searchable.includes('qua')) return KEYWORD_OWNERS.gifts
  return null
}

function isMalformedPostSlug(slug: string): boolean {
  return /^https?:\/\//i.test(slug) || slug.includes('/') || slug.includes('\\')
}

export function buildSeoPhase4Audit(input: {
  keywordRows: SeoPhase4KeywordRow[]
  posts: SeoPhase4PostRecord[]
  reachableOwnerUrls: string[]
}) {
  const reachableOwners = new Set(input.reachableOwnerUrls)
  const postBySlug = new Map<string, SeoPhase4PostRecord>()
  for (const post of input.posts) {
    if (!postBySlug.has(post.slug)) postBySlug.set(post.slug, post)
  }
  const uniquePosts = [...postBySlug.values()]
  const focusGroups = new Map<string, SeoPhase4PostRecord[]>()

  for (const post of uniquePosts) {
    const normalizedFocus = normalizeSeoKeyword(post.focusKeyword)
    if (!normalizedFocus) continue
    const posts = focusGroups.get(normalizedFocus) || []
    posts.push(post)
    focusGroups.set(normalizedFocus, posts)
  }

  const duplicateFocusKeywords = [...focusGroups.entries()]
    .filter(([, posts]) => posts.length > 1)
    .map(([, posts]) => ({
      keyword: posts[0].focusKeyword || '',
      posts: posts
        .map(({ id, slug }) => ({ id, slug }))
        .sort((a, b) => a.id - b.id),
    }))
    .sort((a, b) => normalizeSeoKeyword(a.keyword).localeCompare(normalizeSeoKeyword(b.keyword)))

  const malformedPostSlugs = uniquePosts
    .filter((post) => isMalformedPostSlug(post.slug))
    .map(({ id, slug }) => ({ id, slug }))
    .sort((a, b) => a.id - b.id)

  const priorityPosts = PHASE4_PRIORITY_POST_SLUGS
    .map((slug) => uniquePosts.find((post) => post.slug === slug))
    .filter((post): post is SeoPhase4PostRecord => Boolean(post))

  const keywords = input.keywordRows.map((row) => {
    const owner = resolveKeywordOwner(row.index)
    const normalizedKeyword = normalizeSeoKeyword(row.keyword)
    const currentTargets = uniquePosts
      .filter((post) => (
        normalizeSeoKeyword(post.focusKeyword) === normalizedKeyword
        || post.slug === row.proposedSlug
      ))
      .map(({ id, slug, title, focusKeyword }) => ({ id, slug, title, focusKeyword }))

    return {
      ...row,
      owner,
      ownerReachable: reachableOwners.has(owner.href),
      currentTargets,
      status: currentTargets.length > 1
        ? 'duplicate'
        : currentTargets.length === 1
          ? 'mapped'
          : 'owner-only',
    }
  })

  const ownerUrls = [...new Set(keywords.map((row) => row.owner.href))]
  const missingOwnerUrls = ownerUrls.filter((href) => !reachableOwners.has(href))

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      keywordCount: input.keywordRows.length,
      ownerCount: ownerUrls.length,
      missingOwnerCount: missingOwnerUrls.length,
      duplicateFocusKeywordCount: duplicateFocusKeywords.length,
      malformedPostSlugCount: malformedPostSlugs.length,
      priorityPostCount: priorityPosts.length,
    },
    ownerUrls,
    missingOwnerUrls,
    keywords,
    duplicateFocusKeywords,
    malformedPostSlugs,
    priorityPosts,
  }
}

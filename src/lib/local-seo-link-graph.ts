import {
  PUBLISHED_LOCAL_PAGES,
  type LocalArea,
  type LocalPage,
} from '@/lib/local-seo'

export const LOCAL_AREA_HUBS = [
  { slug: 'phu-kien-handmade-dong-nai', label: 'Phụ kiện handmade Đồng Nai', area: 'Đồng Nai' },
  { slug: 'phu-kien-handmade-trang-dai', label: 'Phụ kiện handmade Trảng Dài', area: 'Trảng Dài' },
  { slug: 'phu-kien-handmade-bien-hoa', label: 'Phụ kiện handmade Biên Hòa', area: 'Biên Hòa' },
  { slug: 'phu-kien-handmade-tphcm', label: 'Phụ kiện handmade giao TP.HCM', area: 'TP.HCM' },
] as const satisfies readonly { slug: string; label: string; area: LocalArea }[]

function clusterKey(page: LocalPage): string {
  return page.area === 'Trảng Dài' ? 'Đồng Nai' : page.area
}

export interface LocalDiscoveryLink {
  slug: string
  href: `/${string}`
  label: string
}

function uniquePages(pages: readonly LocalPage[]): LocalPage[] {
  const seen = new Set<string>()
  return pages.filter((page) => !seen.has(page.slug) && Boolean(seen.add(page.slug)))
}

export function getLocalHubForPage(sourceSlug: string) {
  const source = PUBLISHED_LOCAL_PAGES.find((page) => page.slug === sourceSlug)
  if (!source) return undefined
  return LOCAL_AREA_HUBS.find((hub) => hub.area === source.area)
}

function serviceLabel(page: LocalPage): string {
  return page.serviceType
    .replace(/\s*\(giao TP\.HCM\)$/iu, '')
    .toLocaleLowerCase('vi')
}

function contextualLabel(target: LocalPage, prefix: 'Khám phá' | 'Xem'): string {
  if (target.onlineOnly) {
    return `${prefix} ${serviceLabel(target)} Mushroomie giao online đến ${target.area}`
  }
  return `${prefix} ${serviceLabel(target)} Mushroomie phục vụ ${target.area}`
}

function linkLabel(source: LocalPage, target: LocalPage, cluster: readonly LocalPage[]): string {
  const sourceIndex = cluster.findIndex((page) => page.slug === source.slug)
  const targetIndex = cluster.findIndex((page) => page.slug === target.slug)
  const forwardDistance = sourceIndex >= 0 && targetIndex >= 0
    ? (targetIndex - sourceIndex + cluster.length) % cluster.length
    : -1

  if (forwardDistance === 3) return target.crumb
  if (forwardDistance % 2 === 0) return contextualLabel(target, 'Xem')
  return contextualLabel(target, 'Khám phá')
}

export function getLocalDiscoveryLinks(sourceSlug: string): LocalDiscoveryLink[] {
  const source = PUBLISHED_LOCAL_PAGES.find((page) => page.slug === sourceSlug)
  if (!source) return []

  const cluster = PUBLISHED_LOCAL_PAGES.filter((page) => clusterKey(page) === clusterKey(source))
  const sourceIndex = cluster.findIndex((page) => page.slug === source.slug)
  const ring = [1, 2, 3]
    .map((offset) => cluster[(sourceIndex + offset) % cluster.length])
    .filter((page): page is LocalPage => Boolean(page) && page.slug !== source.slug)
  const hub = getLocalHubForPage(sourceSlug)
  const hubPage = hub
    ? PUBLISHED_LOCAL_PAGES.find((page) => page.slug === hub.slug)
    : undefined
  const hubMemberSlugs = new Set(getLocalHubMembers(sourceSlug).map((page) => page.slug))

  return uniquePages([...(hubPage ? [hubPage] : []), ...ring])
    .filter((page) => page.slug !== source.slug && !hubMemberSlugs.has(page.slug))
    .slice(0, 6)
    .map((page) => ({
      slug: page.slug,
      href: `/${page.slug}`,
      label: linkLabel(source, page, cluster),
    }))
}

function getLocalHubMembers(hubSlug: string): LocalPage[] {
  const hub = LOCAL_AREA_HUBS.find((item) => item.slug === hubSlug)
  if (!hub) return []

  return PUBLISHED_LOCAL_PAGES.filter((page) => (
    page.slug !== hub.slug && page.area === hub.area
  ))
}

export function getLocalHubMemberLinks(hubSlug: string): LocalDiscoveryLink[] {
  return getLocalHubMembers(hubSlug).map((page) => ({
    slug: page.slug,
    href: `/${page.slug}`,
    label: contextualLabel(page, 'Xem'),
  }))
}

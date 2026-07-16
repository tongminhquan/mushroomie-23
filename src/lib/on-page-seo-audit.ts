import { parseFragment, type DefaultTreeAdapterTypes } from 'parse5'
import {
  resolvePostMetadataDescription,
  resolvePostMetadataTitle,
} from './post-metadata'
import { decodeProductSlug, generateSlug } from './product-slug'
import { buildProductMetadataText } from './product-metadata'
import { normalizeGeneratedPostImageAlt } from './image-alt'

export type OnPageSeoIssueSeverity = 'error' | 'warning'

export interface OnPageSeoIssue {
  code: string
  severity: OnPageSeoIssueSeverity
  message: string
}

export interface PostOnPageSeoRecord {
  id: number
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  featured_image?: string | null
  featured_image_alt?: string | null
  seo_title?: string | null
  meta_description?: string | null
  canonical_url?: string | null
  robots_index?: boolean | null
  robots_follow?: boolean | null
}

export interface ProductOnPageSeoRecord {
  id: number
  name: string
  slug: string
  sku?: string | null
  is_customizable?: boolean
  short_description?: string | null
  description?: string | null
  featured_image?: string | null
  images?: Array<{ image_url: string; alt_text?: string | null }>
}

export interface AuditedOnPageSeoItem {
  kind: 'post' | 'product'
  id: number
  slug: string
  url: string
  effectiveTitle: string
  effectiveDescription: string
  issues: OnPageSeoIssue[]
  metrics: {
    titleLength: number
    metaLength: number
    h1Count: number
    headingJumpCount: number
    imageCount: number
    missingAltCount: number
    stuffedAltCount: number
    internalCommercialLinkCount: number
  }
}

export interface OnPageSeoAuditReport {
  generatedAt: string
  siteUrl: string
  summary: {
    postsScanned: number
    productsScanned: number
    errors: number
    warnings: number
    pagesWithIssues: number
    duplicateTitleGroups: number
    duplicateMetaGroups: number
  }
  posts: AuditedOnPageSeoItem[]
  products: AuditedOnPageSeoItem[]
}

interface HtmlAuditMetrics {
  h1Count: number
  headingJumpCount: number
  imageCount: number
  missingAltCount: number
  stuffedAltCount: number
  internalCommercialLinkCount: number
}

interface HtmlElementSummary {
  headings: number[]
  imageAlts: Array<string | null>
  links: string[]
}

const TITLE_MIN_LENGTH = 50
const TITLE_MAX_LENGTH = 60
const META_MIN_LENGTH = 140
const META_MAX_LENGTH = 160
const COMMERCIAL_ALT_PHRASES = [
  'handmade',
  'vong tay',
  'phu kien',
  'moc khoa',
  'ca nhan hoa',
  'charm',
]

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/+$/, '')
}

function normalizeComparableUrl(value: string, siteUrl: string): string | null {
  try {
    const url = new URL(value, `${normalizeSiteUrl(siteUrl)}/`)
    url.search = ''
    url.hash = ''
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname
    return `${url.origin}${pathname}`
  } catch {
    return null
  }
}

function isIntentionalPostConsolidation(
  canonical: string | null,
  expectedCanonical: string | null,
  robotsIndex: boolean | null | undefined,
  siteUrl: string,
) {
  if (robotsIndex !== false || !canonical || !expectedCanonical || canonical === expectedCanonical) {
    return false
  }

  try {
    const canonicalUrl = new URL(canonical)
    const siteOrigin = new URL(siteUrl).origin
    return canonicalUrl.origin === siteOrigin && canonicalUrl.pathname.startsWith('/tin-tuc/')
  } catch {
    return false
  }
}

function getAttribute(element: DefaultTreeAdapterTypes.Element, name: string) {
  return element.attrs.find((attribute) => attribute.name === name)?.value ?? null
}

function summarizeHtml(html?: string | null): HtmlElementSummary {
  if (!html) return { headings: [], imageAlts: [], links: [] }

  const fragment = parseFragment(html)
  const summary: HtmlElementSummary = { headings: [], imageAlts: [], links: [] }

  function visit(parent: DefaultTreeAdapterTypes.ParentNode) {
    for (const child of parent.childNodes) {
      if (!('tagName' in child)) continue

      const heading = /^h([1-6])$/.exec(child.tagName)
      if (heading) summary.headings.push(Number(heading[1]))
      if (child.tagName === 'img') summary.imageAlts.push(getAttribute(child, 'alt'))
      if (child.tagName === 'a') {
        const href = getAttribute(child, 'href')?.trim()
        if (href) summary.links.push(href)
      }

      visit(child)
    }
  }

  visit(fragment)
  return summary
}

function normalizeWords(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function phraseOccurrenceCount(value: string, phrase: string) {
  if (!value || !phrase) return 0
  return value.split(phrase).length - 1
}

export function isLikelyKeywordStuffedAlt(alt: string) {
  const normalized = normalizeWords(alt)
  if (normalized.length > 125) return true

  return COMMERCIAL_ALT_PHRASES.some(
    (phrase) => phraseOccurrenceCount(normalized, phrase) >= 2,
  )
}

function countHeadingJumps(headings: number[]) {
  let jumps = 0
  let previous = 1

  for (const heading of headings) {
    if (heading > previous + 1) jumps += 1
    previous = heading
  }

  return jumps
}

function countCommercialLinks(links: string[], siteUrl: string) {
  const origin = new URL(siteUrl).origin
  const targets = new Set<string>()

  for (const href of links) {
    try {
      if (href.startsWith('//')) continue
      const url = new URL(href, `${origin}/`)
      if (url.origin !== origin) continue
      if (url.pathname !== '/san-pham' && !url.pathname.startsWith('/san-pham/')) continue
      targets.add(`${url.pathname}${url.search}`)
    } catch {
      continue
    }
  }

  return targets.size
}

function auditHtml(
  html: string | null | undefined,
  siteUrl: string,
  additionalCommercialLinkCount = 0,
): HtmlAuditMetrics {
  const summary = summarizeHtml(html)
  const renderedAlts = summary.imageAlts.map((alt) => (
    alt === null ? null : normalizeGeneratedPostImageAlt(alt)
  ))
  const missingAltCount = renderedAlts.filter((alt) => !alt?.trim()).length
  const stuffedAltCount = renderedAlts.filter(
    (alt) => Boolean(alt?.trim()) && isLikelyKeywordStuffedAlt(alt || ''),
  ).length

  return {
    h1Count: summary.headings.filter((heading) => heading === 1).length,
    headingJumpCount: countHeadingJumps(summary.headings),
    imageCount: summary.imageAlts.length,
    missingAltCount,
    stuffedAltCount,
    internalCommercialLinkCount:
      countCommercialLinks(summary.links, siteUrl) + additionalCommercialLinkCount,
  }
}

function pushLengthIssues(
  issues: OnPageSeoIssue[],
  title: string,
  description: string,
) {
  if (!title.trim()) {
    issues.push({ code: 'title_missing', severity: 'error', message: 'SEO title is missing.' })
  } else if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
    issues.push({
      code: 'title_length',
      severity: 'warning',
      message: `SEO title has ${title.length} characters; target ${TITLE_MIN_LENGTH}-${TITLE_MAX_LENGTH}.`,
    })
  }

  if (!description.trim()) {
    issues.push({ code: 'meta_missing', severity: 'error', message: 'Meta description is missing.' })
  } else if (description.length < META_MIN_LENGTH || description.length > META_MAX_LENGTH) {
    issues.push({
      code: 'meta_length',
      severity: 'warning',
      message: `Meta description has ${description.length} characters; target ${META_MIN_LENGTH}-${META_MAX_LENGTH}.`,
    })
  }
}

function pushHtmlIssues(issues: OnPageSeoIssue[], metrics: HtmlAuditMetrics) {
  if (metrics.h1Count > 0) {
    issues.push({
      code: 'content_h1',
      severity: 'error',
      message: `Content contains ${metrics.h1Count} H1 heading(s); the page template already renders the H1.`,
    })
  }
  if (metrics.headingJumpCount > 0) {
    issues.push({
      code: 'heading_jump',
      severity: 'warning',
      message: `Content contains ${metrics.headingJumpCount} heading level jump(s).`,
    })
  }
  if (metrics.missingAltCount > 0) {
    issues.push({
      code: 'image_alt_missing',
      severity: 'error',
      message: `${metrics.missingAltCount} content image(s) have no specific alt text.`,
    })
  }
  if (metrics.stuffedAltCount > 0) {
    issues.push({
      code: 'image_alt_stuffed',
      severity: 'warning',
      message: `${metrics.stuffedAltCount} image alt value(s) look repetitive or keyword stuffed.`,
    })
  }
}

export function auditPostOnPageSeo(
  post: PostOnPageSeoRecord,
  siteUrl: string,
  templateCommercialLinkCount = 0,
): AuditedOnPageSeoItem {
  const baseUrl = normalizeSiteUrl(siteUrl)
  const url = `${baseUrl}/tin-tuc/${post.slug}`
  const effectiveTitle = resolvePostMetadataTitle(post.title, post.seo_title)
  const effectiveDescription = resolvePostMetadataDescription(
    post.title,
    post.meta_description,
    post.excerpt,
  )
  const htmlMetrics = auditHtml(post.content, baseUrl, templateCommercialLinkCount)
  const issues: OnPageSeoIssue[] = []

  pushLengthIssues(issues, effectiveTitle, effectiveDescription)
  pushHtmlIssues(issues, htmlMetrics)

  const canonical = normalizeComparableUrl(post.canonical_url || url, baseUrl)
  const expectedCanonical = normalizeComparableUrl(url, baseUrl)
  const intentionalConsolidation = isIntentionalPostConsolidation(
    canonical,
    expectedCanonical,
    post.robots_index,
    baseUrl,
  )
  if ((!canonical || canonical !== expectedCanonical) && !intentionalConsolidation) {
    issues.push({
      code: 'canonical_mismatch',
      severity: 'error',
      message: `Canonical must resolve to ${url}.`,
    })
  }
  if (post.robots_index === false && !intentionalConsolidation) {
    issues.push({
      code: 'robots_noindex',
      severity: 'error',
      message: 'Published post is configured as noindex.',
    })
  }
  if (!post.featured_image?.trim()) {
    issues.push({
      code: 'featured_image_missing',
      severity: 'error',
      message: 'Featured image is missing.',
    })
  } else if (!post.featured_image_alt?.trim()) {
    issues.push({
      code: 'featured_image_alt_missing',
      severity: 'warning',
      message: 'Featured image has no specific alt text.',
    })
  } else if (isLikelyKeywordStuffedAlt(post.featured_image_alt)) {
    issues.push({
      code: 'image_alt_stuffed',
      severity: 'warning',
      message: 'Featured image alt looks repetitive or keyword stuffed.',
    })
  }
  if (htmlMetrics.internalCommercialLinkCount < 2) {
    issues.push({
      code: 'internal_commercial_links',
      severity: 'warning',
      message: `Post links to ${htmlMetrics.internalCommercialLinkCount} unique product/catalog target(s); target at least 2.`,
    })
  }

  return {
    kind: 'post',
    id: post.id,
    slug: post.slug,
    url,
    effectiveTitle,
    effectiveDescription,
    issues,
    metrics: {
      titleLength: effectiveTitle.length,
      metaLength: effectiveDescription.length,
      ...htmlMetrics,
    },
  }
}

export function auditProductOnPageSeo(
  product: ProductOnPageSeoRecord,
  siteUrl: string,
): AuditedOnPageSeoItem {
  const baseUrl = normalizeSiteUrl(siteUrl)
  const url = `${baseUrl}/san-pham/${product.slug}`
  const productMetadata = buildProductMetadataText(product.name, {
    sku: product.sku,
    isCustomizable: product.is_customizable,
  })
  const effectiveTitle = productMetadata.title
  const effectiveDescription = productMetadata.description
  const htmlMetrics = auditHtml(product.description, baseUrl)
  const galleryMissingAltCount = (product.images || []).filter(
    (image) => !image.alt_text?.trim(),
  ).length
  const metrics = {
    ...htmlMetrics,
    imageCount: htmlMetrics.imageCount + (product.images?.length || 0),
    missingAltCount: htmlMetrics.missingAltCount + galleryMissingAltCount,
  }
  const issues: OnPageSeoIssue[] = []

  pushLengthIssues(issues, effectiveTitle, effectiveDescription)
  pushHtmlIssues(issues, metrics)

  if (generateSlug(decodeProductSlug(product.slug)) !== product.slug) {
    issues.push({
      code: 'slug_not_normalized',
      severity: 'error',
      message: 'Product slug must be lowercase ASCII with hyphen separators.',
    })
  }
  if (!product.featured_image?.trim()) {
    issues.push({
      code: 'featured_image_missing',
      severity: 'error',
      message: 'Featured product image is missing.',
    })
  }

  return {
    kind: 'product',
    id: product.id,
    slug: product.slug,
    url,
    effectiveTitle,
    effectiveDescription,
    issues,
    metrics: {
      titleLength: effectiveTitle.length,
      metaLength: effectiveDescription.length,
      ...metrics,
    },
  }
}

function normalizedDuplicateKey(value: string) {
  return value.toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim()
}

function appendDuplicateIssues(
  items: AuditedOnPageSeoItem[],
  field: 'effectiveTitle' | 'effectiveDescription',
  code: 'duplicate_title' | 'duplicate_meta',
) {
  const groups = new Map<string, AuditedOnPageSeoItem[]>()

  for (const item of items) {
    const key = normalizedDuplicateKey(item[field])
    if (!key) continue
    groups.set(key, [...(groups.get(key) || []), item])
  }

  const duplicates = [...groups.values()].filter((group) => group.length > 1)
  for (const group of duplicates) {
    for (const item of group) {
      item.issues.push({
        code,
        severity: 'warning',
        message: `${field === 'effectiveTitle' ? 'SEO title' : 'Meta description'} is duplicated across ${group.length} pages.`,
      })
    }
  }

  return duplicates.length
}

export function buildOnPageSeoAudit(input: {
  siteUrl: string
  generatedAt?: string
  postTemplateCommercialLinkCount?: number
  posts: PostOnPageSeoRecord[]
  products: ProductOnPageSeoRecord[]
}): OnPageSeoAuditReport {
  const posts = input.posts.map((post) => auditPostOnPageSeo(
    post,
    input.siteUrl,
    input.postTemplateCommercialLinkCount || 0,
  ))
  const products = input.products.map((product) => auditProductOnPageSeo(product, input.siteUrl))
  const allItems = [...posts, ...products]
  const duplicateTitleGroups = appendDuplicateIssues(
    allItems,
    'effectiveTitle',
    'duplicate_title',
  )
  const duplicateMetaGroups = appendDuplicateIssues(
    allItems,
    'effectiveDescription',
    'duplicate_meta',
  )
  const issues = allItems.flatMap((item) => item.issues)

  return {
    generatedAt: input.generatedAt || new Date().toISOString(),
    siteUrl: normalizeSiteUrl(input.siteUrl),
    summary: {
      postsScanned: posts.length,
      productsScanned: products.length,
      errors: issues.filter((issue) => issue.severity === 'error').length,
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
      pagesWithIssues: allItems.filter((item) => item.issues.length > 0).length,
      duplicateTitleGroups,
      duplicateMetaGroups,
    },
    posts,
    products,
  }
}

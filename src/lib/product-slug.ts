export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export interface ProductSlugRecord {
  id: number
  name: string
  slug: string
}

export interface ProductSlugChange {
  id: number
  from: string
  to: string
}

export interface ProductSlugCollision {
  target: string
  products: Array<{ id: number; slug: string }>
}

export interface ProductSlugNormalizationAnalysis {
  changes: ProductSlugChange[]
  collisions: ProductSlugCollision[]
  nonRedirectable: ProductSlugChange[]
  safeToApply: boolean
}

export function decodeProductSlug(slug: string): string {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

export function getProductSlugLookupCandidates(slug: string): string[] {
  const decodedSlug = decodeProductSlug(slug)
  const normalizedSlug = generateSlug(decodedSlug)

  return [...new Set([decodedSlug, slug, normalizedSlug].filter(Boolean))]
}

export function normalizeProductSlugInput(
  slug: string | undefined,
  productName: string | undefined,
): string | null {
  const source = slug?.trim() ? slug : productName
  const normalizedSlug = generateSlug(source || '')

  return normalizedSlug || null
}

export function analyzeProductSlugNormalization(
  products: readonly ProductSlugRecord[],
): ProductSlugNormalizationAnalysis {
  const sortedProducts = [...products].sort((left, right) => left.id - right.id)
  const planned = sortedProducts.map((product) => ({
    product,
    target:
      generateSlug(product.slug) || generateSlug(product.name) || `san-pham-${product.id}`,
  }))
  const changes = planned
    .filter(({ product, target }) => product.slug !== target)
    .map(({ product, target }) => ({ id: product.id, from: product.slug, to: target }))
  const productsByTarget = new Map<string, Array<{ id: number; slug: string }>>()

  for (const { product, target } of planned) {
    const owners = productsByTarget.get(target) || []
    owners.push({ id: product.id, slug: product.slug })
    productsByTarget.set(target, owners)
  }

  const collisions = [...productsByTarget.entries()]
    .filter(([, owners]) => owners.length > 1)
    .map(([target, owners]) => ({ target, products: owners }))
  const nonRedirectable = changes.filter(
    (change) => generateSlug(decodeProductSlug(change.from)) !== change.to,
  )

  return {
    changes,
    collisions,
    nonRedirectable,
    safeToApply: collisions.length === 0 && nonRedirectable.length === 0,
  }
}

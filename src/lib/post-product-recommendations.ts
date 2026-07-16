export interface PostProductRecommendationInput {
  title: string
  focusKeyword?: string | null
  secondaryKeywords?: string | null
}

export interface PostProductRecommendationCandidate {
  id: number
  name: string
  slug: string
  short_description?: string | null
  is_featured: boolean
  stock: number
  category?: { name: string; slug: string } | null
}

const STOP_WORDS = new Set([
  'cach',
  'cho',
  'cua',
  'duoc',
  'goi',
  'huong',
  'khi',
  'mua',
  'nhung',
  'phu',
  'theo',
  'va',
  'voi',
])

function searchTokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  )
}

export function rankProductsForPost<T extends PostProductRecommendationCandidate>(
  post: PostProductRecommendationInput,
  products: readonly T[],
  limit = 2,
): T[] {
  const resultLimit = Math.max(0, limit)
  const postTokens = searchTokens(
    [post.title, post.focusKeyword, post.secondaryKeywords].filter(Boolean).join(' '),
  )
  const availableProducts = products.filter((product) => product.stock > 0)
  const candidates = availableProducts.length >= resultLimit
    ? availableProducts
    : products

  return candidates
    .map((product) => {
      const productTokens = searchTokens([
        product.name,
        product.short_description,
        product.category?.name,
      ].filter(Boolean).join(' '))
      const overlap = [...postTokens].filter((token) => productTokens.has(token)).length
      const score = overlap * 10 + Number(product.is_featured) * 2 + Number(product.stock > 0)

      return { product, score }
    })
    .sort((left, right) => right.score - left.score || left.product.id - right.product.id)
    .slice(0, resultLimit)
    .map(({ product }) => product)
}

const SITE_NAME = 'Mushroomie'
const TITLE_MIN_LENGTH = 50
const TITLE_MAX_LENGTH = 60
const META_MIN_LENGTH = 140
const META_MAX_LENGTH = 160

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function trimAtWord(value: string, maxLength: number) {
  const clean = collapseWhitespace(value)
  if (clean.length <= maxLength) return clean

  const candidate = clean.slice(0, Math.max(1, maxLength - 1)).trimEnd()
  const lastSpace = candidate.lastIndexOf(' ')
  const trimmed = lastSpace > maxLength * 0.65 ? candidate.slice(0, lastSpace) : candidate
  return `${trimmed.trimEnd()}…`
}

function titleDistance(title: string) {
  if (title.length < TITLE_MIN_LENGTH) return TITLE_MIN_LENGTH - title.length
  if (title.length > TITLE_MAX_LENGTH) return title.length - TITLE_MAX_LENGTH
  return 0
}

function fitProductTitle(value: string) {
  const clean = collapseWhitespace(value)
  if (clean.length <= TITLE_MAX_LENGTH) return clean

  const suffix = ` | ${SITE_NAME}`
  const unbranded = clean
    .replace(/\s*(?:\||[-–—])?\s*Mushroomie\s*$/i, '')
    .trim()

  return `${trimAtWord(unbranded, TITLE_MAX_LENGTH - suffix.length)}${suffix}`
}

export interface ProductMetadataOptions {
  sku?: string | null
  isCustomizable?: boolean
}

function productIdentity(productName: string, options: ProductMetadataOptions) {
  const name = collapseWhitespace(productName)
  const sku = collapseWhitespace(options.sku || '')
  return sku ? `${name} mã ${sku}` : name
}

function buildProductSeoTitle(productName: string, options: ProductMetadataOptions) {
  const name = productIdentity(productName, options)
  const includesHandmade = /\bhandmade\b/i.test(name)
  const handmadeSuffix = includesHandmade ? '' : ' handmade'
  const candidates = [
    ...(options.isCustomizable
      ? [
          `${name}${handmadeSuffix} cá nhân hóa theo yêu cầu | ${SITE_NAME}`,
          `${name}${handmadeSuffix} cá nhân hóa | ${SITE_NAME}`,
        ]
      : []),
    `${name}${handmadeSuffix} thiết kế thủ công cho Gen Z | ${SITE_NAME}`,
    `${name}${handmadeSuffix} phụ kiện nhỏ xinh | ${SITE_NAME}`,
    `Mua ${name}${handmadeSuffix} tại ${SITE_NAME}`,
    `Mua ${name} | ${SITE_NAME}`,
    `${name} | ${SITE_NAME}`,
  ]
  const inRange = candidates
    .filter((candidate) => candidate.length >= TITLE_MIN_LENGTH && candidate.length <= TITLE_MAX_LENGTH)
    .sort((left, right) => Math.abs(left.length - 56) - Math.abs(right.length - 56))

  if (inRange[0]) return inRange[0]

  const closest = [...candidates]
    .sort((left, right) => titleDistance(left) - titleDistance(right))[0]
  return fitProductTitle(closest)
}

function buildProductMetaDescription(productName: string, options: ProductMetadataOptions) {
  const name = productIdentity(productName, options)
  const handmadeSuffix = /\bhandmade\b/i.test(name) ? '' : ' handmade'
  const productDetail = options.isCustomizable
    ? 'được phối thủ công và hỗ trợ cá nhân hóa màu sắc, charm theo sở thích'
    : 'được phối thủ công với màu sắc và charm hài hòa'
  let description = collapseWhitespace(
    `Khám phá ${name}${handmadeSuffix} tại Mushroomie, ${productDetail}. Phù hợp làm quà tặng nhỏ xinh cho bạn bè, người thân hoặc chính bạn.`,
  )

  if (description.length > META_MAX_LENGTH) {
    description = trimAtWord(description, META_MAX_LENGTH)
  }
  if (description.length < META_MIN_LENGTH) {
    description = trimAtWord(
      `${description.replace(/[.…]$/, '')}, mang dấu ấn riêng trong từng chi tiết.`,
      META_MAX_LENGTH,
    )
  }

  return description
}

export function buildProductMetadataText(
  productName: string,
  options: ProductMetadataOptions = {},
) {
  return {
    title: buildProductSeoTitle(productName, options),
    description: buildProductMetaDescription(productName, options),
  }
}

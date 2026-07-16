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

function fitSeoTitle(value: string) {
  const clean = collapseWhitespace(value)
  if (clean.length <= TITLE_MAX_LENGTH) return clean

  if (/Mushroomie\s*$/i.test(clean)) {
    const suffix = ` | ${SITE_NAME}`
    const unbranded = clean
      .replace(/\s*(?:\||[-–—])?\s*Mushroomie\s*$/i, '')
      .trim()
    return `${trimAtWord(unbranded, TITLE_MAX_LENGTH - suffix.length)}${suffix}`
  }

  return trimAtWord(clean, TITLE_MAX_LENGTH)
}

export function resolvePostMetadataTitle(
  title: string,
  seoTitle?: string | null,
): string {
  const configuredTitle = seoTitle?.trim()
  if (configuredTitle) {
    if (/Mushroomie\s*$/i.test(configuredTitle)) {
      if (configuredTitle.length < TITLE_MIN_LENGTH) {
        const unbranded = configuredTitle.replace(/\s*\|\s*Mushroomie\s*$/i, '')
        const brandedCandidates = [
          /cách làm/i.test(unbranded)
            ? `${unbranded} | Hướng dẫn ${SITE_NAME}`
            : null,
          /xu hướng/i.test(unbranded)
            ? `${unbranded} | Cẩm nang ${SITE_NAME}`
            : null,
        ].filter((candidate): candidate is string => Boolean(candidate))
        const fitted = brandedCandidates.find(
          (candidate) => candidate.length >= TITLE_MIN_LENGTH && candidate.length <= TITLE_MAX_LENGTH,
        )
        if (fitted) return fitted
      }

      return fitSeoTitle(configuredTitle)
    }
    if (configuredTitle.length > TITLE_MAX_LENGTH) {
      return fitSeoTitle(configuredTitle)
    }
    if (configuredTitle.length < TITLE_MIN_LENGTH) {
      const semanticCandidates = [
        /nữ/i.test(configuredTitle) ? `${configuredTitle} cho Gen Z` : null,
        /phối đồ/i.test(configuredTitle) ? `${configuredTitle} hằng ngày` : null,
        /đôi/i.test(configuredTitle) ? `${configuredTitle} làm quà` : null,
      ].filter((candidate): candidate is string => Boolean(candidate))
      const candidates = [
        ...semanticCandidates,
        `${configuredTitle} | ${SITE_NAME}`,
        `${configuredTitle} | Blog ${SITE_NAME}`,
        `${configuredTitle} | Góc ${SITE_NAME}`,
      ]
        .filter((candidate) => candidate.length >= TITLE_MIN_LENGTH && candidate.length <= TITLE_MAX_LENGTH)
        .sort((left, right) => Math.abs(left.length - 56) - Math.abs(right.length - 56))
      if (candidates[0]) return candidates[0]
    }

    return fitSeoTitle(configuredTitle)
  }

  return fitSeoTitle(`${title.trim()} | ${SITE_NAME}`)
}

export function resolvePostMetadataDescription(
  title: string,
  metaDescription?: string | null,
  excerpt?: string | null,
) {
  const configured = collapseWhitespace(metaDescription || excerpt || '')
  if (configured.length >= META_MIN_LENGTH && configured.length <= META_MAX_LENGTH) {
    return configured
  }
  if (configured.length > META_MAX_LENGTH) {
    return trimAtWord(configured, META_MAX_LENGTH)
  }

  const candidate = configured.length >= 100
    ? `${configured.replace(/[.…]$/, '')}. Khám phá thêm gợi ý phối màu và cá nhân hóa từ Mushroomie.`
    : `Khám phá ${collapseWhitespace(title)} cùng Mushroomie: gợi ý chọn phụ kiện handmade, phối màu và cá nhân hóa theo phong cách riêng, phù hợp làm quà tặng nhiều cảm xúc.`

  return trimAtWord(candidate, META_MAX_LENGTH)
}

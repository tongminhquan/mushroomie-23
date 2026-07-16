const GENERATED_ALT_PATTERNS = [
  {
    pattern: /^(.+?)\s*-\s*(?:phụ kiện|phu kien) handmade (?:cá nhân hóa|ca nhan hoa) Mushroomie$/iu,
    replacement: (subject: string) => `${subject.trim()} trong bộ ảnh sản phẩm Mushroomie`,
  },
  {
    pattern: /^(.+?)\s*-\s*(?:gợi ý phối|goi y phoi) phụ kiện handmade Mushroomie$/iu,
    replacement: (subject: string) => `Gợi ý phối màu cho ${subject.trim()}`,
  },
]

export function normalizeGeneratedPostImageAlt(alt: string) {
  const value = alt.trim()
  for (const { pattern, replacement } of GENERATED_ALT_PATTERNS) {
    const match = value.match(pattern)
    if (match?.[1]) return replacement(match[1])
  }

  return value
}

export interface PostSeoInput {
  title?: string | null
  slug?: string | null
  content?: string | null
  seo_title?: string | null
  meta_description?: string | null
  focus_keyword?: string | null
  secondary_keywords?: string[] | string | null
  featured_image?: string | null
  featured_image_alt?: string | null
  og_image?: string | null
  twitter_image?: string | null
}

export type PostSeoCheckGroup = 'basic' | 'additional' | 'title_readability' | 'content_readability'

export interface PostSeoCheckResult {
  status: 'success' | 'warning' | 'error'
  text: string
  group: PostSeoCheckGroup
}

export interface PostSeoAnalysis {
  score: number
  checks: PostSeoCheckResult[]
}

function parseSecondaryKeywords(value: PostSeoInput['secondary_keywords']): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (!value || typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
}

export function calculatePostSeoAnalysis(form: PostSeoInput): PostSeoAnalysis {
  const checks: PostSeoCheckResult[] = []
  let points = 0
  const keyword = (form.focus_keyword || '').toLowerCase().trim()

  if (!keyword) {
    return {
      score: 0,
      checks: [{ status: 'error', text: 'Chưa thiết lập Từ khóa chính (Focus Keyword).', group: 'basic' }],
    }
  }

  const rawHtml = form.content || ''
  const plain = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim()
  const wordCount = plain.split(/\s+/).filter(Boolean).length
  const titleValue = form.seo_title || form.title || ''
  const title = titleValue.toLowerCase()
  const descriptionValue = form.meta_description || ''
  const description = descriptionValue.toLowerCase()
  const slug = (form.slug || '').toLowerCase()
  const keywordPattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')

  if (title.includes(keyword)) {
    points += 10
    checks.push({ status: 'success', text: 'Tuyệt vời! Bạn đang sử dụng từ khoá chính trong Tiêu đề SEO.', group: 'basic' })
  } else checks.push({ status: 'error', text: 'Từ khoá chính chưa xuất hiện trong Tiêu đề SEO.', group: 'basic' })

  if (description.includes(keyword)) {
    points += 8
    checks.push({ status: 'success', text: 'Đã sử dụng từ khoá chính trong Mô tả Meta SEO.', group: 'basic' })
  } else checks.push({ status: 'error', text: 'Thêm từ khoá chính vào Mô tả Meta (Meta Description).', group: 'basic' })

  const keywordSlug = keyword.replace(/\s+/g, '-')
  if (slug.includes(keywordSlug) || slug.replace(/-/g, '').includes(keyword.replace(/\s/g, ''))) {
    points += 7
    checks.push({ status: 'success', text: 'Từ khoá chính đã được sử dụng trong URL.', group: 'basic' })
  } else checks.push({ status: 'warning', text: 'Nên đưa từ khoá chính vào Đường dẫn tĩnh (Slug).', group: 'basic' })

  const firstPart = plain.substring(0, Math.max(150, Math.floor(plain.length * 0.1)))
  if (firstPart.includes(keyword)) {
    points += 8
    checks.push({ status: 'success', text: 'Từ khóa chính xuất hiện trong 10% nội dung đầu tiên.', group: 'basic' })
  } else checks.push({ status: 'warning', text: 'Hãy chèn từ khóa vào đoạn mở bài (10% đầu tiên).', group: 'basic' })

  const keywordCount = (plain.match(keywordPattern) || []).length
  if (keywordCount > 0) {
    points += 7
    checks.push({ status: 'success', text: 'Đã tìm thấy từ khoá chính trong nội dung.', group: 'basic' })
  } else checks.push({ status: 'error', text: 'Từ khoá chính chưa xuất hiện trong nội dung bài viết.', group: 'basic' })

  if (wordCount >= 600) {
    points += 8
    checks.push({ status: 'success', text: `Nội dung dài ${wordCount} từ. Làm tốt lắm!`, group: 'basic' })
  } else if (wordCount >= 300) {
    points += 4
    checks.push({ status: 'warning', text: `Nội dung dài ${wordCount} từ. Nên đạt trên 600 từ.`, group: 'basic' })
  } else checks.push({ status: 'error', text: `Nội dung quá ngắn (${wordCount} từ). Tối thiểu cần 300 từ.`, group: 'basic' })

  const metaLength = descriptionValue.length
  if (metaLength >= 120 && metaLength <= 160) {
    points += 7
    checks.push({ status: 'success', text: `Meta description ${metaLength} ký tự. Hoàn hảo!`, group: 'basic' })
  } else if (metaLength >= 80) {
    points += 3
    checks.push({ status: 'warning', text: `Meta description ${metaLength > 160 ? 'quá dài' : 'hơi ngắn'} (${metaLength} ký tự). Khuyến nghị 120–160 ký tự.`, group: 'basic' })
  } else if (metaLength > 0) checks.push({ status: 'error', text: `Meta description quá ngắn (${metaLength} ký tự). Tối thiểu 80 ký tự.`, group: 'basic' })
  else checks.push({ status: 'error', text: 'Chưa nhập meta description.', group: 'basic' })

  const h2Matches = rawHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || []
  const h2Text = h2Matches.map((heading) => heading.replace(/<[^>]+>/g, '')).join(' ').toLowerCase()
  if (h2Text.includes(keyword)) {
    points += 5
    checks.push({ status: 'success', text: 'Từ khoá chính xuất hiện trong ít nhất một tiêu đề H2.', group: 'additional' })
  } else checks.push({ status: 'warning', text: 'Nên thêm từ khoá vào ít nhất một tiêu đề phụ H2.', group: 'additional' })

  if (h2Matches.length >= 2) {
    points += 3
    checks.push({ status: 'success', text: `Bài viết có ${h2Matches.length} tiêu đề H2. Tốt!`, group: 'additional' })
  } else if (h2Matches.length === 1) {
    points += 1
    checks.push({ status: 'warning', text: 'Chỉ có 1 tiêu đề H2. Nên có ít nhất 2 H2.', group: 'additional' })
  } else checks.push({ status: 'error', text: 'Chưa có tiêu đề H2 nào. Nên có ít nhất 2 H2.', group: 'additional' })

  const h1Count = (rawHtml.match(/<h1[^>]*>/gi) || []).length
  if (h1Count === 0) {
    points += 3
    checks.push({ status: 'success', text: 'Nội dung không chứa thẻ H1 (H1 chỉ nên ở tiêu đề bài).', group: 'additional' })
  } else checks.push({ status: 'error', text: `Phát hiện ${h1Count} thẻ H1 trong nội dung. Không nên dùng H1 trong bài viết.`, group: 'additional' })

  const altTexts = (rawHtml.match(/alt="([^"]*)"/gi) || []).join(' ').toLowerCase()
  if (altTexts.includes(keyword)) {
    points += 3
    checks.push({ status: 'success', text: 'Đã tìm thấy từ khoá chính trong thuộc tính alt của hình ảnh.', group: 'additional' })
  } else checks.push({ status: 'warning', text: altTexts ? 'Thêm từ khoá chính vào thuộc tính alt của hình ảnh.' : 'Không tìm thấy hình ảnh có thuộc tính alt. Hãy thêm hình và alt text.', group: 'additional' })

  if (keywordCount > 0 && wordCount > 0) {
    const density = (keywordCount / wordCount) * 100
    if (density >= 0.5 && density <= 2.5) {
      points += 3
      checks.push({ status: 'success', text: `Mật độ từ khóa là ${density.toFixed(2)}%, xuất hiện ${keywordCount} lần.`, group: 'additional' })
    } else checks.push({ status: 'warning', text: `Mật độ từ khóa ${density > 2.5 ? 'hơi cao' : 'còn thấp'} (${density.toFixed(2)}%).`, group: 'additional' })
  }

  if (slug.length > 0 && slug.length <= 75) {
    points += 3
    checks.push({ status: 'success', text: `URL dài ${slug.length} ký tự. Rất tốt!`, group: 'additional' })
  } else if (slug.length > 75) checks.push({ status: 'warning', text: `URL quá dài (${slug.length} ký tự). Nên giữ dưới 75 ký tự.`, group: 'additional' })

  const externalLinks = rawHtml.match(/href="https?:\/\/[^"]+"/gi) || []
  if (externalLinks.length > 0) {
    points += 3
    checks.push({ status: 'success', text: `Tuyệt vời! Bạn đang liên kết đến ${externalLinks.length} tài nguyên bên ngoài.`, group: 'additional' })
  } else checks.push({ status: 'warning', text: 'Nên thêm ít nhất một liên kết ngoại (external link).', group: 'additional' })

  const internalLinks = rawHtml.match(/href="\/[^"]+"/gi) || []
  if (internalLinks.length > 0) {
    points += 4
    checks.push({ status: 'success', text: `Bạn đang liên kết đến ${internalLinks.length} tài nguyên khác trên trang web.`, group: 'additional' })
  } else checks.push({ status: 'warning', text: 'Nên thêm liên kết nội bộ (internal link) đến bài viết khác.', group: 'additional' })

  if (title.startsWith(keyword)) {
    points += 3
    checks.push({ status: 'success', text: 'Từ khoá chính được sử dụng ở đầu tiêu đề SEO.', group: 'title_readability' })
  } else checks.push({ status: 'warning', text: 'Nên đặt từ khóa chính ở đầu tiêu đề SEO để tăng hiệu quả.', group: 'title_readability' })

  if (/\d/.test(titleValue)) {
    points += 2
    checks.push({ status: 'success', text: 'Bạn đang sử dụng một số trong tiêu đề SEO.', group: 'title_readability' })
  } else checks.push({ status: 'warning', text: 'Thêm số vào tiêu đề (ví dụ: "Top 10...") để thu hút click.', group: 'title_readability' })

  if (form.featured_image) {
    points += 3
    checks.push({ status: 'success', text: 'Bài viết có ảnh đại diện. Tốt!', group: 'content_readability' })
    if (form.featured_image_alt) {
      points += 2
      checks.push({ status: 'success', text: 'Ảnh đại diện có alt text. Tốt cho SEO!', group: 'content_readability' })
    } else checks.push({ status: 'warning', text: 'Ảnh đại diện chưa có alt text. Hãy thêm mô tả ảnh.', group: 'content_readability' })
  } else checks.push({ status: 'error', text: 'Thiếu ảnh đại diện. Ảnh giúp tăng CTR khi chia sẻ.', group: 'content_readability' })

  const imageCount = (rawHtml.match(/<img/gi) || []).length
  if (imageCount > 0) {
    points += 2
    checks.push({ status: 'success', text: `Nội dung của bạn chứa ${imageCount} hình ảnh.`, group: 'content_readability' })
  } else checks.push({ status: 'warning', text: 'Nên thêm ít nhất một hình ảnh vào nội dung.', group: 'content_readability' })

  const paragraphs = rawHtml.split(/<\/p>/i).filter((paragraph) => paragraph.trim().length > 0)
  const longParagraphs = paragraphs.filter((paragraph) => paragraph.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length > 150)
  if (paragraphs.length > 0 && longParagraphs.length === 0) {
    points += 3
    checks.push({ status: 'success', text: 'Bạn đang sử dụng các đoạn văn ngắn. Rất tốt!', group: 'content_readability' })
  } else checks.push({ status: 'warning', text: longParagraphs.length > 0 ? `${longParagraphs.length} đoạn văn quá dài. Hãy chia nhỏ để dễ đọc hơn.` : 'Chưa có nội dung để đánh giá khả năng đọc.', group: 'content_readability' })

  const secondaryKeywords = parseSecondaryKeywords(form.secondary_keywords)
  if (secondaryKeywords.length > 0) {
    const found = secondaryKeywords.filter((item) => item.trim() && plain.includes(item.toLowerCase().trim())).length
    if (found > 0) {
      points += 3
      checks.push({ status: 'success', text: `Tìm thấy ${found}/${secondaryKeywords.length} từ khóa phụ trong nội dung.`, group: 'basic' })
    } else checks.push({ status: 'warning', text: 'Chưa tìm thấy từ khóa phụ nào trong nội dung bài viết.', group: 'basic' })
  }

  if (form.og_image || form.twitter_image || form.featured_image) {
    points += 2
    checks.push({ status: 'success', text: 'Đã có hình ảnh để hiển thị trên mạng xã hội.', group: 'additional' })
  } else checks.push({ status: 'warning', text: 'Nên thêm ảnh đại diện hoặc ảnh mạng xã hội để bài viết nổi bật khi chia sẻ.', group: 'additional' })

  return { score: Math.min(100, points), checks }
}

export function getPostSeoRating(score: number) {
  if (score >= 80) return { label: 'Tốt', tone: 'good' as const }
  if (score >= 50) return { label: 'Cần cải thiện', tone: 'warning' as const }
  if (score > 0) return { label: 'Kém', tone: 'poor' as const }
  return { label: 'Chưa chấm', tone: 'empty' as const }
}

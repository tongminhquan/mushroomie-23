export interface ArticleFigure {
  slot: 'content-1' | 'content-2'
  src: string
  alt: string
  caption: string
  width?: number
  height?: number
}

export function extractImageSources(html?: string | null): string[] {
  if (!html) return []

  const sources: string[] = []
  const imagePattern = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null

  while ((match = imagePattern.exec(html)) !== null) {
    const source = match[1].trim()
    if (source) sources.push(source)
  }

  return [...new Set(sources)]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function buildArticleFigureHtml(figure: ArticleFigure) {
  const dimensions = validDimension(figure.width) && validDimension(figure.height)
    ? ' width="' + figure.width + '" height="' + figure.height + '"'
    : ''

  return [
    '<figure class="mushroomie-article-media" data-mushroomie-media-slot="' + figure.slot + '">',
    '<img src="' + escapeHtml(figure.src) + '" alt="' + escapeHtml(figure.alt) + '"' + dimensions + ' loading="lazy" decoding="async">',
    '<figcaption>' + escapeHtml(figure.caption) + '</figcaption>',
    '</figure>',
  ].join('')
}

function validDimension(value: number | undefined) {
  return Boolean(value && Number.isFinite(value) && value > 0)
}

function closingTagOffsets(html: string, tag: 'h2' | 'p') {
  const offsets: number[] = []
  const pattern = new RegExp('</' + tag + '\\s*>', 'gi')
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null) {
    offsets.push(match.index + match[0].length)
  }

  return offsets
}

function chooseInsertionOffsets(html: string, count: number) {
  const headings = closingTagOffsets(html, 'h2')
  const paragraphs = closingTagOffsets(html, 'p')
  const offsets: number[] = []

  for (const heading of headings.slice(0, count)) {
    offsets.push(heading)
  }

  if (offsets.length < count && paragraphs.length > 0) {
    const desired = count - offsets.length
    for (let index = 1; index <= desired; index++) {
      const paragraphIndex = Math.min(
        paragraphs.length - 1,
        Math.max(0, Math.floor((paragraphs.length * index) / (desired + 1))),
      )
      offsets.push(paragraphs[paragraphIndex])
    }
  }

  while (offsets.length < count) offsets.push(html.length)
  return offsets.slice(0, count).sort((a, b) => a - b)
}

export function insertArticleFigures(
  html: string | null | undefined,
  figures: ArticleFigure[],
) {
  let result = html || ''
  const pending = figures.filter(
    (figure) => !result.includes('data-mushroomie-media-slot="' + figure.slot + '"'),
  )

  if (pending.length === 0) return result

  const offsets = chooseInsertionOffsets(result, pending.length)
  const insertions = pending
    .map((figure, index) => ({
      offset: offsets[index],
      html: buildArticleFigureHtml(figure),
    }))
    .sort((a, b) => b.offset - a.offset)

  for (const insertion of insertions) {
    result = result.slice(0, insertion.offset) + insertion.html + result.slice(insertion.offset)
  }

  return result
}

import { parseFragment, serialize, type DefaultTreeAdapterTypes } from 'parse5'

export interface ArticleFigure {
  slot: 'content-1' | 'content-2'
  src: string
  alt: string
  caption: string
  width?: number
  height?: number
}

export interface ArticleMediaSource {
  src: string
  width: number
  height: number
}

export interface ArticleFigureCopy {
  alt: string
  caption: string
}

export interface ArticleMediaNormalizationPlan {
  normalizationNeeded: boolean
  oldFigureCount: number
  newFigureCount: number
}

const ARTICLE_MEDIA_NORMALIZATION_SLUGS = new Set(['vong-tay-handmade'])

export function extractImageSources(html?: string | null): string[] {
  if (!html) return []

  const sources: string[] = []
  for (const image of collectElementsByTagName(parseFragment(html), 'img')) {
    const source = getElementAttribute(image, 'src')?.trim()
    if (source) sources.push(source)
  }

  return [...new Set(sources)]
}

export function createArticleFigures(
  media: ArticleMediaSource[],
  copies: ArticleFigureCopy[],
): ArticleFigure[] {
  return media.slice(0, 2).map((image, index) => ({
    slot: index === 0 ? 'content-1' : 'content-2',
    src: image.src,
    width: image.width,
    height: image.height,
    alt: copies[index]?.alt || '',
    caption: copies[index]?.caption || '',
  }))
}

export function planArticleMediaNormalization(
  slug: string,
  html?: string | null,
): ArticleMediaNormalizationPlan {
  const figures = collectElementsByTagName(parseFragment(html || ''), 'figure')
    .filter(isManagedArticleFigure)
  const slots = figures.map((figure) => getElementAttribute(figure, 'data-mushroomie-media-slot'))
  const hasExpectedSlots = figures.length === 2
    && slots.includes('content-1')
    && slots.includes('content-2')
  const normalizationNeeded = ARTICLE_MEDIA_NORMALIZATION_SLUGS.has(slug) && !hasExpectedSlots

  return {
    normalizationNeeded,
    oldFigureCount: figures.length,
    newFigureCount: normalizationNeeded ? 2 : figures.length,
  }
}

export function postNeedsArticleMediaWork(
  generatedCount: number,
  normalizationNeeded: boolean,
) {
  return generatedCount > 0 || normalizationNeeded
}

export function normalizeArticleFigures(
  html: string | null | undefined,
  figures: ArticleFigure[],
) {
  const fragment = parseFragment(html || '')
  const existingFigures = collectElementsByTagName(fragment, 'figure')
    .filter(isManagedArticleFigure)

  for (const figure of existingFigures) {
    const parent = figure.parentNode
    if (!parent) continue
    const index = parent.childNodes.indexOf(figure)
    if (index >= 0) parent.childNodes.splice(index, 1)
  }

  const normalizedHtml = insertArticleFigures(serialize(fragment), figures.slice(0, 2))
  const newFigureCount = collectElementsByTagName(parseFragment(normalizedHtml), 'figure')
    .filter(isManagedArticleFigure)
    .length

  return {
    html: normalizedHtml,
    oldFigureCount: existingFigures.length,
    newFigureCount,
  }
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

function collectElementsByTagName(
  root: DefaultTreeAdapterTypes.ParentNode,
  tagName: string,
) {
  const elements: DefaultTreeAdapterTypes.Element[] = []

  function visit(node: DefaultTreeAdapterTypes.ParentNode) {
    for (const child of node.childNodes) {
      if (!('tagName' in child)) continue
      if (child.tagName === tagName) elements.push(child)
      visit(child)
    }
  }

  visit(root)
  return elements
}

function getElementAttribute(element: DefaultTreeAdapterTypes.Element, name: string) {
  return element.attrs.find((attribute) => attribute.name === name)?.value
}

function isManagedArticleFigure(figure: DefaultTreeAdapterTypes.Element) {
  return Boolean(getElementAttribute(figure, 'data-mushroomie-media-slot'))
    || collectElementsByTagName(figure, 'img').length > 0
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

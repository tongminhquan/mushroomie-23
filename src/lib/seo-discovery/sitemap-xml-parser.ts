import { validatePublicUrl } from './eligibility'

export type SitemapXmlErrorCode =
  | 'SITEMAP_INVALID_XML'
  | 'SITEMAP_DUPLICATE_URL'

export class SitemapXmlError extends Error {
  readonly code: SitemapXmlErrorCode

  constructor(code: SitemapXmlErrorCode) {
    super(`SEO_DISCOVERY_${code}`)
    this.name = 'SitemapXmlError'
    this.code = code
  }
}

function xmlError(code: SitemapXmlErrorCode): never {
  throw new SitemapXmlError(code)
}

const MAX_SITEMAP_URL_ENTRIES = 10_000
const MAX_XML_NESTING_DEPTH = 32
const MAX_CORE_TEXT_LENGTH = 2_048
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const SITEMAP_CHANGE_FREQUENCIES = new Set([
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
])
const SITEMAP_PRIORITY_PATTERN = /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/

function validXmlCodePoint(codePoint: number): boolean {
  return codePoint === 0x09
    || codePoint === 0x0a
    || codePoint === 0x0d
    || (codePoint >= 0x20 && codePoint <= 0xd7ff)
    || (codePoint >= 0xe000 && codePoint <= 0xfffd)
    || (codePoint >= 0x10000 && codePoint <= 0x10ffff)
}

function decodedEntityReference(reference: string): string | null {
  const predefined: Readonly<Record<string, string>> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  }
  const predefinedValue = predefined[reference]
  if (predefinedValue !== undefined) return predefinedValue
  if (!reference.startsWith('#')) return null

  const hexadecimal = reference[1] === 'x'
  const digits = reference.slice(hexadecimal ? 2 : 1)
  if (!digits) return null

  const radix = hexadecimal ? 16 : 10
  let codePoint = 0
  for (const character of digits) {
    const code = character.charCodeAt(0)
    let digit: number
    if (code >= 48 && code <= 57) {
      digit = code - 48
    } else if (hexadecimal && code >= 65 && code <= 70) {
      digit = code - 55
    } else if (hexadecimal && code >= 97 && code <= 102) {
      digit = code - 87
    } else {
      return null
    }

    codePoint = (codePoint * radix) + digit
    if (codePoint > 0x10ffff) return null
  }

  return validXmlCodePoint(codePoint) ? String.fromCodePoint(codePoint) : null
}

function decodeXmlEntities(value: string): string {
  let decoded = ''
  let cursor = 0

  while (cursor < value.length) {
    const ampersand = value.indexOf('&', cursor)
    if (ampersand < 0) return decoded + value.slice(cursor)

    decoded += value.slice(cursor, ampersand)
    const semicolon = value.indexOf(';', ampersand + 1)
    if (semicolon < 0) xmlError('SITEMAP_INVALID_XML')

    const replacement = decodedEntityReference(
      value.slice(ampersand + 1, semicolon),
    )
    if (replacement === null) xmlError('SITEMAP_INVALID_XML')
    decoded += replacement
    cursor = semicolon + 1
  }

  return decoded
}

function containsEncodedEntityReference(value: string): boolean {
  let cursor = 0
  while (cursor < value.length) {
    const ampersand = value.indexOf('&', cursor)
    if (ampersand < 0) return false
    const semicolon = value.indexOf(';', ampersand + 1)
    if (semicolon < 0) return false
    if (decodedEntityReference(value.slice(ampersand + 1, semicolon)) !== null) {
      return true
    }
    cursor = ampersand + 1
  }
  return false
}

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

function parseLastModified(value: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  if (!dateOnly && !dateTime) xmlError('SITEMAP_INVALID_XML')
  if (!isValidCalendarDate(value.slice(0, 10))) xmlError('SITEMAP_INVALID_XML')

  const timestamp = Date.parse(dateOnly ? `${value}T00:00:00.000Z` : value)
  if (!Number.isFinite(timestamp)) xmlError('SITEMAP_INVALID_XML')
  return new Date(timestamp)
}

function isXmlWhitespace(character: string | undefined): boolean {
  return character === ' '
    || character === '\t'
    || character === '\r'
    || character === '\n'
}

function isOnlyXmlWhitespace(value: string): boolean {
  for (const character of value) {
    if (!isXmlWhitespace(character)) return false
  }
  return true
}

function isXmlNameStart(character: string | undefined): boolean {
  if (!character) return false
  const code = character.charCodeAt(0)
  return character === '_'
    || (code >= 65 && code <= 90)
    || (code >= 97 && code <= 122)
}

function isXmlNameCharacter(character: string | undefined): boolean {
  if (!character) return false
  const code = character.charCodeAt(0)
  return isXmlNameStart(character)
    || character === ':'
    || character === '-'
    || character === '.'
    || (code >= 48 && code <= 57)
}

function isValidQualifiedName(name: string): boolean {
  const separator = name.indexOf(':')
  if (separator < 0) return true
  if (
    separator === 0
    || separator === name.length - 1
    || name.indexOf(':', separator + 1) >= 0
  ) {
    return false
  }
  return isXmlNameStart(name[separator + 1])
}

function assertValidXmlCharacters(value: string): void {
  for (let index = 0; index < value.length;) {
    const codePoint = value.codePointAt(index)
    if (codePoint === undefined || !validXmlCodePoint(codePoint)) {
      xmlError('SITEMAP_INVALID_XML')
    }
    index += codePoint > 0xffff ? 2 : 1
  }
}

interface XmlStartToken {
  kind: 'start'
  offset: number
  name: string
  attributes: ReadonlyMap<string, string>
  selfClosing: boolean
}

interface XmlEndToken {
  kind: 'end'
  offset: number
  name: string
}

interface XmlValueToken {
  kind: 'text' | 'cdata' | 'comment'
  offset: number
  value: string
}

interface XmlProcessingInstructionToken {
  kind: 'processing-instruction'
  offset: number
  target: string
  data: string
}

type XmlToken =
  | XmlStartToken
  | XmlEndToken
  | XmlValueToken
  | XmlProcessingInstructionToken

class XmlTokenizer {
  private cursor = 0

  constructor(private readonly source: string) {}

  next(): XmlToken | null {
    if (this.cursor >= this.source.length) return null
    const offset = this.cursor

    if (this.source[this.cursor] !== '<') {
      const nextMarkup = this.source.indexOf('<', this.cursor)
      const end = nextMarkup < 0 ? this.source.length : nextMarkup
      const value = this.source.slice(this.cursor, end)
      this.cursor = end
      assertValidXmlCharacters(value)
      if (value.includes(']]>')) xmlError('SITEMAP_INVALID_XML')
      return { kind: 'text', offset, value }
    }

    if (this.source.startsWith('<!--', this.cursor)) {
      return this.readComment(offset)
    }
    if (this.source.startsWith('<![CDATA[', this.cursor)) {
      return this.readCdata(offset)
    }
    if (this.source.startsWith('<?', this.cursor)) {
      return this.readProcessingInstruction(offset)
    }
    if (this.source.startsWith('</', this.cursor)) {
      return this.readEndTag(offset)
    }
    if (this.source.startsWith('<!', this.cursor)) {
      // DTDs, entity declarations, and all other declarations are forbidden.
      xmlError('SITEMAP_INVALID_XML')
    }
    return this.readStartTag(offset)
  }

  private readComment(offset: number): XmlValueToken {
    const valueStart = this.cursor + 4
    const end = this.source.indexOf('-->', valueStart)
    if (end < 0) xmlError('SITEMAP_INVALID_XML')
    const value = this.source.slice(valueStart, end)
    if (value.includes('--') || value.endsWith('-')) {
      xmlError('SITEMAP_INVALID_XML')
    }
    assertValidXmlCharacters(value)
    this.cursor = end + 3
    return { kind: 'comment', offset, value }
  }

  private readCdata(offset: number): XmlValueToken {
    const valueStart = this.cursor + 9
    const end = this.source.indexOf(']]>', valueStart)
    if (end < 0) xmlError('SITEMAP_INVALID_XML')
    const value = this.source.slice(valueStart, end)
    assertValidXmlCharacters(value)
    this.cursor = end + 3
    return { kind: 'cdata', offset, value }
  }

  private readProcessingInstruction(
    offset: number,
  ): XmlProcessingInstructionToken {
    this.cursor += 2
    const target = this.readName()
    const dataStart = this.cursor
    const end = this.source.indexOf('?>', dataStart)
    if (end < 0) xmlError('SITEMAP_INVALID_XML')
    const data = this.source.slice(dataStart, end)
    if (data && !isXmlWhitespace(data[0])) xmlError('SITEMAP_INVALID_XML')
    assertValidXmlCharacters(data)
    this.cursor = end + 2
    return { kind: 'processing-instruction', offset, target, data }
  }

  private readEndTag(offset: number): XmlEndToken {
    this.cursor += 2
    const name = this.readName()
    this.skipWhitespace()
    if (this.source[this.cursor] !== '>') xmlError('SITEMAP_INVALID_XML')
    this.cursor += 1
    return { kind: 'end', offset, name }
  }

  private readStartTag(offset: number): XmlStartToken {
    this.cursor += 1
    const name = this.readName()
    const attributes = new Map<string, string>()

    while (true) {
      const whitespaceCount = this.skipWhitespace()
      if (this.source.startsWith('/>', this.cursor)) {
        this.cursor += 2
        return { kind: 'start', offset, name, attributes, selfClosing: true }
      }
      if (this.source[this.cursor] === '>') {
        this.cursor += 1
        return { kind: 'start', offset, name, attributes, selfClosing: false }
      }
      if (whitespaceCount === 0) xmlError('SITEMAP_INVALID_XML')

      const attributeName = this.readName()
      if (attributes.has(attributeName)) xmlError('SITEMAP_INVALID_XML')
      this.skipWhitespace()
      if (this.source[this.cursor] !== '=') xmlError('SITEMAP_INVALID_XML')
      this.cursor += 1
      this.skipWhitespace()

      const quote = this.source[this.cursor]
      if (quote !== '"' && quote !== "'") xmlError('SITEMAP_INVALID_XML')
      this.cursor += 1
      const valueStart = this.cursor
      const valueEnd = this.source.indexOf(quote, valueStart)
      if (valueEnd < 0) xmlError('SITEMAP_INVALID_XML')
      const rawValue = this.source.slice(valueStart, valueEnd)
      if (rawValue.includes('<')) xmlError('SITEMAP_INVALID_XML')
      assertValidXmlCharacters(rawValue)
      attributes.set(attributeName, decodeXmlEntities(rawValue))
      this.cursor = valueEnd + 1
    }
  }

  private readName(): string {
    const start = this.cursor
    if (!isXmlNameStart(this.source[this.cursor])) {
      xmlError('SITEMAP_INVALID_XML')
    }
    this.cursor += 1
    while (isXmlNameCharacter(this.source[this.cursor])) this.cursor += 1
    const name = this.source.slice(start, this.cursor)
    if (!isValidQualifiedName(name)) xmlError('SITEMAP_INVALID_XML')
    return name
  }

  private skipWhitespace(): number {
    const start = this.cursor
    while (isXmlWhitespace(this.source[this.cursor])) this.cursor += 1
    return this.cursor - start
  }
}

function validateXmlDeclaration(data: string): void {
  if (!data || !isXmlWhitespace(data[0]) || data.includes('&')) {
    xmlError('SITEMAP_INVALID_XML')
  }

  const tokenizer = new XmlTokenizer(`<declaration${data}>`)
  const declaration = tokenizer.next()
  if (
    !declaration
    || declaration.kind !== 'start'
    || declaration.name !== 'declaration'
    || declaration.selfClosing
    || tokenizer.next() !== null
  ) {
    xmlError('SITEMAP_INVALID_XML')
  }

  const names = [...declaration.attributes.keys()]
  if (names[0] !== 'version' || declaration.attributes.get('version') !== '1.0') {
    xmlError('SITEMAP_INVALID_XML')
  }

  let index = 1
  if (names[index] === 'encoding') {
    if (declaration.attributes.get('encoding')?.toLowerCase() !== 'utf-8') {
      xmlError('SITEMAP_INVALID_XML')
    }
    index += 1
  }
  if (names[index] === 'standalone') {
    const standalone = declaration.attributes.get('standalone')
    if (standalone !== 'yes' && standalone !== 'no') {
      xmlError('SITEMAP_INVALID_XML')
    }
    index += 1
  }
  if (index !== names.length) xmlError('SITEMAP_INVALID_XML')
}

function elementPrefix(name: string): string | null {
  const separator = name.indexOf(':')
  return separator < 0 ? null : name.slice(0, separator)
}

function namespaceScope(
  parent: ReadonlySet<string>,
  attributes: ReadonlyMap<string, string>,
): ReadonlySet<string> {
  let extendedScope: Set<string> | null = null

  for (const [name, value] of attributes) {
    if (!name.startsWith('xmlns:')) continue
    const prefix = name.slice('xmlns:'.length)
    if (!prefix || prefix === 'xmlns' || !value) xmlError('SITEMAP_INVALID_XML')
    if (
      prefix === 'xml'
      && value !== 'http://www.w3.org/XML/1998/namespace'
    ) {
      xmlError('SITEMAP_INVALID_XML')
    }
    extendedScope ??= new Set(parent)
    extendedScope.add(prefix)
  }

  const scope = extendedScope ?? parent
  for (const name of attributes.keys()) {
    const prefix = elementPrefix(name)
    if (prefix && prefix !== 'xmlns' && !scope.has(prefix)) {
      xmlError('SITEMAP_INVALID_XML')
    }
  }
  return scope
}

type SitemapScalarFrameKind = 'loc' | 'lastmod' | 'changefreq' | 'priority'

type XmlFrameKind = 'urlset' | 'url' | SitemapScalarFrameKind | 'extension'

function isSitemapScalarFrameKind(
  kind: string,
): kind is SitemapScalarFrameKind {
  return kind === 'loc'
    || kind === 'lastmod'
    || kind === 'changefreq'
    || kind === 'priority'
}

interface XmlFrame {
  kind: XmlFrameKind
  name: string
  namespaces: ReadonlySet<string>
  text: string
  location: string | null
  lastModified: string | null
  changeFrequency: string | null
  priority: string | null
}

function createFrame(
  kind: XmlFrameKind,
  token: XmlStartToken,
  namespaces: ReadonlySet<string>,
): XmlFrame {
  return {
    kind,
    name: token.name,
    namespaces,
    text: '',
    location: null,
    lastModified: null,
    changeFrequency: null,
    priority: null,
  }
}

export function parseSitemapXml(xml: string): Map<string, Date | null> {
  const source = xml.startsWith('\uFEFF') ? xml.slice(1) : xml
  const tokenizer = new XmlTokenizer(source)
  const result = new Map<string, Date | null>()
  const stack: XmlFrame[] = []
  let rootSeen = false
  let rootClosed = false
  let declarationSeen = false
  let prologContentSeen = false

  const closeElement = (name: string): void => {
    const frame = stack.pop()
    if (!frame || frame.name !== name) xmlError('SITEMAP_INVALID_XML')

    if (isSitemapScalarFrameKind(frame.kind)) {
      const parent = stack.at(-1)
      if (!parent || parent.kind !== 'url') xmlError('SITEMAP_INVALID_XML')
      const value = frame.text.trim()
      if (!value || containsEncodedEntityReference(value)) {
        xmlError('SITEMAP_INVALID_XML')
      }
      if (frame.kind === 'loc') {
        if (parent.location !== null) xmlError('SITEMAP_INVALID_XML')
        parent.location = value
      } else if (frame.kind === 'lastmod') {
        if (parent.lastModified !== null) xmlError('SITEMAP_INVALID_XML')
        parent.lastModified = value
      } else if (frame.kind === 'changefreq') {
        if (
          parent.changeFrequency !== null
          || !SITEMAP_CHANGE_FREQUENCIES.has(value)
        ) {
          xmlError('SITEMAP_INVALID_XML')
        }
        parent.changeFrequency = value
      } else {
        if (
          parent.priority !== null
          || !SITEMAP_PRIORITY_PATTERN.test(value)
        ) {
          xmlError('SITEMAP_INVALID_XML')
        }
        parent.priority = value
      }
      return
    }

    if (frame.kind === 'url') {
      if (frame.location === null) xmlError('SITEMAP_INVALID_XML')
      if (result.size >= MAX_SITEMAP_URL_ENTRIES) {
        xmlError('SITEMAP_INVALID_XML')
      }

      let url: string
      try {
        url = validatePublicUrl(frame.location)
      } catch {
        xmlError('SITEMAP_INVALID_XML')
      }
      if (result.has(url)) xmlError('SITEMAP_DUPLICATE_URL')

      const lastModified = frame.lastModified === null
        ? null
        : parseLastModified(frame.lastModified)
      result.set(url, lastModified)
      return
    }

    if (frame.kind === 'urlset') rootClosed = true
  }

  let token: XmlToken | null
  while ((token = tokenizer.next()) !== null) {
    if (token.kind === 'comment') {
      if (!rootSeen) prologContentSeen = true
      continue
    }

    if (token.kind === 'processing-instruction') {
      if (token.target.toLowerCase() === 'xml') {
        if (
          token.target !== 'xml'
          || token.offset !== 0
          || declarationSeen
          || prologContentSeen
          || rootSeen
        ) {
          xmlError('SITEMAP_INVALID_XML')
        }
        validateXmlDeclaration(token.data)
        declarationSeen = true
      } else if (!rootSeen) {
        prologContentSeen = true
      }
      continue
    }

    if (token.kind === 'text' || token.kind === 'cdata') {
      const frame = stack.at(-1)
      if (token.kind === 'cdata' && !frame) xmlError('SITEMAP_INVALID_XML')
      const value = token.kind === 'text'
        ? decodeXmlEntities(token.value)
        : token.value

      if (frame && isSitemapScalarFrameKind(frame.kind)) {
        frame.text += value
        if (frame.text.length > MAX_CORE_TEXT_LENGTH) {
          xmlError('SITEMAP_INVALID_XML')
        }
      } else if (frame?.kind !== 'extension') {
        if (value && !isOnlyXmlWhitespace(value)) {
          xmlError('SITEMAP_INVALID_XML')
        }
      }

      if (!rootSeen && token.value) prologContentSeen = true
      continue
    }

    if (token.kind === 'end') {
      closeElement(token.name)
      continue
    }
    if (token.kind !== 'start') xmlError('SITEMAP_INVALID_XML')

    if (stack.length >= MAX_XML_NESTING_DEPTH) {
      xmlError('SITEMAP_INVALID_XML')
    }

    const parent = stack.at(-1)
    let kind: XmlFrameKind
    let namespaces: ReadonlySet<string>

    if (!parent) {
      if (rootSeen || rootClosed || token.name !== 'urlset') {
        xmlError('SITEMAP_INVALID_XML')
      }
      if (token.attributes.get('xmlns') !== SITEMAP_NAMESPACE) {
        xmlError('SITEMAP_INVALID_XML')
      }
      namespaces = namespaceScope(new Set(['xml']), token.attributes)
      rootSeen = true
      kind = 'urlset'
    } else {
      namespaces = namespaceScope(parent.namespaces, token.attributes)
      const prefix = elementPrefix(token.name)
      if (prefix && !namespaces.has(prefix)) xmlError('SITEMAP_INVALID_XML')

      if (parent.kind === 'urlset') {
        if (token.name !== 'url' || token.attributes.size !== 0) {
          xmlError('SITEMAP_INVALID_XML')
        }
        kind = 'url'
      } else if (parent.kind === 'url') {
        if (isSitemapScalarFrameKind(token.name)) {
          if (token.attributes.size !== 0) xmlError('SITEMAP_INVALID_XML')
          if (token.name === 'loc' && parent.location !== null) {
            xmlError('SITEMAP_INVALID_XML')
          }
          if (token.name === 'lastmod' && parent.lastModified !== null) {
            xmlError('SITEMAP_INVALID_XML')
          }
          if (
            token.name === 'changefreq'
            && parent.changeFrequency !== null
          ) {
            xmlError('SITEMAP_INVALID_XML')
          }
          if (token.name === 'priority' && parent.priority !== null) {
            xmlError('SITEMAP_INVALID_XML')
          }
          kind = token.name
        } else if (prefix && prefix !== 'xml') {
          kind = 'extension'
        } else {
          xmlError('SITEMAP_INVALID_XML')
        }
      } else if (parent.kind === 'extension') {
        kind = 'extension'
      } else {
        xmlError('SITEMAP_INVALID_XML')
      }
    }

    stack.push(createFrame(kind, token, namespaces))
    if (token.selfClosing) closeElement(token.name)
  }

  if (
    stack.length !== 0
    || !rootSeen
    || !rootClosed
    || result.size === 0
  ) {
    xmlError('SITEMAP_INVALID_XML')
  }
  return result
}

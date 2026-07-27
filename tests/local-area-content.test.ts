import assert from 'node:assert/strict'
import test from 'node:test'
import { AREA_DELIVERY, AREA_NOTES, getAreaNote } from '../src/lib/local-area-content'
import { PUBLISHED_LOCAL_PAGES, getLocalFaqs } from '../src/lib/local-seo'

/** Mỗi trang landing phải có tối thiểu chừng này từ nội dung riêng. */
const MIN_AREA_NOTE_WORDS = 60
/** Trùng lặp 5-gram tối đa cho phép giữa hai trang bất kỳ. */
const MAX_PAIRWISE_OVERLAP = 0.35

function shingles(text: string, size = 5): Set<string> {
  const words = text.toLowerCase().replace(/\s+/g, ' ').trim().split(' ')
  const out = new Set<string>()
  for (let i = 0; i + size <= words.length; i += 1) {
    out.add(words.slice(i, i + size).join(' '))
  }
  return out
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const item of a) if (b.has(item)) shared += 1
  return shared / (a.size + b.size - shared)
}

test('every published local landing page has its own area note', () => {
  const missing = PUBLISHED_LOCAL_PAGES
    .filter((page) => !getAreaNote(page.slug))
    .map((page) => page.slug)

  assert.deepEqual(missing, [], 'thêm entry vào AREA_NOTES cho các slug này')
})

test('area notes are substantial enough to move the uniqueness needle', () => {
  const tooShort = Object.entries(AREA_NOTES)
    .filter(([, note]) => note.trim().split(/\s+/).length < MIN_AREA_NOTE_WORDS)
    .map(([slug, note]) => `${slug} (${note.trim().split(/\s+/).length}w)`)

  assert.deepEqual(tooShort, [])
})

test('no two area notes are near-duplicates of each other', () => {
  const slugs = Object.keys(AREA_NOTES)
  const grams = new Map(slugs.map((slug) => [slug, shingles(AREA_NOTES[slug])]))

  const tooSimilar: string[] = []
  for (let i = 0; i < slugs.length; i += 1) {
    for (let j = i + 1; j < slugs.length; j += 1) {
      const overlap = jaccard(grams.get(slugs[i])!, grams.get(slugs[j])!)
      if (overlap > MAX_PAIRWISE_OVERLAP) {
        tooSimilar.push(`${slugs[i]} <-> ${slugs[j]} (${(overlap * 100).toFixed(1)}%)`)
      }
    }
  }

  assert.deepEqual(tooSimilar, [])
})

test('delivery copy differs per area instead of reusing one paragraph', () => {
  const summaries = Object.values(AREA_DELIVERY).map((entry) => entry.summary)
  assert.equal(new Set(summaries).size, summaries.length)

  const pickups = Object.values(AREA_DELIVERY).map((entry) => entry.pickup)
  assert.equal(new Set(pickups).size, pickups.length)
})

test('FAQ answers vary by area rather than repeating verbatim on every page', () => {
  // Trước đây 2/4 câu trả lời là chuỗi cứng, giống hệt nhau trên cả 23 trang.
  const byArea = new Map<string, string[]>()
  for (const page of PUBLISHED_LOCAL_PAGES) {
    byArea.set(page.area, getLocalFaqs(page).map((faq) => faq.answer))
  }

  const areas = [...byArea.keys()]
  assert.ok(areas.length > 1, 'cần ít nhất 2 khu vực để so sánh')

  // Câu 3 (thời gian) và câu 4 (giao hàng) phải khác nhau giữa các khu vực.
  for (const index of [2, 3]) {
    const answers = areas.map((area) => byArea.get(area)![index])
    assert.equal(
      new Set(answers).size,
      areas.length,
      `câu FAQ #${index + 1} vẫn giống nhau giữa các khu vực`,
    )
  }
})

test('TP.HCM pages never claim a physical storefront', () => {
  const onlineOnly = PUBLISHED_LOCAL_PAGES.filter((page) => page.onlineOnly)
  assert.ok(onlineOnly.length > 0)

  for (const page of onlineOnly) {
    const note = getAreaNote(page.slug) ?? ''
    assert.ok(
      !/ghé xưởng|nhận trực tiếp tại/i.test(note),
      `${page.slug} hứa nhận trực tiếp nhưng là khu vực chỉ giao online`,
    )
  }
})

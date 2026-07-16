import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  PHASE4_PRIORITY_POST_SLUGS,
  buildSeoPhase4Audit,
  getSupportingPostOwner,
  resolveKeywordOwner,
  type SeoPhase4KeywordRow,
} from '../src/lib/seo-phase-4'

function read(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

const keywordNames = [
  'vòng tay handmade',
  'vòng tay',
  'vòng tay nữ',
  'vòng tay handmade nữ',
  'vòng tay custom',
  'vòng tay theo yêu cầu',
  'vòng tay hạt cườm',
  'vòng tay charm',
  'vòng tay đôi',
  'vòng tay tình bạn',
  'vòng tay bạn thân',
  'vòng tay handmade cute',
  'vòng tay handmade giá rẻ',
  'vòng tay handmade theo tên',
  'vòng tay handmade làm quà',
  'phụ kiện handmade',
  'shop phụ kiện handmade',
  'trang sức handmade',
  'phụ kiện nữ',
  'phụ kiện thời trang',
  'móc khóa handmade',
  'móc khóa điện thoại',
  'móc khóa cute',
  'charm handmade',
  'charm vòng tay',
  'vòng cổ handmade',
  'dây chuyền handmade',
  'quà tặng handmade',
  'quà sinh nhật cho bạn thân',
  'quà handmade cho người yêu',
]

const keywordRows: SeoPhase4KeywordRow[] = keywordNames.map((keyword, index) => ({
  index: index + 1,
  keyword,
  cluster: 'Test cluster',
  intent: 'Thương mại',
  priority: index < 5 ? 'Rất cao' : 'Cao',
  proposedPage: 'Trang đích',
  proposedSlug: keyword
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase(),
  note: '',
}))

test('the 30-keyword plan resolves to exactly nine canonical owner URLs', () => {
  const owners = keywordRows.map((row) => resolveKeywordOwner(row.index))

  assert.equal(owners.length, 30)
  assert.equal(new Set(owners.map((owner) => owner.href)).size, 9)
  assert.equal(resolveKeywordOwner(1).href, '/san-pham?category=vong-tay')
  assert.equal(resolveKeywordOwner(17).href, '/')
  assert.equal(resolveKeywordOwner(24).href, '/san-pham?category=charm')
  assert.equal(resolveKeywordOwner(30).href, '/tin-tuc/qua-handmade-tang-nguoi-yeu')
  assert.throws(() => resolveKeywordOwner(0), /Unsupported keyword index/)
  assert.throws(() => resolveKeywordOwner(31), /Unsupported keyword index/)
})

test('supporting posts link to their cluster owner while owner articles do not self-link', () => {
  assert.equal(
    getSupportingPostOwner({ slug: 'vong-tay-hat-cuom', focusKeyword: 'cách chọn vòng tay hạt cườm' })?.href,
    '/san-pham?category=vong-tay',
  )
  assert.equal(
    getSupportingPostOwner({ slug: 'moc-khoa-handmade', focusKeyword: 'cách chọn móc khóa handmade' })?.href,
    '/san-pham?category=moc-khoa',
  )
  assert.equal(
    getSupportingPostOwner({ slug: 'charm-ten-rieng', focusKeyword: 'charm tên riêng' })?.href,
    '/san-pham?category=charm',
  )
  assert.equal(
    getSupportingPostOwner({ slug: 'day-chuyen-handmade-nu', focusKeyword: 'dây chuyền handmade nữ' })?.href,
    '/san-pham?category=vong-co',
  )
  assert.equal(
    getSupportingPostOwner({ slug: 'shop-phu-kien-handmade', focusKeyword: 'cách chọn shop phụ kiện handmade uy tín' })?.href,
    '/',
  )
  assert.equal(
    getSupportingPostOwner({ slug: 'qua-tang-handmade', focusKeyword: 'quà tặng handmade' }),
    null,
  )
  assert.equal(
    getSupportingPostOwner({
      slug: 'vong-tay-best-friend-handmade',
      focusKeyword: 'quà sinh nhật cho bạn thân',
    }),
    null,
  )
})

test('phase 4 audit reports duplicate targeting, malformed slugs and priority briefs', () => {
  const ownerUrls = [...new Set(keywordRows.map((row) => resolveKeywordOwner(row.index).href))]
  const audit = buildSeoPhase4Audit({
    keywordRows,
    reachableOwnerUrls: ownerUrls,
    posts: [
      {
        id: 3,
        slug: 'vong-tay-handmade',
        title: 'Bài viết',
        focusKeyword: 'vòng tay handmade',
        wordCount: 1514,
      },
      {
        id: 4,
        slug: 'https://mushroomie.io.vn/vong-tay-handmade-nu/',
        title: 'Vòng tay handmade nữ',
        focusKeyword: 'vòng tay handmade nữ',
        wordCount: 2074,
      },
      {
        id: 39,
        slug: 'vong-tay-handmade-nu',
        title: 'Vòng tay handmade nữ - Cẩm nang',
        focusKeyword: 'vòng tay handmade nữ',
        wordCount: 920,
      },
      ...PHASE4_PRIORITY_POST_SLUGS.map((slug, index) => ({
        id: 100 + index,
        slug,
        title: slug,
        focusKeyword: slug.replace(/-/g, ' '),
        wordCount: 100 + index,
      })),
    ],
  })

  assert.equal(audit.summary.keywordCount, 30)
  assert.equal(audit.summary.ownerCount, 9)
  assert.equal(audit.summary.missingOwnerCount, 0)
  assert.deepEqual(audit.duplicateFocusKeywords, [
    {
      keyword: 'vòng tay handmade nữ',
      posts: [
        { id: 4, slug: 'https://mushroomie.io.vn/vong-tay-handmade-nu/' },
        { id: 39, slug: 'vong-tay-handmade-nu' },
      ],
    },
  ])
  assert.deepEqual(audit.malformedPostSlugs, [
    { id: 4, slug: 'https://mushroomie.io.vn/vong-tay-handmade-nu/' },
  ])
  assert.equal(audit.priorityPosts.length, 10)
  assert.deepEqual(
    audit.priorityPosts.map((post) => post.slug),
    PHASE4_PRIORITY_POST_SLUGS,
  )
})

test('article detail integrates the canonical owner link without client-only code', () => {
  const page = read('src/app/(user)/tin-tuc/[slug]/page.tsx')
  const component = read('src/components/blog/PostKeywordOwnerLink.tsx')

  assert.match(page, /PostKeywordOwnerLink/)
  assert.match(page, /slug=\{post\.slug\}/)
  assert.match(page, /focusKeyword=\{post\.focus_keyword\}/)
  assert.doesNotMatch(component, /['"]use client['"]/)
  assert.match(component, /getSupportingPostOwner/)
})

test('metadata cleanup script is dry-run first and protects production writes', () => {
  const script = read('scripts/apply-seo-phase-4.ts')
  const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> }

  assert.match(script, /process\.argv\.includes\('--apply'\)/)
  assert.match(script, /process\.platform === 'win32'/)
  assert.match(script, /backup-production\.sh/)
  assert.match(script, /execFileSync\('gzip'/)
  assert.match(script, /prisma\.\$transaction/)
  assert.match(script, /postRevision\.create/)
  assert.match(script, /updateMany/)
  assert.match(script, /updated_at/)
  assert.match(script, /rollback/)
  assert.equal(packageJson.scripts['seo:phase-4'], 'tsx scripts/apply-seo-phase-4.ts')
  assert.equal(packageJson.scripts['seo:phase-4:apply'], 'tsx scripts/apply-seo-phase-4.ts --apply')
})

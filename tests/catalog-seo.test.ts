import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CATALOG_SEO_LAST_MODIFIED,
  CATALOG_SEO_SLUGS,
  getCatalogCanonicalPath,
  getCatalogSeo,
  getCatalogSeoLastModified,
  isCatalogCategory,
  shouldIndexCatalog,
} from '../src/lib/catalog-seo'

test('catalog SEO chỉ cấu hình danh mục có dữ liệu sản phẩm thật', () => {
  assert.deepEqual([...CATALOG_SEO_SLUGS].sort(), ['charm', 'moc-khoa', 'vong-co', 'vong-tay'])

  for (const slug of CATALOG_SEO_SLUGS) {
    const config = getCatalogSeo(slug)
    assert.equal(config.categorySlug, slug)
    assert.ok(config.title.length >= 30 && config.title.length <= 60)
    assert.ok(config.description.length >= 135 && config.description.length <= 165)
    assert.ok(config.sections.length >= 3)
    assert.ok(config.links.length >= 4)

    const wordCount = [config.intro, ...config.sections.map((section) => section.body)]
      .join(' ')
      .trim()
      .split(/\s+/u)
      .length
    assert.ok(wordCount >= 145, `${slug} chỉ có ${wordCount} từ nội dung tư vấn`)
  }
})

test('trang trụ cột liên kết trực tiếp đến landing local ưu tiên cùng ý định tìm kiếm', () => {
  const expectedLinks = new Map<string | null, string[]>([
    [null, ['/phu-kien-handmade-dong-nai', '/qua-tang-handmade-dong-nai']],
    ['vong-tay', ['/vong-tay-handmade-dong-nai', '/vong-tay-custom-bien-hoa']],
    ['charm', ['/charm-handmade-dong-nai']],
    ['moc-khoa', ['/moc-khoa-handmade-dong-nai']],
    ['vong-co', ['/day-chuyen-handmade-dong-nai']],
  ])

  for (const [categorySlug, hrefs] of expectedLinks) {
    const actualLinks = new Set(getCatalogSeo(categorySlug).links.map((link) => link.href))
    for (const href of hrefs) {
      assert.ok(actualLinks.has(href), `${categorySlug ?? 'trang sản phẩm'} thiếu liên kết ${href}`)
    }
  }
})

test('lastmod danh mục phản ánh cả nội dung SEO trong code và dữ liệu sản phẩm', () => {
  assert.equal(CATALOG_SEO_LAST_MODIFIED.toISOString(), '2026-07-28T00:00:00.000Z')
  assert.equal(
    getCatalogSeoLastModified(new Date('2026-07-20T12:00:00.000Z')).toISOString(),
    CATALOG_SEO_LAST_MODIFIED.toISOString(),
  )
  assert.equal(
    getCatalogSeoLastModified(new Date('2026-08-01T12:00:00.000Z')).toISOString(),
    '2026-08-01T12:00:00.000Z',
  )
})

test('canonical danh mục ổn định và danh mục lạ quay về trang trụ cột', () => {
  assert.equal(getCatalogCanonicalPath(), '/san-pham')
  assert.equal(getCatalogCanonicalPath('vong-tay'), '/san-pham?category=vong-tay')
  assert.equal(getCatalogCanonicalPath('khong-ton-tai'), '/san-pham')
  assert.equal(isCatalogCategory('vong-tay'), true)
  assert.equal(isCatalogCategory('khong-ton-tai'), false)
})

test('chỉ trang trụ cột và danh mục chuẩn trang đầu được index', () => {
  assert.equal(shouldIndexCatalog({}), true)
  assert.equal(shouldIndexCatalog({ categorySlug: 'vong-tay' }), true)
  assert.equal(shouldIndexCatalog({ categorySlug: 'khong-ton-tai' }), false)
  assert.equal(shouldIndexCatalog({ searchKeyword: 'vòng tay' }), false)
  assert.equal(shouldIndexCatalog({ sortValue: 'price_asc' }), false)
  assert.equal(shouldIndexCatalog({ page: 2 }), false)
})

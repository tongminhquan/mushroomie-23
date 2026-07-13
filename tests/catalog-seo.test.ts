import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CATALOG_SEO_SLUGS,
  getCatalogCanonicalPath,
  getCatalogSeo,
  isCatalogCategory,
  shouldIndexCatalog,
} from '../src/lib/catalog-seo'

test('catalog SEO chỉ cấu hình danh mục có dữ liệu sản phẩm thật', () => {
  assert.deepEqual([...CATALOG_SEO_SLUGS].sort(), ['charm', 'moc-khoa', 'vong-co', 'vong-tay'])

  for (const slug of CATALOG_SEO_SLUGS) {
    const config = getCatalogSeo(slug)
    assert.equal(config.categorySlug, slug)
    assert.ok(config.title.length >= 20 && config.title.length <= 60)
    assert.ok(config.description.length >= 120 && config.description.length <= 170)
    assert.ok(config.sections.length >= 2)
    assert.ok(config.links.length >= 4)
  }
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

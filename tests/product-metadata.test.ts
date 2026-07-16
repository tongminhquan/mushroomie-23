import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProductMetadataText } from '../src/lib/product-metadata'

const productNames = [
  'Vong xanh',
  'Vong hoa hong',
  'Moc khoa dien thoai Song Xanh',
  'Moc khoa handmade banh dango anh dao',
]

test('builds unique product titles inside the requested SEO length range', () => {
  const titles = productNames.map((name) => buildProductMetadataText(name).title)

  for (const [index, title] of titles.entries()) {
    assert.equal(title.length >= 50 && title.length <= 60, true, `${title.length}: ${title}`)
    assert.equal(title.includes(productNames[index]), true)
    assert.equal((title.match(/Mushroomie/g) || []).length, 1)
  }
  assert.equal(new Set(titles).size, productNames.length)
})

test('builds natural product descriptions inside the requested SEO length range', () => {
  for (const name of productNames) {
    const description = buildProductMetadataText(name).description
    assert.equal(
      description.length >= 140 && description.length <= 160,
      true,
      `${description.length}: ${description}`,
    )
    assert.equal(description.includes(name), true)
    assert.equal(description.endsWith('.') || description.endsWith('…'), true)
  }
})

test('uses real SKU values to disambiguate products with the same name', () => {
  const first = buildProductMetadataText('Vòng hoa hồng', { sku: 'Mus02' })
  const second = buildProductMetadataText('Vòng hoa hồng', { sku: 'MUS999' })

  assert.notEqual(first.title, second.title)
  assert.notEqual(first.description, second.description)
  assert.equal(first.title.includes('Mus02'), true)
  assert.equal(second.title.includes('MUS999'), true)
})

test('does not repeat handmade or promise customization for fixed products', () => {
  const metadata = buildProductMetadataText(
    'Móc khóa handmade bánh dango anh đào',
    { isCustomizable: false },
  )
  const shortNameMetadata = buildProductMetadataText('Vòng xanh', {
    isCustomizable: false,
  })

  assert.equal((metadata.description.toLowerCase().match(/handmade/g) || []).length, 1)
  assert.equal(shortNameMetadata.title.includes('cá nhân hóa'), false)
  assert.equal(metadata.description.includes('hỗ trợ cá nhân hóa'), false)
})

test('bounds metadata generated from future unusually long product names', () => {
  const metadata = buildProductMetadataText(
    'Vòng tay handmade phiên bản giới hạn '.repeat(10),
    { sku: 'MUS-LONG-001', isCustomizable: true },
  )

  assert.equal(metadata.title.length <= 60, true, metadata.title)
  assert.equal(metadata.description.length <= 160, true, metadata.description)
})

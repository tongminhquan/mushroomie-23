import assert from 'node:assert/strict'
import test from 'node:test'
import { rankProductsForPost } from '../src/lib/post-product-recommendations'

const products = [
  {
    id: 1,
    name: 'Vong tay charm do',
    slug: 'vong-tay-charm-do',
    short_description: 'Vong tay phoi charm',
    is_featured: false,
    stock: 5,
    category: { name: 'Vong tay', slug: 'vong-tay' },
  },
  {
    id: 2,
    name: 'Moc khoa keo may',
    slug: 'moc-khoa-keo-may',
    short_description: 'Moc khoa nho xinh',
    is_featured: true,
    stock: 5,
    category: { name: 'Moc khoa', slug: 'moc-khoa' },
  },
  {
    id: 3,
    name: 'Vong tay hat pastel',
    slug: 'vong-tay-hat-pastel',
    short_description: 'Vong tay mau pastel',
    is_featured: false,
    stock: 0,
    category: { name: 'Vong tay', slug: 'vong-tay' },
  },
]

test('keeps recommendations in stock when enough available products exist', () => {
  const ranked = rankProductsForPost({
    title: 'Cach chon vong tay charm theo phong cach',
    focusKeyword: 'vong tay charm',
  }, products, 2)

  assert.deepEqual(ranked.map((product) => product.id), [1, 2])
})

test('uses featured and in-stock products as deterministic fallbacks', () => {
  const ranked = rankProductsForPost({ title: 'Qua tang ca nhan hoa' }, products, 2)

  assert.deepEqual(ranked.map((product) => product.id), [2, 1])
})

test('uses an out-of-stock contextual fallback only when availability is insufficient', () => {
  const ranked = rankProductsForPost({
    title: 'Cach chon vong tay pastel',
    focusKeyword: 'vong tay pastel',
  }, [products[0], products[2]], 2)

  assert.deepEqual(ranked.map((product) => product.id), [3, 1])
})

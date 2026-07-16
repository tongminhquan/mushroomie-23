import assert from 'node:assert/strict'
import test from 'node:test'
import { generateSlug } from '../src/lib/utils'
import {
  analyzeProductSlugNormalization,
  getProductSlugLookupCandidates,
  normalizeProductSlugInput,
} from '../src/lib/product-slug'

test('generateSlug creates lowercase ASCII slugs from Vietnamese product text', () => {
  assert.equal(generateSlug('  ĐỒNG HỒ ĐỎ -- Cá Tính  '), 'dong-ho-do-ca-tinh')
})

test('generateSlug removes unsafe characters and trims collapsed hyphens', () => {
  assert.equal(generateSlug('--- Vòng @ tay___custom ---'), 'vong-taycustom')
  assert.equal(generateSlug('🔥✨'), '')
})

test('product lookup candidates preserve exact dirty slugs before canonical fallback', () => {
  assert.deepEqual(getProductSlugLookupCandidates('Vòng-Tay-%C4%90%E1%BB%8F'), [
    'Vòng-Tay-Đỏ',
    'Vòng-Tay-%C4%90%E1%BB%8F',
    'vong-tay-do',
  ])
  assert.deepEqual(getProductSlugLookupCandidates('vong-tay-do'), ['vong-tay-do'])
  assert.deepEqual(getProductSlugLookupCandidates('Vòng--Tay'), [
    'Vòng--Tay',
    'vong-tay',
  ])
})

test('product slug input normalizes supplied values and handles empty results safely', () => {
  assert.equal(normalizeProductSlugInput('  VÒNG---ĐỎ  ', 'Tên khác'), 'vong-do')
  assert.equal(normalizeProductSlugInput('', 'Vòng tay tên riêng'), 'vong-tay-ten-rieng')
  assert.equal(normalizeProductSlugInput('🔥', 'Tên hợp lệ'), null)
  assert.equal(normalizeProductSlugInput(undefined, '✨'), null)
})

test('product slug migration blocks collisions instead of inventing unsafe aliases', () => {
  const analysis = analyzeProductSlugNormalization([
    { id: 30, name: 'Vòng tay', slug: 'VÒNG TAY' },
    { id: 20, name: 'Vòng tay', slug: 'Vòng-tay' },
    { id: 40, name: 'Emoji', slug: '🔥' },
    { id: 10, name: 'Canonical', slug: 'vong-tay' },
    { id: 50, name: '✨', slug: '✨' },
    { id: 11, name: 'Reserved suffix', slug: 'vong-tay-2' },
  ])

  assert.deepEqual(analysis.changes, [
    { id: 20, from: 'Vòng-tay', to: 'vong-tay' },
    { id: 30, from: 'VÒNG TAY', to: 'vong-tay' },
    { id: 40, from: '🔥', to: 'emoji' },
    { id: 50, from: '✨', to: 'san-pham-50' },
  ])
  assert.deepEqual(analysis.collisions, [
    {
      target: 'vong-tay',
      products: [
        { id: 10, slug: 'vong-tay' },
        { id: 20, slug: 'Vòng-tay' },
        { id: 30, slug: 'VÒNG TAY' },
      ],
    },
  ])
  assert.deepEqual(analysis.nonRedirectable, [
    { id: 40, from: '🔥', to: 'emoji' },
    { id: 50, from: '✨', to: 'san-pham-50' },
  ])
  assert.equal(analysis.safeToApply, false)
})

test('product slug migration is safe when each old slug derives its unique canonical slug', () => {
  const analysis = analyzeProductSlugNormalization([
    { id: 1, name: 'Vòng táo', slug: 'Vòng-táo' },
    { id: 2, name: 'Vòng xanh', slug: 'vong-xanh' },
  ])

  assert.deepEqual(analysis.changes, [
    { id: 1, from: 'Vòng-táo', to: 'vong-tao' },
  ])
  assert.deepEqual(analysis.collisions, [])
  assert.deepEqual(analysis.nonRedirectable, [])
  assert.equal(analysis.safeToApply, true)
})

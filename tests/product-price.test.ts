import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { buildAuthoritativeOrderItems } from '../src/lib/order-pricing'
import { resolveDisplayPrice } from '../src/lib/product-price'
import {
  createProductUpdateSchema,
  productCreateSchema,
} from '../src/lib/product-validation'

test('display and authoritative order pricing both ignore an invalid higher sale price', () => {
  const resolved = resolveDisplayPrice(40_000, 66_000)
  assert.deepEqual(resolved, {
    price: 40_000,
    originalPrice: null,
    isOnSale: false,
  })

  const [item] = buildAuthoritativeOrderItems([{ product_id: 1, quantity: 1 }], [{
    id: 1,
    name: 'Vong tay test',
    price: 40_000,
    sale_price: 66_000,
    stock: 1,
    options: [],
  }])

  assert.equal(item.price_snapshot, resolved.price)
})

test('display pricing keeps a valid sale price and original price', () => {
  assert.deepEqual(resolveDisplayPrice(40_000, 30_000), {
    price: 30_000,
    originalPrice: 40_000,
    isOnSale: true,
  })
})

test('product creation rejects sale prices equal to or higher than the regular price', () => {
  const baseProduct = {
    name: 'San pham test',
    price: 40_000,
    stock: 0,
  }

  for (const sale_price of [40_000, 66_000]) {
    const parsed = productCreateSchema.safeParse({ ...baseProduct, sale_price })
    assert.equal(parsed.success, false)
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some(
        (issue) => issue.path.join('.') === 'sale_price' && issue.message === 'Giá khuyến mãi phải NHỎ HƠN giá gốc',
      ))
    }
  }
})

test('product updates compare changed fields with persisted price data', () => {
  const schema = createProductUpdateSchema({ price: 40_000, sale_price: 30_000 })

  assert.equal(schema.safeParse({ sale_price: 66_000 }).success, false)
  assert.equal(schema.safeParse({ price: 30_000 }).success, false)
  assert.equal(schema.safeParse({ sale_price: 20_000 }).success, true)
  assert.equal(schema.safeParse({ sale_price: null }).success, true)
})

test('product write routes use the shared create and update validation schemas', () => {
  const createRoute = readFileSync('src/app/api/products/route.ts', 'utf8')
  const updateRoute = readFileSync('src/app/api/products/[id]/route.ts', 'utf8')

  assert.match(createRoute, /productCreateSchema/)
  assert.match(updateRoute, /createProductUpdateSchema/)
  assert.match(updateRoute, /prisma\.product\.findUnique/)
  assert.match(updateRoute, /price:\s*Number\(existing\.price\)/)
  assert.match(
    updateRoute,
    /sale_price:\s*existing\.sale_price === null \? null : Number\(existing\.sale_price\)/,
  )
  assert.match(
    updateRoute,
    /include:\s*\{\s*images:\s*\{\s*select:\s*\{ image_url: true, sort_order: true \}/,
  )
})

test('every price consumer imports the shared product price resolver', () => {
  for (const path of [
    'src/components/product/ProductCard.tsx',
    'src/components/product/AddToCartButton.tsx',
    'src/app/(user)/san-pham/[slug]/page.tsx',
    'src/lib/order-pricing.ts',
  ]) {
    const source = readFileSync(path, 'utf8')
    assert.match(source, /resolveDisplayPrice/)
    assert.match(source, /product-price/)
  }
})

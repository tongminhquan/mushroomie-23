import assert from 'node:assert/strict'
import test from 'node:test'
import { orderSchema } from '../src/lib/order-schema'
import {
  buildAuthoritativeOrderItems,
  calculateOrderTotal,
  calculateVoucherDiscount,
} from '../src/lib/order-pricing'

const validOrder = {
  customer_name: 'Nguyen Van A',
  customer_email: 'buyer@example.com',
  customer_phone: '0947192590',
  shipping_address: '123 Duong Dong Khoi, Bien Hoa',
  items: [{ product_id: 1, quantity: 2, price_snapshot: 1 }],
}

test('order input validation accepts supported payment data and rejects malformed input', () => {
  const parsed = orderSchema.parse(validOrder)
  assert.equal(parsed.payment_method, 'bank_transfer')

  assert.equal(orderSchema.safeParse({ ...validOrder, customer_email: 'invalid' }).success, false)
  assert.equal(orderSchema.safeParse({ ...validOrder, customer_phone: '123' }).success, false)
  assert.equal(orderSchema.safeParse({ ...validOrder, items: [] }).success, false)
  assert.equal(orderSchema.safeParse({ ...validOrder, items: [{ product_id: 1, quantity: 100 }] }).success, false)
})

test('authoritative pricing ignores client product name and price snapshot', () => {
  const items = buildAuthoritativeOrderItems(validOrder.items, [{
    id: 1,
    name: 'Vong tay that',
    price: 100_000,
    sale_price: 80_000,
    stock: 5,
    options: [],
  }])

  assert.equal(items[0].product_name, 'Vong tay that')
  assert.equal(items[0].price_snapshot, 80_000)
  assert.equal(items[0].total_price, 160_000)
})

test('authoritative pricing falls back to regular price when sale price is invalid', () => {
  for (const salePrice of [0, 100_000, 120_000, null]) {
    const [item] = buildAuthoritativeOrderItems([{ product_id: 1, quantity: 1 }], [{
      id: 1,
      name: 'Moc khoa',
      price: 100_000,
      sale_price: salePrice,
      stock: 2,
      options: [],
    }])
    assert.equal(item.price_snapshot, 100_000)
  }
})

test('authoritative pricing enforces stock and product options', () => {
  const product = {
    id: 1,
    name: 'Vong custom',
    price: 120_000,
    sale_price: null,
    stock: 1,
    options: [
      { option_name: 'Mau', option_type: 'select', option_values: '["Do","Hong"]' },
      { option_name: 'Ten', option_type: 'text', option_values: null },
    ],
  }

  assert.throws(
    () => buildAuthoritativeOrderItems([{ product_id: 1, quantity: 2 }], [product]),
    /PRODUCT_UNAVAILABLE/,
  )
  assert.throws(
    () => buildAuthoritativeOrderItems([{ product_id: 1, quantity: 1, selected_options: { Mau: 'Xanh' } }], [product]),
    /INVALID_PRODUCT_OPTIONS/,
  )
  assert.throws(
    () => buildAuthoritativeOrderItems([{ product_id: 1, quantity: 1, selected_options: { Size: 'M' } }], [product]),
    /INVALID_PRODUCT_OPTIONS/,
  )

  const [valid] = buildAuthoritativeOrderItems([{
    product_id: 1,
    quantity: 1,
    selected_options: { Mau: 'Hong', Ten: 'Mina' },
  }], [product])
  assert.deepEqual(valid.selected_options, { Mau: 'Hong', Ten: 'Mina' })
})

test('voucher discounts are capped and cannot make totals negative', () => {
  assert.deepEqual(calculateVoucherDiscount(500_000, 30_000, {
    discountType: 'PERCENT',
    discountValue: 20,
    maxDiscount: 50_000,
  }), {
    itemDiscountAmount: 50_000,
    shippingDiscountAmount: 0,
    voucherDiscountAmount: 50_000,
  })

  assert.deepEqual(calculateVoucherDiscount(100_000, 30_000, {
    discountType: 'FIXED',
    discountValue: 500_000,
  }), {
    itemDiscountAmount: 100_000,
    shippingDiscountAmount: 0,
    voucherDiscountAmount: 100_000,
  })

  assert.deepEqual(calculateVoucherDiscount(100_000, 30_000, {
    discountType: 'FREE_SHIPPING',
    discountValue: 0,
  }), {
    itemDiscountAmount: 0,
    shippingDiscountAmount: 30_000,
    voucherDiscountAmount: 30_000,
  })

  assert.equal(calculateOrderTotal(100_000, 30_000, 500_000, 500_000), 0)
  assert.equal(calculateOrderTotal(100_000, 30_000, 20_000, 10_000), 100_000)
})

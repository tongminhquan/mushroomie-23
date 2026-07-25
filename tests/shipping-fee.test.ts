import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import {
  DEFAULT_SHIPPING_FEE,
  createShippingFeeConflict,
  createShippingFeeUpdateNotice,
  normalizeShippingFee,
  shippingFeeValueSchema,
} from '../src/lib/shipping-fee'

test('normalizes a persisted integer shipping fee', () => {
  assert.equal(normalizeShippingFee('25000'), 25_000)
})

test('falls back for empty, malformed, decimal, negative, and excessive values', () => {
  for (const value of ['', 'abc', '1000.5', '-1', '1000001', null, undefined]) {
    assert.equal(normalizeShippingFee(value), DEFAULT_SHIPPING_FEE)
  }
})

test('admin schema accepts only bounded integer VND values', () => {
  assert.equal(shippingFeeValueSchema.safeParse(0).success, true)
  assert.equal(shippingFeeValueSchema.safeParse(1_000_000).success, true)
  assert.equal(shippingFeeValueSchema.safeParse(-1).success, false)
  assert.equal(shippingFeeValueSchema.safeParse(10.5).success, false)
  assert.equal(shippingFeeValueSchema.safeParse(1_000_001).success, false)
})

test('returns a checkout conflict only when the reviewed fee is stale', () => {
  assert.equal(createShippingFeeConflict(25_000, 25_000), null)
  assert.deepEqual(createShippingFeeConflict(30_000, 25_000), {
    code: 'SHIPPING_FEE_CHANGED',
    shippingFee: 25_000,
    message: 'Phí vận chuyển vừa được cập nhật. Vui lòng kiểm tra lại tổng tiền.',
  })
})

test('returns a structured conflict for a checkout bundle that predates shipping snapshots', () => {
  assert.deepEqual(createShippingFeeConflict(undefined, 25_000), {
    code: 'SHIPPING_FEE_CHANGED',
    shippingFee: 25_000,
    message: 'Phí vận chuyển đã được cập nhật. Vui lòng tải lại trang để kiểm tra tổng tiền.',
  })
})

test('creates a notice only after an already loaded fee changes', () => {
  assert.equal(createShippingFeeUpdateNotice(null, 25_000), null)
  assert.equal(createShippingFeeUpdateNotice(25_000, 25_000), null)
  assert.deepEqual(createShippingFeeUpdateNotice(30_000, 25_000), {
    previousFee: 30_000,
    currentFee: 25_000,
  })
})

test('public shipping route is no-store and uses the shared server reader', () => {
  const source = readFileSync(resolve('src/app/api/shipping-fee/route.ts'), 'utf8')
  assert.match(source, /getShippingFeeSnapshot/)
  assert.match(source, /['"]Cache-Control['"]:\s*['"]no-store['"]/)
})

test('admin shipping route enforces role, strict validation, atomic writes, and audit', () => {
  const source = readFileSync(resolve('src/app/api/admin/shipping-fee/route.ts'), 'utf8')
  assert.match(source, /super_admin/)
  assert.match(source, /admin/)
  assert.match(source, /\.strict\(\)/)
  assert.match(source, /prisma\.\$transaction/)
  assert.match(source, /adminLog\.create/)
  assert.match(source, /default_shipping_fee/)
  assert.match(source, /shipping_fee_updated_at/)
  assert.match(source, /TransactionIsolationLevel\.Serializable/)
  assert.match(source, /P2034/)
})

test('order creation checks expected shipping before inventory reservation', () => {
  const source = readFileSync(resolve('src/app/api/orders/route.ts'), 'utf8')
  const orderTransaction = source.indexOf('const order = await prisma.$transaction')
  const readSetting = source.indexOf('getShippingFeeSnapshot(tx)', orderTransaction)
  const conflict = source.indexOf('const shippingConflict', readSetting)
  const reserveInventory = source.indexOf('tx.product.updateMany')
  assert.ok(orderTransaction >= 0)
  assert.ok(readSetting >= 0)
  assert.ok(conflict > readSetting)
  assert.ok(reserveInventory > conflict)
  assert.doesNotMatch(source, /const shippingFee = 30_000/)
})

test('voucher endpoints use the shared shipping setting', () => {
  for (const file of [
    'src/app/api/vouchers/my-available/route.ts',
    'src/app/api/checkout/apply-voucher/route.ts',
  ]) {
    const source = readFileSync(resolve(file), 'utf8')
    assert.match(source, /getShippingFeeSnapshot/)
    assert.doesNotMatch(source, /estimatedShippingFee = .*30000/)
  }
})

test('shipping hook polls the public endpoint and handles visibility', () => {
  const source = readFileSync(resolve('src/hooks/useShippingFee.ts'), 'utf8')
  assert.match(source, /5_000/)
  assert.match(source, /visibilitychange/)
  assert.match(source, /document\.visibilityState/)
  assert.match(source, /AbortController/)
  assert.match(source, /cache: 'no-store'/)
})

test('shipping notice uses polite live status semantics', () => {
  const source = readFileSync(resolve('src/components/checkout/ShippingFeeNotice.tsx'), 'utf8')
  assert.match(source, /role="status"/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /previousFee/)
  assert.match(source, /currentFee/)
})

test('cart and checkout use the shared live shipping hook', () => {
  for (const file of [
    'src/app/(user)/gio-hang/page.tsx',
    'src/app/(user)/thanh-toan/page.tsx',
  ]) {
    const source = readFileSync(resolve(file), 'utf8')
    assert.match(source, /useShippingFee/)
    assert.match(source, /ShippingFeeNotice/)
    assert.doesNotMatch(source, /const shippingFee = 30000/)
  }
})

test('checkout submits reviewed shipping and handles a stale-fee conflict', () => {
  const source = readFileSync(resolve('src/app/(user)/thanh-toan/page.tsx'), 'utf8')
  assert.match(source, /expected_shipping_fee: shippingFee/)
  assert.match(source, /SHIPPING_FEE_CHANGED/)
  assert.match(source, /acceptServerFee/)
  assert.match(
    source,
    /selectedVoucher\?\.discountType === 'FREE_SHIPPING'\s*\?\s*shippingFee\s*:\s*0/,
  )
  assert.doesNotMatch(
    source,
    /selectedVoucher\?\.discountType === 'FREE_SHIPPING'\s*\?\s*Math\.min\(shippingFee,\s*selectedVoucher\.discountAmount\)/,
  )
})

test('legacy checkout payloads reach the structured shipping conflict path', () => {
  const schema = readFileSync(resolve('src/lib/order-schema.ts'), 'utf8')
  const route = readFileSync(resolve('src/app/api/orders/route.ts'), 'utf8')
  assert.match(schema, /expected_shipping_fee:\s*shippingFeeValueSchema\.optional\(\)/)
  assert.match(route, /createShippingFeeConflict\(expected_shipping_fee,\s*shippingFee\)/)
})

test('admin settings renders the dedicated shipping control', () => {
  const page = readFileSync(resolve('src/app/admin/cai-dat/page.tsx'), 'utf8')
  const control = readFileSync(resolve('src/components/admin/ShippingFeeSettings.tsx'), 'utf8')
  assert.match(page, /ShippingFeeSettings/)
  assert.match(page, /aria-pressed=/)
  assert.match(page, /Vận chuyển/)
  assert.match(control, /\/api\/admin\/shipping-fee/)
  assert.match(control, /Lưu phí vận chuyển/)
})

test('generic admin settings cannot bypass the dedicated shipping writer', () => {
  const route = readFileSync(resolve('src/app/api/admin/settings/route.ts'), 'utf8')
  const page = readFileSync(resolve('src/app/admin/cai-dat/page.tsx'), 'utf8')
  assert.match(route, /GENERAL_SETTING_KEYS/)
  assert.match(route, /Unsupported setting key/)
  assert.doesNotMatch(page, /setSettings\(prev => \(\{ \.\.\.prev, \.\.\.res\.settings \}\)\)/)
})

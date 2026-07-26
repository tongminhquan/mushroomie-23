import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_GIFT_WRAP_FEE,
  MAX_GIFT_MESSAGE_LENGTH,
  createGiftWrapFeeConflict,
  createGiftWrapUnavailable,
  normalizeGiftMessage,
  normalizeGiftWrapEnabled,
  normalizeGiftWrapFee,
  resolveGiftWrapFee,
} from '../src/lib/gift-wrap'
import { calculateOrderTotal } from '../src/lib/order-pricing'
import { renderGiftWrapDetails } from '../src/lib/payment/email/templates'

test('chỉ thu phí gói quà khi khách chọn VÀ dịch vụ đang mở', () => {
  const snapshot = { enabled: true, fee: 15_000 }

  assert.equal(resolveGiftWrapFee(true, snapshot), 15_000)
  assert.equal(resolveGiftWrapFee(false, snapshot), 0)
  assert.equal(resolveGiftWrapFee(undefined, snapshot), 0)
  // Shop tắt dịch vụ giữa chừng thì không được cộng tiền dù client vẫn gửi true.
  assert.equal(resolveGiftWrapFee(true, { enabled: false, fee: 15_000 }), 0)
})

test('phí gói quà KHÔNG bị voucher giảm giá', () => {
  const subtotal = 100_000
  const shippingFee = 30_000
  const giftWrapFee = 15_000

  // Voucher giảm 20.000 trên hàng hoá: chỉ trừ vào subtotal, không đụng phí gói quà.
  const total = calculateOrderTotal(subtotal, shippingFee, 20_000, 0, giftWrapFee)
  assert.equal(total, 80_000 + 30_000 + 15_000)

  // Voucher freeship: miễn phí ship nhưng vẫn thu phí gói quà.
  const freeShipTotal = calculateOrderTotal(subtotal, shippingFee, 0, shippingFee, giftWrapFee)
  assert.equal(freeShipTotal, 100_000 + 0 + 15_000)
})

test('không truyền phí gói quà thì tổng tiền giữ nguyên như trước', () => {
  assert.equal(
    calculateOrderTotal(100_000, 30_000, 0, 0),
    calculateOrderTotal(100_000, 30_000, 0, 0, 0),
  )
})

test('chỉ báo xung đột giá khi khách thực sự chọn gói quà', () => {
  // Không chọn gói quà thì giá đổi cũng không ảnh hưởng tổng tiền -> không chặn đơn.
  assert.equal(createGiftWrapFeeConflict(false, 10_000, 20_000), null)
  assert.equal(createGiftWrapFeeConflict(undefined, undefined, 20_000), null)

  // Có chọn mà giá client lệch giá server -> phải chặn.
  const conflict = createGiftWrapFeeConflict(true, 10_000, 20_000)
  assert.equal(conflict?.code, 'GIFT_WRAP_FEE_CHANGED')
  assert.equal(conflict?.giftWrapFee, 20_000)

  // Giá khớp thì cho qua.
  assert.equal(createGiftWrapFeeConflict(true, 20_000, 20_000), null)
})

test('chặn đơn khi khách chọn gói quà lúc shop đã tắt dịch vụ', () => {
  assert.equal(createGiftWrapUnavailable(true, { enabled: true }), null)
  assert.equal(createGiftWrapUnavailable(false, { enabled: false }), null)

  const blocked = createGiftWrapUnavailable(true, { enabled: false })
  assert.equal(blocked?.code, 'GIFT_WRAP_UNAVAILABLE')
})

test('chuẩn hoá phí từ settings dạng chuỗi, giá trị rác quay về mặc định', () => {
  assert.equal(normalizeGiftWrapFee('25000'), 25_000)
  assert.equal(normalizeGiftWrapFee(0), 0)
  assert.equal(normalizeGiftWrapFee('abc'), DEFAULT_GIFT_WRAP_FEE)
  assert.equal(normalizeGiftWrapFee(-5), DEFAULT_GIFT_WRAP_FEE)
  assert.equal(normalizeGiftWrapFee(null), DEFAULT_GIFT_WRAP_FEE)
})

test('cờ bật/tắt: mặc định bật, chỉ tắt khi lưu đúng chuỗi false', () => {
  assert.equal(normalizeGiftWrapEnabled(undefined), true)
  assert.equal(normalizeGiftWrapEnabled('true'), true)
  assert.equal(normalizeGiftWrapEnabled('false'), false)
  assert.equal(normalizeGiftWrapEnabled(false), false)
})

test('thư tay: cắt khoảng trắng, rỗng thành null, giới hạn độ dài', () => {
  assert.equal(normalizeGiftMessage('  Chúc mừng sinh nhật  '), 'Chúc mừng sinh nhật')
  assert.equal(normalizeGiftMessage('   '), null)
  assert.equal(normalizeGiftMessage(undefined), null)
  assert.equal(normalizeGiftMessage(123), null)
  assert.equal(normalizeGiftMessage('a'.repeat(900))?.length, MAX_GIFT_MESSAGE_LENGTH)
})

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

test('trang giỏ hàng và cart drawer cùng cho phép chọn gói quà và tính phí vào tổng dự kiến', () => {
  const cartPage = source('src/app/(user)/gio-hang/page.tsx')
  const cartDrawer = source('src/components/cart/CartDrawer.tsx')

  for (const cartSurface of [cartPage, cartDrawer]) {
    assert.match(cartSurface, /GiftWrapOption/)
    assert.match(cartSurface, /useGiftWrap/)
    assert.match(cartSurface, /giftWrapFee/)
  }

  assert.match(cartPage, /estimatedTotal\s*=\s*subtotal\s*\+\s*shippingFee\s*\+\s*giftWrapFee/)
  assert.match(cartDrawer, /estimatedTotal\s*=\s*getTotalPrice\(\)\s*\+\s*giftWrapFee/)
  assert.match(cartPage, /className="grid min-w-0 gap-6/)
  assert.equal((cartPage.match(/className="min-w-0[^"]*rounded-\[22px\][^"]*"/g) ?? []).length, 2)
})

test('gói quà dùng id truy cập duy nhất khi nhiều bề mặt cùng được render', () => {
  const option = source('src/components/product/GiftWrapOption.tsx')

  assert.match(option, /useId/)
  assert.doesNotMatch(option, /aria-describedby="gift-wrap-desc"/)
  assert.doesNotMatch(option, /id="gift-message"/)
})

test('khách hàng nhìn thấy gói quà và thư tay trong chi tiết đơn lẫn email xác nhận', () => {
  const customerOrder = source('src/app/(user)/tai-khoan/don-hang/[code]/page.tsx')
  const emailTemplate = source('src/lib/payment/email/templates.ts')

  for (const confirmationSurface of [customerOrder, emailTemplate]) {
    assert.match(confirmationSurface, /gift_wrap/)
    assert.match(confirmationSurface, /gift_wrap_fee/)
    assert.match(confirmationSurface, /gift_message/)
  }

  assert.match(emailTemplate, /escapeHtml/)
})

test('email gói quà escape nội dung thư tay do khách nhập', () => {
  const html = renderGiftWrapDetails({
    gift_wrap: true,
    gift_wrap_fee: 15_000,
    gift_message: '<img src=x onerror=alert(1)>',
  })

  assert.doesNotMatch(html, /<img/)
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/)
})

test('deploy tạo Prisma Client trước typecheck và chỉ đồng bộ DB sau tests', () => {
  const deploy = source('deploy.sh')
  const generateIndex = deploy.indexOf('npm exec prisma generate')
  const typecheckIndex = deploy.indexOf('npm run typecheck')
  const testIndex = deploy.indexOf('npm test')
  const dbPushIndex = deploy.indexOf('npm exec prisma db push')

  assert.ok(generateIndex > -1)
  assert.ok(generateIndex < typecheckIndex)
  assert.ok(typecheckIndex < testIndex)
  assert.ok(testIndex < dbPushIndex)
})

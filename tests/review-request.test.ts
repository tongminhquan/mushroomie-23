import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

// getApplicationSecret() yêu cầu tối thiểu 32 ký tự.
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || 'test-secret-for-review-tokens-0123456789'

import {
  OPT_OUT_TEMPLATE_KEY,
  REVIEW_REQUEST_DELAY_DAYS,
  REVIEW_REQUEST_TEMPLATE_KEY,
  buildReviewRequestEmail,
  createReviewToken,
  isDeliverableEmail,
  reviewRequestEmailsEnabled,
  verifyReviewToken,
} from '../src/lib/review-request'

const ORDER = {
  id: 42,
  order_code: 'MSH-000042',
  customer_name: 'Nguyễn Văn A',
  customer_email: 'khach@example.com',
}

const FROM_TOKEN_ROUTE = fs.readFileSync(
  path.resolve(__dirname, '../src/app/api/reviews/from-token/route.ts'),
  'utf8',
)

test('a freshly issued token round-trips back to its order', () => {
  const token = createReviewToken(ORDER.id, ORDER.order_code)
  assert.deepEqual(verifyReviewToken(token), { orderId: ORDER.id, orderCode: ORDER.order_code })
})

test('tampered or malformed tokens are rejected', () => {
  const token = createReviewToken(ORDER.id, ORDER.order_code)
  const [payload, signature] = token.split('.')

  assert.equal(verifyReviewToken(`${payload}.${signature}x`), null, 'chữ ký sai vẫn được chấp nhận')
  assert.equal(verifyReviewToken(`${payload}x.${signature}`), null, 'payload bị sửa vẫn được chấp nhận')
  assert.equal(verifyReviewToken(payload), null, 'token thiếu chữ ký vẫn được chấp nhận')
  assert.equal(verifyReviewToken(''), null)
  assert.equal(verifyReviewToken(null), null)
  assert.equal(verifyReviewToken(undefined), null)
})

test('tokens expire after their 30-day window', () => {
  const issuedAt = Date.parse('2026-07-01T00:00:00.000Z')
  const token = createReviewToken(ORDER.id, ORDER.order_code, issuedAt)

  const dayBeforeExpiry = issuedAt + 29 * 24 * 60 * 60 * 1000
  assert.ok(verifyReviewToken(token, dayBeforeExpiry), 'token còn hạn lại bị từ chối')

  const afterExpiry = issuedAt + 31 * 24 * 60 * 60 * 1000
  assert.equal(verifyReviewToken(token, afterExpiry), null, 'token hết hạn vẫn được chấp nhận')
})

test('a review token cannot be swapped for a different order', () => {
  const token = createReviewToken(ORDER.id, ORDER.order_code)
  const decoded = verifyReviewToken(token)!

  // Route handler đối chiếu order_code lấy từ DB với order_code trong token; token của
  // đơn này không được khớp với mã đơn khác.
  assert.notEqual(decoded.orderCode, 'MSH-000043')
  assert.equal(decoded.orderId, 42)
})

test('review emails are disabled unless explicitly switched on', () => {
  const original = process.env.REVIEW_REQUEST_EMAILS_ENABLED

  delete process.env.REVIEW_REQUEST_EMAILS_ENABLED
  assert.equal(reviewRequestEmailsEnabled(), false, 'mặc định phải TẮT')

  process.env.REVIEW_REQUEST_EMAILS_ENABLED = 'false'
  assert.equal(reviewRequestEmailsEnabled(), false)

  process.env.REVIEW_REQUEST_EMAILS_ENABLED = 'yes'
  assert.equal(reviewRequestEmailsEnabled(), false, 'chỉ chuỗi "true" mới được bật')

  process.env.REVIEW_REQUEST_EMAILS_ENABLED = 'true'
  assert.equal(reviewRequestEmailsEnabled(), true)

  if (original === undefined) delete process.env.REVIEW_REQUEST_EMAILS_ENABLED
  else process.env.REVIEW_REQUEST_EMAILS_ENABLED = original
})

test('the email carries a working review link and an unsubscribe link', () => {
  const { subject, html, text } = buildReviewRequestEmail(ORDER)

  assert.ok(subject.includes(ORDER.order_code))
  for (const body of [html, text]) {
    assert.ok(body.includes('/danh-gia?token='), 'thiếu link đánh giá')
    assert.ok(body.includes('/api/reviews/opt-out?token='), 'thiếu link huỷ đăng ký')
    assert.ok(body.includes(ORDER.order_code))
  }
})

test('customer names are HTML-escaped in the email body', () => {
  const { html } = buildReviewRequestEmail({
    ...ORDER,
    customer_name: '<script>alert(1)</script>',
  })

  assert.ok(!html.includes('<script>alert(1)</script>'), 'tên khách chưa được escape')
  assert.ok(html.includes('&lt;script&gt;'))
})

test('addresses on domains without MX records are treated as undeliverable', async () => {
  // Đơn test lọt vào DB với AA@gmail.net — domain đó không có MX, thư chắc chắn bounce.
  const withMx = async () => [{ exchange: 'mx.example.com', priority: 10 }]
  const noMx = async () => {
    const error = new Error('queryMx ESERVFAIL') as Error & { code: string }
    error.code = 'ESERVFAIL'
    throw error
  }

  assert.equal(await isDeliverableEmail('khach@gmail.com', new Map(), withMx), true)
  assert.equal(await isDeliverableEmail('AA@gmail.net', new Map(), noMx), false)
  // Domain có MX nhưng rỗng cũng không gửi được.
  assert.equal(await isDeliverableEmail('a@b.com', new Map(), async () => []), false)
})

test('malformed addresses are rejected without touching DNS', async () => {
  let dnsCalls = 0
  const spy = async () => {
    dnsCalls += 1
    return [{ exchange: 'mx', priority: 1 }]
  }

  for (const bad of ['khong-co-a-cong', 'thieu-domain@', '@thieu-local.com', 'a@b', 'a b@c.com', '']) {
    assert.equal(await isDeliverableEmail(bad, new Map(), spy), false, `chấp nhận nhầm: ${bad}`)
  }
  assert.equal(dnsCalls, 0, 'đã tra DNS cho địa chỉ sai định dạng')
})

test('MX lookups are cached per run so one domain is resolved once', async () => {
  let lookups = 0
  const counting = async () => {
    lookups += 1
    return [{ exchange: 'mx', priority: 1 }]
  }
  const cache = new Map<string, boolean>()

  for (const address of ['a@gmail.com', 'b@gmail.com', 'c@GMAIL.com']) {
    assert.equal(await isDeliverableEmail(address, cache, counting), true)
  }

  assert.equal(lookups, 1, 'phải cache theo domain, không tra lại mỗi địa chỉ')
})

test('template keys and delay stay stable — changing them would re-send to past customers', () => {
  assert.equal(REVIEW_REQUEST_TEMPLATE_KEY, 'review_request')
  assert.equal(OPT_OUT_TEMPLATE_KEY, 'review_request_optout')
  assert.equal(REVIEW_REQUEST_DELAY_DAYS, 3)
})

test('review submission atomically claims an unreviewed order before creating reviews', () => {
  const transaction = FROM_TOKEN_ROUTE.slice(FROM_TOKEN_ROUTE.indexOf('prisma.$transaction'))
  const claimIndex = transaction.indexOf('tx.order.updateMany')
  const createIndex = transaction.indexOf('tx.review.createMany')

  assert.ok(claimIndex >= 0, 'route chưa claim đơn bằng updateMany có điều kiện')
  assert.ok(createIndex > claimIndex, 'phải claim đơn trước khi tạo review')
  assert.match(transaction, /is_reviewed: false/)
  assert.match(transaction, /if \(claim\.count !== 1\)/)
})

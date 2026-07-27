import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { resolveOrderDeletionPolicy } from '../src/lib/order-deletion'

const ROOT = path.resolve(__dirname, '..')
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')

const ROUTE = read('src/app/api/orders/[id]/route.ts')
const SCHEMA = read('prisma/schema.prisma')
const BUTTON = read('src/components/admin/DeleteOrderButton.tsx')

test('deleting an order removes its payment row explicitly', () => {
  // Payment là quan hệ DUY NHẤT trỏ tới Order không khai báo onDelete, nên MySQL mặc
  // định RESTRICT. Không xoá tay thì order.delete() ném lỗi khoá ngoại với mọi đơn đã
  // qua thanh toán — tức là gần như mọi đơn thật.
  const paymentModel = SCHEMA.match(/^model Payment \{[\s\S]*?^\}/m)?.[0] ?? ''
  const orderRelation = paymentModel.match(/order\s+Order\s+@relation\([^)]*\)/)?.[0] ?? ''
  assert.ok(orderRelation, 'không tìm thấy quan hệ Payment -> Order')
  assert.doesNotMatch(
    orderRelation,
    /onDelete/,
    'Payment giờ đã có onDelete — kiểm tra lại xem còn cần xoá tay trong route không',
  )

  assert.match(ROUTE, /tx\.payment\.delete\(\{ where: \{ order_id: orderId \} \}\)/)
})

test('deleting an order restores reserved stock', () => {
  // Chỉ policy trung tâm mới được quyết định hoàn kho; không suy diễn trực tiếp từ timestamp.
  assert.match(ROUTE, /if \(deletionPolicy\.shouldRestoreInventory\)/)
  assert.match(ROUTE, /stock: \{ increment: item\.quantity \}/)
})

test('deleting an order returns used vouchers to the customer', () => {
  assert.match(ROUTE, /tx\.userVoucher\.updateMany/)
  assert.match(ROUTE, /status: 'AVAILABLE', orderId: null, usedAt: null/)
})

test('the whole deletion runs in one transaction', () => {
  // Hoàn kho xong mà xoá đơn lỗi thì kho bị cộng khống.
  const deleteBlock = ROUTE.slice(ROUTE.indexOf('export async function DELETE'))
  assert.match(deleteBlock, /prisma\.\$transaction\(async \(tx\) =>/)

  const txIndex = deleteBlock.indexOf('prisma.$transaction')
  const orderDeleteIndex = deleteBlock.indexOf('tx.order.delete')
  assert.ok(orderDeleteIndex > txIndex, 'order.delete phải nằm trong transaction')
})

test('only super_admin can delete an order', () => {
  const deleteBlock = ROUTE.slice(ROUTE.indexOf('export async function DELETE'))

  // Xoá đơn siết chặt hơn PUT (đổi trạng thái), vốn cho phép cả 'admin'.
  assert.match(deleteBlock, /role !== 'super_admin'/)
  assert.doesNotMatch(
    deleteBlock,
    /\['super_admin', 'admin'\]/,
    "DELETE vẫn cho phép role 'admin'",
  )
  // 403 chứ không 401: người dùng đã đăng nhập hợp lệ, chỉ là không đủ quyền.
  assert.match(deleteBlock, /status: 403/)

  // PUT phải giữ nguyên quyền cũ — siết nhầm sẽ khoá luồng đổi trạng thái đơn.
  const putBlock = ROUTE.slice(ROUTE.indexOf('export async function PUT'), ROUTE.indexOf('export async function DELETE'))
  assert.match(putBlock, /\['super_admin', 'admin'\]/)

  // Ảnh chụp phải lấy TRƯỚC transaction — sau khi xoá thì không còn gì để đọc.
  const snapshotIndex = deleteBlock.indexOf('const snapshot')
  const txIndex = deleteBlock.indexOf('prisma.$transaction')
  assert.ok(snapshotIndex > -1 && snapshotIndex < txIndex, 'snapshot phải chụp trước khi xoá')

  assert.match(deleteBlock, /action: 'DELETE'/)
  assert.match(deleteBlock, /entity: 'ORDER'/)
  assert.match(deleteBlock, /order_code: order\.order_code/)
})

test('the delete button is hidden from non super_admin accounts', () => {
  // Không phải lớp bảo mật (API tự chặn 403), mà để 'admin' không gõ hết mã đơn rồi
  // mới nhận lỗi từ chối.
  assert.match(BUTTON, /role === 'super_admin'/)
  assert.match(BUTTON, /if \(!canDelete \|\| !deletionPolicy\.canDelete\) return null/)
})

test('the confirm dialog requires typing the order code', () => {
  // Chỉ bấm "Đồng ý" thì dễ bấm nhầm theo quán tính; mã đơn dài và không đoán được.
  assert.match(BUTTON, /confirmText\.trim\(\) === orderCode/)
  assert.match(BUTTON, /disabled=\{!canConfirm\}/)
})

test('paid and fulfilled orders are protected from permanent deletion', () => {
  for (const paymentStatus of ['PAID', 'REFUNDED']) {
    const policy = resolveOrderDeletionPolicy({
      paymentStatus,
      orderStatus: 'PROCESSING',
      inventoryReserved: true,
    })
    assert.equal(policy.canDelete, false)
    assert.equal(policy.shouldRestoreInventory, false)
  }

  for (const orderStatus of ['SHIPPING', 'COMPLETED']) {
    const policy = resolveOrderDeletionPolicy({
      paymentStatus: 'PENDING',
      orderStatus,
      inventoryReserved: true,
    })
    assert.equal(policy.canDelete, false)
    assert.equal(policy.shouldRestoreInventory, false)
  }
})

test('only deletable orders with an active reservation restore stock', () => {
  assert.deepEqual(
    resolveOrderDeletionPolicy({
      paymentStatus: 'PENDING',
      orderStatus: 'PROCESSING',
      inventoryReserved: true,
    }),
    { canDelete: true, shouldRestoreInventory: true, reason: null },
  )

  assert.equal(
    resolveOrderDeletionPolicy({
      paymentStatus: 'FAILED',
      orderStatus: 'CANCELLED',
      inventoryReserved: false,
    }).shouldRestoreInventory,
    false,
  )
})

test('payment webhook audit rows are preserved when a deletable order is removed', () => {
  assert.match(ROUTE, /tx\.paymentWebhookEvent\.updateMany/)
  assert.match(ROUTE, /data: \{ payment_id: null \}/)
})

test('both admin pages expose the delete action', () => {
  for (const page of ['src/app/admin/don-hang/page.tsx', 'src/app/admin/thanh-toan/page.tsx']) {
    const src = read(page)
    assert.match(src, /DeleteOrderButton/, `${page} thiếu nút xoá`)
  }

  // Trang thanh toán render phía client nên phải nhận đủ order.id để gọi DELETE.
  const api = read('src/app/api/payments/route.ts')
  const orderSelect = api.slice(api.indexOf('order: {'), api.indexOf('order: {') + 400)
  for (const field of ['id: true', 'order_code: true', 'payment_status: true', 'order_status: true']) {
    assert.ok(orderSelect.includes(field), `API thanh toán thiếu ${field}`)
  }
})

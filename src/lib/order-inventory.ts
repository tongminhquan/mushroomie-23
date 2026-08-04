import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export class ReservationExpiryConflictError extends Error {
  constructor(message = 'Order or payment state changed while expiring reservation') {
    super(message)
    this.name = 'ReservationExpiryConflictError'
  }
}

export async function cancelOrderAndReleaseInventory(
  tx: Prisma.TransactionClient,
  input: { orderId: number; changedBy: string; changedByUserId?: number; note?: string },
) {
  const order = await tx.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  })
  if (!order || order.order_status === 'CANCELLED') return false

  const transitioned = await tx.order.updateMany({
    where: { id: input.orderId, order_status: order.order_status },
    data: { order_status: 'CANCELLED', inventory_reserved_at: null },
  })
  if (transitioned.count !== 1) return false

  if (order.inventory_reserved_at) {
    for (const item of order.items) {
      if (!item.product_id) continue
      await tx.product.update({
        where: { id: item.product_id },
        data: { stock: { increment: item.quantity } },
      })
    }
  }

  await tx.userVoucher.updateMany({
    where: { orderId: input.orderId, status: 'USED' },
    data: { status: 'AVAILABLE', orderId: null, usedAt: null },
  })
  await tx.orderStatusHistory.create({
    data: {
      order_id: input.orderId,
      old_status: order.order_status,
      new_status: 'CANCELLED',
      changed_by: input.changedBy,
      changed_by_user_id: input.changedByUserId,
      note: input.note,
    },
  })
  return true
}

/**
 * Atomically expire a reservation that is still awaiting bank transfer.
 *
 * The order transition deliberately happens first. It obtains the order-row
 * lock shared with payment creation; any later payment-state conflict throws
 * so the enclosing transaction rolls the cancellation and inventory release
 * back together.
 */
export async function expirePendingOrderReservation(
  tx: Prisma.TransactionClient,
  input: {
    orderId: number
    expectedPaymentId?: number
    now: Date
    changedBy: string
    changedByUserId?: number
    note?: string
  },
) {
  const transitioned = await tx.order.updateMany({
    where: {
      id: input.orderId,
      order_status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
      inventory_reserved_at: { not: null },
    },
    data: { order_status: 'CANCELLED', inventory_reserved_at: null },
  })
  if (transitioned.count !== 1) return false

  // This read happens only after the conditional order update has acquired
  // the row lock, so a concurrently-created payment is visible before any
  // inventory is released.
  const payment = await tx.payment.findUnique({
    where: { order_id: input.orderId },
  })
  if (input.expectedPaymentId !== undefined && payment?.id !== input.expectedPaymentId) {
    throw new ReservationExpiryConflictError('Expected payment changed before expiry')
  }

  if (payment) {
    if (
      payment.status !== 'PENDING'
      || !payment.expires_at
      || payment.expires_at > input.now
    ) {
      throw new ReservationExpiryConflictError('Payment is no longer expired and pending')
    }

    const expired = await tx.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    })
    if (expired.count !== 1) {
      throw new ReservationExpiryConflictError('Payment state changed before expiry')
    }
  } else if (input.expectedPaymentId !== undefined) {
    throw new ReservationExpiryConflictError('Expected payment disappeared before expiry')
  }

  const order = await tx.order.findUnique({
    where: { id: input.orderId },
    include: { items: true },
  })
  if (!order) throw new ReservationExpiryConflictError('Order disappeared before inventory release')

  for (const item of order.items) {
    if (!item.product_id) continue
    await tx.product.update({
      where: { id: item.product_id },
      data: { stock: { increment: item.quantity } },
    })
  }

  await tx.userVoucher.updateMany({
    where: { orderId: input.orderId, status: 'USED' },
    data: { status: 'AVAILABLE', orderId: null, usedAt: null },
  })
  await tx.orderStatusHistory.create({
    data: {
      order_id: input.orderId,
      old_status: 'PENDING_PAYMENT',
      new_status: 'CANCELLED',
      changed_by: input.changedBy,
      changed_by_user_id: input.changedByUserId,
      note: input.note,
    },
  })

  return true
}

export async function releaseExpiredOrderReservations() {
  const now = new Date()
  const fallbackCutoff = new Date(now.getTime() - Number(process.env.PAYMENT_EXPIRE_MINUTES || 30) * 60 * 1000)
  const candidates = await prisma.order.findMany({
    where: {
      order_status: 'PENDING_PAYMENT',
      payment_status: 'PENDING',
      inventory_reserved_at: { not: null },
      created_at: { lte: fallbackCutoff },
    },
    orderBy: { created_at: 'asc' },
    take: 100,
  })

  let released = 0
  for (const order of candidates) {
    let didRelease = false
    try {
      didRelease = await prisma.$transaction((tx) => expirePendingOrderReservation(tx, {
        orderId: order.id,
        now,
        changedBy: 'SYSTEM',
        note: 'Payment reservation expired; inventory released',
      }))
    } catch (error) {
      if (!(error instanceof ReservationExpiryConflictError)) throw error
    }
    if (didRelease) released += 1
  }
  return released
}

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

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
    include: { payment: true },
    orderBy: { created_at: 'asc' },
    take: 100,
  })

  let released = 0
  for (const order of candidates) {
    if (order.payment?.expires_at && order.payment.expires_at > now) continue
    const didRelease = await prisma.$transaction(async (tx) => {
      if (order.payment) {
        if (order.payment.status !== 'PENDING') return false

        const expired = await tx.payment.updateMany({
          where: { id: order.payment.id, status: 'PENDING' },
          data: { status: 'EXPIRED' },
        })
        // A payment webhook may have won the PENDING -> PAID transition
        // after the candidate snapshot was read. Never cancel that order.
        if (expired.count !== 1) return false
      }
      return cancelOrderAndReleaseInventory(tx, {
        orderId: order.id,
        changedBy: 'SYSTEM',
        note: 'Payment reservation expired; inventory released',
      })
    })
    if (didRelease) released += 1
  }
  return released
}

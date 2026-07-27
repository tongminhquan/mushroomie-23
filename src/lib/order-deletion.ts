interface OrderDeletionPolicyInput {
  paymentStatus: string | null | undefined
  orderStatus: string | null | undefined
  inventoryReserved: boolean
}

interface OrderDeletionPolicy {
  canDelete: boolean
  shouldRestoreInventory: boolean
  reason: string | null
}

const PROTECTED_PAYMENT_STATUSES = new Set(['PAID', 'REFUNDED'])
const PROTECTED_ORDER_STATUSES = new Set(['SHIPPING', 'COMPLETED'])

/**
 * Permanent deletion is only for abandoned or test orders. Financial and
 * fulfilled records must remain available for reconciliation and support.
 */
export function resolveOrderDeletionPolicy({
  paymentStatus,
  orderStatus,
  inventoryReserved,
}: OrderDeletionPolicyInput): OrderDeletionPolicy {
  if (paymentStatus && PROTECTED_PAYMENT_STATUSES.has(paymentStatus)) {
    return {
      canDelete: false,
      shouldRestoreInventory: false,
      reason: 'Không thể xoá vĩnh viễn đơn đã thanh toán hoặc hoàn tiền. Hãy cập nhật trạng thái đơn.',
    }
  }

  if (orderStatus && PROTECTED_ORDER_STATUSES.has(orderStatus)) {
    return {
      canDelete: false,
      shouldRestoreInventory: false,
      reason: 'Không thể xoá vĩnh viễn đơn đang giao hoặc đã hoàn tất.',
    }
  }

  return {
    canDelete: true,
    shouldRestoreInventory: inventoryReserved && orderStatus !== 'CANCELLED',
    reason: null,
  }
}

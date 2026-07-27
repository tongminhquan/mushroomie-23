'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Trash2, X, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'
import { resolveOrderDeletionPolicy } from '@/lib/order-deletion'

interface DeleteOrderButtonProps {
  orderId: number
  orderCode: string
  /** Trạng thái dùng để ẩn thao tác với hồ sơ tài chính đã chốt. */
  paymentStatus?: string | null
  orderStatus?: string | null
  /**
   * Danh sách render phía client tự cập nhật state qua callback này. Bỏ trống thì
   * component gọi router.refresh() — cần cho trang server component như /admin/don-hang,
   * nơi dữ liệu chỉ tải lại khi server render lại.
   */
  onDeleted?: (orderId: number) => void
  className?: string
}

/**
 * Nút xoá đơn hàng, dùng chung cho /admin/don-hang và /admin/thanh-toan.
 *
 * Xoá đơn là thao tác không hoàn tác được trên hồ sơ kinh doanh, nên hộp thoại bắt
 * người dùng gõ đúng mã đơn thay vì chỉ bấm "Đồng ý" — mã đơn dài và không đoán được,
 * nên không thể bấm nhầm theo quán tính.
 *
 * Đơn đã thu tiền, hoàn tiền, đang giao hoặc đã hoàn tất không có thao tác xoá.
 * Các hồ sơ đó phải được giữ để đối soát doanh thu và hỗ trợ khách hàng.
 *
 * Chỉ super_admin thấy nút này. API cũng tự chặn (403) nên đây không phải lớp bảo mật —
 * mục đích là để tài khoản 'admin' không gõ hết mã đơn rồi mới nhận lỗi từ chối.
 */
export default function DeleteOrderButton({
  orderId,
  orderCode,
  paymentStatus,
  orderStatus,
  onDeleted,
  className,
}: DeleteOrderButtonProps) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const dialog = useDrawerTransition(open, 200)
  const router = useRouter()
  const { data: session } = useSession()
  const canDelete = (session?.user as { role?: string } | undefined)?.role === 'super_admin'

  const deletionPolicy = resolveOrderDeletionPolicy({
    paymentStatus,
    orderStatus,
    inventoryReserved: orderStatus !== 'CANCELLED',
  })
  const canConfirm = confirmText.trim() === orderCode && !busy

  const close = () => {
    if (busy) return
    setOpen(false)
    setConfirmText('')
    setError('')
  }

  const handleDelete = async () => {
    if (!canConfirm) return
    setBusy(true)
    setError('')

    try {
      const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error || 'Không xoá được đơn hàng. Vui lòng thử lại.')
        setBusy(false)
        return
      }

      setOpen(false)
      setConfirmText('')
      if (onDeleted) onDeleted(orderId)
      else router.refresh()
    } catch {
      setError('Không kết nối được máy chủ. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  if (!canDelete || !deletionPolicy.canDelete) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Xoá đơn ${orderCode}`}
        className={
          className ??
          'm-press grid h-9 w-9 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600'
        }
      >
        <Trash2 size={16} />
      </button>

      {dialog.mounted && (
        <div
          data-drawer-state={dialog.state}
          className="m-backdrop fixed inset-0 z-[200] grid place-items-center bg-text/50 p-4 backdrop-blur-[2px]"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Xoá đơn ${orderCode}`}
        >
          <div
            data-drawer-state={dialog.state}
            className="m-drawer-top w-full max-w-md rounded-[20px] bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={20} />
                </span>
                <div>
                  <h2 className="font-heading text-lg text-neutral-900">Xoá đơn hàng</h2>
                  <p className="text-sm text-neutral-500">{orderCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Đóng"
                className="grid h-9 w-9 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-neutral-600">
              Thao tác này <strong>không hoàn tác được</strong>. Sản phẩm trong đơn, lịch sử trạng thái và bản ghi
              thanh toán sẽ bị xoá cùng.
            </p>

            {orderStatus !== 'CANCELLED' && (
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Tồn kho đơn này đang giữ sẽ được cộng trả về sản phẩm, voucher đã dùng được trả lại ví khách.
              </p>
            )}

            <label htmlFor={`confirm-${orderId}`} className="mt-4 block text-sm font-semibold text-neutral-700">
              Gõ <span className="font-mono text-primary">{orderCode}</span> để xác nhận
            </label>
            <input
              id={`confirm-${orderId}`}
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
              className="mt-1.5 h-11 w-full rounded-xl border border-neutral-200 px-4 font-mono text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
            />

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={close} disabled={busy}>
                Huỷ
              </Button>
              <Button
                size="sm"
                onClick={handleDelete}
                disabled={!canConfirm}
                isLoading={busy}
                className="!bg-red-600 hover:!bg-red-700"
              >
                Xoá vĩnh viễn
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

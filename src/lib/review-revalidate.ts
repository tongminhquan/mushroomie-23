import { revalidatePath } from 'next/cache'

/**
 * Trang chủ và trang sản phẩm đều prerender kèm ISR (revalidate 1h), nên mọi thay đổi
 * đánh giá phải revalidate thủ công. Nếu không, admin duyệt hoặc gỡ một đánh giá mà khách
 * vẫn thấy bản cũ tới cả tiếng sau.
 *
 * Phát hiện 2026-07-27 khi gỡ 6 review seed khỏi DB: trang chủ vẫn hiển thị chúng kể cả
 * sau khi restart PM2, vì HTML prerender nằm trên đĩa chứ không phụ thuộc process.
 *
 * Trang chủ luôn nằm trong danh sách vì HomeTrust đọc các review `is_featured`.
 */
export function revalidateReview(productSlug?: string | null) {
  revalidatePath('/')

  if (productSlug) {
    revalidatePath(`/san-pham/${productSlug}`)
  }
}

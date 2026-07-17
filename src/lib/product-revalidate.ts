import { revalidatePath } from 'next/cache'

/**
 * Trang sản phẩm được prerender qua generateStaticParams, nên mọi thay đổi sản phẩm
 * phải revalidate thủ công — nếu không, admin sửa giá/tên/mô tả mà khách vẫn thấy bản cũ
 * cho tới lần deploy kế tiếp.
 *
 * Truyền cả slug cũ lẫn slug mới khi slug đổi, để bản prerender của slug cũ không bị kẹt.
 */
export function revalidateProduct(...slugs: (string | null | undefined)[]) {
  revalidatePath('/')
  revalidatePath('/san-pham')

  for (const slug of new Set(slugs.filter((slug): slug is string => Boolean(slug)))) {
    revalidatePath(`/san-pham/${slug}`)
  }
}

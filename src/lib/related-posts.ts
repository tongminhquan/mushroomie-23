/**
 * Chọn bài viết liên quan sao cho link nội bộ trải đều toàn bộ archive.
 *
 * Cách cũ (lấy N bài mới nhất cùng chuyên mục) khiến mọi bài trong một chuyên mục đều
 * trỏ về đúng N bài mới nhất — các bài cũ không nhận được link nội bộ nào. Crawl ngày
 * 2026-07-27 cho thấy 28 bài trong sitemap có 0 inbound link vì lý do này.
 *
 * Ở đây ta lấy một pool lớn rồi cắt một "cửa sổ" khác nhau cho từng bài, dựa trên id.
 * Kết quả ổn định giữa các lần render (quan trọng cho ISR và cho crawler), nhưng mỗi
 * bài lại trỏ tới một nhóm khác nhau.
 */

/** FNV-1a 32-bit — hash ổn định, không phụ thuộc runtime. */
function stableHash(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash >>> 0
}

export function pickRelatedPosts<T extends { id: string | number }>(
  candidates: T[],
  currentPostId: string | number,
  count: number,
): T[] {
  if (candidates.length <= count) return candidates

  const offset = stableHash(String(currentPostId)) % candidates.length
  const picked: T[] = []
  for (let i = 0; i < count; i += 1) {
    picked.push(candidates[(offset + i) % candidates.length])
  }
  return picked
}

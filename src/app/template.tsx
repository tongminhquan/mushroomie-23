/**
 * Hiệu ứng vào trang, áp cho MỌI route (cả public lẫn admin).
 *
 * Dùng `template.tsx` chứ không phải `layout.tsx`: layout giữ nguyên giữa các lần
 * điều hướng, còn template được mount lại mỗi lần đổi route — nên hoạt ảnh `animation`
 * bên dưới chạy lại ở từng trang mà không cần bất kỳ JavaScript nào.
 *
 * Không dùng AnimatePresence/Framer Motion: hiệu ứng thoát trong App Router đòi hỏi
 * FrozenRouter (snapshot LayoutRouterContext — một API nội bộ của Next, dễ vỡ khi nâng
 * cấp) cộng một thư viện ~40KB. Đổi lại chỉ để có hiệu ứng thoát 200ms là không đáng,
 * nhất là với trang admin dùng liên tục.
 *
 * Server component, 0 byte JS. Bản thân keyframe được khai báo trong globals.css và tự
 * tắt khi người dùng bật giảm chuyển động.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="m-page-enter">{children}</div>
}
